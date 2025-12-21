/**
 * Web Scraper Module
 * Uses Puppeteer (headless browser) to scrape webpages for SEO/GEO analysis
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
   * @param {string} url - URL to scrape
   * @returns {Object} - Scraped page data
   */
  async scrape(url) {
    let browser;
    const startTime = Date.now();

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(this.userAgent);

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to URL
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.timeout,
      });

      const loadTime = Date.now() - startTime;

      // Get HTML content
      const html = await page.content();

      // Parse with Cheerio for detailed extraction
      const $ = cheerio.load(html);

      // Extract all page data
      const pageData = {
        url: page.url(),
        finalUrl: page.url(),
        statusCode: response?.status() || 200,
        loadTime,
        ...this.extractMetadata($),
        ...this.extractHeadings($),
        ...this.extractContent($),
        ...this.extractImages($),
        ...this.extractLinks($, url),
        ...this.extractStructuredData($),
        ...this.extractTechnicalData($),
        ...this.extractSocialMeta($),
      };

      return pageData;
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
   * Extract metadata from the page
   */
  extractMetadata($) {
    return {
      title: $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '',
      metaDescription: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
      metaKeywords: $('meta[name="keywords"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      robotsMeta: $('meta[name="robots"]').attr('content') || '',
      viewport: $('meta[name="viewport"]').attr('content') || '',
      charset: $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content') || '',
      language: $('html').attr('lang') || '',
      author: $('meta[name="author"]').attr('content') || '',
      datePublished: $('meta[property="article:published_time"]').attr('content') || $('time[datetime]').attr('datetime') || '',
      dateModified: $('meta[property="article:modified_time"]').attr('content') || '',
    };
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

    // Count semantic elements
    const articles = $('article').length;
    const sections = $('section').length;
    const nav = $('nav').length;
    const aside = $('aside').length;

    return {
      textContent,
      paragraphs,
      lists,
      articles: articles > 0 ? Array(articles).fill({}) : [],
      sections: sections > 0 ? Array(sections).fill({}) : [],
      nav: nav > 0 ? Array(nav).fill({}) : [],
      aside: aside > 0 ? Array(aside).fill({}) : [],
    };
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
      });
    });

    return { images };
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

    return { links: { internal, external } };
  }

  /**
   * Extract JSON-LD structured data
   */
  extractStructuredData($) {
    const structuredData = [];

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html();
        if (content) {
          const parsed = JSON.parse(content);
          // Handle @graph arrays
          if (parsed['@graph']) {
            structuredData.push(...parsed['@graph']);
          } else {
            structuredData.push(parsed);
          }
        }
      } catch (e) {
        console.warn('Failed to parse JSON-LD:', e.message);
      }
    });

    return { structuredData };
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

    // Check for common issues
    const hasHttps = true; // We'll check this from the URL later

    return {
      scripts,
      stylesheets,
      scriptCount: scripts.length,
      stylesheetCount: stylesheets.length,
    };
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
    };
  }
}
