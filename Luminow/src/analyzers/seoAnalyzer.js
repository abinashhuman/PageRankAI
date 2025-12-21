/**
 * SEO Analyzer Module
 * Analyzes webpage content for Search Engine Optimization factors
 */

export class SEOAnalyzer {
  constructor() {
    this.weights = {
      title: 10,
      metaDescription: 10,
      headings: 10,
      images: 10,
      links: 10,
      contentQuality: 15,
      technicalSEO: 15,
      mobileOptimization: 10,
      pageSpeed: 10,
    };
  }

  /**
   * Main analysis method
   * @param {Object} pageData - Scraped page data
   * @returns {Object} SEO analysis results
   */
  analyze(pageData) {
    const checks = {
      title: this.analyzeTitle(pageData),
      metaDescription: this.analyzeMetaDescription(pageData),
      headings: this.analyzeHeadings(pageData),
      images: this.analyzeImages(pageData),
      links: this.analyzeLinks(pageData),
      contentQuality: this.analyzeContentQuality(pageData),
      technicalSEO: this.analyzeTechnicalSEO(pageData),
      mobileOptimization: this.analyzeMobileOptimization(pageData),
      pageSpeed: this.analyzePageSpeed(pageData),
    };

    const score = this.calculateScore(checks);
    const issues = this.collectIssues(checks);
    const recommendations = this.generateRecommendations(checks);

    return {
      score,
      checks,
      issues,
      recommendations,
      summary: this.generateSummary(score, issues),
    };
  }

