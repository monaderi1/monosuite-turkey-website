# PrimWard Turkey Website

English-first marketing website for PrimWard's Turkey market entry.

## Current implementation

- Static HTML website
- Selected visual direction: Theme 3 / Intelligence Graph
- Primary language: English
- Demo requests handled by email during the initial phase

## Deployment target

The production website is deployed with **Cloudflare Pages**. GitHub is the source repository; GitHub Pages is not used.

### Cloudflare Pages configuration

- Git provider: GitHub
- Repository: `monaderi1/monosuite-turkey-website`
- Production branch: `main`
- Framework preset: None
- Build command: `exit 0`
- Build output directory: `/`
- Root directory: repository root

Cloudflare Pages creates preview deployments for non-production branches and pull requests. Merges to `main` publish the production version automatically after the Git integration is connected.

## Custom domain

The domain remains registered at GoDaddy. For the apex domain, add the domain as a Cloudflare zone and replace the GoDaddy nameservers with the Cloudflare nameservers assigned to the zone. Then associate the domain from the Cloudflare Pages project's **Custom domains** section.

## Files

- `index.html` — current homepage
- `platform.html` — earlier platform page
- `assets/` — earlier static assets retained for reference
- `archive/` — archived concepts and previous homepage versions
