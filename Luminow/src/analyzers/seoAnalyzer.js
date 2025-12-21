/**
 * SEO Analyzer Module
 * Phase 3 of the GEO Algorithm
 *
 * Analyzes webpage content for Search Engine Optimization factors
 * Scoring: 0-100 based on 6 weighted categories
 *
 * Categories and Weights:
 * 1. Indexability & Technical SEO: 20 points
 * 2. Page Experience & Performance: 15 points
 * 3. On-page Relevance & Content Quality: 25 points
 * 4. Structured Data & Rich Result Readiness: 20 points
 * 5. Media & Accessibility: 10 points
 * 6. Commerce Trust Signals: 10 points
 */

export class SEOAnalyzer {
  constructor() {
    // Category weights (total = 100)
    this.categoryWeights = {
      indexability: 20,
      pageExperience: 15,
      onPageRelevance: 25,
      structuredData: 20,
      mediaAccessibility: 10,
      commerceTrust: 10,
    };
  }

  /**
   * Main analysis method
   * @param {Object} pageData - Scraped page data
   * @returns {Object} SEO analysis results with 0-100 score
   */
  analyze(pageData) {
    const categories = {
      indexability: this.analyzeIndexability(pageData),
      pageExperience: this.analyzePageExperience(pageData),
      onPageRelevance: this.analyzeOnPageRelevance(pageData),
      structuredData: this.analyzeStructuredData(pageData),
      mediaAccessibility: this.analyzeMediaAccessibility(pageData),
      commerceTrust: this.analyzeCommerceTrust(pageData),
    };

    const score = this.calculateScore(categories);
    const issues = this.collectIssues(categories);
    const recommendations = this.generateRecommendations(categories);

    return {
      score,
      categories,
      issues,
      recommendations,
      summary: this.generateSummary(score, issues),
      checks: this.transformToChecks(categories), // For backwards compatibility with frontend
    };
  }

  /**
   * Step 7: Indexability & Technical SEO (0-20 points)
   * Checks: 200 OK, canonical, noindex, robots.txt, hreflang, internal linking
   */
  analyzeIndexability(pageData) {
    const maxScore = 20;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};

    // Check 1: HTTP Status Code (5 points)
    checks.statusCode = {
      value: pageData.statusCode,
      passed: pageData.statusCode === 200,
      points: 0,
    };
    if (pageData.statusCode !== 200) {
      score -= 5;
      issues.push({
        severity: 'critical',
        message: `Non-200 status code: ${pageData.statusCode}`,
        impact: 5,
      });
      recommendations.push('Ensure the page returns a 200 OK status code');
    } else {
      checks.statusCode.points = 5;
    }

    // Check 2: No noindex directive (5 points - critical)
    checks.noindex = {
      value: pageData.noindex,
      passed: !pageData.noindex,
      points: 0,
    };
    if (pageData.noindex) {
      score -= 5;
      issues.push({
        severity: 'critical',
        message: 'Page has noindex directive - will not appear in search results',
        impact: 5,
      });
      recommendations.push('Remove noindex directive if you want this page indexed');
    } else {
      checks.noindex.points = 5;
    }

    // Check 3: Canonical URL (3 points)
    checks.canonical = {
      value: pageData.canonical || 'Not set',
      passed: !!pageData.canonical,
      points: 0,
    };
    if (!pageData.canonical) {
      score -= 3;
      issues.push({
        severity: 'warning',
        message: 'Missing canonical URL',
        impact: 3,
      });
      recommendations.push('Add a canonical tag to specify the preferred URL for this page');
    } else {
      // Check if canonical matches current URL (or is reasonable)
      checks.canonical.points = 3;
    }

    // Check 4: Redirect chain (2 points)
    checks.redirects = {
      value: pageData.redirectCount || 0,
      passed: (pageData.redirectCount || 0) <= 2,
      points: 0,
    };
    if (pageData.redirectCount > 2) {
      score -= 2;
      issues.push({
        severity: 'warning',
        message: `Long redirect chain: ${pageData.redirectCount} redirects`,
        impact: 2,
      });
      recommendations.push('Reduce redirect chains to a maximum of 1-2 redirects');
    } else {
      checks.redirects.points = 2;
    }

    // Check 5: Hreflang (2 points) - only check if multilingual signals exist
    const hasHreflang = pageData.hreflang && pageData.hreflang.length > 0;
    checks.hreflang = {
      value: hasHreflang ? `${pageData.hreflang.length} languages` : 'Not set',
      passed: true, // Only deduct if hreflang exists but is malformed
      points: hasHreflang ? 2 : 1, // Neutral if not multilingual
    };

