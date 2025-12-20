GEO Shopify App

Generative Engine Optimization for Shopify

Complete Architecture & Implementation Specification

Version 1.0 \| December 2025

Production-Ready Technical Blueprint for Shopify App Store

1\. Executive Summary

This specification defines a production-ready Shopify app for
**Generative Engine Optimization (GEO)** - a turnkey solution enabling
merchants to optimize their stores for both traditional search engines
(Google, Bing) and AI-powered search tools (ChatGPT, Perplexity, Gemini,
Copilot). The app leverages the **Shopify Remix App Template** with
Node.js/React, utilizing **Theme App Extensions** (App Embeds and App
Blocks) for non-destructive storefront integration - explicitly avoiding
direct theme file modification via the Asset API to ensure App Store
compliance and maximum theme compatibility.

The architecture employs a **non-destructive overlay approach**: all
AI-generated optimizations (enhanced descriptions, JSON-LD structured
data, FAQ schemas, meta improvements) are stored in Shopify Metafields
with distinct \'pending\' and \'approved\' states. Native product data
remains untouched. Merchants review proposed changes via an embedded
Polaris dashboard, approve individually or in bulk, and approved content
renders automatically on the storefront through Theme App Extension
Liquid blocks. This approach satisfies Shopify\'s App Store review
requirements (particularly the 2025 mandate for GraphQL-only APIs),
ensures clean uninstallation, and provides merchants complete control
over AI-generated content before it goes live.

2\. Core Architecture & Tech Stack

2.1 Technology Stack Overview

  -----------------------------------------------------------------------
  **Component**           **Technology**
  ----------------------- -----------------------------------------------
  Framework               Shopify Remix App Template (React Router v7)

  Backend Runtime         Node.js 20+ with TypeScript

  Frontend UI             Polaris v13 + App Bridge v4

  Database                Prisma ORM with PostgreSQL (production) /
                          SQLite (dev)

  Storefront Integration  Theme App Extensions (App Embeds + App Blocks)

  Data Storage            Shopify Metafields (app-owned namespace)

  API                     GraphQL Admin API 2025-01+ (REST deprecated)

  AI Provider             Anthropic Claude API / OpenAI GPT-4

  Deployment              Fly.io / Railway / Vercel (recommended)

  Background Jobs         BullMQ with Redis (webhook processing queue)
  -----------------------------------------------------------------------

2.2 Backend Architecture

**Why Shopify Remix Template:**

-   Official Shopify-maintained template with built-in OAuth, session
    management, and App Bridge integration

-   File-based routing matches Shopify\'s webhook patterns (e.g.,
    /app/routes/webhooks.products.update.tsx)

-   Token exchange authentication (no redirect OAuth) for embedded apps
    since February 2024

-   Prisma integration for session storage and app-specific data

-   TypeScript support out-of-the-box for type-safe GraphQL queries

2.3 Storefront Integration Strategy

**CRITICAL REQUIREMENT:** Theme App Extensions are mandatory. Direct
theme file modification via Asset API is prohibited for App Store
compliance.

  -----------------------------------------------------------------------
  **Method**        **Use Case**               **App Store Status**
  ----------------- -------------------------- --------------------------
  App Embed Block   JSON-LD injection in       APPROVED - Auto-activates,
                    \<head\>, global scripts   works on all themes

  App Block         FAQ sections, review       APPROVED - OS 2.0 themes
                    widgets, content blocks    only, merchant positions

  Asset API         Direct Liquid file         PROHIBITED - Causes review
                    modification               rejection

  ScriptTags        Legacy JavaScript          DEPRECATED - Use App
                    injection                  Embeds instead
  -----------------------------------------------------------------------

2.4 Database Schema Design

The app uses a hybrid storage approach: Shopify Metafields for
storefront-accessible data, and Prisma/PostgreSQL for app-internal
state, analytics, and job queues.

**Prisma Models:**

-   **Session** - Shopify session tokens (built-in from template)

-   **Shop** - Store settings, AI preferences, subscription tier

-   **OptimizationJob** - Queue tracking: productId, status, createdAt,
    completedAt

-   **AuditLog** - Change history: productId, fieldChanged, oldValue,
    newValue, approvedAt

3\. Authentication & Permissions

3.1 OAuth Flow (Token Exchange)

Since February 2024, Shopify uses **Shopify Managed Installation with
Token Exchange** for embedded apps, eliminating redirect-based OAuth:

