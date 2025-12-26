/**
 * Page Type Configuration Module
 *
 * Defines detection signals and thresholds for 10+ page types.
 * Used by WebScraper for page classification.
 *
 * Each page type has:
 * - signals: Array of detection rules (selectors, patterns, schemas)
 * - threshold: Minimum score to classify as this type
 * - priority: Higher priority wins in case of ties
 */

export const PAGE_TYPES = {
  // ════════════════════════════════════════════════════════════════════════════
  // E-COMMERCE PAGE TYPES
  // ════════════════════════════════════════════════════════════════════════════

  product: {
    name: 'Product',
    description: 'E-commerce product detail page',
    threshold: 35,
    priority: 10,
    signals: [
      // Schema signals (highest weight)
      { type: 'schema', value: 'Product', weight: 30 },
      { type: 'pattern', value: /"@type"\s*:\s*"Product"/i, weight: 25 },

      // DOM signals
      { type: 'selector', value: '[class*="add-to-cart"], [id*="add-to-cart"], button[name*="add"]', weight: 25 },
      { type: 'selector', value: '[class*="product-price"], [data-price], [itemprop="price"]', weight: 15 },
      { type: 'selector', value: '[class*="buy-now"], [class*="checkout"], [class*="purchase"]', weight: 15 },
      { type: 'selector', value: '[class*="product-image"], [class*="product-gallery"]', weight: 10 },

      // Text patterns
      { type: 'text', value: /add to cart|buy now|in stock|out of stock/i, weight: 15 },
      { type: 'text', value: /sku|gtin|upc|ean|mpn/i, weight: 10 },

      // URL patterns
      { type: 'url', value: /\/product\/|\/p\/|\/item\/|\/dp\//i, weight: 15 },
    ],
  },

  category: {
    name: 'Category',
    description: 'Product listing or category page',
    threshold: 40,
    priority: 8,
    signals: [
      { type: 'selector', value: '[class*="product-list"], [class*="products-grid"], [class*="product-grid"]', weight: 25 },
      { type: 'selector', value: '[class*="product-card"], [class*="product-item"]', weight: 20, minCount: 3 },
      { type: 'selector', value: '[class*="filter"], [class*="facet"], [class*="refinement"]', weight: 20 },
      { type: 'selector', value: '[class*="sort-by"], [class*="sorting"]', weight: 15 },
      { type: 'selector', value: '.pagination, [class*="load-more"]', weight: 10 },
      { type: 'url', value: /\/category\/|\/collection\/|\/collections\/|\/c\/|\/shop\//i, weight: 20 },
      { type: 'text', value: /showing \d+ (of|-)|\d+ products?|\d+ results?/i, weight: 15 },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // CONTENT PAGE TYPES
  // ════════════════════════════════════════════════════════════════════════════

  article: {
    name: 'Article',
    description: 'Blog post or article content',
    threshold: 35,
    priority: 7,
    signals: [
      { type: 'schema', value: 'Article', weight: 30 },
      { type: 'schema', value: 'BlogPosting', weight: 30 },
      { type: 'schema', value: 'NewsArticle', weight: 30 },
      { type: 'selector', value: 'article', weight: 20 },
      { type: 'selector', value: 'time[datetime], [class*="publish-date"], [class*="post-date"]', weight: 15 },
      { type: 'selector', value: '[class*="author"], [rel="author"], [class*="byline"]', weight: 15 },
      { type: 'selector', value: '[class*="post"], [class*="blog"], [class*="entry"]', weight: 10 },
      { type: 'url', value: /\/blog\/|\/post\/|\/article\/|\/news\//i, weight: 15 },
    ],
  },

  news: {
    name: 'News',
    description: 'News article with time-sensitive content',
    threshold: 45,
    priority: 9,
    signals: [
      { type: 'schema', value: 'NewsArticle', weight: 40 },
      { type: 'selector', value: '[class*="byline"], .author-info', weight: 15 },
      { type: 'selector', value: 'time[datetime], [class*="publish"]', weight: 20 },
      { type: 'selector', value: '[class*="breaking"], [class*="latest-news"]', weight: 15 },
      { type: 'text', value: /breaking|just in|updated|live updates/i, weight: 15 },
      { type: 'url', value: /\/news\/|\/story\/|\/breaking\//i, weight: 15 },
    ],
  },

  documentation: {
    name: 'Documentation',
    description: 'Technical documentation or API reference',
    threshold: 45,
    priority: 8,
    signals: [
      { type: 'selector', value: 'pre code, .code-block, .highlight', weight: 25 },
      { type: 'selector', value: '.table-of-contents, .toc, nav[class*="toc"]', weight: 20 },
      { type: 'selector', value: '[class*="sidebar"] nav, .docs-sidebar', weight: 15 },
      { type: 'selector', value: '.copy-button, [class*="code-copy"]', weight: 10 },
      { type: 'text', value: /installation|usage|api reference|getting started/i, weight: 15 },
      { type: 'text', value: /v\d+\.\d+|version \d+|changelog/i, weight: 10 },
      { type: 'url', value: /\/docs\/|\/documentation\/|\/api\/|\/reference\//i, weight: 20 },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // BUSINESS PAGE TYPES
  // ════════════════════════════════════════════════════════════════════════════

  saas: {
    name: 'SaaS Landing',
    description: 'Software-as-a-Service landing or pricing page',
    threshold: 50,
    priority: 8,
    signals: [
      { type: 'selector', value: '[class*="pricing"], .pricing-table, .price-card', weight: 30 },
      { type: 'selector', value: '[class*="feature-list"], [class*="features"]', weight: 15 },
      { type: 'selector', value: '[class*="cta"], .signup-button, [class*="get-started"]', weight: 20 },
      { type: 'selector', value: '[class*="demo"], [class*="trial"]', weight: 15 },
      { type: 'text', value: /free trial|get started|sign up|start free/i, weight: 15 },
      { type: 'text', value: /per month|\/mo|annually|billed yearly/i, weight: 20 },
      { type: 'text', value: /enterprise|team|pro plan|basic plan/i, weight: 10 },
    ],
  },

  localBusiness: {
    name: 'Local Business',
    description: 'Local business with physical location',
    threshold: 45,
    priority: 8,
    signals: [
      { type: 'schema', value: 'LocalBusiness', weight: 40 },
      { type: 'schema', value: 'Restaurant', weight: 40 },
      { type: 'schema', value: 'Store', weight: 40 },
      { type: 'selector', value: '[class*="hours"], .opening-hours, [class*="business-hours"]', weight: 20 },
      { type: 'selector', value: '[class*="location"], .address, [class*="directions"]', weight: 15 },
      { type: 'selector', value: '.google-map, [class*="map"], iframe[src*="maps"]', weight: 15 },
      { type: 'text', value: /call us|visit us|directions|open today/i, weight: 10 },
      { type: 'text', value: /\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/i, weight: 10 }, // Phone pattern
    ],
  },

  portfolio: {
    name: 'Portfolio',
    description: 'Portfolio or agency showcase page',
    threshold: 45,
    priority: 7,
    signals: [
      { type: 'selector', value: '.case-study, [class*="project"], [class*="portfolio"]', weight: 25 },
      { type: 'selector', value: '.work-sample, [class*="work-item"]', weight: 25 },
      { type: 'selector', value: '[class*="testimonial"], [class*="client-quote"]', weight: 15 },
      { type: 'selector', value: '.client-logo, [class*="clients"], [class*="trusted-by"]', weight: 15 },
      { type: 'text', value: /case study|our work|projects|portfolio/i, weight: 15 },
      { type: 'url', value: /\/work\/|\/portfolio\/|\/projects\/|\/case-study/i, weight: 15 },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // COMPARISON & DIRECTORY PAGE TYPES
  // ════════════════════════════════════════════════════════════════════════════

  comparison: {
    name: 'Comparison',
    description: 'Product or service comparison page',
    threshold: 45,
    priority: 9,
    signals: [
      { type: 'selector', value: '.comparison-table, [class*="versus"], [class*="compare"]', weight: 30 },
      { type: 'selector', value: '.pros-cons, [class*="advantages"], [class*="pros"]', weight: 20 },
      { type: 'selector', value: '[class*="rating"], .star-rating', weight: 15 },
      { type: 'text', value: /vs\.?|versus|compared to|alternative/i, weight: 20 },
      { type: 'text', value: /pros|cons|advantages|disadvantages/i, weight: 15 },
      { type: 'url', value: /vs-|versus|-comparison|-compare/i, weight: 15 },
    ],
  },

  directory: {
    name: 'Directory',
    description: 'Listing or directory page',
    threshold: 45,
    priority: 6,
    signals: [
      { type: 'selector', value: '.listing-card, [class*="directory-item"], [class*="listing"]', weight: 25 },
      { type: 'selector', value: '.filter-sidebar, [class*="search-filters"]', weight: 20 },
      { type: 'selector', value: '.pagination, [class*="load-more"], [class*="show-more"]', weight: 15 },
      { type: 'selector', value: '[class*="category-filter"], [class*="filter-by"]', weight: 15 },
      { type: 'text', value: /showing \d+ of \d+|\d+ results?|browse all/i, weight: 10 },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // MARKETING PAGE TYPES
  // ════════════════════════════════════════════════════════════════════════════

  landing: {
    name: 'Landing Page',
    description: 'Marketing landing page',
    threshold: 40,
    priority: 5,
    signals: [
      { type: 'selector', value: '.hero, [class*="hero"]', weight: 20 },
      { type: 'selector', value: '[class*="cta"], [class*="call-to-action"]', weight: 20 },
      { type: 'selector', value: '[class*="benefit"], [class*="value-prop"]', weight: 15 },
      { type: 'selector', value: '.social-proof, [class*="trust-badges"], [class*="as-seen"]', weight: 15 },
      { type: 'text', value: /limited time|exclusive|join now|don't miss/i, weight: 10 },
      { type: 'text', value: /\d+%\s*off|save \$?\d+|discount/i, weight: 10 },
    ],
  },

  homepage: {
    name: 'Homepage',
    description: 'Website homepage',
    threshold: 40,
    priority: 4,
    signals: [
      { type: 'url', value: /^\/$|\/index\.html?$|\/home\/?$/i, weight: 35 },
      { type: 'schema', value: 'Organization', weight: 20 },
      { type: 'schema', value: 'WebSite', weight: 15 },
      { type: 'selector', value: 'nav.main-nav, header nav, [class*="main-menu"]', weight: 15 },
      { type: 'selector', value: '[class*="featured"], [class*="highlights"]', weight: 10 },
      { type: 'selector', value: '[class*="hero"], [class*="banner"]', weight: 10 },
    ],
  },
};

/**
 * Get all page type keys
 */
export const getPageTypeKeys = () => Object.keys(PAGE_TYPES);

/**
 * Get page type configuration by key
 */
export const getPageTypeConfig = (key) => PAGE_TYPES[key] || null;

/**
 * Get default/fallback page type
 */
export const DEFAULT_PAGE_TYPE = 'other';

export default PAGE_TYPES;