  /**
   * Analyze page title
   */
  analyzeTitle(pageData) {
    const title = pageData.title || '';
    const issues = [];
    const recommendations = [];
    let score = 100;

    if (!title) {
      score = 0;
      issues.push({ severity: 'critical', message: 'Missing page title' });
      recommendations.push('Add a descriptive title tag to your page');
    } else {
      if (title.length < 30) {
        score -= 30;
        issues.push({ severity: 'warning', message: `Title too short (${title.length} chars). Optimal: 50-60 characters` });
        recommendations.push('Expand your title to 50-60 characters for better visibility in search results');
      } else if (title.length > 60) {
        score -= 20;
        issues.push({ severity: 'warning', message: `Title too long (${title.length} chars). May be truncated in search results` });
        recommendations.push('Shorten your title to under 60 characters to prevent truncation');
      }

      if (!/[a-zA-Z]/.test(title)) {
        score -= 20;
        issues.push({ severity: 'warning', message: 'Title lacks descriptive text' });
      }
    }

    return {
      value: title,
      length: title.length,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze meta description
   */
  analyzeMetaDescription(pageData) {
    const description = pageData.metaDescription || '';
    const issues = [];
    const recommendations = [];
    let score = 100;

    if (!description) {
      score = 0;
      issues.push({ severity: 'critical', message: 'Missing meta description' });
      recommendations.push('Add a compelling meta description (150-160 characters) that summarizes your page content');
    } else {
      if (description.length < 120) {
        score -= 30;
        issues.push({ severity: 'warning', message: `Meta description too short (${description.length} chars)` });
        recommendations.push('Expand your meta description to 150-160 characters for optimal display');
      } else if (description.length > 160) {
        score -= 15;
        issues.push({ severity: 'info', message: `Meta description may be truncated (${description.length} chars)` });
        recommendations.push('Consider shortening your meta description to 160 characters');
      }
    }

    return {
      value: description,
      length: description.length,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze heading structure
   */
  analyzeHeadings(pageData) {
    const headings = pageData.headings || { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check H1
    if (headings.h1.length === 0) {
      score -= 40;
      issues.push({ severity: 'critical', message: 'Missing H1 heading' });
      recommendations.push('Add a single H1 heading that describes the main topic of your page');
    } else if (headings.h1.length > 1) {
      score -= 20;
      issues.push({ severity: 'warning', message: `Multiple H1 headings found (${headings.h1.length})` });
      recommendations.push('Use only one H1 heading per page for clarity');
    }

    // Check heading hierarchy
    const h2Count = headings.h2.length;
    const h3Count = headings.h3.length;

    if (h2Count === 0 && h3Count > 0) {
      score -= 15;
      issues.push({ severity: 'warning', message: 'H3 headings used without H2 headings' });
      recommendations.push('Maintain proper heading hierarchy (H1 > H2 > H3)');
    }

    // Check for empty headings
    const allHeadings = [...headings.h1, ...headings.h2, ...headings.h3];
    const emptyHeadings = allHeadings.filter(h => !h.trim());
    if (emptyHeadings.length > 0) {
      score -= 10;
      issues.push({ severity: 'warning', message: `${emptyHeadings.length} empty heading(s) found` });
    }

    return {
      structure: headings,
      h1Count: headings.h1.length,
      totalHeadings: allHeadings.length,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze images
   */
  analyzeImages(pageData) {
    const images = pageData.images || [];
    const issues = [];
    const recommendations = [];
    let score = 100;

    if (images.length === 0) {
      return {
        totalImages: 0,
        imagesWithAlt: 0,
        imagesWithoutAlt: 0,
        score: 100,
        passed: true,
        issues: [],
        recommendations: ['Consider adding relevant images to enhance content'],
      };
    }

    const imagesWithAlt = images.filter(img => img.alt && img.alt.trim());
    const imagesWithoutAlt = images.length - imagesWithAlt.length;

    if (imagesWithoutAlt > 0) {
      const percentWithoutAlt = (imagesWithoutAlt / images.length) * 100;
      score -= Math.min(40, percentWithoutAlt * 0.8);
      issues.push({
        severity: imagesWithoutAlt > images.length / 2 ? 'critical' : 'warning',
        message: `${imagesWithoutAlt} image(s) missing alt text`,
      });
      recommendations.push('Add descriptive alt text to all images for accessibility and SEO');
    }

    // Check for images without dimensions
    const imagesWithoutDimensions = images.filter(img => !img.width || !img.height);
    if (imagesWithoutDimensions.length > 0) {
      score -= 10;
      issues.push({ severity: 'info', message: `${imagesWithoutDimensions.length} image(s) missing width/height attributes` });
      recommendations.push('Specify width and height attributes on images to prevent layout shifts');
    }

    return {
      totalImages: images.length,
      imagesWithAlt: imagesWithAlt.length,
      imagesWithoutAlt,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze links
   */
  analyzeLinks(pageData) {
    const links = pageData.links || { internal: [], external: [] };
    const issues = [];
    const recommendations = [];
    let score = 100;

    const totalLinks = links.internal.length + links.external.length;

    if (totalLinks === 0) {
      score -= 30;
      issues.push({ severity: 'warning', message: 'No links found on the page' });
      recommendations.push('Add internal links to other pages on your site');
    }

    // Check for broken link indicators
    const linksWithoutHref = [...links.internal, ...links.external].filter(l => !l.href || l.href === '#');
    if (linksWithoutHref.length > 0) {
      score -= 15;
      issues.push({ severity: 'warning', message: `${linksWithoutHref.length} link(s) with missing or empty href` });
    }

    // Check internal to external ratio
    if (links.external.length > links.internal.length * 2 && links.external.length > 10) {
      score -= 10;
      issues.push({ severity: 'info', message: 'High ratio of external to internal links' });
      recommendations.push('Consider adding more internal links to keep users on your site');
    }

    return {
      totalLinks,
      internal: links.internal.length,
      external: links.external.length,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze content quality
   */
  analyzeContentQuality(pageData) {
    const text = pageData.textContent || '';
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const issues = [];
    const recommendations = [];
    let score = 100;

    if (wordCount < 300) {
      score -= 40;
      issues.push({ severity: 'critical', message: `Thin content (${wordCount} words). Minimum recommended: 300 words` });
      recommendations.push('Add more comprehensive content. Aim for at least 300-500 words for better rankings');
    } else if (wordCount < 600) {
      score -= 15;
      issues.push({ severity: 'info', message: `Content could be more comprehensive (${wordCount} words)` });
      recommendations.push('Consider expanding your content to 600+ words for competitive topics');
    }

    // Check for paragraph structure
    const paragraphs = pageData.paragraphs || [];
    if (paragraphs.length < 3 && wordCount > 200) {
      score -= 10;
      issues.push({ severity: 'info', message: 'Content lacks paragraph structure' });
      recommendations.push('Break content into multiple paragraphs for better readability');
    }

    // Estimate reading time
    const readingTime = Math.ceil(wordCount / 200);

    return {
      wordCount,
      paragraphCount: paragraphs.length,
      readingTime: `${readingTime} min`,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze technical SEO factors
   */
  analyzeTechnicalSEO(pageData) {
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check canonical URL
    if (!pageData.canonical) {
      score -= 15;
      issues.push({ severity: 'warning', message: 'Missing canonical URL' });
      recommendations.push('Add a canonical tag to specify the preferred URL for this page');
    }

    // Check robots meta
    if (pageData.robotsMeta?.includes('noindex')) {
      score -= 30;
      issues.push({ severity: 'critical', message: 'Page is set to noindex' });
      recommendations.push('Remove noindex directive if you want this page to appear in search results');
    }

    // Check for viewport meta
    if (!pageData.viewport) {
      score -= 20;
      issues.push({ severity: 'warning', message: 'Missing viewport meta tag' });
      recommendations.push('Add a viewport meta tag for proper mobile rendering');
    }

    // Check for structured data
    if (!pageData.structuredData || pageData.structuredData.length === 0) {
      score -= 15;
      issues.push({ severity: 'info', message: 'No structured data (JSON-LD) found' });
      recommendations.push('Add JSON-LD structured data to help search engines understand your content');
    }

    // Check for Open Graph tags
    if (!pageData.openGraph || Object.keys(pageData.openGraph).length === 0) {
      score -= 10;
      issues.push({ severity: 'info', message: 'Missing Open Graph tags' });
      recommendations.push('Add Open Graph meta tags for better social media sharing');
    }

    return {
      hasCanonical: !!pageData.canonical,
      hasViewport: !!pageData.viewport,
      hasStructuredData: pageData.structuredData?.length > 0,
      hasOpenGraph: Object.keys(pageData.openGraph || {}).length > 0,
      robotsMeta: pageData.robotsMeta,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze mobile optimization
   */
  analyzeMobileOptimization(pageData) {
    const issues = [];
    const recommendations = [];
    let score = 100;

    if (!pageData.viewport) {
      score -= 40;
      issues.push({ severity: 'critical', message: 'Not mobile-optimized (missing viewport)' });
      recommendations.push('Add <meta name="viewport" content="width=device-width, initial-scale=1">');
    }

    // Check for touch-friendly elements
    if (pageData.smallClickTargets > 0) {
      score -= 15;
      issues.push({ severity: 'warning', message: 'Some tap targets may be too small' });
      recommendations.push('Ensure buttons and links are at least 48x48 pixels for touch devices');
    }

    return {
      hasViewport: !!pageData.viewport,
      viewportContent: pageData.viewport,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze page speed indicators
   */
  analyzePageSpeed(pageData) {
    const issues = [];
    const recommendations = [];
    let score = 100;

    const loadTime = pageData.loadTime || 0;

    if (loadTime > 3000) {
      score -= 40;
      issues.push({ severity: 'critical', message: `Slow page load time (${(loadTime / 1000).toFixed(2)}s)` });
      recommendations.push('Optimize images, minify CSS/JS, and consider using a CDN');
    } else if (loadTime > 2000) {
      score -= 20;
      issues.push({ severity: 'warning', message: `Page load time could be improved (${(loadTime / 1000).toFixed(2)}s)` });
      recommendations.push('Target page load time under 2 seconds for best user experience');
    }

    // Check resource counts
    const totalResources = (pageData.scripts?.length || 0) + (pageData.stylesheets?.length || 0);
    if (totalResources > 30) {
      score -= 15;
      issues.push({ severity: 'warning', message: `High number of resources (${totalResources})` });
      recommendations.push('Combine and minify CSS and JavaScript files to reduce HTTP requests');
    }

    return {
      loadTime: loadTime,
      loadTimeFormatted: `${(loadTime / 1000).toFixed(2)}s`,
      resourceCount: totalResources,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Calculate overall SEO score
   */
  calculateScore(checks) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, check] of Object.entries(checks)) {
      const weight = this.weights[key] || 10;
      totalScore += check.score * weight;
      totalWeight += weight;
    }

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Collect all issues from checks
   */
  collectIssues(checks) {
    const allIssues = [];

    for (const [category, check] of Object.entries(checks)) {
      for (const issue of check.issues || []) {
        allIssues.push({
          category,
          ...issue,
        });
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return allIssues;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(checks) {
    const allRecommendations = [];

    for (const [category, check] of Object.entries(checks)) {
      for (const rec of check.recommendations || []) {
        allRecommendations.push({
          category,
          recommendation: rec,
          priority: check.score < 50 ? 'high' : check.score < 70 ? 'medium' : 'low',
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return allRecommendations;
  }

  /**
   * Generate summary
   */
  generateSummary(score, issues) {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    let status;
    if (score >= 80) status = 'Good';
    else if (score >= 60) status = 'Needs Improvement';
    else status = 'Poor';

    return {
      status,
      criticalIssues: criticalCount,
      warnings: warningCount,
      message: this.getSummaryMessage(score, criticalCount, warningCount),
    };
  }

  getSummaryMessage(score, criticalCount, warningCount) {
    if (score >= 90) {
      return 'Excellent SEO! Your page is well-optimized for search engines.';
    } else if (score >= 80) {
      return 'Good SEO with minor improvements needed.';
    } else if (score >= 60) {
      return `Your page needs SEO improvements. Found ${criticalCount} critical issues and ${warningCount} warnings.`;
    } else {
      return `Significant SEO issues detected. Address ${criticalCount} critical problems to improve visibility.`;
    }
  }
}
