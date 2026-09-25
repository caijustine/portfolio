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
    return env.ASSETS.fetch(request);
  }
};

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
