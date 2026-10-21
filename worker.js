// Serves the static site (via the assets binding) and handles the contact form.
// POST /api/contact  ->  emails the inquiry to CONTACT_TO using Cloudflare Email Routing.
import { EmailMessage } from 'cloudflare:email';

const FIELDS = ['name', 'email', 'phone', 'business', 'service', 'budget', 'website', 'message'];
const MAX_LEN = { message: 5000, default: 300 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      return handleContact(request, env);
    }
    if (url.pathname === '/project' || url.pathname === '/project.html') return projectPage(request, env, url);
    return env.ASSETS.fetch(request);
  }
};

// project.html is one page for every project, so crawlers and link previews that don't run
// JavaScript would all see the Ledger tags. Rewrite them here to match ?p=.
// Keep these in sync with PROJECTS in public/project.html.
const PROJECTS = {
  ledger: {
    title: 'Daily Work Ledger',
    desc: 'A full stack work ledger app with daily checklists, Slack-fed task queues, and AI-written reports. Built with Node.js, SQLite, and Docker by Cailin Justine.'
  },
  nebula: {
    title: 'Nebula',
    desc: 'A web app where a class submits and browses helpful resource links, with an AI chat assistant that answers questions about them. Built with React, FastAPI, and PostgreSQL.'
  },
  roses: {
    title: 'Rose’s Cleaning & Janitorial',
    desc: 'A fast, SEO-ready business website for a family cleaning service in St. George, Utah, with service and city pages and a price estimator. Built by Cailin Justine.'
  },
  finance: { title: 'Finance Tracker', desc: 'A personal finance tracker in progress by Cailin Justine.', noindex: true }
};

async function projectPage(request, env, url) {
  const res = await env.ASSETS.fetch(request);
  const key = url.searchParams.get('p');
  const p = PROJECTS[key];
  if (!p || !res.ok) return res;
  const title = p.title + ' | Cailin Justine';
  const canonical = 'https://cailinjustine.dev/project?p=' + key;
  const attr = (name, value) => ({ element(el) { el.setAttribute(name, value); } });
  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]', attr('content', p.desc))
    .on('meta[property="og:title"], meta[name="twitter:title"]', attr('content', title))
    .on('meta[property="og:url"]', attr('content', canonical))
    .on('link[rel="canonical"]', attr('href', canonical))
    .on('meta[name="robots"]', attr('content', p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'))
    .transform(res);
}

async function handleContact(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  // Honeypot: real visitors never see or fill this field. Pretend success for bots.
  if (body.company_site) return json({ ok: true });

  const f = {};
  for (const k of FIELDS) {
    const v = typeof body[k] === 'string' ? body[k].trim() : '';
    f[k] = v.slice(0, MAX_LEN[k] || MAX_LEN.default);
  }
  if (!f.name || !EMAIL_RE.test(f.email) || !f.service) {
    return json({ error: 'Please fill in your name, a valid email, and the service you need.' }, 400);
  }

  const subject = 'Inquiry: ' + f.service + (f.business ? ' for ' + f.business : '');
  const details = [
    'Name: ' + f.name,
    'Email: ' + f.email,
    f.phone && 'Phone: ' + f.phone,
    f.business && 'Business: ' + f.business,
    'Service: ' + f.service,
    f.budget && 'Budget: ' + f.budget,
    f.website && 'Current website: ' + f.website
  ].filter(Boolean);
  const text = details.join('\n') + '\n\n' + (f.message || '(no message)');

  const raw = buildMime({
    from: env.CONTACT_FROM,
    fromName: 'Portfolio contact form',
    to: env.CONTACT_TO,
    replyTo: f.email,
    subject,
    text
  });

  try {
    await env.CONTACT_EMAIL.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, raw));
  } catch (err) {
    console.error('Contact email failed:', err && err.message);
    return json({ error: 'Sorry, your message could not be sent.' }, 502);
  }
  return json({ ok: true });
}

// Minimal RFC 5322 message: plain-text UTF-8 body, base64-encoded so any characters are safe.
function buildMime({ from, fromName, to, replyTo, subject, text }) {
  const oneLine = s => String(s).replace(/[\r\n]+/g, ' ');
  const domain = from.split('@')[1];
  return [
    'From: ' + encodeWord(fromName) + ' <' + from + '>',
    'To: <' + to + '>',
    'Reply-To: <' + oneLine(replyTo) + '>',
    'Subject: ' + encodeWord(oneLine(subject)),
    'Date: ' + new Date().toUTCString(),
    'Message-ID: <' + crypto.randomUUID() + '@' + domain + '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64(text).replace(/.{76}/g, '$&\r\n')
  ].join('\r\n');
}

function encodeWord(s) {
  return /^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + base64(s) + '?=';
}

function base64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