1.  Merchant clicks \'Install\' from App Store listing

2.  Shopify automatically grants scopes defined in shopify.app.toml

3.  App receives session token via App Bridge on first load

4.  Backend exchanges session token for access token using
    \@shopify/shopify-app-remix

5.  Access token stored in Prisma Session table for subsequent API calls

3.2 Required Access Scopes

**Minimal Scope Justification:** Request only scopes necessary for core
functionality. Excessive scopes trigger App Store review flags.

  ------------------------------------------------------------------------
  **Scope**             **Access Type**       **Justification**
  --------------------- --------------------- ----------------------------
  read_products         Required              Fetch product data for AI
                                              analysis

  write_products        Required              Write metafields to products
                                              (GEO content)

  read_content          Required              Access pages, blogs for
                                              analysis

  write_content         Optional              Only if modifying page
                                              metafields

  read_themes           Required              Verify theme OS 2.0
                                              compatibility

  read_metaobjects      Optional              For FAQ metaobject
                                              definitions

  write_metaobjects     Optional              Create FAQ metaobject
                                              entries
  ------------------------------------------------------------------------

3.3 shopify.app.toml Configuration

Scopes are declared in the app configuration file and managed via
Shopify CLI:

\[access_scopes\]

scopes = \"read_products,write_products,read_content,read_themes\"

use_legacy_install_flow = false

4\. Detailed Flow & API Sequence

4.1 High-Level System Flow

The system operates through four primary phases: Ingest, Optimize,
Review, and Publish.

Phase 1: Ingest (Webhook Reception)

1.  Shopify fires products/create or products/update webhook

2.  Webhook handler validates HMAC signature

3.  Job enqueued to BullMQ Redis queue with product GID

4.  Immediate 200 OK response to Shopify (\< 5 seconds)

Phase 2: Optimize (AI Processing)

1.  Worker dequeues job and fetches full product data via GraphQL

2.  Product data assembled: title, description, images, variants,
    vendor, tags

3.  AI prompt constructed with GEO optimization instructions

4.  Claude/GPT generates: enhanced description, JSON-LD, FAQs, meta tags

5.  Generated content written to PENDING metafields

Phase 3: Review (Merchant Dashboard)

1.  Dashboard displays products with pending optimizations

2.  Side-by-side diff view: current vs. proposed content

3.  Merchant can Edit, Approve, Reject, or Regenerate

4.  Bulk actions available for efficient review

Phase 4: Publish (Activation)

1.  On Approve: content copied from PENDING to ACTIVE metafields

2.  Theme App Extension reads ACTIVE metafields

3.  JSON-LD injected via App Embed in \<head\>

4.  FAQ content rendered via App Block in product template

5.  Changes live immediately, no theme publish required

4.2 Metafield Data Model

All GEO content stored in app-owned metafields using the \$app:geo
namespace:

  ---------------------------------------------------------------------------------------
  **Metafield Key**               **Type**           **Purpose**
  ------------------------------- ------------------ ------------------------------------
  \$app:geo.pending_description   multi_line_text    AI-enhanced description awaiting
                                                     review

  \$app:geo.active_description    multi_line_text    Approved description for storefront

  \$app:geo.pending_jsonld        json               Proposed JSON-LD structured data

  \$app:geo.active_jsonld         json               Live JSON-LD for search engines

  \$app:geo.pending_faq           json               Generated FAQ Q&A pairs

  \$app:geo.active_faq            json               Approved FAQ for storefront

  \$app:geo.pending_meta          json               Meta title/description suggestions

  \$app:geo.active_meta           json               Approved meta tags

  \$app:geo.status                single_line_text   pending\|approved\|rejected\|error

  \$app:geo.last_optimized        date_time          Timestamp of last AI processing
  ---------------------------------------------------------------------------------------

4.3 Webhook Configuration

Webhooks defined in shopify.app.toml for app-specific subscriptions:

\[webhooks\]

api_version = \"2025-01\"

\[\[webhooks.subscriptions\]\]

