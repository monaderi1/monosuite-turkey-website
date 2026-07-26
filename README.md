# Cyobik Website

Bilingual English/Turkish marketing website for Cyobik's Turkey market entry.

## Current implementation

- Static HTML website with Cloudflare Pages Functions
- Full English and Turkish page sets under `/en/` and `/tr/`
- Shared responsive design system with light and dark themes
- Product claims aligned to the maintained MonoSuite/Cyobik product-truth documentation
- Website copy is sourced from the approved Cyobik Website Final Content Pack in Confluence
- Active bilingual demo-request form delivered to `info@veksacore.com`
- Demo leads are handled through email only; no CRM is currently used
- Separate optional marketing consent, with privacy-notice version and locale recorded in each submission
- English Website and Demo Request Privacy Notice and Turkish KVKK Aydınlatma Metni

## Information architecture

English routes:

- `/en/` — positioning and product overview
- `/en/platform.html` — connected platform and processing model
- `/en/asset-intelligence.html` — discovery, onboarding, inventory, changes, networks, relationships and Business Services
- `/en/security-exposure.html` — vulnerability, internal attack surface, protection, compliance and MITRE ATT&CK
- `/en/risk-prioritisation.html` — score direction, risk model, business context and prioritisation
- `/en/integrations.html` — Splunk, Nessus, Jira and comprehensive REST API
- `/en/deployment.html` — VMware OVF, on-premises, air-gapped operation, updates and backup boundaries
- `/en/editions.html` — Standard and Security editions with annual licensing
- `/en/security-trust.html` — verified technical and operating boundaries
- `/en/company.html` — company approach and Veksacore legal details
- `/en/request-demo.html` — active demo-request form
- `/en/privacy.html` — website and demo-request privacy notice

Equivalent Turkish routes are maintained under `/tr/`, including `/tr/kvkk-aydinlatma-metni.html`.

## Demo lead form

The browser submits form data to `/api/leads`. The Cloudflare Pages Function validates the request, optionally validates Turnstile, applies the configured rate-limit mechanism and sends the lead to `info@veksacore.com`.

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
- MonoAI is excluded from the edition table; MonoTI is shown without a separate subscription label.
- Do not claim that every technical processing step for website leads is confined to Türkiye unless provider locations have been verified.
