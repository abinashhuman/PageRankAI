The GEO Analyzer Algorithm (URL → SEO score + GEO score) 

Inputs and outputs 

Input 

url (string) 

Optional: locale, currency, country, device_profile (mobile/desktop), render_js (bool), analysis_depth (fast/standard/deep) 

Output (JSON) 

seo_score (0–100) 

geo_score (0–800) 

subscores: category scores + raw feature values 

issues: prioritized list of findings with severity + fixes 

extracted_product: normalized product entity (name, brand, price, availability, identifiers, variants, rating, etc.) 

 

Phase 1 — Acquire: fetch, render, and validate access 

Step 1: Resolve & fetch the URL (raw HTTP) 

What it does 

Follow redirects (cap at ~5) 

Capture: 

final URL 

HTTP status + headers 

response time, content-type, content-length 

canonical hints (header + HTML) 

robots directives (header: X‑Robots‑Tag) 

Why it matters 

Crawl/index eligibility begins with “does the bot get a 200 and actual indexable content?” 

Key checks 

status_code == 200 

Not gated by login, paywall, or geo-block in default crawl 

HTML is present (not empty shell) 

 

Step 2: Render the page (headless browser) 

What it does 

Load the page with a browser renderer (Playwright/Puppeteer) 

Wait for network idle (or heuristic: DOMContentLoaded + 2–3s) 

Capture: 

rendered DOM 

final visible text 

JS-injected structured data 

critical resources (CSS/JS) 

screenshot (optional) 

performance metrics (TTFB, DOM load, total blocking time) 

Why it matters 

Many ecommerce pages only expose price/variants/reviews after JS render. 

 

Step 3: Crawl-policy checks (SEO + GEO critical) 

What it does 

Fetch and parse: 

robots.txt at site root 

<meta name="robots"> and <meta name="googlebot"> 

X-Robots-Tag headers 

Evaluate allow/disallow for: 

Googlebot (SEO baseline) 

OAI‑SearchBot (ChatGPT Search eligibility) OpenAI Platform 

PerplexityBot (Perplexity search eligibility) Perplexity 

Why it matters 

If blocked, your “AI visibility score” should drop sharply because the page may never be considered/cited. 

Note: OpenAI also distinguishes OAI‑SearchBot (search) vs GPTBot (training). Your GEO Analyzer should score search bots for visibility. OpenAI Platform 

 

Phase 2 — Understand: classify and extract the product entity 

Step 4: Detect page type (Product page classifier) 

What it does 
Assign page_type ∈ {product, category, article, homepage, other} using a weighted classifier. 

Strong product signals 

Presence of schema.org/Product + offers 

Visible price + currency 

Add-to-cart / buy / availability 

Variant selectors (size/color) 

SKU/GTIN/MPN 

Review count / rating UI 

Output 

is_product_page confidence score 0–1 

If low confidence, still audit but downgrade “product-specific” scoring. 

 

Step 5: Extract structured data (JSON‑LD + Microdata + RDFa) 

What it does 

Parse all schema blocks and normalize into an internal graph: 

Product, Offer/AggregateOffer, AggregateRating, Review 

BreadcrumbList 

Organization, WebSite, WebPage 

Validate against: 

Google product/merchant listing expectations (required/recommended fields) Google for Developers+2Google for Developers+2 

Check “structured data matches visible content” rule of thumb. Google for Developers 

Why it matters 

This is the most machine-readable surface for both classic SEO rich results and AI shopping retrieval. ChatGPT Shopping explicitly mentions structured metadata for selection. OpenAI Help Center 

 

Step 6: Extract visible product facts (DOM → normalized attributes) 

What it does 
From rendered DOM, extract: 

Product name, brand/manufacturer 

Price, currency, sale price, price range 

Availability (in stock/backorder), shipping/returns snippets 

Key specs (dimensions, material, compatibility, warranty) 

Ratings summary, review count (visible) 

Identifiers: SKU, GTIN/UPC/EAN, MPN, model number 

Variant options + selected variant 

Why it matters 

GEO scoring needs to know if the page contains “answerable” facts. 

Also used for consistency checks vs schema. 

 

Phase 3 — SEO score (0–100) 

SEO category weights 

Indexability & Technical SEO — 20 

Page Experience & Performance — 15 

On‑page Relevance & Content Quality — 25 

Structured Data & Rich Result Readiness — 20 

Media & Accessibility — 10 

Commerce Trust Signals — 10 

Total = 100 

Below are the stepwise checks for each. 

 

Step 7: Indexability & Technical SEO (0–20) 

Checks 

200 OK + canonical correctness 

