/**
 * GEO (Generative Engine Optimization) Analyzer Module - v3.0
 * Phase 4 of the LuMinoSity Algorithm
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ALGORITHM DESIGN PRINCIPLES (Research-Grounded)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This analyzer measures: "How likely is this page to be retrieved, extracted,
 * trusted, and cited by generative AI engines for user queries?"
 *
 * KEY INSIGHTS FROM RESEARCH:
 *
 * 1. RAG PIPELINE FUNNEL (Critical)
 *    The retrieval-augmented generation pipeline is a funnel:
 *    Crawl Access → Retrieval → Extraction → Ranking → Citation
 *
 *    If you fail at crawl access, nothing else matters. We implement
 *    MULTIPLICATIVE GATING for critical pillars rather than simple addition.
 *
 * 2. KDD'24 GEO PAPER (arXiv:2311.09735)
 *    Found that these content modifications had highest citation lift:
 *    - Statistics/quantified claims: +30-40% citation likelihood
 *    - Source citations ("According to..."): +25-35% citation likelihood
 *    - Quotations from experts: +20-30% citation likelihood
 *    - Keyword stuffing: NEGATIVE impact (avoid!)
 *
 *    We weight Evidence & Citability pillar highest (18% of score).
 *
 * 3. CHUNKING FOR RAG SYSTEMS
 *    LLMs don't read pages—they read chunks (200-500 tokens).
 *    Content must be:
 *    - Self-contained within chunks
 *    - Semantically coherent
 *    - High information density (facts per token)
 *
 * 4. AI BOT ACCESS (OpenAI, Perplexity, Anthropic)
 *    Must check robots.txt for specific AI crawlers:
 *    - OAI-SearchBot (ChatGPT Search)
 *    - PerplexityBot (Perplexity AI)
 *    - ClaudeBot (Anthropic)
 *    - Google-Extended (Gemini training)
 *
 * 5. PAGE TYPE DIFFERENTIATION (v3.0 - Universal Support)
 *    Supports 12+ page types with customized scoring profiles:
 *    - E-commerce: product, category
 *    - Content: article, news, documentation, comparison
 *    - Business: saas, localBusiness, portfolio, landing
 *    - Navigation: homepage, directory
 *
 * 6. CONTENT FRESHNESS (KDD'24)
 *    76.4% of ChatGPT's most-cited pages updated within 30 days.
 *    Content with 2000+ words gets 3x more citations.
 *    Listicles account for 50% of top AI citations.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCORING ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Base Score: 0-1000 (normalized to 0-800 for display)
 *
 * PILLAR WEIGHTS (Research-justified):
 * ┌─────────────────────────────────────┬────────┬─────────────────────────────┐
 * │ Pillar                              │ Weight │ Justification               │
 * ├─────────────────────────────────────┼────────┼─────────────────────────────┤
 * │ 1. AI Crawl Access (GATING)        │ 15%    │ No access = zero visibility │
 * │ 2. Product Metadata / Content Quality│ 12%   │ Page-type dependent         │
 * │ 3. Entity Disambiguation            │ 8%     │ Identity matching           │
 * │ 4. Information Architecture         │ 10%    │ Extraction quality          │
 * │ 5. Answerability                    │ 13%    │ Query coverage              │
 * │ 6. Evidence & Citability           │ 18%    │ KDD'24: highest impact      │
 * │ 7. Multimodal Readiness            │ 8%     │ Visual understanding        │
 * │ 8. Authority Signals               │ 16%    │ Trust for citation          │
 * └─────────────────────────────────────┴────────┴─────────────────────────────┘
 *
 * GATING MULTIPLIERS:
 * - Crawl Access < 50%: Apply 0.5x multiplier to final score
 * - Crawl Access < 25%: Apply 0.25x multiplier (near-zero visibility)
 *
 * Score Bands (Credit Score Style):
 * - 0-199: Poor (unlikely to be cited)
 * - 200-399: Fair (limited visibility)
 * - 400-549: Good (moderate visibility)
 * - 550-699: Very Good (strong visibility)
 * - 700-800: Excellent (highly optimized)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
  PILLAR_CONFIG,
  SCORING_PROFILES,
  getScoringProfile,
  shouldUseProductMetadata,
} from '../config/scoringProfiles.js';
import { analyzeContentQuality, analyzeContentFreshness } from '../utils/contentAnalysis.js';

export class GEOAnalyzer {
  constructor() {
    /**
     * Pillar configuration imported from centralized config
     * Now supports dynamic pillar selection based on page type
     */
    this.pillarConfig = PILLAR_CONFIG;

    /**
     * Scoring profiles imported from centralized config
     * Supports 12+ page types with customized multipliers
     */
    this.scoringProfiles = SCORING_PROFILES;

    /**
     * All supported page types
     */
    this.supportedPageTypes = [
      'product', 'category', // E-commerce
      'article', 'news', 'documentation', // Content
      'saas', 'localBusiness', 'portfolio', // Business
      'comparison', 'directory', // Comparison & Directory
      'landing', 'homepage', // Marketing
      'other', // Default
    ];
  }

  /**
   * Main analysis method
   * Orchestrates all pillar analyses and applies gating logic
   *
   * @param {Object} pageData - Scraped page data from Phase 1-2
   * @returns {Object} Complete GEO analysis with 0-800 score
   */
  analyze(pageData) {
    const pageType = this.determinePageType(pageData);
    const profile = getScoringProfile(pageType);
    const useProductMetadata = shouldUseProductMetadata(pageType);

    // Run all pillar analyses
    // For non-product pages, use Content Quality instead of Product Metadata
    const pillars = {
      aiCrawlAccess: this.analyzeAICrawlAccess(pageData),
      // Dynamic pillar: productMetadata for e-commerce, contentQuality for others
      ...(useProductMetadata
        ? { productMetadata: this.analyzeProductMetadata(pageData, pageType) }
        : { contentQuality: this.analyzeContentQualityPillar(pageData, pageType) }
      ),
      entityDisambiguation: this.analyzeEntityDisambiguation(pageData, pageType),
      informationArchitecture: this.analyzeInformationArchitecture(pageData),
      answerability: this.analyzeAnswerability(pageData, pageType),
      evidenceCitability: this.analyzeEvidenceCitability(pageData),
      multimodalReadiness: this.analyzeMultimodalReadiness(pageData, pageType),
      authoritySignals: this.analyzeAuthoritySignals(pageData, pageType),
    };

    // Calculate score with gating and profile adjustments
    const { score, gateMultiplier } = this.calculateWeightedScore(pillars, profile, pageType);
    const normalizedScore = Math.round((score / 1000) * 800); // Normalize to 0-800

    const issues = this.collectIssues(pillars);
    const recommendations = this.generateRecommendations(pillars, gateMultiplier, pageType);
    const band = this.getScoreBand(normalizedScore);

    // Enhanced content analysis for visualization features
    const contentAnalysis = this.getContentAnalysis(pageData, pageType);

    return {
      score: normalizedScore,
      maxScore: 800,
      rawScore: Math.round(score),
      gateMultiplier,
      pageType,
      pageTypeName: profile.description || pageType,
      useProductMetadata,
      band,
      pillars,
      issues,
      recommendations,
      summary: this.generateSummary(normalizedScore, band, issues, gateMultiplier, pageType),
      checks: this.transformToChecks(pillars),
      contentAnalysis, // New: detailed content analysis for visualizations
    };
  }

  /**
   * Determine page type for scoring profile selection
   * Supports 12+ page types with confidence-weighted signals
   *
   * @param {Object} pageData - Scraped page data
   * @returns {string} Detected page type
   */
  determinePageType(pageData) {
    // Use new enhanced page type detection if available
    const detectedType = pageData.pageType?.type;

    // Validate against supported types
    if (detectedType && this.supportedPageTypes.includes(detectedType)) {
      return detectedType;
    }

    // Legacy fallback for backwards compatibility
    if (pageData.pageType?.isProductPage) return 'product';
    if (pageData.pageType?.isEcommerce) return pageData.pageType?.type || 'product';
    if (pageData.pageType?.isContent) return pageData.pageType?.type || 'article';
    if (pageData.pageType?.isBusiness) return pageData.pageType?.type || 'saas';

    return 'other';
  }

  /**
   * Analyze Content Quality pillar (for non-product pages)
   * Replaces productMetadata for content-focused pages
   *
   * Based on KDD'24 research:
   * - 2000+ words get 3x more citations
   * - Listicles account for 50% of top AI citations
   * - Tables increase citation rates 2.5x
   * - 76.4% of cited pages updated within 30 days
   *
   * @param {Object} pageData - Scraped page data
   * @param {string} pageType - Detected page type
   * @returns {Object} Content quality analysis result
   */
  analyzeContentQualityPillar(pageData, pageType) {
    // Use the centralized content quality analyzer
    const analysis = analyzeContentQuality(pageData, pageType);

    return {
      score: analysis.score,
      maxScore: analysis.maxScore,
      percentage: analysis.percentage,
      passed: analysis.passed,
      checks: analysis.checks,
      issues: analysis.issues.map(issue => ({
        severity: 'warning',
        message: issue,
        impact: 10,
      })),
      recommendations: analysis.recommendations,
      pillarName: analysis.pillarName,
      details: analysis.details,
    };
  }

  /**
   * Get detailed content analysis for visualization features
   * Powers "What AI Sees" and citation likelihood displays
   *
   * @param {Object} pageData - Scraped page data
   * @param {string} pageType - Detected page type
   * @returns {Object} Detailed content analysis
   */
  getContentAnalysis(pageData, pageType) {
    const textContent = pageData.textContent || '';

    // Get freshness analysis
    const freshness = analyzeContentFreshness(pageData, textContent);

    // Get full content quality analysis for details
    const contentQuality = analyzeContentQuality(pageData, pageType);

    return {
      freshness,
      depth: contentQuality.details?.depth,
      listicle: contentQuality.details?.listicle,
      tables: contentQuality.details?.tables,
      research: contentQuality.details?.research,
      eeat: contentQuality.details?.eeat,
      quotableSentences: contentQuality.details?.quotableSentences || [],
      uncitableContent: contentQuality.details?.uncitableContent || [],
      wordCount: pageData.wordCount || 0,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PILLAR 1: AI Crawl Access & Snippet Controls (0-100)
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * CRITICAL GATING PILLAR
   *
   * This pillar acts as a gate: if AI bots can't access the page, nothing else
   * matters. We check for:
   *
   * 1. HTTP accessibility (200 OK)
   * 2. No blocking meta directives (noindex, noai)
   * 3. robots.txt allows AI-specific bots:
   *    - OAI-SearchBot (ChatGPT Search) - OpenAI Platform docs
   *    - PerplexityBot (Perplexity AI) - perplexity.ai/bot
   *    - ClaudeBot (Anthropic) - anthropic.com/claude-bot
   * 4. No restrictive snippet controls (max-snippet:0, nosnippet)
   *
   * SCORING:
   * - HTTP 200: 20 points
   * - No noindex: 20 points
   * - OAI-SearchBot allowed: 25 points (most important AI search bot)
   * - PerplexityBot allowed: 15 points
   * - ClaudeBot allowed: 10 points
   * - No snippet restrictions: 10 points
   *
   * GATING LOGIC:
   * - Score < 50: Apply 0.5x multiplier to final GEO score
   * - Score < 25: Apply 0.25x multiplier (effectively zero visibility)
   */
  analyzeAICrawlAccess(pageData) {
    const maxScore = 100;
    let score = 0;
    const issues = [];
    const recommendations = [];
    const checks = {};

    // Check 1: HTTP 200 with accessible content (20 points)
    const isAccessible = pageData.statusCode === 200;
    checks.httpStatus = {
      value: pageData.statusCode,
      passed: isAccessible,
      points: isAccessible ? 20 : 0,
    };
    if (isAccessible) {
      score += 20;
    } else {
      issues.push({
        severity: 'critical',
        message: `HTTP ${pageData.statusCode} - AI crawlers cannot access page content`,
        impact: 20,
      });
      recommendations.push('Ensure page returns HTTP 200 OK status');
    }

    // Check 2: No noindex directive (20 points)
    const hasNoindex = pageData.noindex || this.detectNoindex(pageData);
    checks.noindex = {
      value: hasNoindex ? 'Blocked' : 'Indexable',
      passed: !hasNoindex,
      points: hasNoindex ? 0 : 20,
    };
    if (!hasNoindex) {
      score += 20;
    } else {
      issues.push({
        severity: 'critical',
        message: 'Page has noindex directive - invisible to all AI search engines',
        impact: 20,
      });
      recommendations.push('Remove noindex meta tag to allow AI indexing');
    }

    // Check 3: OAI-SearchBot (ChatGPT Search) access (25 points)
    // This is the most important AI search bot currently
    const oaiStatus = this.checkBotAccess(pageData, 'OAI-SearchBot');
    checks.oaiSearchBot = {
      value: oaiStatus.status,
      passed: oaiStatus.allowed,
      points: oaiStatus.allowed ? 25 : 0,
    };
    if (oaiStatus.allowed) {
      score += 25;
    } else {
      issues.push({
        severity: 'critical',
        message: 'OAI-SearchBot blocked - ChatGPT Search cannot cite this page',
        impact: 25,
      });
      recommendations.push('Allow OAI-SearchBot in robots.txt for ChatGPT Search visibility');
    }

    // Check 4: PerplexityBot access (15 points)
    const perplexityStatus = this.checkBotAccess(pageData, 'PerplexityBot');
    checks.perplexityBot = {
      value: perplexityStatus.status,
      passed: perplexityStatus.allowed,
      points: perplexityStatus.allowed ? 15 : 0,
    };
    if (perplexityStatus.allowed) {
      score += 15;
    } else {
      issues.push({
        severity: 'warning',
        message: 'PerplexityBot blocked - Perplexity AI cannot cite this page',
        impact: 15,
      });
      recommendations.push('Allow PerplexityBot in robots.txt for Perplexity visibility');
    }

    // Check 5: ClaudeBot/Anthropic access (10 points)
    const claudeStatus = this.checkBotAccess(pageData, 'ClaudeBot');
    checks.claudeBot = {
      value: claudeStatus.status,
      passed: claudeStatus.allowed,
      points: claudeStatus.allowed ? 10 : 0,
    };
    if (claudeStatus.allowed) {
      score += 10;
    } else {
      issues.push({
        severity: 'info',
        message: 'ClaudeBot blocked - Anthropic AI cannot access this page',
        impact: 10,
      });
    }

    // Check 6: No restrictive snippet controls (10 points)
    const hasRestrictiveSnippet = pageData.nosnippet ||
      pageData.maxSnippet === '0' ||
      this.detectSnippetRestrictions(pageData);
    checks.snippetControls = {
      value: hasRestrictiveSnippet ? 'Restricted' : 'Allowed',
      passed: !hasRestrictiveSnippet,
      points: hasRestrictiveSnippet ? 0 : 10,
    };
    if (!hasRestrictiveSnippet) {
      score += 10;
    } else {
      issues.push({
        severity: 'warning',
        message: 'Snippet restrictions (nosnippet/max-snippet:0) prevent AI from quoting content',
        impact: 10,
      });
      recommendations.push('Remove nosnippet or increase max-snippet for AI citability');
    }

    return {
      score: Math.min(score, maxScore),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarConfig.aiCrawlAccess.name,
    };
  }

  /**
   * Check if a specific bot is allowed based on robots.txt and meta directives
   *
   * RESEARCH BASIS:
   * The web scraper now fetches robots.txt and parses it for AI bot rules.
   * We check the structured aiBotAccess data for accurate bot status.
   *
   * Bot name mapping:
   * - 'OAI-SearchBot' → robotsTxt.aiBotAccess.oaiSearchBot
   * - 'PerplexityBot' → robotsTxt.aiBotAccess.perplexityBot
   * - 'ClaudeBot' → robotsTxt.aiBotAccess.claudeBot
   * - 'GPTBot' → robotsTxt.aiBotAccess.gptBot
   */
  checkBotAccess(pageData, botName) {
    // Map bot names to the robotsTxt data structure keys
    const botKeyMap = {
      'OAI-SearchBot': 'oaiSearchBot',
      'PerplexityBot': 'perplexityBot',
      'ClaudeBot': 'claudeBot',
      'GPTBot': 'gptBot',
      'ChatGPT-User': 'chatgptUser',
      'Google-Extended': 'googleExtended',
      'CCBot': 'ccBot',
      'Amazonbot': 'amazonBot',
      'anthropic-ai': 'anthropicAi',
      'Bytespider': 'bytespider',
    };

    const botKey = botKeyMap[botName] || botName.toLowerCase().replace(/[-_]/g, '');

    // Check robots.txt data from web scraper (new v2.0 format)
    if (pageData.robotsTxt && pageData.robotsTxt.aiBotAccess) {
      const botAccess = pageData.robotsTxt.aiBotAccess[botKey];
      if (botAccess) {
        const rulesStr = botAccess.rules?.length > 0
          ? ` (${botAccess.rules.join(', ')})`
          : '';
        if (!botAccess.allowed) {
          return {
            allowed: false,
            status: `Blocked in robots.txt${rulesStr}`,
          };
        }
        // Explicitly allowed or no blocking rule found
        return {
          allowed: true,
          status: botAccess.rules?.length > 0
            ? `Allowed${rulesStr}`
            : 'Not blocked',
        };
      }
    }

    // Fallback: check legacy robotsTxtRules format
    const robotsRules = pageData.robotsTxtRules || {};
    const specificRule = robotsRules[botName];

    if (specificRule === 'disallow') {
      return { allowed: false, status: 'Blocked in robots.txt' };
    }
    if (specificRule === 'allow') {
      return { allowed: true, status: 'Explicitly allowed' };
    }

    // Check for blocking meta tags
    const robotsMeta = (pageData.robotsMeta || '').toLowerCase();
    if (robotsMeta.includes('noai') || robotsMeta.includes('noimageai')) {
      return { allowed: false, status: 'Blocked by noai directive' };
    }

    // Check for bot-specific meta tags
    const botMeta = pageData[`${botName.toLowerCase()}Meta`];
    if (botMeta === 'noindex' || botMeta === 'none') {
      return { allowed: false, status: 'Blocked by meta directive' };
    }

    // Check if robots.txt exists but has global disallow
    if (pageData.robotsTxt?.globalDisallow) {
      return { allowed: false, status: 'Blocked by global Disallow: /' };
    }

    // Default: assume allowed (no explicit block found)
    return { allowed: true, status: 'Likely allowed' };
  }

  /**
   * Detect noindex from various sources
   */
  detectNoindex(pageData) {
    const robotsMeta = (pageData.robotsMeta || '').toLowerCase();
    return robotsMeta.includes('noindex') ||
           robotsMeta.includes('none') ||
           pageData.xRobotsTag?.includes('noindex');
  }

  /**
   * Detect snippet restrictions
   */
  detectSnippetRestrictions(pageData) {
    const robotsMeta = (pageData.robotsMeta || '').toLowerCase();
    return robotsMeta.includes('nosnippet') ||
           /max-snippet\s*:\s*0/.test(robotsMeta);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PILLAR 2: Product Metadata Readiness (0-100)
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Measures how easily AI shopping engines can ingest correct product facts.
   *
   * RESEARCH BASIS:
   * - ChatGPT Shopping explicitly states it uses "structured metadata (price,
   *   description, etc.) from providers" for product selection
   * - Google Shopping requires specific Product schema fields
   * - AI engines need consistent, machine-readable product data
   *
   * KEY CHECKS:
   * 1. Product schema completeness (name, image, description, offers)
   * 2. Offer fields (price, currency, availability)
   * 3. Schema-to-visible content consistency (critical for trust)
   * 4. OpenGraph/Twitter cards (helps scrapers)
   * 5. Variant handling (unique identifiers per variant)
   *
   * For non-product pages: Reduced weight via scoring profile
   */
  analyzeProductMetadata(pageData, pageType) {
    const maxScore = 100;
    let score = 0;
    const issues = [];
    const recommendations = [];
    const checks = {};

    // For non-product pages, return baseline score
    if (pageType !== 'product') {
      return this.createNonApplicableResult(
        'productMetadata',
        'Non-product page',
        60, // Neutral baseline
        maxScore
      );
    }

    const productSchema = pageData.productSchema;
    const productData = pageData.productData || {};

    // Check 1: Product Schema Presence & Core Fields (35 points)
    let schemaPoints = 0;
    if (productSchema) {
      schemaPoints = 15; // Base for having schema
      if (productSchema.name) schemaPoints += 5;
      if (productSchema.image) schemaPoints += 5;
      if (productSchema.description) schemaPoints += 5;
      if (productSchema.brand) schemaPoints += 5;
    }
    checks.productSchema = {
      value: productSchema ? `${schemaPoints}/35 fields` : 'Missing',
      passed: schemaPoints >= 25,
      points: schemaPoints,
    };
    score += schemaPoints;
    if (!productSchema) {
      issues.push({
        severity: 'critical',
        message: 'Missing Product schema - AI cannot read structured product data',
        impact: 35,
      });
      recommendations.push('Add Product schema with name, image, description, brand, and offers');
    } else if (schemaPoints < 25) {
      issues.push({
        severity: 'warning',
        message: 'Incomplete Product schema - missing required fields',
        impact: 35 - schemaPoints,
      });
    }

    // Check 2: Offer Fields - Price, Currency, Availability (30 points)
    const offers = productSchema?.offers;
    let offerPoints = 0;
    if (offers) {
      if (offers.price || offers.lowPrice) offerPoints += 12;
      if (offers.priceCurrency) offerPoints += 8;
      if (offers.availability) offerPoints += 10;
    }
    checks.offerFields = {
      value: offers ? `${offerPoints}/30 points` : 'Missing',
      passed: offerPoints >= 20,
      points: offerPoints,
    };
    score += offerPoints;
    if (!offers) {
      issues.push({
        severity: 'critical',
        message: 'No Offer schema - AI cannot answer "How much does this cost?"',
        impact: 30,
      });
      recommendations.push('Add Offer schema with price, priceCurrency, and availability');
    } else if (offerPoints < 20) {
      issues.push({
        severity: 'warning',
        message: 'Incomplete Offer data - missing price, currency, or availability',
        impact: 30 - offerPoints,
      });
    }

    // Check 3: Schema-Visible Content Consistency (15 points)
    // Critical: AI may distrust pages where schema doesn't match visible content
    const consistencyResult = this.checkSchemaConsistency(productSchema, productData);
    checks.schemaConsistency = {
      value: consistencyResult.status,
      passed: consistencyResult.consistent,
      points: consistencyResult.consistent ? 15 : 5,
    };
    score += consistencyResult.consistent ? 15 : 5;
    if (!consistencyResult.consistent) {
      issues.push({
        severity: 'warning',
        message: `Schema mismatch: ${consistencyResult.details}`,
        impact: 10,
      });
      recommendations.push('Ensure structured data exactly matches visible page content');
    }

    // Check 4: OpenGraph/Social Meta (10 points)
    const hasOG = pageData.hasOpenGraph;
    const hasTwitter = pageData.hasTwitterCard;
    const socialPoints = (hasOG ? 6 : 0) + (hasTwitter ? 4 : 0);
    checks.socialMeta = {
      value: `OG: ${hasOG ? 'Yes' : 'No'}, Twitter: ${hasTwitter ? 'Yes' : 'No'}`,
      passed: socialPoints >= 6,
      points: socialPoints,
    };
    score += socialPoints;
    if (!hasOG) {
      issues.push({
        severity: 'info',
        message: 'Missing Open Graph tags - reduces scraper compatibility',
        impact: 6,
      });
      recommendations.push('Add og:title, og:image, og:price:amount meta tags');
    }

    // Check 5: Variant Handling (10 points)
    const hasVariants = productData.hasVariants || productSchema?.hasVariant;
    let variantPoints = 10;
    if (hasVariants) {
      // Check if variants have unique identifiers
      const variantIds = productSchema?.hasVariant?.map(v => v.sku || v.gtin) || [];
      const uniqueIds = new Set(variantIds).size;
      if (uniqueIds < variantIds.length) {
        variantPoints = 5;
        issues.push({
          severity: 'info',
          message: 'Variants may share identifiers - harder for AI to distinguish',
          impact: 5,
        });
      }
    }
    checks.variantHandling = {
      value: hasVariants ? 'Variants detected' : 'No variants',
      passed: true,
      points: variantPoints,
    };
    score += variantPoints;

    return {
      score: Math.min(score, maxScore),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarConfig.productMetadata.name,
    };
  }

  /**
   * Check consistency between schema data and visible content
   */
  checkSchemaConsistency(schema, visibleData) {
    if (!schema || !visibleData) {
      return { consistent: true, status: 'Unable to verify', details: '' };
    }

    const issues = [];

    // Check price consistency
    if (schema.offers?.price && visibleData.price) {
      const schemaPrice = String(schema.offers.price).replace(/[^0-9.]/g, '');
      const visiblePrice = String(visibleData.price).replace(/[^0-9.]/g, '');
      if (schemaPrice && visiblePrice && schemaPrice !== visiblePrice) {
        issues.push(`Price mismatch (schema: ${schemaPrice}, visible: ${visiblePrice})`);
      }
    }

    // Check name consistency
    if (schema.name && visibleData.name) {
      const schemaName = schema.name.toLowerCase().trim();
      const visibleName = visibleData.name.toLowerCase().trim();
      if (!visibleName.includes(schemaName.substring(0, 20))) {
        issues.push('Product name mismatch');
      }
    }

    return {
      consistent: issues.length === 0,
      status: issues.length === 0 ? 'Consistent' : 'Mismatch detected',
      details: issues.join('; '),
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PILLAR 3: Entity Disambiguation & Identifiers (0-100)
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Measures how confidently AI can identify "which exact product/entity is this?"
   *
   * WHY THIS MATTERS:
   * - AI engines need to match products across retailers (price comparison)
   * - Unique identifiers (GTIN, SKU, MPN) enable product graph connections
   * - Ambiguous products are harder to cite with confidence
   *
   * KEY CHECKS:
   * 1. Brand + Product Name + Model visibility
   * 2. Standard identifiers (GTIN/UPC/EAN, SKU, MPN)
   * 3. Identifiers in structured data
   * 4. Category taxonomy (breadcrumbs)
   * 5. Variant-level identification
   */
  analyzeEntityDisambiguation(pageData, pageType) {
    const maxScore = 100;
    let score = 0;
    const issues = [];
    const recommendations = [];
    const checks = {};

    // For non-product pages, check general entity clarity          
    if (pageType !== 'product') {
      return this.analyzeGeneralEntityClarity(pageData);
    }

    const productData = pageData.productData || {};
    const productSchema = pageData.productSchema;

    // Check 1: Brand + Product Name + Model (25 points)
    let identityPoints = 0;
    if (productData.name || productSchema?.name) identityPoints += 10;
    if (productData.brand || productSchema?.brand) identityPoints += 10;
    if (productData.model || productSchema?.model) identityPoints += 5;
    checks.productIdentity = {
      value: `${identityPoints}/25 points`,
      passed: identityPoints >= 15,
      points: identityPoints,
    };
    score += identityPoints;
    if (identityPoints < 15) {
      issues.push({
        severity: 'warning',
        message: 'Incomplete product identity - missing brand, name, or model',
        impact: 25 - identityPoints,
      });
      recommendations.push('Clearly display brand, product name, and model number');
    }

    // Check 2: Standard Product Identifiers (30 points)
    const hasGTIN = productData.gtin || productSchema?.gtin || productSchema?.gtin13 || productSchema?.gtin12;
    const hasSKU = productData.sku || productSchema?.sku;
    const hasMPN = productData.mpn || productSchema?.mpn;
    let idPoints = 0;
    if (hasGTIN) idPoints += 15; // Most valuable - global identifier
    if (hasSKU) idPoints += 10;
    if (hasMPN) idPoints += 5;
    checks.productIdentifiers = {
      value: `GTIN: ${hasGTIN ? '✓' : '✗'}, SKU: ${hasSKU ? '✓' : '✗'}, MPN: ${hasMPN ? '✓' : '✗'}`,
      passed: idPoints >= 15,
      points: idPoints,
    };
    score += idPoints;
    if (!hasGTIN && !hasSKU) {
      issues.push({
        severity: 'warning',
        message: 'No unique product identifiers - AI cannot match across retailers',
        impact: 25 - idPoints,
      });
      recommendations.push('Add GTIN (UPC/EAN) and SKU to product data and schema');
    }

    // Check 3: Identifiers in Schema (20 points)
    const schemaHasIds = productSchema &&
      (productSchema.gtin || productSchema.sku || productSchema.mpn);
    checks.schemaIdentifiers = {
      value: schemaHasIds ? 'Present in schema' : 'Not in schema',
      passed: schemaHasIds,
      points: schemaHasIds ? 20 : 0,
    };
    score += schemaHasIds ? 20 : 0;
    if (!schemaHasIds) {
      issues.push({
        severity: 'info',
        message: 'Product identifiers not in structured data',
        impact: 20,
      });
      recommendations.push('Include gtin, sku, and mpn fields in Product schema');
    }

    // Check 4: Category Taxonomy/Breadcrumbs (15 points)
    const hasBreadcrumbs = pageData.hasBreadcrumbs || pageData.hasBreadcrumbSchema;
    checks.categoryTaxonomy = {
      value: hasBreadcrumbs ? 'Present' : 'Missing',
      passed: hasBreadcrumbs,
      points: hasBreadcrumbs ? 15 : 0,
    };
    score += hasBreadcrumbs ? 15 : 0;
    if (!hasBreadcrumbs) {
      issues.push({
        severity: 'info',
        message: 'No category breadcrumbs - product context unclear',
        impact: 15,
      });
      recommendations.push('Add breadcrumb navigation with BreadcrumbList schema');
    }

    // Check 5: Variant Identification (10 points)
    checks.variantIdentifiers = {
      value: productData.hasVariants ? 'Variants present' : 'No variants',
      passed: true,
      points: 10,
    };
    score += 10;

    return {
      score: Math.min(score, maxScore),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarConfig.entityDisambiguation.name,
    };
  }

  /**
   * Entity clarity analysis for non-product pages
   */
  analyzeGeneralEntityClarity(pageData) {
    const h1 = pageData.headings?.h1?.[0] || '';
    const title = pageData.title || '';
    const hasSchema = pageData.schemas?.length > 0;

    let score = 0;
    if (h1) score += 35;
    if (title) score += 25;
    if (hasSchema) score += 20;
    if (h1 && title && title.toLowerCase().includes(h1.toLowerCase().substring(0, 20))) {
      score += 20; // Consistency bonus
    }

    return {
      score: Math.min(score, 100),
      maxScore: 100,
      percentage: Math.min(score, 100),
      passed: score >= 60,
      checks: {
        topicClarity: {
          value: h1 ? 'Clear topic' : 'Unclear topic',
          passed: !!(h1 && title),
          points: score,
        },
      },
      issues: h1 ? [] : [{
        severity: 'warning',
        message: 'Page topic unclear - missing or vague H1',
        impact: 35,
      }],
      recommendations: h1 ? [] : ['Add clear H1 heading that identifies the page topic'],
      pillarName: this.pillarConfig.entityDisambiguation.name,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PILLAR 4: Machine-Scannable Information Architecture (0-100)
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Measures how "extractable" and "chunkable" the page is for RAG systems.
   *
   * CRITICAL INSIGHT - HOW RAG WORKS:
   * LLMs don't read entire pages. They read CHUNKS (typically 200-500 tokens).
   * Content must be:
   * 1. Well-structured with clear section breaks
   * 2. Self-contained within chunks
   * 3. High signal-to-noise ratio
   *
   * KEY CHECKS:
   * 1. Heading hierarchy (H1 → H2 → H3)
   * 2. Bullet/numbered lists for specs
   * 3. Short paragraphs (2-3 sentences ideal)
   * 4. Tables for structured data
   * 5. Semantic HTML elements
   * 6. Content density (facts per 100 words)
   *
   * AWS documentation on RAG best practices emphasizes:
   * - Clear document structure improves retrieval
   * - Headings help chunk boundaries
   * - Lists are easier to extract than prose
   */
  analyzeInformationArchitecture(pageData) {
    const maxScore = 100;
    let score = 0;
    const issues = [];
    const recommendations = [];
    const checks = {};

    // Check 1: Heading Hierarchy (25 points)
    const h1Count = pageData.headings?.h1?.length || 0;
    const h2Count = pageData.headings?.h2?.length || 0;
    const h3Count = pageData.headings?.h3?.length || 0;
    let headingPoints = 0;
    if (h1Count === 1) headingPoints += 10;
    if (h2Count >= 3) headingPoints += 10;
    else if (h2Count >= 1) headingPoints += 5;
    if (h3Count >= 2) headingPoints += 5;
    checks.headingHierarchy = {
      value: `H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}`,
      passed: headingPoints >= 15,
      points: headingPoints,
    };
    score += headingPoints;
    if (h1Count !== 1) {
      issues.push({
        severity: h1Count === 0 ? 'critical' : 'warning',
        message: h1Count === 0 ? 'Missing H1' : `Multiple H1 headings (${h1Count})`,
        impact: 10,
      });
    }
    if (h2Count < 2) {
      issues.push({
        severity: 'warning',
        message: 'Insufficient H2 sections - content not well-chunked for AI',
        impact: 10,
      });
      recommendations.push('Add H2 headings: Specifications, Features, Compatibility, FAQ');
    }

    // Check 2: Bullet/Numbered Lists (20 points)
    const listCount = pageData.lists?.length || 0;
    const totalItems = pageData.lists?.reduce((sum, l) => sum + (l.items?.length || 0), 0) || 0;
    let listPoints = 0;
    if (listCount >= 3 && totalItems >= 10) listPoints = 20;
    else if (listCount >= 2) listPoints = 15;
    else if (listCount >= 1) listPoints = 8;
    checks.bulletLists = {
      value: `${listCount} lists, ${totalItems} items`,
      passed: listPoints >= 15,
      points: listPoints,
    };
    score += listPoints;
    if (listCount < 2) {
      issues.push({
        severity: 'warning',
        message: 'Few bullet lists - specs harder for AI to extract',
        impact: 20 - listPoints,
      });
      recommendations.push('Use bullet lists for features, specs, and "what\'s included"');
    }

    // Check 3: Paragraph Length / Chunk Quality (20 points)
    const paragraphs = pageData.paragraphs || [];
    const avgWordCount = paragraphs.length > 0
      ? paragraphs.reduce((sum, p) => sum + (p.split(/\s+/).length), 0) / paragraphs.length
      : 0;
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 80).length;
    let paragraphPoints = 20;
    if (avgWordCount > 100) paragraphPoints -= 10;
    if (longParagraphs > 3) paragraphPoints -= 5;
    if (paragraphs.length < 3) paragraphPoints -= 5;
    checks.paragraphLength = {
      value: `Avg: ${Math.round(avgWordCount)} words, ${longParagraphs} long`,
      passed: paragraphPoints >= 15,
      points: Math.max(0, paragraphPoints),
    };
    score += Math.max(0, paragraphPoints);
    if (longParagraphs > 2) {
      issues.push({
        severity: 'info',
        message: 'Long paragraphs detected - key facts buried, harder to cite',
        impact: 10,
      });
      recommendations.push('Keep paragraphs to 2-3 sentences for better AI extraction');
    }

    // Check 4: Tables for Structured Data (15 points)
    const tableCount = pageData.tables?.length || 0;
    const tablePoints = tableCount >= 2 ? 15 : (tableCount === 1 ? 10 : 0);
    checks.specTables = {
      value: tableCount > 0 ? `${tableCount} table(s)` : 'None',
      passed: tableCount > 0 || listCount >= 3,
      points: tablePoints,
    };
    score += tablePoints;
    if (tableCount === 0 && listCount < 2) {
      issues.push({
        severity: 'info',
        message: 'No spec tables - add structured data presentation',
        impact: 10,
      });
      recommendations.push('Add specification table AND bullet list (some AI prefers one over other)');
    }

    // Check 5: Semantic HTML (10 points)
    const hasMain = pageData.hasMainElement;
    const hasArticle = (pageData.articles?.length || 0) > 0;
    const hasSection = (pageData.sections?.length || 0) > 0;
    const semanticCount = [hasMain, hasArticle, hasSection].filter(Boolean).length;
    const semanticPoints = semanticCount >= 2 ? 10 : (semanticCount === 1 ? 5 : 0);
    checks.semanticHTML = {
      value: `main: ${hasMain ? '✓' : '✗'}, article: ${hasArticle ? '✓' : '✗'}, section: ${hasSection ? '✓' : '✗'}`,
      passed: semanticCount >= 1,
      points: semanticPoints,
    };
    score += semanticPoints;
    if (semanticCount === 0) {
      issues.push({
        severity: 'info',
        message: 'No semantic HTML elements - content structure unclear to AI',
        impact: 10,
      });
      recommendations.push('Use <main>, <article>, <section> for semantic structure');
    }

    // Check 6: Content Efficiency / Fact Density (10 points)
    const factDensity = this.measureFactDensity(pageData.textContent, pageData.wordCount);
    checks.contentDensity = {
      value: `${factDensity.factsPerHundred.toFixed(1)} facts/100 words`,
      passed: factDensity.factsPerHundred >= 3,
      points: factDensity.points,
    };
    score += factDensity.points;
    if (factDensity.factsPerHundred < 2) {
      issues.push({
        severity: 'info',
        message: 'Low fact density - content may be too fluffy for AI citation',
        impact: 5,
      });
    }

    return {
      score: Math.min(score, maxScore),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarConfig.informationArchitecture.name,
    };
  }

  /**
   * Measure content fact density (facts per 100 words)
   * High-value content has specific, extractable facts
   */
  measureFactDensity(text, wordCount) {
    if (!text || !wordCount) {
      return { factsPerHundred: 0, points: 0 };
    }

    const factPatterns = [
      /\d+(?:\.\d+)?(?:\s*(?:mm|cm|m|kg|lb|oz|g|inch|"|ft|hours?|minutes?|days?|GB|TB|MB|mAh|W|V|Hz|fps|MP|px))/gi,
      /\d+%/g,
      /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
      /\d+(?:,\d{3})+/g,
      /\d+\s*x\s*\d+/gi,
    ];

    let factCount = 0;
    for (const pattern of factPatterns) {
      const matches = text.match(pattern);
      if (matches) factCount += matches.length;
    }

    const factsPerHundred = (factCount / wordCount) * 100;

    let points = 0;
    if (factsPerHundred >= 5) points = 10;
    else if (factsPerHundred >= 3) points = 8;
    else if (factsPerHundred >= 1) points = 5;

    return { factsPerHundred, factCount, points };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PILLAR 5: Answerability & Query Coverage (0-100)
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Measures whether the page can answer common user questions.
   *
   * INSIGHT: Generative AI synthesizes answers from retrieved content.
   * If your page doesn't contain the facts, it can't be used as evidence.
   *
   * QUESTION TAXONOMY FOR E-COMMERCE:
   * 1. Factual: "What is the battery life?" → Needs specific numbers
   * 2. Comparative: "Is X better than Y?" → Needs comparison data
   * 3. Eligibility: "Will this work with my Z?" → Needs compatibility info
   * 4. Procedural: "How do I set up X?" → Needs instructions
   * 5. Trust: "Is this site legit?" → Needs authority signals
   *
   * SCORING BY QUESTION TYPE:
   * - Factual coverage: 25 points
   * - Compatibility/eligibility: 20 points
   * - What's included: 15 points
   * - FAQ content: 20 points
   * - Policy info: 15 points
   * - Care/usage: 5 points
   */
  analyzeAnswerability(pageData, pageType) {
    const maxScore = 100;
    let score = 0;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const text = (pageData.textContent || '').toLowerCase();

    // For non-product pages, simpler analysis
    if (pageType !== 'product') {
      const hasSubstantialContent = pageData.wordCount > 500;
      const hasFAQ = /faq|frequently asked|common questions/i.test(text);
      const baseScore = hasSubstantialContent ? 50 : 30;
      const faqBonus = hasFAQ ? 20 : 0;

      return {
        score: baseScore + faqBonus,
        maxScore,
        percentage: baseScore + faqBonus,
        passed: baseScore + faqBonus >= 50,
        checks: {
          generalContent: {
            value: hasSubstantialContent ? 'Substantial content' : 'Limited content',
            passed: hasSubstantialContent,
            points: baseScore + faqBonus,
          },
        },
        issues: hasSubstantialContent ? [] : [{
          severity: 'warning',
          message: 'Limited content for AI to extract answers from',
          impact: 20,
        }],
        recommendations: hasSubstantialContent ? [] : ['Add comprehensive content addressing user questions'],
        pillarName: this.pillarConfig.answerability.name,
      };
    }

    // Check 1: Factual/Specification Coverage (25 points)
    const specPatterns = [
      /\d+(?:\.\d+)?\s*(?:mm|cm|m|inch|ft|kg|lb|oz)/gi,
      /\d+\s*(?:mAh|hours?|GB|TB|MP|fps|Hz)/gi,
      /dimensions|weight|size|capacity|resolution|speed/gi,
    ];
    let specMatches = 0;
    for (const p of specPatterns) {
      specMatches += (text.match(p) || []).length;
    }
    const specPoints = specMatches >= 10 ? 25 : (specMatches >= 5 ? 18 : (specMatches >= 2 ? 10 : 0));
    checks.specifications = {
      value: `${specMatches} spec mentions`,
      passed: specPoints >= 15,
      points: specPoints,
    };
    score += specPoints;
    if (specMatches < 5) {
      issues.push({
        severity: 'warning',
        message: 'Limited product specifications - AI cannot answer "what are the specs?"',
        impact: 25 - specPoints,
      });
      recommendations.push('Add detailed specifications with measurements and numbers');
    }

    // Check 2: Compatibility/Eligibility Info (20 points)
    const compatPatterns = [
      /compatible with|works with|fits|requires|supports/gi,
      /connectivity|compatible|system requirements/gi,
    ];
    let compatMatches = 0;
    for (const p of compatPatterns) {
      compatMatches += (text.match(p) || []).length;
    }
    const compatPoints = compatMatches >= 3 ? 20 : (compatMatches >= 1 ? 12 : 0);
    checks.compatibility = {
      value: compatMatches > 0 ? `${compatMatches} mentions` : 'Not found',
      passed: compatPoints >= 12,
      points: compatPoints,
    };
    score += compatPoints;
    if (compatMatches === 0) {
      issues.push({
        severity: 'warning',
        message: 'No compatibility info - AI cannot answer "Does this work with...?"',
        impact: 20,
      });
      recommendations.push('Add compatibility details (devices, standards, requirements)');
    }

    // Check 3: What's Included (15 points)
    const includedPatterns = /what's included|in the box|package contents|includes|comes with/gi;
    const hasIncluded = includedPatterns.test(text);
    checks.whatsIncluded = {
      value: hasIncluded ? 'Present' : 'Missing',
      passed: hasIncluded,
      points: hasIncluded ? 15 : 0,
    };
    score += hasIncluded ? 15 : 0;
    if (!hasIncluded) {
      issues.push({
        severity: 'info',
        message: 'No "what\'s included" - common purchase question unanswered',
        impact: 15,
      });
      recommendations.push('List what\'s included in the box/package');
    }

    // Check 4: FAQ Content (20 points)
    const hasFAQ = pageData.hasFAQSchema ||
      /(?:^|\n)\s*(?:q:|question:|faq)/mi.test(text) ||
      (pageData.faqContent?.length > 0);
    const faqPoints = hasFAQ ? 20 : 0;
    checks.faqContent = {
      value: hasFAQ ? 'Present' : 'Missing',
      passed: hasFAQ,
      points: faqPoints,
    };
    score += faqPoints;
    if (!hasFAQ) {
      issues.push({
        severity: 'warning',
        message: 'No FAQ content - missing pre-answered common questions',
        impact: 20,
      });
      recommendations.push('Add FAQ section with 5-10 real customer questions');
    }

    // Check 5: Policy Information (15 points)
    const policies = pageData.policies || {};
    const policyCount = [
      policies.hasShippingInfo,
      policies.hasReturnsInfo,
      policies.hasWarrantyInfo,
    ].filter(Boolean).length;
    const policyPoints = policyCount >= 2 ? 15 : (policyCount === 1 ? 8 : 0);
    checks.policies = {
      value: `${policyCount}/3 policies`,
      passed: policyCount >= 2,
      points: policyPoints,
    };
    score += policyPoints;
    if (policyCount < 2) {
      issues.push({
        severity: 'info',
        message: 'Limited policy info - shipping, returns, warranty questions unanswered',
        impact: 15 - policyPoints,
      });
      recommendations.push('Add clear shipping, returns, and warranty information');
    }

    // Check 6: Care/Usage Instructions (5 points)
    const carePatterns = /care instructions?|how to use|maintenance|cleaning|wash/gi;
    const hasCare = carePatterns.test(text);
    checks.careInfo = {
      value: hasCare ? 'Present' : 'Not found',
      passed: true,
      points: hasCare ? 5 : 2,
    };
    score += hasCare ? 5 : 2;

    return {
      score: Math.min(score, maxScore),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarConfig.answerability.name,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PILLAR 6: Evidence, Justification & Citability (0-100)
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * THE MOST RESEARCH-GROUNDED PILLAR - HIGHEST WEIGHT (18%)
   *
   * Based on KDD'24 GEO paper (arXiv:2311.09735):
   *
   * WHAT IMPROVES AI CITATIONS:
   * ┌────────────────────────┬─────────────────┬─────────────────────────────┐
   * │ Content Modification   │ Citation Lift   │ Why It Works                │
   * ├────────────────────────┼─────────────────┼─────────────────────────────┤
   * │ Add statistics         │ +30-40%         │ Specific, verifiable claims │
   * │ Add source citations   │ +25-35%         │ External validation         │
   * │ Add expert quotes      │ +20-30%         │ Authority transfer          │
   * │ Add definitions        │ +10-20%         │ Comprehensiveness           │
   * │ Keyword stuffing       │ NEGATIVE        │ Seen as spam                │
   * └────────────────────────┴─────────────────┴─────────────────────────────┘
   *
   * SCORING:
   * - Statistics density: 35 points (highest - research shows biggest impact)
   * - Source citations: 30 points
   * - Definitions/explanations: 15 points
   * - Authority cues: 10 points
   * - Outbound references: 10 points
   */
  analyzeEvidenceCitability(pageData) {
    const maxScore = 100;
    let score = 0;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const text = pageData.textContent || '';
    const wordCount = pageData.wordCount || 1;

    // Check 1: Statistics Density (35 points) - HIGHEST VALUE
    // Research shows specific numbers are most likely to be cited
    const statsPatterns = [
      /\d+(?:\.\d+)?%/g,                                    // Percentages
      /\d+(?:\.\d+)?\s*(?:mm|cm|m|kg|lb|oz|mL|L)/gi,       // Measurements
      /\d+\s*(?:hours?|minutes?|seconds?|days?|years?)/gi, // Time
      /\d+\s*(?:times|x)\s*(?:faster|better|stronger|brighter)/gi,
      /\d+(?:,\d{3})+/g,                                    // Large numbers
      /rated\s*\d+(?:\.\d+)?/gi,                            // Ratings
      /\d+\s*(?:MP|fps|Hz|mAh|W|GB|TB)/gi,                 // Tech specs
    ];

    let statsCount = 0;
    for (const pattern of statsPatterns) {
      const matches = text.match(pattern);
      if (matches) statsCount += matches.length;
    }

    const statsPerHundred = (statsCount / wordCount) * 100;
    let statsPoints = 0;
    if (statsPerHundred >= 2) statsPoints = 35;
    else if (statsPerHundred >= 1) statsPoints = 25;
    else if (statsPerHundred >= 0.5) statsPoints = 15;
    else if (statsCount > 0) statsPoints = 8;

    checks.statistics = {
      value: `${statsCount} stats (${statsPerHundred.toFixed(1)}/100 words)`,
      passed: statsPoints >= 20,
      points: statsPoints,
    };
    score += statsPoints;

    if (statsPerHundred < 0.5) {
      issues.push({
        severity: 'critical',
        message: 'Very low statistics density - content lacks quotable facts',
        impact: 35 - statsPoints,
      });
      recommendations.push('Add specific numbers every 50-100 words: measurements, percentages, comparisons');
    }

    // Check 2: Source Citations (30 points)
    const citationPatterns = [
      /according to/gi,
      /(?:research|studies?|data)\s+(?:shows?|suggests?|indicates?|found)/gi,
      /(?:certified|tested|approved|verified)\s+by/gi,
      /(?:as\s+)?(?:reported|noted|stated)\s+(?:by|in)/gi,
      /"[^"]{30,150}"/g, // Substantial quotes
      /\[\d+\]/g, // Academic-style citations
    ];

    let citationCount = 0;
    for (const pattern of citationPatterns) {
      const matches = text.match(pattern);
      if (matches) citationCount += matches.length;
    }

    let citationPoints = 0;
    if (citationCount >= 4) citationPoints = 30;
    else if (citationCount >= 2) citationPoints = 22;
    else if (citationCount >= 1) citationPoints = 12;

    checks.sourceCitations = {
      value: citationCount > 0 ? `${citationCount} citation(s)` : 'None found',
      passed: citationPoints >= 15,
      points: citationPoints,
    };
    score += citationPoints;

    if (citationCount === 0) {
      issues.push({
        severity: 'warning',
        message: 'No source citations - claims not externally validated',
        impact: 30,
      });
      recommendations.push('Add citations: "According to...", "Certified by...", "Research shows..."');
    }

    // Check 3: Definitions & Explanations (15 points)
    const definitionPatterns = [
      /\bis\s+(?:a|an|the)\s+\w+/gi,
      /(?:refers?\s+to|means?|defined\s+as)/gi,
      /(?:which|that)\s+(?:means|refers)/gi,
    ];

    let definitionCount = 0;
    for (const pattern of definitionPatterns) {
      const matches = text.match(pattern);
      if (matches) definitionCount += Math.min(matches.length, 5); // Cap to avoid over-counting
    }

    const defPoints = definitionCount >= 3 ? 15 : (definitionCount >= 1 ? 10 : 5);
    checks.definitions = {
      value: definitionCount > 0 ? `${definitionCount} explanation(s)` : 'Few found',
      passed: defPoints >= 10,
      points: defPoints,
    };
    score += defPoints;

    // Check 4: Authority Cues (10 points)
    const authorityPatterns = [
      /award[\-\s]?winning/gi,
      /(?:iso|ce|ul|fcc)\s*(?:certified|\d+)/gi,
      /patent(?:ed)?/gi,
      /\d+\+?\s*(?:years?|customers?|reviews?|sold)/gi,
      /official|authentic|genuine|authorized/gi,
      /expert|professional|specialist/gi,
    ];

    let authorityCount = 0;
    for (const pattern of authorityPatterns) {
      const matches = text.match(pattern);
      if (matches) authorityCount += matches.length;
    }

    const authPoints = authorityCount >= 3 ? 10 : (authorityCount >= 1 ? 6 : 2);
    checks.authorityCues = {
      value: authorityCount > 0 ? `${authorityCount} cue(s)` : 'None',
      passed: authorityCount > 0,
      points: authPoints,
    };
    score += authPoints;

    // Check 5: Outbound References (10 points)
    const externalLinks = pageData.linkStats?.totalExternal || 0;
    const outboundPoints = externalLinks >= 3 ? 10 : (externalLinks >= 1 ? 6 : 3);
    checks.outboundRefs = {
      value: `${externalLinks} external link(s)`,
      passed: externalLinks > 0,
      points: outboundPoints,
    };
    score += outboundPoints;

    if (externalLinks === 0) {
      issues.push({
        severity: 'info',
        message: 'No outbound links - content appears self-contained',
        impact: 5,
      });
      recommendations.push('Link to authoritative sources (specs, certifications, standards)');
    }

    return {
      score: Math.min(score, maxScore),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarConfig.evidenceCitability.name,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PILLAR 7: Multimodal Readiness (0-100)
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Measures if AI can understand the product through images/video.
   *
   * WHY IT MATTERS:
   * - Vision-language models (GPT-4V, Gemini) can "see" product images
   * - Alt text bridges visual content to text-based retrieval
   * - Product images are often the primary way users evaluate products
   *
   * Google explicitly recommends:
   * "Support text with high-quality images/videos for AI experiences"
   *
   * SCORING:
   * - Multiple images: 30 points
   * - Descriptive alt text: 30 points
   * - Images referenced in text: 15 points
   * - Video with transcript: 15 points
   * - Images in schema: 10 points
   */
  analyzeMultimodalReadiness(pageData, pageType) {
    const maxScore = 100;
    let score = 0;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const imageStats = pageData.imageStats || { total: 0, withAlt: 0, withoutAlt: 0 };

    // Check 1: Multiple Images (30 points)
    const imageCount = imageStats.total;
    let imagePoints = 0;
    if (imageCount >= 5) imagePoints = 30;
    else if (imageCount >= 3) imagePoints = 22;
    else if (imageCount >= 1) imagePoints = 12;

    checks.imageCount = {
      value: `${imageCount} image(s)`,
      passed: imagePoints >= 15,
      points: imagePoints,
    };
    score += imagePoints;

    if (imageCount < 3 && pageType === 'product') {
      issues.push({
        severity: imageCount === 0 ? 'critical' : 'warning',
        message: imageCount === 0
          ? 'No images - AI cannot visually understand product'
          : 'Few images - add more angles/views',
        impact: 30 - imagePoints,
      });
      recommendations.push('Add 5+ product images: front, back, side, detail, scale reference');
    }

    // Check 2: Descriptive Alt Text (30 points)
    if (imageCount > 0) {
      const altPercentage = Math.round((imageStats.withAlt / imageCount) * 100);
      let altPoints = 0;
      if (altPercentage >= 90) altPoints = 30;
      else if (altPercentage >= 70) altPoints = 22;
      else if (altPercentage >= 50) altPoints = 15;
      else if (imageStats.withAlt > 0) altPoints = 8;

      checks.imageAlt = {
        value: `${altPercentage}% with alt text`,
        passed: altPoints >= 20,
        points: altPoints,
      };
      score += altPoints;

      if (imageStats.withoutAlt > 0) {
        issues.push({
          severity: altPercentage < 50 ? 'critical' : 'warning',
          message: `${imageStats.withoutAlt} image(s) missing alt text`,
          impact: 30 - altPoints,
        });
        recommendations.push('Add descriptive, specific alt text to all product images');
      }
    } else {
      checks.imageAlt = {
        value: 'No images',
        passed: false,
        points: 0,
      };
    }

    // Check 3: Images Referenced in Text (15 points)
    const text = (pageData.textContent || '').toLowerCase();
    const hasImageRefs = /(?:see\s+(?:the\s+)?(?:image|photo|picture)|as\s+shown|pictured|illustrated|image\s+\d)/i.test(text);
    const refPoints = hasImageRefs ? 15 : (imageCount > 0 ? 5 : 0);
    checks.imageReferences = {
      value: hasImageRefs ? 'Referenced in text' : 'Not referenced',
      passed: hasImageRefs || imageCount === 0,
      points: refPoints,
    };
    score += refPoints;

    if (!hasImageRefs && imageCount > 0) {
      issues.push({
        severity: 'info',
        message: 'Images not referenced in text - disconnect between visual and text',
        impact: 10,
      });
      recommendations.push('Reference images in text: "See image for size comparison"');
    }

    // Check 4: Video with Transcript (15 points)
    const hasVideo = pageData.hasVideo;
    const hasTranscript = pageData.hasVideoTranscript;
    let videoPoints = 0;
    if (hasVideo && hasTranscript) videoPoints = 15;
    else if (hasVideo) videoPoints = 8;
    else videoPoints = 5; // Neutral if no video

    checks.videoContent = {
      value: hasVideo ? (hasTranscript ? 'Video + transcript' : 'Video only') : 'No video',
      passed: true,
      points: videoPoints,
    };
    score += videoPoints;

    // Check 5: Images in Schema (10 points)
    const schemaHasImage = pageData.productSchema?.image;
    const schemaPoints = schemaHasImage ? 10 : (pageType !== 'product' ? 5 : 0);
    checks.imageSchema = {
      value: schemaHasImage ? 'In schema' : 'Not in schema',
      passed: schemaHasImage || pageType !== 'product',
      points: schemaPoints,
    };
    score += schemaPoints;

    if (!schemaHasImage && pageType === 'product') {
      issues.push({
        severity: 'warning',
        message: 'Product image not in schema - AI may not access it',
        impact: 10,
      });
      recommendations.push('Add image URL(s) to Product schema');
    }

    return {
      score: Math.min(score, maxScore),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarConfig.multimodalReadiness.name,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PILLAR 8: Authority & Trust Signals (0-100)
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Measures likelihood that AI considers the page "safe to cite."
   *
   * INSIGHT FROM RESEARCH:
   * AI search engines may strongly favor earned media over brand-owned pages.
   * Trust signals help bridge this gap.
   *
   * ON-SITE SIGNALS:
   * - Clear seller/publisher identity
   * - Transparent policies
   * - Review system integrity
   * - Contact information
   * - Content freshness
   *
   * OFF-SITE SIGNALS (if available):
   * - Third-party mentions
   * - Backlink authority
   * - Consistency across sources
   *
   * SCORING:
   * - Organization identity: 25 points
   * - Transparent policies: 20 points
   * - Review integrity: 15 points
   * - Authority credentials: 15 points
   * - Contact info: 15 points
   * - Content freshness: 10 points
   */
  analyzeAuthoritySignals(pageData) {
    const maxScore = 100;
    let score = 0;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const text = (pageData.textContent || '').toLowerCase();
    const policies = pageData.policies || {};

    // Check 1: Organization Identity (25 points)
    const hasOrgSchema = pageData.hasOrganizationSchema;
    const hasAboutPage = pageData.hasAboutLink;
    let orgPoints = 0;
    if (hasOrgSchema) orgPoints += 15;
    if (hasAboutPage) orgPoints += 10;
    if (!hasOrgSchema && !hasAboutPage) orgPoints = 5; // Some identity assumed

    checks.sellerIdentity = {
      value: hasOrgSchema ? 'Organization schema present' : (hasAboutPage ? 'About page linked' : 'Limited'),
      passed: orgPoints >= 15,
      points: orgPoints,
    };
    score += orgPoints;

    if (!hasOrgSchema) {
      issues.push({
        severity: 'warning',
        message: 'No Organization schema - seller/publisher identity unclear to AI',
        impact: 15,
      });
      recommendations.push('Add Organization schema with name, logo, URL, and contact info');
    }

    // Check 2: Transparent Policies (20 points)
    const policyChecks = [
      policies.hasShippingInfo,
      policies.hasReturnsInfo,
      policies.hasWarrantyInfo,
      policies.hasPrivacyPolicy,
      policies.hasTermsOfService,
    ];
    const policyCount = policyChecks.filter(Boolean).length;
    const policyPoints = Math.min(20, policyCount * 5);

    checks.transparentPolicies = {
      value: `${policyCount}/5 policies found`,
      passed: policyCount >= 3,
      points: policyPoints,
    };
    score += policyPoints;

    if (policyCount < 3) {
      issues.push({
        severity: 'warning',
        message: 'Incomplete policy information - reduces trust signals',
        impact: 20 - policyPoints,
      });
      recommendations.push('Add clear links to shipping, returns, privacy, and terms policies');
    }

    // Check 3: Review Integrity (15 points)
    const hasReviews = pageData.productData?.reviewCount > 0;
    const hasRatingSchema = pageData.productSchema?.aggregateRating;
    let reviewPoints = 0;
    if (hasRatingSchema) reviewPoints = 15;
    else if (hasReviews) reviewPoints = 10;
    else reviewPoints = 5; // Neutral

    checks.reviewIntegrity = {
      value: hasRatingSchema
        ? `${pageData.productSchema.aggregateRating.ratingValue} (${pageData.productSchema.aggregateRating.reviewCount} reviews)`
        : (hasReviews ? 'Reviews present' : 'No reviews'),
      passed: reviewPoints >= 10,
      points: reviewPoints,
    };
    score += reviewPoints;

    // Check 4: Authority Credentials (15 points)
    const credentialPatterns = [
      /(?:iso|ce|ul|fcc|fda)\s*(?:certified|\d+)/gi,
      /award[\-\s]?winning/gi,
      /\d+\+?\s*years?\s*(?:experience|in business)/gi,
      /trusted\s+by\s+\d+/gi,
      /official|authorized|licensed/gi,
      /member\s+of|accredited\s+by/gi,
    ];

    let credentialCount = 0;
    for (const pattern of credentialPatterns) {
      const matches = text.match(pattern);
      if (matches) credentialCount += matches.length;
    }

    const credPoints = credentialCount >= 3 ? 15 : (credentialCount >= 1 ? 10 : 3);
    checks.authorityCredentials = {
      value: credentialCount > 0 ? `${credentialCount} credential(s)` : 'None found',
      passed: credentialCount > 0,
      points: credPoints,
    };
    score += credPoints;

    if (credentialCount === 0) {
      issues.push({
        severity: 'info',
        message: 'No authority credentials detected',
        impact: 12,
      });
      recommendations.push('Add certifications, awards, years in business, or customer counts');
    }

    // Check 5: Contact Information (15 points)
    const hasContact = policies.hasContactInfo ||
      /(?:contact|email|phone|call|reach)\s*(?:us)?/i.test(text);
    const contactPoints = hasContact ? 15 : 0;

    checks.contactInfo = {
      value: hasContact ? 'Contact info present' : 'Not found',
      passed: hasContact,
      points: contactPoints,
    };
    score += contactPoints;

    if (!hasContact) {
      issues.push({
        severity: 'warning',
        message: 'No visible contact information - reduces trust',
        impact: 15,
      });
      recommendations.push('Add visible contact information (email, phone, or form)');
    }

    // Check 6: Content Freshness (10 points)
    const freshnessResult = this.checkContentFreshness(pageData, text);
    checks.contentFreshness = {
      value: freshnessResult.status,
      passed: freshnessResult.fresh,
      points: freshnessResult.points,
    };
    score += freshnessResult.points;

    if (!freshnessResult.fresh) {
      issues.push({
        severity: 'info',
        message: 'No freshness signals - content may appear stale',
        impact: 5,
      });
      recommendations.push('Add "last updated" date or recent publication date');
    }

    return {
      score: Math.min(score, maxScore),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarConfig.authoritySignals.name,
    };
  }

  /**
   * Check for content freshness signals
   */
  checkContentFreshness(pageData, text) {
    const datePatterns = [
      /(?:updated|modified|reviewed|published)\s*(?:on|:)?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi,
      /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/gi,
      /\d{4}-\d{2}-\d{2}/g,
    ];

    let hasDate = false;
    for (const pattern of datePatterns) {
      if (pattern.test(text) || pattern.test(pageData.html || '')) {
        hasDate = true;
        break;
      }
    }

    // Check meta tags
    const hasMetaDate = pageData.lastModified || pageData.publishedDate;

    return {
      fresh: hasDate || hasMetaDate,
      status: hasDate ? 'Date found' : (hasMetaDate ? 'Meta date' : 'No date signals'),
      points: hasDate ? 10 : (hasMetaDate ? 8 : 3),
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * SCORING CALCULATIONS
   * ═══════════════════════════════════════════════════════════════════════════
   */

  /**
   * Calculate weighted score with gating logic
   *
   * GATING MECHANISM:
   * If AI crawl access is poor, the entire score is multiplied down.
   * This reflects reality: blocked pages get zero AI visibility regardless
   * of how good their content is.
   */
  calculateWeightedScore(pillars, profile, pageType = 'other') {
    let weightedSum = 0;
    let totalWeight = 0;

    // Map contentQuality pillar to use contentQuality config when applicable
    const pillarConfigMap = {
      contentQuality: this.pillarConfig.contentQuality || this.pillarConfig.productMetadata,
    };

    // Calculate base weighted score
    for (const [pillarName, pillar] of Object.entries(pillars)) {
      // Get config - handle contentQuality as alternative to productMetadata
      let config = this.pillarConfig[pillarName];
      if (!config && pillarConfigMap[pillarName]) {
        config = pillarConfigMap[pillarName];
      }
      if (!config) continue;

      // Apply profile multiplier if exists
      // Support both old format (profile[pillarName]) and new format (profile.multipliers[pillarName])
      let profileMultiplier = 1.0;
      if (profile.multipliers && profile.multipliers[pillarName] !== undefined) {
        profileMultiplier = profile.multipliers[pillarName];
      } else if (profile.multipliers && pillarName === 'contentQuality') {
        // contentQuality uses productMetadata multiplier when not specified
        profileMultiplier = profile.multipliers.contentQuality || profile.multipliers.productMetadata || 1.0;
      } else if (profile[pillarName] !== undefined) {
        // Legacy format support
        profileMultiplier = profile[pillarName];
      }

      const adjustedWeight = config.weight * profileMultiplier;

      const normalizedScore = pillar.score / config.maxPoints;
      weightedSum += normalizedScore * adjustedWeight * 1000;
      totalWeight += adjustedWeight;
    }

    // Normalize to total weight
    let score = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Apply gating multiplier for crawl access
    let gateMultiplier = 1.0;
    const crawlScore = pillars.aiCrawlAccess?.score || 0;
    const crawlPercentage = crawlScore / 100;

    if (crawlPercentage < 0.25) {
      gateMultiplier = 0.25; // Severe penalty
    } else if (crawlPercentage < 0.50) {
      gateMultiplier = 0.5;  // Moderate penalty
    } else if (crawlPercentage < 0.70) {
      gateMultiplier = 0.8;  // Light penalty
    }

    score *= gateMultiplier;

    return {
      score: Math.round(score),
      gateMultiplier,
    };
  }

  /**
   * Get score band with colors and descriptions
   */
  getScoreBand(score) {
    if (score >= 700) {
      return {
        band: 'Excellent',
        color: '#22c55e',
        description: 'Highly optimized for AI citation',
      };
    }
    if (score >= 550) {
      return {
        band: 'Very Good',
        color: '#84cc16',
        description: 'Well-positioned for AI search',
      };
    }
    if (score >= 400) {
      return {
        band: 'Good',
        color: '#eab308',
        description: 'Moderate AI visibility',
      };
    }
    if (score >= 200) {
      return {
        band: 'Fair',
        color: '#f97316',
        description: 'Limited AI citation potential',
      };
    }
    return {
      band: 'Poor',
      color: '#ef4444',
      description: 'Unlikely to be cited by AI',
    };
  }

  /**
   * Helper to create non-applicable result for pillars that don't apply to page type
   */
  createNonApplicableResult(pillarKey, reason, baseScore, maxScore) {
    return {
      score: baseScore,
      maxScore,
      percentage: Math.round((baseScore / maxScore) * 100),
      passed: true,
      checks: {
        notApplicable: {
          value: reason,
          passed: true,
          points: baseScore,
        },
      },
      issues: [],
      recommendations: [],
      pillarName: this.pillarConfig[pillarKey]?.name || pillarKey,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * REPORTING UTILITIES
   * ═══════════════════════════════════════════════════════════════════════════
   */

  /**
   * Collect all issues from pillars, sorted by severity and impact
   */
  collectIssues(pillars) {
    const allIssues = [];

    for (const [pillarName, pillar] of Object.entries(pillars)) {
      for (const issue of pillar.issues || []) {
        allIssues.push({
          pillar: pillarName,
          pillarDisplayName: pillar.pillarName,
          ...issue,
        });
      }
    }

    const severityOrder = { critical: 0, warning: 1, info: 2 };
    allIssues.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return (b.impact || 0) - (a.impact || 0);
    });

    return allIssues;
  }

  /**
   * Generate prioritized recommendations with gating context
   * @param {Object} pillars - Analyzed pillars
   * @param {number} gateMultiplier - Gating multiplier from crawl access
   * @param {string} pageType - Detected page type for context-aware recommendations
   */
  generateRecommendations(pillars, gateMultiplier, pageType = 'other') {
    const allRecs = [];

    // If gated, add priority recommendation
    if (gateMultiplier < 1.0) {
      allRecs.push({
        pillar: 'aiCrawlAccess',
        pillarDisplayName: 'AI Crawl Access',
        recommendation: 'CRITICAL: Fix AI bot access first - all other improvements are nullified while AI crawlers are blocked',
        priority: 'critical',
        potentialImpact: 10,
      });
    }

    for (const [pillarName, pillar] of Object.entries(pillars)) {
      const percentageLost = ((pillar.maxScore - pillar.score) / pillar.maxScore) * 100;
      const weight = this.pillarConfig[pillarName]?.weight || 0.1;

      for (const rec of pillar.recommendations || []) {
        const priority = percentageLost > 50 ? 'high' :
          (percentageLost > 25 ? 'medium' : 'low');
        allRecs.push({
          pillar: pillarName,
          pillarDisplayName: pillar.pillarName,
          recommendation: rec,
          priority,
          potentialImpact: Math.round(percentageLost * weight),
        });
      }
    }

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allRecs.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.potentialImpact - a.potentialImpact;
    });

    return allRecs.slice(0, 20);
  }

  /**
   * Transform pillars to checks format for frontend
   */
  transformToChecks(pillars) {
    const checks = {};
    for (const [pillarName, pillar] of Object.entries(pillars)) {
      checks[pillarName] = {
        score: pillar.score,
        maxScore: pillar.maxScore,
        percentage: pillar.percentage,
        passed: pillar.passed,
        pillarName: pillar.pillarName,
        details: pillar.checks,
      };
    }
    return checks;
  }

  /**
   * Generate summary with context about gating and page type
   * @param {number} score - Normalized score (0-800)
   * @param {Object} band - Score band object
   * @param {Array} issues - List of issues
   * @param {number} gateMultiplier - Gating multiplier
   * @param {string} pageType - Detected page type
   */
  generateSummary(score, band, issues, gateMultiplier, pageType = 'other') {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    // Page type display names
    const pageTypeNames = {
      product: 'Product Page',
      category: 'Category Page',
      article: 'Article',
      news: 'News Article',
      documentation: 'Documentation',
      saas: 'SaaS Landing Page',
      localBusiness: 'Local Business Page',
      portfolio: 'Portfolio Page',
      comparison: 'Comparison Page',
      directory: 'Directory Page',
      landing: 'Landing Page',
      homepage: 'Homepage',
      other: 'Web Page',
    };
    const pageTypeName = pageTypeNames[pageType] || 'Web Page';

    let message;
    if (gateMultiplier < 0.5) {
      message = `CRITICAL: AI crawlers are blocked. Score is heavily penalized (${Math.round(gateMultiplier * 100)}% multiplier). Fix access issues first.`;
    } else if (score >= 700) {
      message = `Excellent! This ${pageTypeName.toLowerCase()} is highly optimized for AI citation by ChatGPT, Perplexity, and other AI search engines.`;
    } else if (score >= 550) {
      message = `Very good GEO optimization for this ${pageTypeName.toLowerCase()}. Content is well-positioned to be cited by AI systems.`;
    } else if (score >= 400) {
      message = `Good foundation for this ${pageTypeName.toLowerCase()}. Address ${criticalCount} critical issues to improve AI citation likelihood.`;
    } else if (score >= 200) {
      message = `Fair GEO readiness. ${criticalCount} critical and ${warningCount} warning issues need attention.`;
    } else {
      message = `Poor AI visibility. Content unlikely to be cited. Address ${criticalCount} critical issues immediately.`;
    }

    return {
      score,
      maxScore: 800,
      band: band.band,
      bandColor: band.color,
      description: band.description,
      gateMultiplier,
      pageType,
      pageTypeName,
      criticalIssues: criticalCount,
      warnings: warningCount,
      message,
    };
  }
}
