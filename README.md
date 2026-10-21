# cailinjustine.dev

Portfolio site. Static pages in `public/`, served by a small Cloudflare Worker (`worker.js`) that also handles the contact form. No build step.

## Deploying
The Cloudflare Worker `portfolio` is connected to the GitHub repo `caijustine/portfolio`.
**Pushing to `main` deploys automatically**, and the live site updates about a minute later.

Settings live in `wrangler.jsonc`:
- `assets.directory: ./public` is what gets published. Anything outside `public/` (the Worker code, config, this README) is never served.
- `send_email` + `vars` configure where contact form emails go (see below).

After a deploy, do a hard refresh (Cmd + Shift + R) if the browser still shows the old version.

## Project layout
```
public/            everything served on the site
  *.html           the pages
  site.css         mobile / small-screen overrides (page styles are inline in each .html)
  fonts.css        @font-face rules for the self-hosted fonts in assets/fonts/
  support.js       page runtime (generated, don't edit by hand)
  vendor/          React 18.3.1 UMD builds the runtime uses (self-hosted so pages don't wait on unpkg)
  assets/          images, icons/, fonts/, and the resume PDF
  _headers         cache rules for vendor/ and assets/
worker.js          handles POST /api/contact and rewrites /project meta tags per ?p=
wrangler.jsonc     Cloudflare Worker config
```

## Pages
- `/` home, `/work`, `/about`, `/services`, `/contact`
- `/project?p=ledger | nebula | roses | finance`

## Contact form
The form POSTs to `/api/contact`, and `worker.js` emails it to cailin.justineschirm@gmail.com through Cloudflare Email Routing.
Emails come from `contact@cailinjustine.dev` with Reply-To set to the visitor, so replying in Gmail goes straight to them.
A hidden honeypot field silently drops bot submissions.

Already set up in the Cloudflare dashboard (cailinjustine.dev → Email → Email Routing):
Email Routing is enabled, and cailin.justineschirm@gmail.com is a verified destination address.
Changing the destination means updating `wrangler.jsonc` **and** verifying the new address there.

## Resume
`public/assets/Cailin_Schirm_Resume.pdf` is linked from the "View resume" button on the contact page.
It's a copy of the original with the **phone number removed**, so it isn't public. When updating the resume,
make a new phone-free copy rather than uploading the original.

## Running locally
```
npx wrangler dev
```
Opens the site at http://localhost:8787 with the contact form working. Emails aren't actually sent;
they're saved as `.eml` files under `.wrangler/tmp/email/`.

## Speed notes
- Everything loads from cailinjustine.dev: no Google Fonts, unpkg, or icon CDN requests.
- Pages whose markup has no `{{ }}` placeholders paint straight from the HTML (`html x-dc{display:block!important}` in the head)
  and the runtime swaps in the same page when it boots. Pages with placeholders (about, contact, project) stay hidden until then.
- If you add a placeholder to a page that paints early, either hide that piece with an `x-dc ...` rule in the head
  (those only apply before the runtime boots; see the homepage) or switch the page back to `x-dc{display:none}`.