topics = \[\"products/create\", \"products/update\"\]

uri = \"/webhooks/products\"

\[\[webhooks.subscriptions\]\]

topics = \[\"app/uninstalled\"\]

uri = \"/webhooks/app/uninstalled\"

4.4 AI Processing Pipeline

**GEO Optimization Prompt Structure:**

-   **Context:** Product data (title, description, images, variants,
    price, vendor)

-   **Task 1:** Generate enhanced product description optimized for NLP
    readability

-   **Task 2:** Create comprehensive JSON-LD (Product, Offer,
    AggregateRating, FAQ schemas)

-   **Task 3:** Generate 5-8 FAQ Q&A pairs based on product attributes

-   **Task 4:** Suggest optimized meta title (\< 60 chars) and
    description (\< 160 chars)

-   **Output:** Structured JSON response for each task

**Cost Considerations:**

-   Claude Sonnet 4: \~\$3 per 1M input tokens, \~\$15 per 1M output
    tokens

-   Estimated cost per product: \$0.01-0.03 depending on description
    length

-   Implement token counting and cost caps per shop/day

-   Consider batch processing during off-peak hours

5\. Theme App Extension Implementation

5.1 Extension Structure

extensions/

└── geo-theme-extension/

├── blocks/

│ ├── geo-jsonld.liquid \# App Embed - JSON-LD injection

│ └── geo-faq.liquid \# App Block - FAQ section

├── snippets/

│ └── geo-schema-helpers.liquid

├── assets/

│ └── geo-faq.css

└── shopify.extension.toml

5.2 App Embed Block (JSON-LD Injection)

The App Embed automatically injects optimized JSON-LD into every page\'s
\<head\>:

**geo-jsonld.liquid:**

{% if product and product.metafields\[\"\$app:geo\"\].active_jsonld %}

\<script type=\"application/ld+json\"\>

{{ product.metafields\[\"\$app:geo\"\].active_jsonld }}

\</script\>

{% endif %}

5.3 App Block (FAQ Section)

Merchants position this block within their product template:

**geo-faq.liquid schema:**

{% schema %}

{

\"name\": \"GEO FAQ Section\",

\"target\": \"section\",

\"templates\": \[\"product\"\],

\"settings\": \[

{ \"type\": \"text\", \"id\": \"heading\", \"label\": \"Section
Heading\", \"default\": \"FAQ\" }

\]

}

{% endschema %}

6\. Development & Testing Setup

6.1 Prerequisites

-   Node.js 20+ (required for Polaris v13)

-   Shopify CLI 3.x installed globally: npm install -g \@shopify/cli

-   Shopify Partner Account (partners.shopify.com)

-   Development Store with Online Store 2.0 theme (Dawn recommended)

6.2 Development Store Setup

1.  Log into Shopify Partners Dashboard

2.  Navigate to Stores \> Add store \> Create development store

3.  Select \'Create a store to test and build\'

4.  Enable \'Start with test data\' for sample products

5.  Install Dawn theme (Online Store \> Themes \> Add Dawn)

6.3 App Scaffolding

\# Create new app from Remix template

npm init \@shopify/app@latest \-- \--template remix

\# Navigate and install dependencies

cd geo-shopify-app && npm install

\# Generate Theme App Extension

shopify app generate extension \--type theme_app_extension

\# Start development server with tunnel

shopify app dev

6.4 Testing Webhooks Locally

Shopify CLI creates a Cloudflare tunnel automatically. Test webhooks
with:

shopify app webhook trigger \\

\--topic products/update \\

\--api-version 2025-01 \\

\--delivery-method http

6.5 Deployment Commands

\# Deploy app and extensions to Shopify

shopify app deploy

\# Verify extension status

shopify app versions list

7\. Key Challenges & Limitations

7.1 Theme Compatibility

  -----------------------------------------------------------------------
  **Challenge**           **Impact**              **Mitigation**
  ----------------------- ----------------------- -----------------------
  Vintage themes (pre-OS  App Blocks not          App Embeds still work;
  2.0)                    supported               provide manual
                                                  integration docs

  Custom themes without   FAQ block cannot be     Detect and notify
  \@app blocks            positioned              merchant; offer code
                                                  snippet

  Themes with existing    Potential schema        Use \@id to merge;
  JSON-LD                 conflicts               validate with Rich
                                                  Results Test
  -----------------------------------------------------------------------

7.2 Rate Limits & Performance

  -----------------------------------------------------------------------
  **Limit Type**          **Threshold**           **Strategy**
  ----------------------- ----------------------- -----------------------
  Shopify GraphQL         50 points/second        Implement exponential
                                                  backoff; batch queries

  Webhook processing      5 second response       Immediate queue; async
                                                  processing

  Claude API              Varies by tier          Queue with rate
                                                  limiting; batch during
                                                  low-traffic

  Metafield writes        Part of GraphQL budget  Combine mutations; use
                                                  productUpdate with
                                                  metafields
  -----------------------------------------------------------------------

7.3 AI Content Quality

-   **Hallucination Risk:** AI may invent product features not in source
    data

-   **Mitigation:** Strict prompt engineering; require citations from
    product data only

-   **Brand Voice:** AI output may not match merchant\'s tone

-   **Mitigation:** Add brand voice settings; learn from approved edits

-   **Duplicate Content:** Similar products may get similar descriptions

-   **Mitigation:** Include variant differentiation; check similarity
    scores

7.4 App Store Review Risks

1.  **Automated Content Concerns:** Reviewers scrutinize AI-generated
    content apps. Emphasize human approval step.

2.  **Theme Modification Check:** Ensure no Asset API usage. Use Theme
    App Extensions exclusively.

3.  **Performance Impact:** Must not reduce Lighthouse score by \>10
    points. Lazy-load non-critical content.

4.  **GraphQL Requirement:** As of April 2025, all new public apps must
    use GraphQL Admin API exclusively.

5.  **Privacy Compliance:** Implement mandatory GDPR webhooks
    (customers/data_request, customers/redact).

7.5 Edge Cases

  -----------------------------------------------------------------------
  **Scenario**            **Handling Strategy**
  ----------------------- -----------------------------------------------
  High-variant products   Generate ProductGroup schema; summarize
  (100+ variants)         variants by attributes

  Multilingual stores     Detect locale from product; generate content in
                          matching language

  Digital/service         Adjust schema type (Service,
  products                SoftwareApplication); skip shipping fields

  Products without images Skip image optimization; note in review UI

  Subscription products   Include SubscriptionOffer schema; handle
                          recurring pricing
  -----------------------------------------------------------------------

8\. GEO-Specific Optimizations

8.1 What Makes Content AI-Citeable

Research shows these factors increase AI citation probability:

1.  **Fact Density:** Include statistics every 150-200 words
    (specifications, dimensions, ratings)

2.  **Direct Answers:** First 40-60 words should directly answer \'What
    is this product?\'

3.  **Structured Data:** Comprehensive JSON-LD with Product, Offer, FAQ,
    Review schemas

4.  **Citation Sources:** Reference authoritative standards (e.g.,
    \'meets ISO 9001 certification\')

5.  **Clear Structure:** Use semantic HTML (h2, h3, lists) that LLMs can
    parse easily

8.2 JSON-LD Schema Requirements

Comprehensive schema markup for maximum AI/search engine visibility:

-   **Product:** name, description, image, sku, brand, offers,
    aggregateRating

-   **Offer:** price, priceCurrency, availability, priceValidUntil,
    seller

-   **AggregateRating:** ratingValue, reviewCount, bestRating,
    worstRating

-   **FAQPage:** mainEntity array with Question/Answer pairs

-   **BreadcrumbList:** itemListElement for navigation path

-   **Organization:** Store identity for brand authority signals

8.3 FAQ Generation Strategy

AI-generated FAQs should cover:

-   **Product Specifications:** \'What are the dimensions of
    \[product\]?\'

-   **Usage Questions:** \'How do I use \[product\]?\'

-   **Comparison Queries:** \'How does \[product\] compare to
    \[competitor\]?\'

-   **Purchase Intent:** \'What\'s included with \[product\]?\'

-   **Support Questions:** \'What is the warranty on \[product\]?\'

Appendix A: Key Documentation References

-   Shopify Remix Template:
    github.com/Shopify/shopify-app-template-remix

-   Theme App Extensions:
    shopify.dev/docs/apps/build/online-store/theme-app-extensions

-   Metafields API: shopify.dev/docs/apps/build/custom-data

-   Webhooks Reference: shopify.dev/docs/api/webhooks

-   App Store Requirements:
    shopify.dev/docs/apps/launch/app-requirements-checklist

-   GraphQL Admin API: shopify.dev/docs/api/admin-graphql

-   Polaris Design System: polaris.shopify.com

-   GEO Research Paper: arxiv.org/abs/2311.09735

Appendix B: GraphQL Mutation Examples

**Write Pending Metafields:**

mutation UpdateProductMetafields(\$input: ProductInput!) {

productUpdate(input: \$input) {

product {

id

metafields(first: 10, namespace: \"\$app:geo\") {

edges { node { key value } }

}

}

userErrors { field message }

}

}

*--- End of Specification ---*
