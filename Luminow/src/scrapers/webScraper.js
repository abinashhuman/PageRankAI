/**
 * Web Scraper Module
 * Uses Puppeteer (headless browser) to scrape webpages for SEO/GEO analysis
 * Implements Phase 1 (Acquire) and Phase 2 (Understand) of the GEO algorithm
 *
 * v2.0 Update: Added robots.txt fetching for AI bot access verification
 * This is critical for GEO analysis as blocked AI crawlers = zero visibility
 * in AI-generated answers (RAG pipeline gating)
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export class WebScraper {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.userAgent = options.userAgent ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Scrape a webpage and extract all relevant data
   * Phase 1: Acquire - fetch, render, and validate access
   * Phase 2: Understand - classify and extract the product entity
   * @param {string} url - URL to scrape
   * @returns {Object} - Scraped page data
   */
  async scrape(url) {
    let browser;
    const startTime = Date.now();

    try {
      // Launch browser in headless mode for reliability
      console.log('[Puppeteer] Starting browser launch...');
      console.log('[Puppeteer] Timestamp:', new Date().toISOString());
      console.log('[Puppeteer] Checking puppeteer executable path...');

      const launchOptions = {
        headless: true, // Headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        ignoreHTTPSErrors: true,
        timeout: 60000,
      };

      console.log('[Puppeteer] Launch options:', JSON.stringify(launchOptions, null, 2));
      console.log('[Puppeteer] Calling puppeteer.launch() now...');

      const launchStart = Date.now();
      browser = await puppeteer.launch(launchOptions);
      const launchEnd = Date.now();

      console.log(`[Puppeteer] Browser launched successfully in ${launchEnd - launchStart}ms`);
      console.log('[Puppeteer] Browser PID:', browser.process()?.pid);

      const page = await browser.newPage();
      console.log('[Puppeteer] New page created');

      // Set longer timeouts for complex pages
      page.setDefaultNavigationTimeout(60000);
      page.setDefaultTimeout(60000);

      // Set user agent (use a common browser agent to avoid blocks)
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Track redirects
      const redirects = [];
      page.on('response', response => {
        const status = response.status();
        if (status >= 300 && status < 400) {
          redirects.push({
            from: response.url(),
            to: response.headers()['location'],
            status,
          });
        }
      });

      // Navigate with retry logic for transient errors
      let response;
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 45000,
          });
          // If we get here, navigation succeeded
          break;
        } catch (navError) {
          lastError = navError;
          const errorMsg = navError.message || '';

          // Retry on transient errors
          if (attempt < 3 && (
            errorMsg.includes('frame was detached') ||
            errorMsg.includes('socket hang up') ||
            errorMsg.includes('net::ERR_')
          )) {
            console.log(`Navigation attempt ${attempt} failed, retrying...`);
            await new Promise(r => setTimeout(r, 2000 * attempt));
            continue;
          }
          throw navError;
        }
      }

      // If all retries failed
      if (!response && lastError) {
        throw lastError;
      }

      // Wait briefly for dynamic content
      await new Promise(r => setTimeout(r, 1000));

      const loadTime = Date.now() - startTime;
      const statusCode = response?.status() || 200;
      const headers = response?.headers() || {};

      // Get HTML content
      const html = await page.content();

      // Parse with Cheerio for detailed extraction
      const $ = cheerio.load(html);

      // Phase 1: Acquire data
      const acquireData = {
        url: page.url(),
        originalUrl: url,
        finalUrl: page.url(),
        statusCode,
        loadTime,
        redirects,
        redirectCount: redirects.length,
        headers: {
          contentType: headers['content-type'] || '',
          xRobotsTag: headers['x-robots-tag'] || '',
          cacheControl: headers['cache-control'] || '',
        },
      };

      // Phase 2: Understand - extract all data
      const pageData = {
        ...acquireData,
        ...this.extractMetadata($),
        ...this.extractRobotsDirectives($),
        ...this.extractHeadings($),
        ...this.extractContent($),
        ...this.extractImages($),
        ...this.extractLinks($, url),
        ...this.extractStructuredData($),
        ...this.extractTechnicalData($),
        ...this.extractSocialMeta($),
        ...this.extractProductData($),
        ...this.extractPolicies($),
        ...this.extractBreadcrumbs($),
        pageType: this.detectPageType($),
        htmlSize: html.length,
      };

      // Phase 1.5: Fetch robots.txt for AI bot access verification
      // This is critical for GEO - if AI bots are blocked, the page has zero visibility
      const robotsData = await this.fetchRobotsTxt(url);

      return {
        ...pageData,
        robotsTxt: robotsData,
      };
    } catch (error) {
      console.error('Scraping error:', error);
      throw new Error(`Failed to scrape URL: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Fetch and parse robots.txt for AI bot access verification
   *
   * Research basis: RAG pipeline gating
   * - If a page blocks AI crawlers in robots.txt, it cannot be indexed
   *   by AI systems, resulting in zero visibility in AI-generated answers
   * - This is the first gate in the RAG funnel: Crawl → Retrieve → Extract → Rank → Cite
   *
   * AI bots checked:
   * - GPTBot: OpenAI's main crawler for training and browsing
   * - OAI-SearchBot: OpenAI's SearchGPT/ChatGPT search crawler
   * - ChatGPT-User: ChatGPT browsing mode
   * - PerplexityBot: Perplexity AI's search crawler
   * - ClaudeBot: Anthropic's Claude web crawler
   * - Claude-Web: Anthropic's web browsing feature
   * - Amazonbot: Amazon's crawler (for Alexa/AI features)
   * - anthropic-ai: Anthropic's AI training crawler
   * - Bytespider: ByteDance's crawler (TikTok AI)
   * - Google-Extended: Google's AI training crawler (Bard/Gemini)
   * - CCBot: Common Crawl (used by many AI training datasets)
   *
   * @param {string} url - The page URL to check
   * @returns {Object} - robots.txt data and AI bot access status
   */
  async fetchRobotsTxt(url) {
    const result = {
      found: false,
      content: '',
      aiBotAccess: {
        gptBot: { allowed: true, rules: [] },
        oaiSearchBot: { allowed: true, rules: [] },
        chatgptUser: { allowed: true, rules: [] },
        perplexityBot: { allowed: true, rules: [] },
        claudeBot: { allowed: true, rules: [] },
        claudeWeb: { allowed: true, rules: [] },
        amazonBot: { allowed: true, rules: [] },
        anthropicAi: { allowed: true, rules: [] },
        bytespider: { allowed: true, rules: [] },
        googleExtended: { allowed: true, rules: [] },
        ccBot: { allowed: true, rules: [] },
      },
      globalDisallow: false,
      crawlDelay: null,
    };

    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      const response = await fetch(robotsUrl, {
        headers: {
          'User-Agent': this.userAgent,
        },
        signal: AbortSignal.timeout(10000), // 10s timeout for robots.txt
      });

      if (response.ok) {
        result.found = true;
        result.content = await response.text();
        result.aiBotAccess = this.parseRobotsTxtForAiBots(result.content, url);

        // Check for global disallow (User-agent: * with Disallow: /)
        result.globalDisallow = this.checkGlobalDisallow(result.content);

        // Extract crawl delay if present
        const crawlDelayMatch = result.content.match(/Crawl-delay:\s*(\d+)/i);
        if (crawlDelayMatch) {
          result.crawlDelay = parseInt(crawlDelayMatch[1], 10);
        }
      }
    } catch (error) {
      // robots.txt not found or error - assume access allowed
      console.warn('Could not fetch robots.txt:', error.message);
    }

    return result;
  }

  /**
   * Parse robots.txt content to check AI bot access
   *
   * @param {string} robotsContent - The robots.txt file content
   * @param {string} pageUrl - The page URL to check against rules
   * @returns {Object} - AI bot access status for each bot
   */
  parseRobotsTxtForAiBots(robotsContent, pageUrl) {
    const aiBots = {
      gptBot: { patterns: ['GPTBot'], allowed: true, rules: [] },
      oaiSearchBot: { patterns: ['OAI-SearchBot'], allowed: true, rules: [] },
      chatgptUser: { patterns: ['ChatGPT-User'], allowed: true, rules: [] },
      perplexityBot: { patterns: ['PerplexityBot'], allowed: true, rules: [] },
      claudeBot: { patterns: ['ClaudeBot', 'claudebot'], allowed: true, rules: [] },
      claudeWeb: { patterns: ['Claude-Web', 'claude-web'], allowed: true, rules: [] },
      amazonBot: { patterns: ['Amazonbot'], allowed: true, rules: [] },
      anthropicAi: { patterns: ['anthropic-ai', 'Anthropic'], allowed: true, rules: [] },
      bytespider: { patterns: ['Bytespider'], allowed: true, rules: [] },
      googleExtended: { patterns: ['Google-Extended'], allowed: true, rules: [] },
      ccBot: { patterns: ['CCBot'], allowed: true, rules: [] },
    };

    const lines = robotsContent.split('\n');
    let currentUserAgents = [];
    let inRelevantBlock = false;
    let wildcardRules = { allow: [], disallow: [] };

    // First pass: collect wildcard rules
    let inWildcardBlock = false;
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#') || trimmedLine === '') continue;

      const [directive, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':').trim();

      if (directive.toLowerCase() === 'user-agent') {
        inWildcardBlock = value === '*';
      } else if (inWildcardBlock) {
        if (directive.toLowerCase() === 'disallow' && value) {
          wildcardRules.disallow.push(value);
        } else if (directive.toLowerCase() === 'allow' && value) {
          wildcardRules.allow.push(value);
        }
      }
    }

    // Second pass: check each AI bot
    for (const [botKey, botInfo] of Object.entries(aiBots)) {
      let botRules = { allow: [], disallow: [] };
      let foundSpecificRules = false;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('#') || trimmedLine === '') continue;

        const [directive, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':').trim();

        if (directive.toLowerCase() === 'user-agent') {
          const isRelevantBot = botInfo.patterns.some(
            pattern => value.toLowerCase() === pattern.toLowerCase()
          );
          inRelevantBlock = isRelevantBot;
          if (isRelevantBot) foundSpecificRules = true;
        } else if (inRelevantBlock) {
          if (directive.toLowerCase() === 'disallow' && value) {
            botRules.disallow.push(value);
            botInfo.rules.push(`Disallow: ${value}`);
          } else if (directive.toLowerCase() === 'allow' && value) {
            botRules.allow.push(value);
            botInfo.rules.push(`Allow: ${value}`);
          }
        }
      }

      // If no specific rules found, use wildcard rules
      if (!foundSpecificRules) {
        botRules = wildcardRules;
      }

      // Check if the page URL is blocked
      const pagePath = new URL(pageUrl).pathname;
      botInfo.allowed = this.isPathAllowed(pagePath, botRules);
    }

    // Return clean result without patterns
    const result = {};
    for (const [key, value] of Object.entries(aiBots)) {
      result[key] = { allowed: value.allowed, rules: value.rules };
    }
    return result;
  }

  /**
   * Check if a path is allowed based on robots.txt rules
   * Implements standard robots.txt matching (longer rules take precedence)
   */
  isPathAllowed(path, rules) {
    // If Disallow: / is present and no specific Allow rule matches, blocked
    let longestMatch = { length: 0, allowed: true };

    for (const disallowRule of rules.disallow) {
      if (this.pathMatchesRule(path, disallowRule)) {
        if (disallowRule.length > longestMatch.length) {
          longestMatch = { length: disallowRule.length, allowed: false };
        }
      }
    }

    for (const allowRule of rules.allow) {
      if (this.pathMatchesRule(path, allowRule)) {
        if (allowRule.length > longestMatch.length) {
          longestMatch = { length: allowRule.length, allowed: true };
        }
      }
    }

    return longestMatch.allowed;
  }

  /**
   * Check if a path matches a robots.txt rule pattern
   * Supports * and $ wildcards
   */
  pathMatchesRule(path, rule) {
    if (rule === '' || rule === '/') return true;

    // Convert rule to regex
    let pattern = rule
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except * and $
      .replace(/\*/g, '.*') // * matches anything
      .replace(/\\\$$/, '$'); // $ at end means end of string

    if (!pattern.endsWith('$')) {
      pattern = pattern + '.*'; // Rule matches prefix
    }

    try {
      const regex = new RegExp('^' + pattern, 'i');
      return regex.test(path);
    } catch {
      return path.startsWith(rule);
    }
  }

  /**
   * Check if robots.txt has a global disallow for all bots
   */
  checkGlobalDisallow(robotsContent) {
    const lines = robotsContent.split('\n');
    let inWildcardBlock = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#') || trimmedLine === '') continue;

      const [directive, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':').trim();

      if (directive.toLowerCase() === 'user-agent') {
        inWildcardBlock = value === '*';
      } else if (inWildcardBlock && directive.toLowerCase() === 'disallow') {
        if (value === '/' || value === '/*') {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Extract metadata from the page
   */
  extractMetadata($) {
    return {
      title: $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '',
      metaDescription: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
      metaKeywords: $('meta[name="keywords"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      viewport: $('meta[name="viewport"]').attr('content') || '',
      charset: $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content') || '',
      language: $('html').attr('lang') || '',
      author: $('meta[name="author"]').attr('content') || '',
      datePublished: $('meta[property="article:published_time"]').attr('content') || $('time[datetime]').attr('datetime') || '',
      dateModified: $('meta[property="article:modified_time"]').attr('content') || '',
      hreflang: this.extractHreflang($),
    };
  }

  /**
   * Extract hreflang tags
   */
  extractHreflang($) {
    const hreflang = [];
    $('link[rel="alternate"][hreflang]').each((_, el) => {
      hreflang.push({
        lang: $(el).attr('hreflang'),
        href: $(el).attr('href'),
      });
    });
    return hreflang;
  }

  /**
   * Extract robots directives from meta tags and headers
   */
  extractRobotsDirectives($) {
    return {
      robotsMeta: $('meta[name="robots"]').attr('content') || '',
      googlebotMeta: $('meta[name="googlebot"]').attr('content') || '',
      bingbotMeta: $('meta[name="bingbot"]').attr('content') || '',
      maxSnippet: this.extractMaxSnippet($),
      noindex: this.hasNoindex($),
      nofollow: this.hasNofollow($),
      nosnippet: this.hasNosnippet($),
    };
  }

  extractMaxSnippet($) {
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const match = robotsMeta.match(/max-snippet:(\d+|-1)/i);
    return match ? match[1] : null;
  }

  hasNoindex($) {
    const robotsMeta = ($('meta[name="robots"]').attr('content') || '').toLowerCase();
    const googlebotMeta = ($('meta[name="googlebot"]').attr('content') || '').toLowerCase();
    return robotsMeta.includes('noindex') || googlebotMeta.includes('noindex');
  }

  hasNofollow($) {
    const robotsMeta = ($('meta[name="robots"]').attr('content') || '').toLowerCase();
    return robotsMeta.includes('nofollow');
  }

  hasNosnippet($) {
    const robotsMeta = ($('meta[name="robots"]').attr('content') || '').toLowerCase();
    return robotsMeta.includes('nosnippet');
  }

  /**
   * Extract all headings
   */
  extractHeadings($) {
    const headings = {
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
    };

    for (let i = 1; i <= 6; i++) {
      $(`h${i}`).each((_, el) => {
        headings[`h${i}`].push($(el).text().trim());
      });
    }

    return { headings };
  }

  /**
   * Extract main content
   */
  extractContent($) {
    // Remove script, style, nav, header, footer elements for clean text
    const $content = $.root().clone();
    $content.find('script, style, nav, header, footer, aside, noscript').remove();

    // Get text content
    const textContent = $content.text()
      .replace(/\s+/g, ' ')
      .trim();

    // Get paragraphs
    const paragraphs = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        paragraphs.push(text);
      }
    });

    // Get lists
    const lists = [];
    $('ul, ol').each((_, el) => {
      const items = [];
      $(el).find('li').each((_, li) => {
        items.push($(li).text().trim());
      });
      if (items.length > 0) {
        lists.push({
          type: $(el).prop('tagName').toLowerCase(),
          items,
        });
      }
    });

    // Get tables
    const tables = [];
    $('table').each((_, el) => {
      const rows = [];
      $(el).find('tr').each((_, tr) => {
        const cells = [];
        $(tr).find('td, th').each((_, cell) => {
          cells.push($(cell).text().trim());
        });
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      if (rows.length > 0) {
        tables.push({ rows });
      }
    });

    // Count semantic elements
    const articles = $('article').length;
    const sections = $('section').length;
    const nav = $('nav').length;
    const aside = $('aside').length;
    const main = $('main').length;

    // Extract FAQ content
    const faqContent = this.extractFAQContent($);

    return {
      textContent,
      paragraphs,
      lists,
      tables,
      faqContent,
      wordCount: textContent.split(/\s+/).filter(w => w.length > 0).length,
      articles: articles > 0 ? Array(articles).fill({}) : [],
      sections: sections > 0 ? Array(sections).fill({}) : [],
      nav: nav > 0 ? Array(nav).fill({}) : [],
      aside: aside > 0 ? Array(aside).fill({}) : [],
      main: main > 0 ? Array(main).fill({}) : [],
      hasMainElement: main > 0,
    };
  }

  /**
   * Extract FAQ content from the page
   */
  extractFAQContent($) {
    const faqs = [];

    // Look for FAQ schema in structured data (will be parsed separately)
    // Look for common FAQ patterns in HTML
    $('[class*="faq"], [id*="faq"], [data-faq]').find('h2, h3, h4, dt, .question').each((_, el) => {
      const question = $(el).text().trim();
      const answer = $(el).next('p, dd, .answer, [class*="answer"]').text().trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    });

    // Look for accordion-style FAQs
    $('[class*="accordion"]').find('[class*="question"], [class*="title"], summary').each((_, el) => {
      const question = $(el).text().trim();
      const answer = $(el).closest('[class*="item"]').find('[class*="answer"], [class*="content"], [class*="panel"]').text().trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    });

    return faqs;
  }

  /**
   * Extract images
   */
  extractImages($) {
    const images = [];

    $('img').each((_, el) => {
      const $img = $(el);
      images.push({
        src: $img.attr('src') || '',
        alt: $img.attr('alt') || '',
        title: $img.attr('title') || '',
        width: $img.attr('width') || '',
        height: $img.attr('height') || '',
        loading: $img.attr('loading') || '',
        srcset: $img.attr('srcset') || '',
      });
    });

    // Count images with/without alt
    const imagesWithAlt = images.filter(img => img.alt && img.alt.trim()).length;
    const imagesWithoutAlt = images.length - imagesWithAlt;
    const imagesWithDimensions = images.filter(img => img.width && img.height).length;

    return {
      images,
      imageStats: {
        total: images.length,
        withAlt: imagesWithAlt,
        withoutAlt: imagesWithoutAlt,
        withDimensions: imagesWithDimensions,
      },
    };
  }

  /**
   * Extract links
   */
  extractLinks($, baseUrl) {
    const internal = [];
    const external = [];

    try {
      const baseHost = new URL(baseUrl).hostname;

      $('a').each((_, el) => {
        const $link = $(el);
        const href = $link.attr('href') || '';
        const text = $link.text().trim();
        const rel = $link.attr('rel') || '';

        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          return;
        }

        const link = {
          href,
          text: text.substring(0, 100),
          rel,
          isNofollow: rel.includes('nofollow'),
          isSponsored: rel.includes('sponsored'),
          isUGC: rel.includes('ugc'),
        };

        try {
          const linkUrl = new URL(href, baseUrl);
          if (linkUrl.hostname === baseHost) {
            internal.push(link);
          } else {
            external.push(link);
          }
        } catch {
          // Relative link, treat as internal
          internal.push(link);
        }
      });
    } catch (error) {
      console.error('Error parsing links:', error);
    }

    return {
      links: { internal, external },
      linkStats: {
        totalInternal: internal.length,
        totalExternal: external.length,
        nofollowLinks: [...internal, ...external].filter(l => l.isNofollow).length,
      },
    };
  }

  /**
   * Extract JSON-LD structured data
   */
  extractStructuredData($) {
    const structuredData = [];
    const schemaTypes = new Set();

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html();
        if (content) {
          const parsed = JSON.parse(content);
          // Handle @graph arrays
          if (parsed['@graph']) {
            parsed['@graph'].forEach(item => {
              structuredData.push(item);
              if (item['@type']) {
                const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
                types.forEach(t => schemaTypes.add(t));
              }
            });
          } else {
            structuredData.push(parsed);
            if (parsed['@type']) {
              const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type']];
              types.forEach(t => schemaTypes.add(t));
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse JSON-LD:', e.message);
      }
    });

    // Extract specific schema data
    const productSchema = structuredData.find(sd => sd['@type'] === 'Product');
    const organizationSchema = structuredData.find(sd => sd['@type'] === 'Organization');
    const faqSchema = structuredData.find(sd => sd['@type'] === 'FAQPage');
    const breadcrumbSchema = structuredData.find(sd => sd['@type'] === 'BreadcrumbList');
    const articleSchema = structuredData.find(sd => ['Article', 'NewsArticle', 'BlogPosting'].includes(sd['@type']));

    return {
      structuredData,
      schemaTypes: Array.from(schemaTypes),
      hasProductSchema: !!productSchema,
      hasOrganizationSchema: !!organizationSchema,
      hasFAQSchema: !!faqSchema,
      hasBreadcrumbSchema: !!breadcrumbSchema,
      hasArticleSchema: !!articleSchema,
      productSchema,
      organizationSchema,
      faqSchema,
      breadcrumbSchema,
      articleSchema,
    };
  }

  /**
   * Extract technical data
   */
  extractTechnicalData($) {
    // Count resources
    const scripts = [];
    $('script[src]').each((_, el) => {
      scripts.push($(el).attr('src'));
    });

    const stylesheets = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      stylesheets.push($(el).attr('href'));
    });

    // Check for common frameworks/technologies
    const technologies = this.detectTechnologies($);

    return {
      scripts,
      stylesheets,
      scriptCount: scripts.length,
      stylesheetCount: stylesheets.length,
      technologies,
      hasHttps: true, // Will be verified from URL
    };
  }

  /**
   * Detect common technologies/frameworks
   */
  detectTechnologies($) {
    const technologies = [];
    const html = $.html().toLowerCase();

    // Common patterns
    if (html.includes('react') || html.includes('__react')) technologies.push('React');
    if (html.includes('vue') || html.includes('__vue__')) technologies.push('Vue');
    if (html.includes('angular') || html.includes('ng-')) technologies.push('Angular');
    if (html.includes('shopify')) technologies.push('Shopify');
    if (html.includes('wordpress') || html.includes('wp-content')) technologies.push('WordPress');
    if (html.includes('woocommerce')) technologies.push('WooCommerce');
    if (html.includes('magento')) technologies.push('Magento');
    if (html.includes('bootstrap')) technologies.push('Bootstrap');
    if (html.includes('tailwind')) technologies.push('Tailwind');

    return technologies;
  }

  /**
   * Extract social media meta tags
   */
  extractSocialMeta($) {
    const openGraph = {};
    const twitter = {};

    // Open Graph
    $('meta[property^="og:"]').each((_, el) => {
      const $meta = $(el);
      const property = $meta.attr('property').replace('og:', '');
      openGraph[property] = $meta.attr('content');
    });

    // Twitter Cards
    $('meta[name^="twitter:"]').each((_, el) => {
      const $meta = $(el);
      const name = $meta.attr('name').replace('twitter:', '');
      twitter[name] = $meta.attr('content');
    });

    return {
      openGraph,
      twitter,
      hasOpenGraph: Object.keys(openGraph).length > 0,
      hasTwitterCard: Object.keys(twitter).length > 0,
    };
  }

  /**
   * Extract product-specific data (for e-commerce pages)
   */
  extractProductData($) {
    const product = {
      name: '',
      price: '',
      currency: '',
      availability: '',
      sku: '',
      gtin: '',
      mpn: '',
      brand: '',
      description: '',
      rating: null,
      reviewCount: 0,
      variants: [],
    };

    // Try to extract from structured data first (more reliable)
    const productLd = $('script[type="application/ld+json"]').toArray()
      .map(el => {
        try { return JSON.parse($(el).html()); } catch { return null; }
      })
      .filter(Boolean)
      .find(sd => sd['@type'] === 'Product' || (sd['@graph'] && sd['@graph'].some(item => item['@type'] === 'Product')));

    if (productLd) {
      const pd = productLd['@type'] === 'Product' ? productLd : productLd['@graph']?.find(item => item['@type'] === 'Product');
      if (pd) {
        product.name = pd.name || '';
        product.description = pd.description || '';
        product.brand = pd.brand?.name || pd.brand || '';
        product.sku = pd.sku || '';
        product.gtin = pd.gtin || pd.gtin13 || pd.gtin12 || pd.gtin14 || pd.gtin8 || '';
        product.mpn = pd.mpn || '';

        if (pd.offers) {
          const offer = Array.isArray(pd.offers) ? pd.offers[0] : pd.offers;
          product.price = offer.price || '';
          product.currency = offer.priceCurrency || '';
          product.availability = offer.availability || '';
        }

        if (pd.aggregateRating) {
          product.rating = pd.aggregateRating.ratingValue;
          product.reviewCount = pd.aggregateRating.reviewCount || pd.aggregateRating.ratingCount || 0;
        }
      }
    }

    // Fallback: try to extract from visible DOM
    if (!product.name) {
      product.name = $('[class*="product-name"], [class*="product-title"], h1[class*="title"]').first().text().trim();
    }

    if (!product.price) {
      const priceText = $('[class*="price"], [data-price]').first().text().trim();
      const priceMatch = priceText.match(/[\$\£\€]?\s*[\d,]+\.?\d*/);
      if (priceMatch) {
        product.price = priceMatch[0];
      }
    }

    // Check for add-to-cart button
    product.hasAddToCart = $('[class*="add-to-cart"], [id*="add-to-cart"], button:contains("Add to Cart"), button:contains("Buy")').length > 0;

    // Check for variant selectors
    product.hasVariants = $('[class*="variant"], [class*="option"], select[name*="size"], select[name*="color"]').length > 0;

    return { productData: product };
  }

  /**
   * Extract shipping/returns/warranty policies
   */
  extractPolicies($) {
    const textContent = $('body').text().toLowerCase();
    const policies = {
      hasShippingInfo: false,
      hasReturnsInfo: false,
      hasWarrantyInfo: false,
      hasContactInfo: false,
      hasPrivacyPolicy: false,
      hasTermsOfService: false,
    };

    // Check for policy mentions
    policies.hasShippingInfo = /shipping|delivery|free shipping|ships in|estimated delivery/i.test(textContent);
    policies.hasReturnsInfo = /return|refund|money.?back|exchange/i.test(textContent);
    policies.hasWarrantyInfo = /warranty|guarantee|covered|protection plan/i.test(textContent);
    policies.hasContactInfo = /contact|email|phone|call us|support|customer service/i.test(textContent);
    policies.hasPrivacyPolicy = $('a[href*="privacy"]').length > 0;
    policies.hasTermsOfService = $('a[href*="terms"]').length > 0;

    return { policies };
  }

  /**
   * Extract breadcrumb navigation
   */
  extractBreadcrumbs($) {
    const breadcrumbs = [];

    // Try common breadcrumb selectors
    $('[class*="breadcrumb"] a, nav[aria-label="breadcrumb"] a, .breadcrumbs a, ol.breadcrumb a').each((_, el) => {
      breadcrumbs.push({
        text: $(el).text().trim(),
        href: $(el).attr('href'),
      });
    });

    return {
      breadcrumbs,
      hasBreadcrumbs: breadcrumbs.length > 0,
    };
  }

  /**
   * Detect page type (Product, Category, Article, Homepage, Other)
   * Phase 2, Step 4 of the algorithm
   */
  detectPageType($) {
    const signals = {
      product: 0,
      category: 0,
      article: 0,
      homepage: 0,
    };

    const url = $('link[rel="canonical"]').attr('href') || '';
    const html = $.html().toLowerCase();

    // Product signals
    if (html.includes('schema.org/product') || html.includes('"@type":"product"') || html.includes('"@type": "product"')) signals.product += 30;
    if ($('[class*="product"]').length > 0) signals.product += 10;
    if ($('[class*="add-to-cart"], [id*="add-to-cart"]').length > 0) signals.product += 25;
    if ($('[class*="price"], [data-price]').length > 0) signals.product += 15;
    if ($('[class*="buy-now"], [class*="checkout"]').length > 0) signals.product += 15;
    if (html.includes('sku') || html.includes('gtin') || html.includes('mpn')) signals.product += 10;

    // Category signals
    if ($('[class*="product-list"], [class*="products-grid"], [class*="category"]').length > 0) signals.category += 25;
    if ($('[class*="product-card"], [class*="product-item"]').length > 3) signals.category += 25;
    if ($('[class*="filter"], [class*="facet"]').length > 0) signals.category += 15;
    if (/\/category\/|\/collection\/|\/products\//i.test(url)) signals.category += 20;

    // Article signals
    if (html.includes('schema.org/article') || html.includes('"@type":"article"') || html.includes('"@type":"blogposting"')) signals.article += 30;
    if ($('article').length > 0) signals.article += 20;
    if ($('time[datetime]').length > 0) signals.article += 15;
    if ($('[class*="author"], [rel="author"]').length > 0) signals.article += 15;
    if ($('[class*="post"], [class*="blog"], [class*="article"]').length > 0) signals.article += 10;

    // Homepage signals
    if (url === '/' || url.match(/^https?:\/\/[^\/]+\/?$/)) signals.homepage += 50;
    if ($('[class*="hero"], [class*="banner"]').length > 0) signals.homepage += 15;
    if ($('[class*="featured"]').length > 0) signals.homepage += 10;

    // Determine page type
    const maxSignal = Math.max(signals.product, signals.category, signals.article, signals.homepage);
    let pageType = 'other';
    let confidence = 0;

    if (signals.product === maxSignal && signals.product > 30) {
      pageType = 'product';
      confidence = Math.min(signals.product / 100, 1);
    } else if (signals.category === maxSignal && signals.category > 30) {
      pageType = 'category';
      confidence = Math.min(signals.category / 100, 1);
    } else if (signals.article === maxSignal && signals.article > 30) {
      pageType = 'article';
      confidence = Math.min(signals.article / 100, 1);
    } else if (signals.homepage === maxSignal && signals.homepage > 30) {
      pageType = 'homepage';
      confidence = Math.min(signals.homepage / 100, 1);
    }

    return {
      type: pageType,
      confidence,
      signals,
      isProductPage: pageType === 'product',
    };
  }
}
