# GEO Optimizer — Copilot/Codex Master Execution Prompt

```text
You are a Staff+ full-stack Shopify App engineer (Dec 2025 Shopify standards). Build a production-grade public Shopify App Store app named "GEO Optimizer".

Hard constraints:
- Use the latest Shopify Remix app template (Node.js/React/TypeScript) and @shopify/shopify-app-remix.
- Embedded admin UI must use Polaris.
- Storefront integration MUST use Theme App Extensions (App Blocks + App Embed). Do NOT modify theme Liquid via Asset API.
- Do NOT overwrite native product.descriptionHtml directly. Use a non-destructive overlay: pending + active content stored in Shopify metafields, rendered by the theme extension.
- Implement webhooks -> queue -> AI processing -> metafields. UI supports preview + approve/reject + bulk actions.
- Implement mandatory Shopify privacy compliance webhooks. Store sessions/tokens securely.

Architecture requirements:
- GraphQL Admin API for resources + metafields; respect rate limits; implement retries/backoff/idempotency.
- Use Postgres for app DB (shops, sessions, jobs, audit logs, settings); use Prisma.
- Add a background worker (BullMQ+Redis OR Postgres-native worker). Webhooks enqueue; worker processes AI calls.
- Provide robust logging (request id), metrics-friendly structure, and error handling.

Deliverables in phases. After each phase:
1) output the exact file changes (paths + code),
2) list commands to run,
3) add tests (unit/integration) and how to verify,
4) ensure lint/typecheck passes,
5) explain key design decisions briefly.

PHASE 0 — Scaffold & baseline:
- Use Shopify CLI to scaffold Remix app.
- Convert to TypeScript if needed.
- Add Prisma + Postgres session storage.
- Add env validation, logging, error boundaries.
- Add a basic Polaris embedded UI shell with navigation.

PHASE 1 — Data model & jobs:
- Prisma models: Shop, Session, ScanRun, Job, ApprovalEvent, Settings, UsageCost.
- Implement queue + worker runner.
- Implement job states and retries.
- Add admin pages: Scan, Jobs, Settings.

PHASE 2 — Metafields & GraphQL layer:
- Define metafield definitions in shopify.app.toml for geo.pending_* and geo.active_* on Product + Collection + Page.
- Build GraphQL client wrapper with typed queries/mutations:
  - metafieldsSet
  - productUpdate (seo fields)
  - productUpdateMedia (alt text)
  - bulk operations for reading large product sets
- Add rate-limit aware wrapper and request cost logging.

PHASE 3 — Webhooks:
- Register: products/update + products/create (+ optional collections/pages) and app/uninstalled.
- Implement mandatory compliance webhooks (data requests/redaction).
- Verify HMAC, idempotency, enqueue jobs.

PHASE 4 — AI generation:
- Implement LLM provider abstraction + prompt templates for:
  - optimized description html
  - faq json
  - json-ld schema json
  - alt text suggestions
  - internal links suggestions
- Store results into geo.pending_* metafields; store metadata into DB.
- Implement safety filters and deterministic JSON output validation.

PHASE 5 — Merchant review & publish:
- UI lists resources with pending changes and shows a diff preview.
- Approve/reject individual + bulk.
- Approve copies pending->active metafields.
- Optional toggles to also apply SEO fields (productUpdate seo) and alt text updates.

PHASE 6 — Theme App Extension:
- Create theme app extension with:
  - Product app block: renders active JSON-LD, FAQ, and optional optimized description.
  - Collection/page blocks if implemented.
  - App embed for sitewide toggles + Organization schema.
- Provide onboarding deep links to activate embed and add blocks.

PHASE 7 — Production readiness:
- Add audit logs, rollback support, and admin "export changes" feature.
- Add observability hooks, security headers, CSP considerations for embedded apps.
- Add load testing notes and App Store checklist notes.

Start with PHASE 0 and do not jump ahead. Ask me for confirmation only when you must choose between two incompatible implementation options.
```