    // Check 6: Breadcrumbs / Internal Linking (3 points)
    checks.internalLinking = {
      value: pageData.hasBreadcrumbs ? 'Has breadcrumbs' : 'No breadcrumbs',
      passed: pageData.hasBreadcrumbs || (pageData.linkStats?.totalInternal > 5),
      points: 0,
    };
    if (!pageData.hasBreadcrumbs && (pageData.linkStats?.totalInternal || 0) < 5) {
      score -= 2;
      issues.push({
        severity: 'info',
        message: 'Limited internal linking structure',
        impact: 2,
      });
      recommendations.push('Add breadcrumb navigation and more internal links');
    } else {
      checks.internalLinking.points = 3;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= maxScore * 0.7,
      checks,
      issues,
      recommendations,
    };
  }

  /**
   * Step 8: Page Experience & Performance (0-15 points)
   * Checks: Load time, resource counts, viewport, CLS/LCP proxies
   */
  analyzePageExperience(pageData) {
    const maxScore = 15;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};

    // Check 1: Page Load Time (5 points)
    const loadTime = pageData.loadTime || 0;
    checks.loadTime = {
      value: `${(loadTime / 1000).toFixed(2)}s`,
      passed: loadTime < 3000,
      points: 0,
    };
    if (loadTime > 5000) {
      score -= 5;
      issues.push({
        severity: 'critical',
        message: `Very slow page load time: ${(loadTime / 1000).toFixed(2)}s`,
        impact: 5,
      });
      recommendations.push('Optimize page load time to under 3 seconds');
    } else if (loadTime > 3000) {
      score -= 3;
      issues.push({
        severity: 'warning',
        message: `Slow page load time: ${(loadTime / 1000).toFixed(2)}s`,
        impact: 3,
      });
      recommendations.push('Target page load time under 3 seconds for better user experience');
      checks.loadTime.points = 2;
    } else {
      checks.loadTime.points = 5;
    }

    // Check 2: Viewport Meta Tag (3 points)
    checks.viewport = {
      value: pageData.viewport ? 'Present' : 'Missing',
      passed: !!pageData.viewport,
      points: 0,
    };
    if (!pageData.viewport) {
      score -= 3;
      issues.push({
        severity: 'warning',
        message: 'Missing viewport meta tag - not mobile optimized',
        impact: 3,
      });
      recommendations.push('Add <meta name="viewport" content="width=device-width, initial-scale=1">');
    } else {
      checks.viewport.points = 3;
    }

    // Check 3: Resource Count (3 points)
    const totalResources = (pageData.scriptCount || 0) + (pageData.stylesheetCount || 0);
    checks.resourceCount = {
      value: `${totalResources} resources`,
      passed: totalResources <= 30,
      points: 0,
    };
    if (totalResources > 50) {
      score -= 3;
      issues.push({
        severity: 'warning',
        message: `High resource count: ${totalResources} external resources`,
        impact: 3,
      });
      recommendations.push('Reduce HTTP requests by combining and minifying CSS/JS files');
    } else if (totalResources > 30) {
      score -= 1;
      checks.resourceCount.points = 2;
    } else {
      checks.resourceCount.points = 3;
    }

    // Check 4: HTML Size (2 points)
    const htmlSizeKB = (pageData.htmlSize || 0) / 1024;
    checks.htmlSize = {
      value: `${htmlSizeKB.toFixed(0)}KB`,
      passed: htmlSizeKB < 500,
      points: 0,
    };
    if (htmlSizeKB > 1000) {
      score -= 2;
      issues.push({
        severity: 'warning',
        message: `Large HTML size: ${htmlSizeKB.toFixed(0)}KB`,
        impact: 2,
      });
      recommendations.push('Reduce HTML size by removing unused code and inline styles');
    } else {
      checks.htmlSize.points = 2;
    }

    // Check 5: HTTPS (2 points)
    const isHttps = pageData.url?.startsWith('https://');
    checks.https = {
      value: isHttps ? 'Secure' : 'Not secure',
      passed: isHttps,
      points: 0,
    };
    if (!isHttps) {
      score -= 2;
      issues.push({
        severity: 'critical',
        message: 'Page not served over HTTPS',
        impact: 2,
      });
      recommendations.push('Migrate to HTTPS for security and SEO benefits');
    } else {
      checks.https.points = 2;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= maxScore * 0.7,
      checks,
      issues,
      recommendations,
    };
  }

  /**
   * Step 9: On-page Relevance & Content Quality (0-25 points)
   * Checks: Title, meta description, H1, heading hierarchy, content uniqueness
   */
  analyzeOnPageRelevance(pageData) {
    const maxScore = 25;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};

    // Check 1: Title Tag (5 points)
    const title = pageData.title || '';
    checks.title = {
      value: title ? `${title.length} chars` : 'Missing',
      passed: title.length >= 30 && title.length <= 60,
      points: 0,
    };
    if (!title) {
      score -= 5;
      issues.push({
        severity: 'critical',
        message: 'Missing page title',
        impact: 5,
      });
      recommendations.push('Add a descriptive title tag (50-60 characters)');
    } else if (title.length < 30) {
      score -= 3;
      issues.push({
        severity: 'warning',
        message: `Title too short: ${title.length} characters (optimal: 50-60)`,
        impact: 3,
      });
      recommendations.push('Expand title to 50-60 characters with relevant keywords');
      checks.title.points = 2;
    } else if (title.length > 60) {
      score -= 1;
      checks.title.points = 4;
    } else {
      checks.title.points = 5;
    }

    // Check 2: Meta Description (4 points)
    const description = pageData.metaDescription || '';
    checks.metaDescription = {
      value: description ? `${description.length} chars` : 'Missing',
      passed: description.length >= 120 && description.length <= 160,
      points: 0,
    };
    if (!description) {
      score -= 4;
      issues.push({
        severity: 'warning',
        message: 'Missing meta description',
        impact: 4,
      });
      recommendations.push('Add a compelling meta description (150-160 characters)');
    } else if (description.length < 120) {
      score -= 2;
      checks.metaDescription.points = 2;
    } else if (description.length > 160) {
      score -= 1;
      checks.metaDescription.points = 3;
    } else {
      checks.metaDescription.points = 4;
    }

    // Check 3: H1 Heading (5 points)
    const h1Count = pageData.headings?.h1?.length || 0;
    checks.h1 = {
      value: `${h1Count} H1 tag(s)`,
      passed: h1Count === 1,
      points: 0,
    };
    if (h1Count === 0) {
      score -= 5;
      issues.push({
        severity: 'critical',
        message: 'Missing H1 heading',
        impact: 5,
      });
      recommendations.push('Add a single H1 heading that describes the main topic');
    } else if (h1Count > 1) {
      score -= 2;
      issues.push({
        severity: 'warning',
        message: `Multiple H1 headings found: ${h1Count}`,
        impact: 2,
      });
      recommendations.push('Use only one H1 heading per page');
      checks.h1.points = 3;
    } else {
      checks.h1.points = 5;
    }

    // Check 4: Heading Hierarchy (3 points)
    const h2Count = pageData.headings?.h2?.length || 0;
    const h3Count = pageData.headings?.h3?.length || 0;
    checks.headingHierarchy = {
      value: `H2: ${h2Count}, H3: ${h3Count}`,
      passed: h2Count >= 2,
      points: 0,
    };
    if (h2Count === 0) {
      score -= 3;
      issues.push({
        severity: 'warning',
        message: 'No H2 subheadings found',
        impact: 3,
      });
      recommendations.push('Add H2 headings to structure your content into sections');
    } else if (h2Count < 2) {
      score -= 1;
      checks.headingHierarchy.points = 2;
    } else {
      checks.headingHierarchy.points = 3;
    }

    // Check 5: Content Length (5 points)
    const wordCount = pageData.wordCount || 0;
    checks.contentLength = {
      value: `${wordCount} words`,
      passed: wordCount >= 300,
      points: 0,
    };
    if (wordCount < 100) {
      score -= 5;
      issues.push({
        severity: 'critical',
        message: `Very thin content: ${wordCount} words`,
        impact: 5,
      });
      recommendations.push('Add more comprehensive content (minimum 300-500 words)');
    } else if (wordCount < 300) {
      score -= 3;
      issues.push({
        severity: 'warning',
        message: `Thin content: ${wordCount} words (recommended: 300+)`,
        impact: 3,
      });
      recommendations.push('Expand content to at least 300 words for better rankings');
      checks.contentLength.points = 2;
    } else {
      checks.contentLength.points = 5;
    }

    // Check 6: Paragraph Structure (3 points)
    const paragraphCount = pageData.paragraphs?.length || 0;
    checks.paragraphStructure = {
      value: `${paragraphCount} paragraphs`,
      passed: paragraphCount >= 3,
      points: 0,
    };
    if (paragraphCount < 2 && wordCount > 200) {
      score -= 2;
      issues.push({
        severity: 'info',
        message: 'Content lacks paragraph structure',
        impact: 2,
      });
      recommendations.push('Break content into multiple paragraphs for readability');
    } else {
      checks.paragraphStructure.points = 3;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= maxScore * 0.7,
      checks,
      issues,
      recommendations,
    };
  }

  /**
   * Step 10: Structured Data & Rich Result Readiness (0-20 points)
   * Checks: Product schema, offers, ratings, breadcrumbs, organization
   */
  analyzeStructuredData(pageData) {
    const maxScore = 20;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const isProductPage = pageData.pageType?.isProductPage;

    // Check 1: Has any structured data (5 points)
    const schemaCount = pageData.structuredData?.length || 0;
    checks.hasSchema = {
      value: schemaCount > 0 ? `${schemaCount} schema(s)` : 'None',
      passed: schemaCount > 0,
      points: 0,
    };
    if (schemaCount === 0) {
      score -= 5;
      issues.push({
        severity: 'warning',
        message: 'No JSON-LD structured data found',
        impact: 5,
      });
      recommendations.push('Add JSON-LD structured data (Product, Article, Organization, etc.)');
    } else {
      checks.hasSchema.points = 5;
    }

    // Check 2: Product Schema (for product pages) (5 points)
    if (isProductPage) {
      const productSchema = pageData.productSchema;
      checks.productSchema = {
        value: productSchema ? 'Present' : 'Missing',
        passed: !!productSchema,
        points: 0,
      };
      if (!productSchema) {
        score -= 5;
        issues.push({
          severity: 'critical',
          message: 'Product page missing Product schema',
          impact: 5,
        });
        recommendations.push('Add Product schema with name, image, description, and offers');
      } else {
        // Check required fields
        const hasOffers = productSchema.offers;
        const hasImage = productSchema.image;
        if (!hasOffers || !hasImage) {
          score -= 2;
          issues.push({
            severity: 'warning',
            message: 'Product schema missing offers or image',
            impact: 2,
          });
          checks.productSchema.points = 3;
        } else {
          checks.productSchema.points = 5;
        }
      }
    } else {
      // For non-product pages, check for appropriate schema
      checks.productSchema = {
        value: 'N/A (not product page)',
        passed: true,
        points: 5,
      };
    }

    // Check 3: Breadcrumb Schema (3 points)
    checks.breadcrumbSchema = {
      value: pageData.hasBreadcrumbSchema ? 'Present' : 'Missing',
      passed: pageData.hasBreadcrumbSchema,
      points: 0,
    };
    if (!pageData.hasBreadcrumbSchema) {
      score -= 3;
      issues.push({
        severity: 'info',
        message: 'Missing BreadcrumbList schema',
        impact: 3,
      });
      recommendations.push('Add BreadcrumbList schema for better search appearance');
    } else {
      checks.breadcrumbSchema.points = 3;
    }

    // Check 4: Organization Schema (3 points)
    checks.organizationSchema = {
      value: pageData.hasOrganizationSchema ? 'Present' : 'Missing',
      passed: pageData.hasOrganizationSchema,
      points: 0,
    };
    if (!pageData.hasOrganizationSchema) {
      score -= 2;
      issues.push({
        severity: 'info',
        message: 'Missing Organization schema',
        impact: 2,
      });
      recommendations.push('Add Organization schema with logo and contact information');
    } else {
      checks.organizationSchema.points = 3;
    }

    // Check 5: Open Graph Tags (2 points)
    checks.openGraph = {
      value: pageData.hasOpenGraph ? 'Present' : 'Missing',
      passed: pageData.hasOpenGraph,
      points: 0,
    };
    if (!pageData.hasOpenGraph) {
      score -= 2;
      issues.push({
        severity: 'info',
        message: 'Missing Open Graph meta tags',
        impact: 2,
      });
      recommendations.push('Add Open Graph tags for better social media sharing');
    } else {
      checks.openGraph.points = 2;
    }

    // Check 6: Twitter Card (2 points)
    checks.twitterCard = {
      value: pageData.hasTwitterCard ? 'Present' : 'Missing',
      passed: pageData.hasTwitterCard,
      points: 0,
    };
    if (!pageData.hasTwitterCard) {
      score -= 1;
    } else {
      checks.twitterCard.points = 2;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= maxScore * 0.7,
      checks,
      issues,
      recommendations,
    };
  }

  /**
   * Step 11: Media & Accessibility (0-10 points)
   * Checks: Image alt text, image dimensions, video transcripts
   */
  analyzeMediaAccessibility(pageData) {
    const maxScore = 10;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};

    const imageStats = pageData.imageStats || { total: 0, withAlt: 0, withoutAlt: 0, withDimensions: 0 };

    // Check 1: Image Alt Text (5 points)
    if (imageStats.total === 0) {
      checks.imageAlt = {
        value: 'No images',
        passed: true,
        points: 5,
      };
    } else {
      const altPercentage = Math.round((imageStats.withAlt / imageStats.total) * 100);
      checks.imageAlt = {
        value: `${altPercentage}% with alt text`,
        passed: altPercentage >= 90,
        points: 0,
      };
      if (imageStats.withoutAlt > 0) {
        const penalty = Math.min(5, Math.ceil((imageStats.withoutAlt / imageStats.total) * 5));
        score -= penalty;
        issues.push({
          severity: imageStats.withoutAlt > imageStats.total / 2 ? 'warning' : 'info',
          message: `${imageStats.withoutAlt} of ${imageStats.total} images missing alt text`,
          impact: penalty,
        });
        recommendations.push('Add descriptive alt text to all images');
        checks.imageAlt.points = 5 - penalty;
      } else {
        checks.imageAlt.points = 5;
      }
    }

    // Check 2: Image Dimensions (3 points)
    if (imageStats.total === 0) {
      checks.imageDimensions = {
        value: 'No images',
        passed: true,
        points: 3,
      };
    } else {
      const dimPercentage = Math.round((imageStats.withDimensions / imageStats.total) * 100);
      checks.imageDimensions = {
        value: `${dimPercentage}% with dimensions`,
        passed: dimPercentage >= 80,
        points: 0,
      };
      const missingDimensions = imageStats.total - imageStats.withDimensions;
      if (missingDimensions > imageStats.total * 0.5) {
        score -= 2;
        issues.push({
          severity: 'info',
          message: `${missingDimensions} images missing width/height attributes`,
          impact: 2,
        });
        recommendations.push('Add width and height attributes to prevent layout shifts');
        checks.imageDimensions.points = 1;
      } else {
        checks.imageDimensions.points = 3;
      }
    }

    // Check 3: Language attribute (2 points)
    checks.langAttribute = {
      value: pageData.language || 'Not set',
      passed: !!pageData.language,
      points: 0,
    };
    if (!pageData.language) {
      score -= 2;
      issues.push({
        severity: 'info',
        message: 'Missing lang attribute on HTML element',
        impact: 2,
      });
      recommendations.push('Add lang attribute to <html> element (e.g., lang="en")');
    } else {
      checks.langAttribute.points = 2;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= maxScore * 0.7,
      checks,
      issues,
      recommendations,
    };
  }

  /**
   * Step 12: Commerce Trust Signals (0-10 points)
   * Checks: Shipping info, returns policy, warranty, contact info, reviews
   */
  analyzeCommerceTrust(pageData) {
    const maxScore = 10;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const policies = pageData.policies || {};
    const isProductPage = pageData.pageType?.isProductPage;

    // For non-commerce pages, give neutral scores
    if (!isProductPage && pageData.pageType?.type !== 'category') {
      return {
        score: 8, // Neutral score for non-commerce pages
        maxScore,
        percentage: 80,
        passed: true,
        checks: {
          notApplicable: {
            value: 'Non-commerce page',
            passed: true,
            points: 8,
          },
        },
        issues: [],
        recommendations: [],
      };
    }

    // Check 1: Shipping Information (2 points)
    checks.shippingInfo = {
      value: policies.hasShippingInfo ? 'Present' : 'Missing',
      passed: policies.hasShippingInfo,
      points: 0,
    };
    if (!policies.hasShippingInfo) {
      score -= 2;
      issues.push({
        severity: 'warning',
        message: 'No shipping information found',
        impact: 2,
      });
      recommendations.push('Add clear shipping information and delivery estimates');
    } else {
      checks.shippingInfo.points = 2;
    }

    // Check 2: Returns Policy (2 points)
    checks.returnsPolicy = {
      value: policies.hasReturnsInfo ? 'Present' : 'Missing',
      passed: policies.hasReturnsInfo,
      points: 0,
    };
    if (!policies.hasReturnsInfo) {
      score -= 2;
      issues.push({
        severity: 'warning',
        message: 'No returns/refund policy information found',
        impact: 2,
      });
      recommendations.push('Add clear returns and refund policy information');
    } else {
      checks.returnsPolicy.points = 2;
    }

    // Check 3: Contact Information (2 points)
    checks.contactInfo = {
      value: policies.hasContactInfo ? 'Present' : 'Missing',
      passed: policies.hasContactInfo,
      points: 0,
    };
    if (!policies.hasContactInfo) {
      score -= 2;
      issues.push({
        severity: 'info',
        message: 'No clear contact information found',
        impact: 2,
      });
      recommendations.push('Add visible contact information (email, phone, support)');
    } else {
      checks.contactInfo.points = 2;
    }

    // Check 4: Product Ratings/Reviews (2 points)
    const productData = pageData.productData || {};
    const hasReviews = productData.rating || productData.reviewCount > 0;
    checks.reviews = {
      value: hasReviews ? `${productData.reviewCount || 0} reviews` : 'Not found',
      passed: hasReviews,
      points: 0,
    };
    if (!hasReviews && isProductPage) {
      score -= 2;
      issues.push({
        severity: 'info',
        message: 'No product reviews or ratings found',
        impact: 2,
      });
      recommendations.push('Display customer reviews and ratings for trust');
    } else {
      checks.reviews.points = 2;
    }

    // Check 5: Privacy/Terms Links (2 points)
    const hasLegalLinks = policies.hasPrivacyPolicy || policies.hasTermsOfService;
    checks.legalLinks = {
      value: hasLegalLinks ? 'Present' : 'Missing',
      passed: hasLegalLinks,
      points: 0,
    };
    if (!hasLegalLinks) {
      score -= 1;
      issues.push({
        severity: 'info',
        message: 'Missing privacy policy or terms of service links',
        impact: 1,
      });
    } else {
      checks.legalLinks.points = 2;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= maxScore * 0.7,
      checks,
      issues,
      recommendations,
    };
  }

  /**
   * Calculate overall SEO score (0-100)
   */
  calculateScore(categories) {
    let totalScore = 0;
    for (const [key, category] of Object.entries(categories)) {
      totalScore += category.score;
    }
    return Math.round(totalScore);
  }

  /**
   * Collect all issues from categories
   */
  collectIssues(categories) {
    const allIssues = [];

    for (const [categoryName, category] of Object.entries(categories)) {
      for (const issue of category.issues || []) {
        allIssues.push({
          category: categoryName,
          ...issue,
        });
      }
    }

    // Sort by severity then by impact
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
   * Generate prioritized recommendations
   */
  generateRecommendations(categories) {
    const allRecommendations = [];

    for (const [categoryName, category] of Object.entries(categories)) {
      const categoryWeight = this.categoryWeights[categoryName] || 10;
      const percentageLost = ((category.maxScore - category.score) / category.maxScore) * 100;

      for (const rec of category.recommendations || []) {
        const priority = percentageLost > 50 ? 'high' : percentageLost > 20 ? 'medium' : 'low';
        allRecommendations.push({
          category: categoryName,
          recommendation: rec,
          priority,
          potentialImpact: Math.round(percentageLost / 10),
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return allRecommendations;
  }

  /**
   * Transform categories to checks format for frontend compatibility
   */
  transformToChecks(categories) {
    const checks = {};
    for (const [categoryName, category] of Object.entries(categories)) {
      checks[categoryName] = {
        score: category.percentage,
        passed: category.passed,
        details: category.checks,
      };
    }
    return checks;
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
    else if (score >= 40) status = 'Poor';
    else status = 'Critical';

    return {
      status,
      score,
      criticalIssues: criticalCount,
      warnings: warningCount,
      message: this.getSummaryMessage(score, criticalCount, warningCount),
    };
  }

  getSummaryMessage(score, criticalCount, warningCount) {
    if (score >= 90) {
      return 'Excellent SEO! Your page is well-optimized for search engines.';
    } else if (score >= 80) {
      return 'Good SEO with minor improvements available.';
    } else if (score >= 60) {
      return `Your page needs SEO improvements. Found ${criticalCount} critical issues and ${warningCount} warnings.`;
    } else if (score >= 40) {
      return `Poor SEO detected. Address ${criticalCount} critical issues to improve visibility.`;
    } else {
      return `Critical SEO problems found. Immediate action required on ${criticalCount} issues.`;
    }
  }
}
