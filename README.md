# Cyobik Turkey Website

English-first marketing website for Cyobik's Turkey market entry.

## Current implementation

- Static HTML website with Cloudflare Pages Functions
- Selected visual direction: Theme 3 / Intelligence Graph
- Primary language: English
- Demo requests collected through a server-side form and delivered by email for entry into the internal CRM

## Deployment target

The production website is deployed with **Cloudflare Pages**. GitHub is the source repository; GitHub Pages is not used.

### Cloudflare Pages configuration

- Git provider: GitHub
- Repository: `monaderi1/monosuite-turkey-website`
- Production branch: `main`
- Framework preset: None
- Build command: `exit 0`
- Build output directory: `.`
- Root directory: repository root

Cloudflare Pages creates preview deployments for non-production branches and pull requests. Merges to `main` publish the production version automatically after the Git integration is connected.

## Demo lead form

The form posts to `/api/leads`, implemented as a Cloudflare Pages Function. The browser never receives the email-service credential.

### CRM intake address

Website leads are sent to:

- `monaderi@hotmail.com`

The optional `LEAD_TO_EMAIL` environment variable can override this address later without changing the code.

### Required production variables and secrets

Configure these under the Pages project's production environment variables:

- `CF_ACCOUNT_ID` — Cloudflare account ID
- `CF_EMAIL_API_TOKEN` — secret API token with Email Sending permission
- `LEAD_FROM_EMAIL` — sender address on the onboarded Cyobik domain

Cloudflare Email Sending requires the sender domain to be onboarded in Cloudflare Email Service.

### Turnstile protection

Recommended production variables:

- `TURNSTILE_SITE_KEY` — public site key
- `TURNSTILE_SECRET_KEY` — secret validation key

When these are configured, the form renders Turnstile and validates each token server-side before sending the lead email.

### Optional rate limiting

Create a Workers KV namespace and bind it to the Pages project as `LEAD_RATE_LIMIT`. The function then limits submissions to five per source IP hash per hour. Raw IP addresses are not stored in KV.

## Custom domain

The domain remains registered at GoDaddy. For the apex domain, add the domain as a Cloudflare zone and replace the GoDaddy nameservers with the Cloudflare nameservers assigned to the zone. Then associate the domain from the Cloudflare Pages project's **Custom domains** section.

## Files

- `index.html` — current homepage and demo form
- `functions/api/leads.js` — server-side validation and email delivery
- `functions/api/form-config.js` — public form configuration
- `_routes.json` — limits Pages Functions execution to `/api/*`
- `platform.html` — earlier platform page
- `assets/` — earlier static assets retained for reference
- `archive/` — archived concepts and previous homepage versions
