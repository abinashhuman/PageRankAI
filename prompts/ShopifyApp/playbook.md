# GEO Optimizer — Shopify App Copilot Execution Playbook (Production-Grade)

This document is meant to be pasted into **Copilot Chat / Codex** and followed **phase-by-phase** to build a Shopify App Store–ready embedded app that performs **GEO (Generative Engine Optimization)** for a merchant’s catalog.

**Design goals**
- Production-grade, scalable, robust, future-proof.
- Non-destructive publishing: AI output is stored in **Shopify Metafields** (Pending + Active), not by editing theme files or overwriting core fields.
- Storefront rendering via **Theme App Extensions** (App Blocks + App Embed).
- Async processing using **webhooks → queue → worker → AI → metafields**.
- Admin UX in Shopify Admin using **Remix + Polaris**.

---

## 1) Architecture Snapshot

### Core components
1. **Embedded Admin App**
   - Shopify Remix template (`@shopify/shopify-app-remix`)
   - React + Polaris UI
   - Auth via Shopify OAuth (offline token is primary)

2. **App Database (Postgres + Prisma)**
   - Operational truth for jobs, scan runs, audits, settings, usage metrics
   - Sessions stored securely (offline + online if needed)

3. **Queue + Worker**
   - BullMQ + Redis *(recommended)* OR Postgres-native worker
   - Handles webhook bursts, retries, backoff, and rate limit control

4. **Shopify Metafields (Storefront Source of Truth)**
   - `geo.pending_*` and `geo.active_*`
   - Theme extension reads `geo.active_*` for live rendering

5. **Theme App Extension**
   - App Block (product template) renders JSON-LD/FAQ/description overlays
   - App Embed for sitewide schema/toggles

---

## 2) Non-Destructive Data Model (Metafields)

**Namespace:** `geo`

### Product metafields — Pending
- `geo.pending_status` (single_line_text_field): `queued | processing | ready | error`
- `geo.pending_description_html` (multi_line_text_field OR rich_text_field)
- `geo.pending_faq_json` (json)
- `geo.pending_jsonld` (json)
- `geo.pending_alt_text_json` (json) → `{ mediaId: altText }`
- `geo.pending_internal_links_json` (json)
- `geo.pending_summary_json` (json) → compact for UI diffs

### Product metafields — Active/Live
- `geo.active_description_html`
- `geo.active_faq_json`
- `geo.active_jsonld`
- `geo.active_internal_links_json`
- `geo.active_version` (single_line_text_field): prompt/schema version

### Collections / Pages / Blogs / Articles
Mirror the same `pending_*` and `active_*` pattern for each supported resource type.

> Define metafield definitions via `shopify.app.toml` so they deploy with the app.

---

## 3) App DB Schema (Prisma)

**Recommended tables**
- `Shop`
- `Session`
- `Settings`
- `ScanRun`
- `Job`
- `ApprovalEvent`
- `UsageCost`
- `AuditLog` (or merge into `ApprovalEvent` + `Job` history)

**Job state machine**
- `queued → processing → ready|error`
- Retry with exponential backoff
- Idempotency keys by `(topic, resourceId, shopId, deliveryId/eventId)`

---

## 4) Webhooks → Queue → AI → Metafields

### Webhooks (minimum)
- `products/create`
- `products/update`
- *(optional)* collections/pages/blogs/articles
- `app/uninstalled`
- **Mandatory privacy/compliance webhooks** for App Store distribution (implement even if no-op beyond cleanup & confirmation)

### Pipeline
1. **Webhook handler**
   - Verify signature/HMAC
   - Deduplicate (idempotency)
   - Enqueue job `{ shopId, resourceType, resourceId, deliveryId }`

2. **Worker**
   - Fetch resource via Admin GraphQL
   - Generate AI outputs via provider abstraction
   - Validate JSON outputs
   - Store result into `geo.pending_*` metafields
   - Update DB job + cost metrics

3. **Admin UI**
   - Lists pending changes
   - Shows preview + diff
   - Approve / reject (single + bulk)

4. **Approval publish**
   - Approve copies `pending_*` → `active_*` using `metafieldsSet`
   - Optional toggles:
     - Apply native `seo { title, description }`
     - Apply image alt via media update mutation

---

## 5) Storefront Integration (Theme App Extension)

### App Block (Product)
Renders:
- `<script type="application/ld+json">` from `geo.active_jsonld`
- FAQ section from `geo.active_faq_json`
- Optional overlay description from `geo.active_description_html`

### App Embed (Sitewide)
- Organization schema
- Global toggles (enable/disable)
- Can be activated via onboarding deep link

> Do **not** modify theme Liquid via Asset API. Theme App Extensions are the intended approach.

---

## 6) AI Layer Requirements

### Provider abstraction
Implement:
- `LLMClient` interface
- Providers: OpenAI / Anthropic / etc. (pluggable)

### Guardrails
- Deterministic JSON output contracts (validate schema)
- Token + cost caps per resource
- Caching by `(shopId, resourceId, resourceUpdatedAt, promptVersion)`
- “Regenerate” action in UI (re-enqueues job)

### Outputs
- Description HTML (non-hallucinated, product-consistent)
- FAQ JSON
- JSON-LD schema JSON
- Alt text suggestions by media
- Internal links suggestions (only within store)

---

## 7) Admin UI (Polaris) — Pages & Features

**Navigation**
- Dashboard (scan status, KPIs)
- Scan / Jobs
- Resources (Products / Collections / Pages)
- Approvals (Pending / Approved / Rejected)
- Settings (AI provider, tone, toggles)
- Audit Log

**Core UX**
- Diff preview (before vs after)
- Bulk approve/reject
- Filters: vendor, tag, collection, “high impact”
- Error states with actionable remediation

---

## 8) Production Readiness Checklist

**Security**
- Never log tokens
- Encrypt secrets
- HMAC verification for webhooks
- Strict input validation
- CSP/headers appropriate for embedded apps

**Reliability**
- Rate-limit aware GraphQL wrapper (cost-based)
- Retries with backoff + jitter
- Dead-letter queue / failed job replay
- Idempotency on webhook handling and metafield writes

**Observability**
- Structured logs with request/job id
- Metrics-friendly counters (queued/processing/ready/error)
- Audit logs for approvals + SEO writes + alt updates

**Compliance**
- Mandatory privacy webhooks implemented
- Clear data retention and deletion behavior
- App uninstall cleanup

---

## 9) Copilot / Codex Master Execution Prompt (Paste This)

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

---

## 10) Verification Steps (What “Done” Looks Like)

**Local**
- `shopify app dev` launches embedded admin UI
- Webhooks arrive and enqueue jobs
- Worker processes jobs and stores `geo.pending_*` metafields
- Admin UI previews pending changes and allows approve/reject
- Approve copies to `geo.active_*`

**Storefront**
- Theme extension installed
- App block added to product template
- JSON-LD and FAQ render using `geo.active_*`
- No theme file modifications required

---

## 11) Notes for Future Extensions

- Multi-language: store localized metafields per locale
- A/B experiments: track impact metrics per variant
- Auto-approval rules (opt-in): approve only low-risk fields (e.g., schema) automatically
- Bulk operations for large stores + progressive onboarding

