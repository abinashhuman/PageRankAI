/**
 * LLM Processor Module
 *
 * Provides LLM-powered deep analysis for GEO optimization.
 * Supports dual providers: Anthropic (Claude) and OpenAI (GPT).
 *
 * Features:
 * - Citation likelihood assessment
 * - Query coverage analysis
 * - Content improvement suggestions
 * - Simulated query testing
 *
 * Provider selection via environment variable: LLM_PROVIDER
 * - 'anthropic' (default): Uses Claude models
 * - 'openai': Uses GPT models
 */

import { CITATION_ASSESSMENT_PROMPT, QUERY_COVERAGE_PROMPT, CONTENT_SUGGESTIONS_PROMPT, QUERY_SIMULATION_PROMPT } from './prompts.js';

export class LLMProcessor {
  /**
   * Create a new LLMProcessor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Determine provider from options or environment
    this.provider = options.provider || process.env.LLM_PROVIDER || 'anthropic';

    // Initialize provider-specific settings
    if (this.provider === 'anthropic') {
      this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
      this.model = options.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
      this.apiUrl = 'https://api.anthropic.com/v1/messages';
    } else {
      this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      this.model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
      this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    // Cache for responses (24 hour TTL)
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 24 * 60 * 60 * 1000; // 24 hours

    // Rate limiting
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // 100ms between requests

    // Validate configuration
    this.isConfigured = !!this.apiKey;
  }

  /**
   * Check if LLM is properly configured
   * @returns {boolean}
   */
  isReady() {
    return this.isConfigured;
  }

  /**
   * Get current provider info
   * @returns {Object}
   */
  getProviderInfo() {
    return {
      provider: this.provider,
      model: this.model,
      isConfigured: this.isConfigured,
    };
  }

