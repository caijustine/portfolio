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
  support.js       page runtime (generated, don't edit by hand)
  assets/          images and the resume PDF
worker.js          serves public/ and handles POST /api/contact
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

## Still to do
- Add LinkedIn when ready.
