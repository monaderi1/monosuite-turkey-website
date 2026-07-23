# Cyobik Website

English-first marketing website for Cyobik's Turkey market entry.

## Current implementation

- Static HTML website with Cloudflare Pages Functions
- Selected visual direction: Theme 3 / Intelligence Graph
- Shared responsive design system with light and dark themes
- Product claims aligned to the maintained MonoSuite Product Truth Register
- Demo requests collected through a server-side form and delivered by email for entry into the internal CRM

## Information architecture

- `index.html` — positioning and product overview
- `platform.html` — connected platform and processing model
- `asset-intelligence.html` — discovery, onboarding, inventory, changes, networks, relationships and Business Services
- `risk-visibility.html` — scores, vulnerability assessment, internal attack surface, dashboards and reporting
- `compliance.html` — CIS Benchmark, PCI DSS and ISO/IEC 27001 control reporting
- `deployment.html` — OVF delivery, air-gapped operation, updates, backup, access control and audit
- `integrations.html` — REST API, Nessus, Splunk and adapter boundaries
- `request-demo.html` — focused evaluation request form
- `assets/site.css` — shared visual system and responsive layouts
- `assets/site.js` — navigation, theme and form interactions

Earlier concepts and retained static assets remain under `archive/` and `assets/` for reference.

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

Website leads are sent to `monaderi@hotmail.com`. The optional `LEAD_TO_EMAIL` environment variable can override this address without changing the code.

### Required production variables and secrets

- `CF_ACCOUNT_ID` — Cloudflare account ID
- `CF_EMAIL_API_TOKEN` — secret API token with Email Sending permission
- `LEAD_FROM_EMAIL` — sender address on the onboarded Cyobik domain

Cloudflare Email Sending requires the sender domain to be onboarded in Cloudflare Email Service.

### Turnstile protection

Recommended production variables:

- `TURNSTILE_SITE_KEY` — public site key
- `TURNSTILE_SECRET_KEY` — secret validation key

When configured, the form renders Turnstile and validates each token server-side before sending the lead email.

### Optional rate limiting

Create a Workers KV namespace and bind it to the Pages project as `LEAD_RATE_LIMIT`. The current implementation limits submissions to five per source IP hash per hour. Raw IP addresses are not stored in KV.

## Custom domain

The domain remains registered at GoDaddy. Add the domain as a Cloudflare zone, replace the GoDaddy nameservers with the assigned Cloudflare nameservers, and associate the domain from the Cloudflare Pages project's **Custom domains** section.