  /**
   * Enhance GEO analysis with LLM insights
   *
   * @param {Object} pageData - Scraped page data
   * @param {Object} geoResults - GEO analysis results
   * @returns {Object} Enhanced analysis with LLM insights
   */
  async enhanceAnalysis(pageData, geoResults) {
    if (!this.isConfigured) {
      return {
        error: 'LLM not configured',
        fallback: true,
        message: `${this.provider.toUpperCase()}_API_KEY environment variable not set`,
      };
    }

    const cacheKey = this.generateCacheKey(pageData.url, pageData.textContent);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      // Run analyses in parallel for efficiency
      const [citationLikelihood, queryCoverage, contentSuggestions] = await Promise.all([
        this.assessCitationLikelihood(pageData, geoResults),
        this.analyzeQueryCoverage(pageData),
        this.generateContentSuggestions(pageData, geoResults),
      ]);

      const enhancement = {
        citationLikelihood,
        queryCoverage,
        contentSuggestions,
        provider: this.provider,
        model: this.model,
        timestamp: new Date().toISOString(),
      };

      this.setCache(cacheKey, enhancement);
      return enhancement;
    } catch (error) {
      console.error('LLM enhancement failed:', error.message);
      return {
        error: 'LLM enhancement failed',
        message: error.message,
        fallback: true,
      };
    }
  }

  /**
   * Assess citation likelihood using LLM
   *
   * @param {Object} pageData - Scraped page data
   * @param {Object} geoResults - GEO analysis results
   * @returns {Object} Citation likelihood assessment
   */
  async assessCitationLikelihood(pageData, geoResults) {
    const prompt = CITATION_ASSESSMENT_PROMPT
      .replace('{{CONTENT}}', (pageData.textContent || '').substring(0, 3000))
      .replace('{{URL}}', pageData.url || '')
      .replace('{{TITLE}}', pageData.title || '')
      .replace('{{WORD_COUNT}}', pageData.wordCount || 0)
      .replace('{{PAGE_TYPE}}', geoResults.pageType || 'other')
      .replace('{{HAS_SCHEMA}}', (pageData.schemaTypes?.length > 0).toString())
      .replace('{{GEO_SCORE}}', geoResults.score || 0);

    try {
      const response = await this.callLLM(prompt);
      return this.parseJSONResponse(response) || {
        error: 'Failed to parse citation assessment',
        raw: response,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Analyze what queries the page can answer
   *
   * @param {Object} pageData - Scraped page data
   * @returns {Object} Query coverage analysis
   */
  async analyzeQueryCoverage(pageData) {
    const prompt = QUERY_COVERAGE_PROMPT
      .replace('{{CONTENT}}', (pageData.textContent || '').substring(0, 2500))
      .replace('{{TITLE}}', pageData.title || '');

    try {
      const response = await this.callLLM(prompt);
      return this.parseJSONResponse(response) || {
        error: 'Failed to parse query coverage',
        raw: response,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Generate specific content improvement suggestions
   *
   * @param {Object} pageData - Scraped page data
   * @param {Object} geoResults - GEO analysis results
   * @returns {Object} Content suggestions
   */
  async generateContentSuggestions(pageData, geoResults) {
    // Find weak pillars
    const weakPillars = Object.entries(geoResults.pillars || {})
      .filter(([_, p]) => p.percentage < 60)
      .map(([name, p]) => `${name}: ${p.percentage}%`)
      .join(', ');

    const prompt = CONTENT_SUGGESTIONS_PROMPT
      .replace('{{TITLE}}', pageData.title || '')
      .replace('{{WEAK_PILLARS}}', weakPillars || 'None below 60%')
      .replace('{{CONTENT}}', (pageData.textContent || '').substring(0, 2000));

    try {
      const response = await this.callLLM(prompt);
      return this.parseJSONResponse(response) || {
        error: 'Failed to parse content suggestions',
        raw: response,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Simulate how AI search would respond to a query about this page
   *
   * @param {string} query - User query to simulate
   * @param {string} pageContent - Page content
   * @param {string} pageUrl - Page URL
   * @returns {Object} Simulation result
   */
  async simulateQueryTest(query, pageContent, pageUrl) {
    if (!this.isConfigured) {
      return { error: 'LLM not configured' };
    }

    const prompt = QUERY_SIMULATION_PROMPT
      .replace('{{QUERY}}', query)
      .replace('{{URL}}', pageUrl)
      .replace('{{CONTENT}}', (pageContent || '').substring(0, 2500));

    try {
      const response = await this.callLLM(prompt);
      return this.parseJSONResponse(response) || {
        error: 'Failed to parse simulation',
        raw: response,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Call the LLM API (unified method for both providers)
   *
   * @param {string} prompt - The prompt to send
   * @returns {string} The LLM response text
   */
  async callLLM(prompt) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(r => setTimeout(r, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    if (this.provider === 'anthropic') {
      return this.callAnthropic(prompt);
    } else {
      return this.callOpenAI(prompt);
    }
  }

  /**
   * Call Anthropic API
   */
  async callAnthropic(prompt) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse JSON from LLM response (handles markdown code blocks)
   */
  parseJSONResponse(response) {
    if (!response) return null;

    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();

    try {
      return JSON.parse(jsonStr);
    } catch {
      // Try to find JSON object in the response
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CACHE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Generate cache key from URL and content
   */
  generateCacheKey(url, content) {
    const contentHash = this.simpleHash((content || '').substring(0, 5000));
    return `${url}:${contentHash}`;
  }

  /**
   * Simple hash function for content
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Get from cache if not expired
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cache with timestamp
   */
  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Cleanup old entries if cache grows too large
    if (this.cache.size > 100) {
      const entries = [...this.cache.entries()];
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      // Remove oldest 20%
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance for convenience
let _instance = null;

/**
 * Get or create LLM processor instance
 * @param {Object} options - Configuration options
 * @returns {LLMProcessor}
 */
export const getLLMProcessor = (options = {}) => {
  if (!_instance || options.forceNew) {
    _instance = new LLMProcessor(options);
  }
  return _instance;
};

export default LLMProcessor;