No noindex, no accidental canonical to another product 

Crawlable without requiring JS for main content (at least name/price visible) 

Hreflang (if multi-language) coherence 

Robots.txt doesn’t block Googlebot 

Internal linking signals: breadcrumbs, category path 

Scoring approach 

Start at 20 

Deduct hard failures (e.g., noindex → -20) 

Deduct soft issues proportionally 

 

Step 8: Page experience & performance (0–15) 

Checks 

Lighthouse-style scores (mobile weighted) 

Excessive JS delaying content (esp. product name/price) 

CLS/LCP/INP proxies if possible 

Why it matters 

Google explicitly emphasizes page experience as part of succeeding in AI experiences too. Google for Developers 

 

Step 9: On‑page relevance & content quality (0–25) 

Checks 

Title includes product name + disambiguator (model/category) 

Meta description present (not critical for ranking, but affects CTR) 

Single clear H1 with product name 

Content uniqueness heuristics (boilerplate ratio; duplicate blocks) 

Presence of: 

feature list 

specs (not just marketing copy) 

use cases 

FAQs (if natural, not spam) 

 

Step 10: Structured data & rich results readiness (0–20) 

Checks 

Valid Product markup 

Offer fields: price, currency, availability 

Ratings/reviews included if present (don’t fake) 

BreadcrumbList 

Organization / policies (returns, etc.) 

Google’s product docs highlight benefits of providing rich product info and note combining on-page structured data with Merchant Center feeds can maximize eligibility. Google for Developers+1 

 

Step 11: Media & accessibility (0–10) 

Checks 

Image alt text quality (descriptive, variant-specific) 

Enough images (angles, packaging, size) 

Video transcript/captions if video exists 

Main content not buried behind carousels or tabs only 

 

Step 12: Commerce trust signals (0–10) 

Checks 

Shipping, returns, warranty information clearly present 

Clear seller identity (address/contact) 

Review authenticity cues (timestamps, verified purchase if applicable) 

 

SEO score formula 

seo_score = sum(weighted_category_scores) (0–100) 

 

Phase 4 — GEO score (0–800) 

The GEO score measures: “How likely is this page to be retrieved, extracted, trusted, and cited by generative engines for shopping/ecommerce questions?” 

GEO pillars (8 × 0–100 = 0–800) 

AI Crawl Access & Snippet Controls (0–100) 

Product Metadata Readiness (for AI shopping + providers) (0–100) 

Entity Disambiguation & Identifiers (0–100) 

Machine‑Scannable Information Architecture (0–100) 

Shopping Intent Coverage (Answerability) (0–100) 

Evidence, Justification & Citability (0–100) 

Multimodal Readiness (0–100) 

Authority Signals (On‑site + Off‑site) (0–100) 

geo_score = sum(pillar_scores) → range 0–800 

 

Pillar 1: AI Crawl Access & Snippet Controls (0–100) 

What it measures 

Whether the page is eligible to appear in AI search results and be quoted. 

Checks (example point split) 

HTTP 200 with indexable content: 20 

No noindex/blocking directives: 20 

robots.txt allows OAI‑SearchBot: 25 OpenAI Platform 

robots.txt allows PerplexityBot: 20 Perplexity 

No overly restrictive preview controls (nosnippet, max-snippet=0): 15 Google for Developers 

If OAI‑SearchBot is disallowed, you should treat ChatGPT Search visibility as near‑zero for citation answers (hard penalty). OpenAI Platform 

 

Pillar 2: Product Metadata Readiness (0–100) 

What it measures 
How easily “shopping engines” (Google Shopping, AI shopping, aggregators) can ingest correct product facts. 

Checks 

Product schema completeness (name, image, offers, availability, etc.) Google for Developers+1 

Shipping/returns policy markup where feasible Google for Developers 

Consistency: schema price == visible price; availability matches UI Google for Developers 

OpenGraph/Twitter card basics (helps downstream scrapers) 

Clear variant handling (size/color) + canonical strategy Google for Developers 

Why this is GEO-critical 
ChatGPT shopping says selection considers structured metadata (price/description/etc.) from providers. Your page should expose the cleanest possible ground truth. OpenAI Help Center 

 

Pillar 3: Entity Disambiguation & Identifiers (0–100) 

What it measures 
How confidently a generative engine can identify “which exact product is this?” 

Checks 

Brand + product name + model number visible 

SKU + MPN + GTIN/UPC/EAN present (if applicable) 

Same identifiers included in schema 

Variant identifiers (each variant has its own SKU/GTIN when appropriate) 

Category taxonomy (“running shoes > trail”, etc.) 

