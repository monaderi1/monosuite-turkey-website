# Cyobik Website

Bilingual English/Turkish marketing website for Cyobik's Turkey market entry.

## Current implementation

- Static HTML website with Cloudflare Pages Functions
- Full English and Turkish page sets under `/en/` and `/tr/`
- Shared responsive design system with light and dark themes
- Product claims aligned to the maintained MonoSuite/Cyobik product-truth documentation
- Website copy is sourced from the approved Cyobik Website Final Content Pack in Confluence
- Active bilingual demo-request form delivered to the existing `monaderi@hotmail.com` mailbox
- Separate optional marketing consent, with privacy-notice version and locale recorded in each submission
- Plain-text English Privacy Notice and Turkish KVKK Aydınlatma Metni
- Plain-text English and Turkish Website Terms of Use

## Website content source of truth

Confluence is the editorial source of truth for public website copy:

- [Cyobik Website Final Content Pack](https://monosuite.atlassian.net/wiki/spaces/MTM/pages/10911816/Cyobik+Website+Final+Content+Pack)
- [Cyobik Website Content Governance](https://monosuite.atlassian.net/wiki/spaces/MTM/pages/15466499/Cyobik+Website+Content+Governance)
- [Cyobik Website Shared Content](https://monosuite.atlassian.net/wiki/spaces/MTM/pages/15466520/Cyobik+Website+Shared+Content)

Production never fetches Confluence at runtime. The repository contains a reviewed, versioned snapshot at `content/website-content.snapshot.json`. `content/confluence-pages.json` records the exact Confluence page IDs and expected titles used by the exporter.

The initial snapshot records:

- 12 bilingual route pages;
- 539 route content items;
- 27 publishable shared content items;
- 7 middleware-only strings excluded because they are not approved and have no Turkish value.

### Content sync

The exporter uses the Confluence Cloud REST API v2 and reads Atlas Document Format tables. Set these environment variables locally without committing them:

- `ATLASSIAN_BASE_URL`
- `ATLASSIAN_EMAIL`
- `ATLASSIAN_API_TOKEN`

Then run:

```sh
npm run content:export
npm run content:validate
npm run site:build
npm test --offline
```

The exporter fails if a registered page is missing, renamed, malformed, redirects to another host, contains a duplicate content ID, has a non-publishable status, or produces incomplete English or Turkish content. It also refuses to send credentials to any origin other than the registered Atlassian site. Unapproved shared strings are preserved in the snapshot's excluded list but cannot enter publishable content.

### Generated website workflow

The route files under `en/` and `tr/`, plus `assets/layout.js` and `assets/site.js`, are generated artifacts. Their public copy comes from `content/website-content.snapshot.json`; their structure comes from the files under `site/templates/`.

- Change copy in Confluence, then export the snapshot and run `npm run site:build`.
- Change markup or layout in `site/templates/`, then run `npm run site:build`.
- Do not edit generated route HTML or generated JavaScript copy directly.
- `npm run site:check` fails when a generated file is stale or was edited by hand.
- `npm run site:templates:init` is a migration utility, not part of the normal publishing workflow; it rebuilds templates from the currently generated site and should only be used intentionally.

Production does not contact Confluence. Cloudflare serves the committed generated files, so an unavailable Confluence instance cannot break the live website.

### Publication workflow

1. Edit English and Turkish together in the registered Confluence route page.
2. Complete copy, translation and product-claim review.
3. Export and validate the repository snapshot.
4. Run `npm run site:build` to update only the generated files affected by the snapshot diff.
5. Run `npm test --offline`; CI repeats the snapshot and generated-output checks.
6. Review both the content-ID diff and generated-file diff in a pull request.
7. Verify the Cloudflare preview against the approved Confluence content.
8. Merge to publish.

The generator replaces values by stable content ID and writes only output files whose content actually changed. A one-page copy change therefore does not rewrite unrelated pages.

## Information architecture

English routes:

- `/en/` — positioning and product overview
- `/en/platform` — connected platform and processing model
- `/en/asset-intelligence` — discovery, onboarding, inventory, changes, networks, relationships and Business Services
- `/en/security-exposure` — vulnerability, internal attack surface, protection, compliance and MITRE ATT&CK
- `/en/risk-prioritisation` — score direction, risk model, business context and prioritisation
- `/en/integrations` — Splunk, Nessus, ITSM/ticketing and comprehensive REST API
- `/en/deployment` — VMware OVF, on-premises, air-gapped operation, updates and backup boundaries
- `/en/editions` — Standard and Security editions with annual licensing
- `/en/company` — company approach and Veksacore legal details
- `/en/request-demo` — active demo-request form
- `/en/privacy` — website and demo-request privacy notice
- `/en/terms` — public website terms of use

Equivalent Turkish routes are maintained under `/tr/`, including `/tr/kvkk-aydinlatma-metni` and `/tr/kullanim-kosullari`.

## Brand-name rule

- The product and brand name must always be written exactly as `Cyobik` in every language.
- Do not translate, transliterate or localise the spelling.
- In Turkish copy, rewrite sentences so Turkish grammatical suffixes are not attached to the brand name.

## Demo lead form

The browser submits form data to `/api/leads`. The Cloudflare Pages Function validates the request, optionally validates Turnstile, applies the configured rate-limit mechanism and sends the lead to the existing `monaderi@hotmail.com` mailbox.

Required Cloudflare variables/secrets:

- `CF_ACCOUNT_ID`
- `CF_EMAIL_API_TOKEN`
- `LEAD_FROM_EMAIL`

Optional protection settings:

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `REQUIRE_TURNSTILE=true`
- `LEAD_RATE_LIMIT` KV binding

## Deployment target

The production website is deployed with **Cloudflare Pages**. GitHub is the source repository; GitHub Pages is not used.

Cloudflare Pages configuration:

- Production branch: `main`
- Framework preset: None
- Build command: `exit 0`
- Build output directory: `.`
- Root directory: repository root

Cloudflare Pages creates preview deployments for non-production branches and pull requests. Merges to `main` publish the production version automatically.

## Public-content boundaries

- Do not publish High Availability, clustering, failover, disaster-recovery, RPO or RTO claims.
- Do not imply support for Hyper-V, KVM, bare metal, container deployment or public-cloud marketplace images.
- Do not name certifications, assessors or external validations without approved publishable evidence.
- Use `more than 1,500 CIS Benchmark recommendations` publicly; do not call them CIS Controls.
- Public pricing is not displayed. Cyobik is offered through annual licensing and Contact Sales.
- MonoAI is excluded from the edition table; CyoTI is shown without a separate subscription label.
- Do not claim that every technical processing step for website leads is confined to Türkiye unless provider locations have been verified.
- Do not merge legal or form changes to `main` without explicit approval after reviewing the preview deployment.

<!-- Cloudflare preview redeploy trigger: 2026-07-27 -->
