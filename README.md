# cailinjustine.dev

Static portfolio site (in `public/`) served by a small Cloudflare Worker (`worker.js`) that also handles the contact form. No build step.

## Publish on Cloudflare Pages
1. Create a new GitHub repo (e.g. `portfolio`) and upload everything in this folder to it.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: Framework preset **None**, build command **empty**, output directory **/**.
4. After it deploys: Custom domains → Set up a domain → `cailinjustine.dev`.

## Pages
- `/` home, `/work`, `/about`, `/services`, `/contact`
- `/project?p=ledger | nebula | roses | finance`

## Contact form
The form POSTs to `/api/contact`; `worker.js` emails it to cailin.justineschirm@gmail.com via Cloudflare Email Routing
(from `contact@cailinjustine.dev`, with Reply-To set to the visitor). One-time setup in the Cloudflare dashboard:
1. cailinjustine.dev → Email → Email Routing → enable it (adds the MX/SPF DNS records).
2. Destination addresses → add and verify cailin.justineschirm@gmail.com.

Test locally with `npx wrangler dev`; sent emails are saved as `.eml` files under `.wrangler/tmp/email/`.

## Still to do
- Add resume PDF and LinkedIn when ready.
# portfolio