Google explicitly notes product identifiers help it understand sellers/products (e.g., in shopping knowledge panels). Google for Developers 

 

Pillar 4: Machine‑Scannable Information Architecture (0–100) 

What it measures 
How “extractable” and “chunkable” the page is for RAG/AI search. 

Checks 

Clear heading hierarchy (H2 sections like Specs, Compatibility, Shipping, Returns) 

Bullet lists for key specs and what’s included 

Short paragraphs; minimal interleaving of unrelated content 

“Section summaries” (1–2 sentence recap under each major heading) 

Avoid broken numbering / malformed lists 

This maps to document practices that improve retrieval and extraction in RAG-style systems (headings, summaries, disambiguation). AWS Documentation 

Practical product-page tactic: keep your spec table but also provide a bullet “Key Specs” block, because some LLM retrieval flows digest linear text better than tables. AWS Documentation 

 

Pillar 5: Shopping Intent Coverage (Answerability) (0–100) 

What it measures 
Can the page answer the common question patterns that trigger AI shopping behavior? 

Checks 
Presence and completeness of: 

“Who it’s for” / use cases 

Compatibility (devices, standards, sizes) 

Constraints & exclusions (“does not fit X”) 

What’s included in the box 

Care instructions / materials / safety 

Warranty, returns, shipping 

FAQ with real questions (not SEO fluff) 

Why it matters: 
Generative engines synthesize answers. If your page doesn’t contain the facts, it can’t be used as evidence—especially for comparison/eligibility questions. arXiv+1 

 

Pillar 6: Evidence, Justification & Citability (0–100) 

What it measures 
How strongly your content behaves like a source that should be cited. 

The most research-grounded part of GEO scoring 
The KDD’24 GEO paper found these improvements were strong performers: 

Quotation addition 

Statistics addition 

Cite sources 
…and showed classic “keyword stuffing” underperformed. arXiv 

Practical, non-spam checks 

Quantified claims (dimensions, weight, battery life, tests) 

Attributed quotes (expert review, standards compliance, lab/cert) 

Outbound citations to authoritative references where relevant (safety standards, certification bodies, material datasheets) 

“Authoritative writing” cues: definitions, precise terms (without jargon dump) 

Scoring note 
Reward verifiable stats + properly attributed quotes/citations. Don’t reward keyword stuffing. 

 

Pillar 7: Multimodal Readiness (0–100) 

What it measures 
If AI can “understand” the product through images/video context (and if engines can use it for multimodal search). 

Google explicitly recommends supporting text with high-quality images/videos for AI experiences and keeping merchant info up to date. Google for Developers 

Checks 

Multiple high-quality images with descriptive alt text 

Variant-specific imagery 

Video with transcript/captions 

Images referenced in text (“see sizing chart image” + textual version) 

 

Pillar 8: Authority Signals (On‑site + Off‑site) (0–100) 

What it measures 
Likelihood an engine considers the page/domain “safe to cite.” 

On-site authority checks 

Clear seller identity (Organization schema, contact, address) 

Transparent policies (returns/shipping) 

Review system integrity cues 

Off-site earned media checks (optional but recommended) 
Because AI search engines may strongly favor earned media over brand-owned pages, your analyzer should optionally compute an “earned authority” proxy: ar5iv 

Run web search for [product name] review, [brand] [model] specs, etc. 

Measure: 

number of third‑party domains referencing the product 

quality tiers of those domains 

consistency of facts across sources 

Also allow plugging in backlink APIs (Ahrefs/Majestic/Moz) if available. 

If you can’t compute off-site 

Use a neutral default (e.g., 50/100) and mark it “not measured,” so you don’t unfairly punish sites. 

 

Phase 5 — Scoring, calibration, and reporting 

Step 13: Normalize all checks to consistent scoring 

Pattern 

Each check returns: 

value (raw) 

score (0–1 or 0–100) 

confidence (0–1) 

evidence (DOM selector, snippet, schema path) 

fix_recommendation 

Step 14: Compute scores 

seo_score = Σ(category_weight * normalized_category_score) 

geo_score = Σ(pillar_score) (0–800) 

Step 15: Add “score bands” (credit score UX) 

Example bands (tweak as you like): 

0–199: Poor 

200–399: Fair 

400–549: Good 

550–699: Very Good 

700–800: Excellent 

Step 16: Prioritize fixes by impact 

For each issue, compute: 

impact = (max_points_in_component - current_points) * component_weight * confidence 
Sort descending and show Top 10. 

Step 17: Output machine + human report 

JSON output for product teams 

HTML report for stakeholders (scorecard + prioritized fixes + examples) 

 