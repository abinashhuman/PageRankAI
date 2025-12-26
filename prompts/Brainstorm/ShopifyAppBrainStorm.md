<!-- *### Role -->
You are an expert full-stack Shopify App developer specialized in the Shopify platform and the Shopify Ecosystem (2025 standards), including the latest Admin API, Storefront API, Theme App Extensions, App Blocks, ScriptTags, Metafields, Webhooks, OAuth, Polaris, App Bridge, and Shopify CLI. You stay current with Shopify's best practices, security guidelines, and app store review requirements. Your answers are precise, actionable, and production-ready.

### Context
I am building a "Generative Engine Optimization" (GEO) Shopify App for the public Shopify App Store. The app's purpose is to optimize product pages for both traditional SEO (Google) and AI Search Engines (ChatGPT Search, Perplexity, Gemini). Do it as a turnkey solution and do it better than average.

### Project Goal
Build a publishable Shopify App for the Shopify App Store that acts as a turnkey solution for merchants to hyper-optimize their store for:
1. Traditional SEO (Google, Bing)
2. Generative Engine Optimization (GEO) for AI-powered search tools and chatbots (ChatGPT, Perplexity, Copilot, Gemini)

The app must automatically analyze product pages, collections, and key pages, then generate and apply optimizations with minimal merchant effort. Optimizations include (but are not limited to):
- Improved product titles, meta titles, and meta descriptions
- Rich, keyword-optimized yet natural product descriptions
- Image alt text improvements
- FAQ sections and FAQPage schema
- Enhanced structured data (JSON-LD) for Product, BreadcrumbList, Organization, Review, AggregateRating, etc.
- Internal linking suggestions
- Content clarity and structure improvements that help LLMs accurately extract and cite information

The solution must be turnkey: after installation and one-click setup, the app scans the store, proposes changes, lets the merchant preview/approve/reject individually or in bulk, and applies approved changes automatically. Changes should persist correctly and respect theme variations.

### Core mechanism
Ingest: The app listens for product updates.
Optimize: An AI agent analyzes the product data and generates:
Enriched Product Descriptions (formatted for NLP readability).
Comprehensive JSON-LD Structured Data (Schema.org) optimized for AI parsers.
FAQ content based on product attributes.
Review: These optimizations are stored in a "Staging" state.
Publish: The merchant reviews and approves changes via the App Dashboard. Upon approval, the optimizations go live on the storefront automatically.

### Technical Guardrails with required strict adherence 
Tech Stack: Use the latest Shopify Remix App Template (Node.js/React).
Storefront Integration: You must use Theme App Extensions (App Embeds and App Blocks). Do NOT suggest using the Asset API to modify Liquid files directly.
Data Storage: Use Shopify Metafields to store both "Pending" and "Approved" content. Do not overwrite native product.description directly; use a non-destructive overlay approach.

UI: Use Shopify Polaris for the embedded admin dashboard.

### Your Task
Follow the Core mechanism and technical guidelines and achieve the following.
Perform thorough, up-to-date research using:
- Official Shopify documentation first (dev.shopify.com, shopify.dev/docs/api, etc.)
- Shopify CLI docs, partner blog posts, and changelog
- Reliable open-source example apps (e.g., Shopify's dawn reference theme extensions, popular SEO apps on GitHub)
- Recent (2024–2025) community discussions, dev forums, and app store guidelines

You are designing a complete, production-viable architecture and data flow that Claude opus 4.5, Gemini 3 or Codex can use to create functional code to the spec.

Deliver your response in the following exact structure

1. Executive Summary  
   One-paragraph overview of the recommended approach, key technologies, and why it is turnkey and approvable on the App Store.

2. Core Architecture & Tech Stack  
   - Backend (Node.js/Express, Ruby on Rails, or other – justify choice)
   - Frontend in admin (Polaris + App Bridge)
   - Database/storage needs (e.g., Shopify metafields, app's own DB)
   - Deployment (Heroku, Fly.io, Vercel, etc.)
   - Use of Theme App Extensions, App Blocks, App Embeds, ScriptTags, or Asset API – explain trade-offs and final choice

3. Authentication & Permissions  
   - Detailed OAuth 2.0 flow (online vs offline access)
   - Exact scopes required (read_products, write_products, read_themes, write_script_tags, etc.) and minimal set justification
   - Session management and token storage best practices

4. Detailed Flow & API Sequence  
   Step-by-step user and system flow from install → optimization → approval → deployment. 
   Data Model: Define the Metafield namespaces/keys for "Pending" vs. "Approved" states (e.g., geo.pending_json_ld vs geo.active_json_ld).
   Include:
   - Webhook usage (e.g., product/update, theme/publish) -> Queue -> AI Processing -> Metafield Write
   - How to scan/analyze existing products and pages
   - How to generate optimizations (call to OpenAI/Anthropic/Groq API – include cost considerations)
   - Storage of proposed vs approved changes
   - Merchant Approval (UI) -> Metafield Status Update
   - Application of approved changes (Product API updates, ScriptTag for JSON-LD, App Embed Blocks, etc.)
   - Storefront Rendering (Liquid logic inside the App Embed Block)

6. Development & Testing Setup  
   - Step by step instructions to create a Shopify Partners development store
   - How to set up dummy products/collections for testing
   - Shopify CLI commands to scaffold, serve, and deploy the app
   - Ngrok usage for local webhook testing

7. Key Challenges & Limitations  
   List any significant obstacles, risks, or areas of lower confidence, including:
   - Theme compatibility issues
   - Rate limits and costs (Shopify API + AI provider)
   - Accuracy/quality of AI generated content
   - App Store review risks (automated theme modifications, etc.)
   - Edge cases (variant heavy products, multilingual stores, custom themes)
   - Proposed mitigations or workarounds

Prioritize solutions that avoid direct theme file modification (prefer Theme App Extensions, ScriptTags, and App Embeds) to maximize compatibility and pass App Store review.

Think step-by-step, cite specific Shopify documentation sections or examples when relevant, and ensure every recommendation is realistic and implementable today (December 2025 or later).