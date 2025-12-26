/**
 * Page Type Detector Module
 *
 * Detects page type using weighted signal matching.
 * Supports 12+ page types with configurable signals.
 *
 * Detection methods:
 * - Schema.org type matching
 * - CSS selector presence
 * - Text pattern matching
 * - URL pattern matching
 */

import { PAGE_TYPES, DEFAULT_PAGE_TYPE, getPageTypeKeys } from '../config/pageTypes.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE TYPE DETECTOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class PageTypeDetector {
  /**
   * Create a new PageTypeDetector
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      minConfidence: 30, // Minimum score to consider a type
      debugMode: false,
      ...options,
    };

    this.pageTypes = PAGE_TYPES;
  }

  /**
   * Detect page type from scraped data
   *
   * @param {Object} pageData - Scraped page data
   * @param {Object} $ - Cheerio instance (optional, for selector checks)
   * @returns {Object} Detection result with type, confidence, and signals
   */
  detect(pageData, $ = null) {
    const scores = {};
    const signalMatches = {};

    // Score each page type
    for (const [typeKey, typeConfig] of Object.entries(this.pageTypes)) {
      const result = this.scorePageType(typeKey, typeConfig, pageData, $);
      scores[typeKey] = result.score;
      signalMatches[typeKey] = result.matches;
    }

    // Find best match
    const sortedTypes = Object.entries(scores)
      .filter(([_, score]) => score >= this.options.minConfidence)
      .sort((a, b) => {
        // Sort by score, then by priority
        const scoreDiff = b[1] - a[1];
        if (scoreDiff !== 0) return scoreDiff;
        return (this.pageTypes[b[0]]?.priority || 0) - (this.pageTypes[a[0]]?.priority || 0);
      });

    // Get best match or default
    const [bestType, bestScore] = sortedTypes[0] || [DEFAULT_PAGE_TYPE, 0];

    // Calculate confidence percentage (capped at 100)
    const threshold = this.pageTypes[bestType]?.threshold || 40;
    const confidence = Math.min(100, Math.round((bestScore / threshold) * 100));

    // Get alternative matches
    const alternatives = sortedTypes
      .slice(1, 4)
      .map(([type, score]) => ({
        type,
        name: this.pageTypes[type]?.name || type,
        score,
        matches: signalMatches[type],
      }));

    return {
      type: bestType,
      name: this.pageTypes[bestType]?.name || bestType,
      description: this.pageTypes[bestType]?.description || '',
      score: bestScore,
      confidence,
      threshold,
      meetsThreshold: bestScore >= threshold,
      matches: signalMatches[bestType] || [],
      alternatives,
      allScores: this.options.debugMode ? scores : undefined,
    };
  }

  /**
   * Score a specific page type
   *
   * @param {string} typeKey - Page type key
   * @param {Object} typeConfig - Page type configuration
   * @param {Object} pageData - Scraped page data
   * @param {Object} $ - Cheerio instance
   * @returns {Object} Score and matched signals
   */
  scorePageType(typeKey, typeConfig, pageData, $) {
    let score = 0;
    const matches = [];

    for (const signal of typeConfig.signals || []) {
      const signalResult = this.evaluateSignal(signal, pageData, $);

      if (signalResult.matched) {
        score += signal.weight;
        matches.push({
          type: signal.type,
          value: this.formatSignalValue(signal),
          weight: signal.weight,
          found: signalResult.found,
        });
      }
    }

    return { score, matches };
  }

  /**
   * Evaluate a single detection signal
   *
   * @param {Object} signal - Signal configuration
   * @param {Object} pageData - Scraped page data
   * @param {Object} $ - Cheerio instance
   * @returns {Object} Match result
   */
  evaluateSignal(signal, pageData, $) {
    switch (signal.type) {
      case 'schema':
        return this.evaluateSchemaSignal(signal, pageData);

      case 'selector':
        return this.evaluateSelectorSignal(signal, pageData, $);

      case 'pattern':
      case 'text':
        return this.evaluatePatternSignal(signal, pageData);

      case 'url':
        return this.evaluateUrlSignal(signal, pageData);

      default:
        return { matched: false };
    }
  }

  /**
   * Evaluate schema signal
   */
  evaluateSchemaSignal(signal, pageData) {
    const schemas = pageData.schemas || pageData.schemaTypes || [];
    const schemaString = JSON.stringify(schemas).toLowerCase();
    const targetSchema = signal.value.toLowerCase();

    const found = schemas.some((s) => {
      const type = (s['@type'] || s.type || s).toString().toLowerCase();
      return type === targetSchema || type.includes(targetSchema);
    }) || schemaString.includes(`"@type":"${targetSchema}"`) ||
    schemaString.includes(`"@type": "${targetSchema}"`);

    return { matched: found, found: found ? signal.value : null };
  }

  /**
   * Evaluate CSS selector signal
   */
  evaluateSelectorSignal(signal, pageData, $) {
    // If we have a Cheerio instance, use it directly
    if ($) {
      try {
        const elements = $(signal.value);
        const count = elements.length;

        // Check minCount if specified
        const minCount = signal.minCount || 1;
        const matched = count >= minCount;

        return { matched, found: matched ? `${count} element(s)` : null };
      } catch {
        // Selector parsing error
        return { matched: false };
      }
    }

    // Fallback: Check if pageData has element counts or HTML
    const html = pageData.html || pageData.rawHtml || '';
    if (!html) return { matched: false };

    // Simple pattern matching for common selectors
    const selectors = signal.value.split(',').map((s) => s.trim());
    for (const selector of selectors) {
      // Extract class or id patterns
      const classMatch = selector.match(/\[class\*="([^"]+)"\]|\.([a-z0-9_-]+)/i);
      const idMatch = selector.match(/\[id\*="([^"]+)"\]|#([a-z0-9_-]+)/i);

      if (classMatch) {
        const className = classMatch[1] || classMatch[2];
        if (html.includes(`class="`) && html.toLowerCase().includes(className.toLowerCase())) {
          return { matched: true, found: `class*="${className}"` };
        }
      }

      if (idMatch) {
        const idName = idMatch[1] || idMatch[2];
        if (html.includes(`id="`) && html.toLowerCase().includes(idName.toLowerCase())) {
          return { matched: true, found: `id*="${idName}"` };
        }
      }

      // Check for element patterns
      const tagMatch = selector.match(/^([a-z]+)/i);
      if (tagMatch) {
        const tag = tagMatch[1].toLowerCase();
        if (html.includes(`<${tag}`) || html.includes(`<${tag.toUpperCase()}`)) {
          // This is a very loose check, might match false positives
          // But it's a fallback for when we don't have Cheerio
        }
      }
    }

    return { matched: false };
  }

  /**
   * Evaluate text/pattern signal
   */
  evaluatePatternSignal(signal, pageData) {
    const textContent = pageData.textContent || pageData.text || '';
    const pattern = signal.value instanceof RegExp
      ? signal.value
      : new RegExp(signal.value, 'i');

    const match = textContent.match(pattern);
    return {
      matched: !!match,
      found: match ? match[0].substring(0, 50) : null,
    };
  }

  /**
   * Evaluate URL pattern signal
   */
  evaluateUrlSignal(signal, pageData) {
    const url = pageData.url || '';
    const pattern = signal.value instanceof RegExp
      ? signal.value
      : new RegExp(signal.value, 'i');

    const matched = pattern.test(url);
    return {
      matched,
      found: matched ? 'URL pattern matched' : null,
    };
  }

  /**
   * Format signal value for display
   */
  formatSignalValue(signal) {
    if (signal.type === 'schema') {
      return `Schema: ${signal.value}`;
    }
    if (signal.type === 'selector') {
      // Truncate long selectors
      const selector = signal.value;
      return selector.length > 40 ? selector.substring(0, 37) + '...' : selector;
    }
    if (signal.type === 'pattern' || signal.type === 'text') {
      return 'Text pattern';
    }
    if (signal.type === 'url') {
      return 'URL pattern';
    }
    return signal.type;
  }

  /**
   * Get available page types
   */
  getPageTypes() {
    return getPageTypeKeys();
  }

  /**
   * Get page type configuration
   */
  getPageTypeConfig(typeKey) {
    return this.pageTypes[typeKey] || null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick page type detection
 *
 * @param {Object} pageData - Scraped page data
 * @param {Object} $ - Cheerio instance (optional)
 * @returns {Object} Detection result
 */
export const detectPageType = (pageData, $ = null) => {
  const detector = new PageTypeDetector();
  return detector.detect(pageData, $);
};

/**
 * Check if page type is e-commerce related
 *
 * @param {string} pageType - Detected page type
 * @returns {boolean}
 */
export const isEcommerceType = (pageType) => {
  return ['product', 'category'].includes(pageType);
};

/**
 * Check if page type is content/article related
 *
 * @param {string} pageType - Detected page type
 * @returns {boolean}
 */
export const isContentType = (pageType) => {
  return ['article', 'news', 'documentation', 'comparison'].includes(pageType);
};

/**
 * Check if page type is business/service related
 *
 * @param {string} pageType - Detected page type
 * @returns {boolean}
 */
export const isBusinessType = (pageType) => {
  return ['saas', 'localBusiness', 'portfolio', 'landing'].includes(pageType);
};

/**
 * Get page type category
 *
 * @param {string} pageType - Detected page type
 * @returns {string} Category: 'ecommerce' | 'content' | 'business' | 'navigation' | 'other'
 */
export const getPageTypeCategory = (pageType) => {
  if (isEcommerceType(pageType)) return 'ecommerce';
  if (isContentType(pageType)) return 'content';
  if (isBusinessType(pageType)) return 'business';
  if (['homepage', 'directory', 'category'].includes(pageType)) return 'navigation';
  return 'other';
};

export default {
  PageTypeDetector,
  detectPageType,
  isEcommerceType,
  isContentType,
  isBusinessType,
  getPageTypeCategory,
};
