# azdata-forms — form-to-email backend

A single Cloudflare Worker that receives the site's forms (demo request, job application, open CV, referral) and emails them to you through Resend. Your address lives only in a Worker secret, never in the HTML.

## One-time setup (~10 minutes)

1. **Resend** — create a free account at resend.com, then *API Keys → Create*. Copy the key.
   The default sender `onboarding@resend.dev` can only deliver to the email you signed up with — that's fine here, since the recipient is you. To send from `@azdata.app` later, add and verify the domain in Resend and change `FROM_EMAIL` in `wrangler.toml`.
2. **Cloudflare** — create a free account at cloudflare.com (no domain needed for Workers).
3. From this folder:
   ```bash
   cd worker
   npx wrangler login
   npx wrangler secret put RESEND_API_KEY   # paste the Resend key
   npx wrangler secret put TO_EMAIL         # the address that should receive submissions
   npx wrangler deploy
   ```
   The deploy prints a URL like `https://azdata-forms.<your-subdomain>.workers.dev`.
4. Put that URL into `API_BASE` at the top of `assets/js/main.js`, commit, push.

## Current state

Deployed to `https://azdata-forms.azdata-forms.workers.dev` (Cloudflare account `2e46…743f`, Worker `azdata-forms`) and `API_BASE` already points at it. Both secrets (`TO_EMAIL`, `RESEND_API_KEY`) are set and a live test submission delivered successfully on 2026-09-10. To rotate the Resend key: create a new key in Resend → API Keys, run `npx wrangler secret put RESEND_API_KEY` from this folder (or update it in the Cloudflare dashboard), confirm a form still sends, then delete the old key in Resend.

## Auto-deploy from GitHub (optional)

Cloudflare dashboard → Workers & Pages → *Create* → *Import a repository* → pick this repo, set the root directory to `worker`, build command empty, deploy command `npx wrangler deploy`. Every push to `main` then redeploys the Worker; secrets are managed in the dashboard under the Worker's *Settings → Variables*.

## What it does

- Accepts `POST /` with `multipart/form-data` (or JSON). Field `form` selects the type: `demo`, `application`, `cv`, `referral`.
- Rejects requests whose `Origin` isn't in `ALLOWED_ORIGINS`, missing name/email, files over 5 MB, or non PDF/Word files.
- Honeypot: any value in the hidden `website` field is silently accepted and dropped.
- Sets `Reply-To` to the submitter, so replying in your inbox goes straight to them.

## Limits

Cloudflare free: 100k requests/day. Resend free: 3,000 emails/month, 100/day. Attachments count toward Resend's 40 MB per-message cap. For rate limiting beyond this, add a *Rate limiting rule* to the Worker in the Cloudflare dashboard (Security → WAF).
