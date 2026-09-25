# cailinjustine.dev

Static portfolio site. No build step.

## Publish on Cloudflare Pages
1. Create a new GitHub repo (e.g. `portfolio`) and upload everything in this folder to it.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: Framework preset **None**, build command **empty**, output directory **/**.
4. After it deploys: Custom domains → Set up a domain → `cailinjustine.dev`.

## Pages
- `/` home, `/work`, `/about`, `/services`, `/contact`
- `/project?p=ledger | nebula | roses | finance`

## Still to do
- Contact form doesn't send yet (connect Formspree/EmailJS later).
- Add resume PDF and LinkedIn when ready.
# portfolio
