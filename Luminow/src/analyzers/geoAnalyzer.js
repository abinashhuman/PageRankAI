/**
 * GEO (Generative Engine Optimization) Analyzer Module
 * Phase 4 of the GEO Algorithm
 *
 * Measures: "How likely is this page to be retrieved, extracted, trusted,
 * and cited by generative engines for shopping/ecommerce questions?"
 *
 * Scoring: 0-800 based on 8 pillars (each 0-100)
 *
 * Pillars:
 * 1. AI Crawl Access & Snippet Controls (0-100)
 * 2. Product Metadata Readiness (0-100)
 * 3. Entity Disambiguation & Identifiers (0-100)
 * 4. Machine-Scannable Information Architecture (0-100)
 * 5. Shopping Intent Coverage (Answerability) (0-100)
 * 6. Evidence, Justification & Citability (0-100)
 * 7. Multimodal Readiness (0-100)
 * 8. Authority Signals (On-site + Off-site) (0-100)
 *
 * Score Bands:
 * 0-199: Poor
 * 200-399: Fair
 * 400-549: Good
 * 550-699: Very Good
 * 700-800: Excellent
 */

export class GEOAnalyzer {
  constructor() {
    this.pillarNames = {
      aiCrawlAccess: 'AI Crawl Access & Snippet Controls',
      productMetadata: 'Product Metadata Readiness',
      entityDisambiguation: 'Entity Disambiguation & Identifiers',
      informationArchitecture: 'Machine-Scannable Information Architecture',
      shoppingIntentCoverage: 'Shopping Intent Coverage (Answerability)',
      evidenceCitability: 'Evidence, Justification & Citability',
      multimodalReadiness: 'Multimodal Readiness',
      authoritySignals: 'Authority Signals',
    };
  }

  /**
   * Main analysis method
   * @param {Object} pageData - Scraped page data
   * @returns {Object} GEO analysis results with 0-800 score
   */
  analyze(pageData) {
    const pillars = {
      aiCrawlAccess: this.analyzeAICrawlAccess(pageData),
      productMetadata: this.analyzeProductMetadata(pageData),
      entityDisambiguation: this.analyzeEntityDisambiguation(pageData),
      informationArchitecture: this.analyzeInformationArchitecture(pageData),
      shoppingIntentCoverage: this.analyzeShoppingIntentCoverage(pageData),
      evidenceCitability: this.analyzeEvidenceCitability(pageData),
      multimodalReadiness: this.analyzeMultimodalReadiness(pageData),
      authoritySignals: this.analyzeAuthoritySignals(pageData),
    };

    const score = this.calculateScore(pillars);
    const issues = this.collectIssues(pillars);
    const recommendations = this.generateRecommendations(pillars);
    const band = this.getScoreBand(score);

    return {
      score,
      maxScore: 800,
      band,
      pillars,
      issues,
      recommendations,
      summary: this.generateSummary(score, band, issues),
      checks: this.transformToChecks(pillars), // For frontend compatibility
    };
  }

  /**
   * Pillar 1: AI Crawl Access & Snippet Controls (0-100)
   * Whether the page is eligible to appear in AI search results and be quoted
   */
  analyzeAICrawlAccess(pageData) {
    const maxScore = 100;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};

    // Check 1: HTTP 200 with indexable content (20 points)
    checks.httpStatus = {
      value: pageData.statusCode,
      passed: pageData.statusCode === 200,
      points: 0,
    };
    if (pageData.statusCode !== 200) {
      score -= 20;
      issues.push({
        severity: 'critical',
        message: `Non-200 status code: ${pageData.statusCode} - AI bots cannot access content`,
        impact: 20,
      });
      recommendations.push('Ensure page returns 200 OK status for AI crawler access');
    } else {
      checks.httpStatus.points = 20;
    }

    // Check 2: No noindex/blocking directives (20 points)
    checks.noindex = {
      value: pageData.noindex ? 'Blocked' : 'Allowed',
      passed: !pageData.noindex,
      points: 0,
    };
    if (pageData.noindex) {
      score -= 20;
      issues.push({
        severity: 'critical',
        message: 'Page has noindex directive - invisible to AI search engines',
        impact: 20,
      });
      recommendations.push('Remove noindex if you want AI engines to cite this page');
    } else {
      checks.noindex.points = 20;
    }

    // Check 3: OAI-SearchBot eligibility (25 points)
    // Note: We can't check robots.txt from client side, so we check for blocking signals
    const hasBlockingMeta = this.checkAIBlockingSignals(pageData);
    checks.oaiSearchBot = {
      value: hasBlockingMeta ? 'Potentially blocked' : 'Likely allowed',
      passed: !hasBlockingMeta,
      points: 0,
    };
    if (hasBlockingMeta) {
      score -= 25;
      issues.push({
        severity: 'critical',
        message: 'Possible AI bot blocking detected - ChatGPT Search may not access this page',
        impact: 25,
      });
      recommendations.push('Review robots.txt to ensure OAI-SearchBot is not blocked');
    } else {
      checks.oaiSearchBot.points = 25;
    }

    // Check 4: PerplexityBot eligibility (20 points)
    checks.perplexityBot = {
      value: hasBlockingMeta ? 'Potentially blocked' : 'Likely allowed',
      passed: !hasBlockingMeta,
      points: 0,
    };
    if (hasBlockingMeta) {
      score -= 20;
      issues.push({
        severity: 'warning',
        message: 'Possible AI bot blocking - PerplexityBot may not access this page',
        impact: 20,
      });
    } else {
      checks.perplexityBot.points = 20;
    }

    // Check 5: No overly restrictive snippet controls (15 points)
    const hasRestrictiveSnippet = pageData.nosnippet || pageData.maxSnippet === '0';
    checks.snippetControls = {
      value: hasRestrictiveSnippet ? 'Restricted' : 'Allowed',
      passed: !hasRestrictiveSnippet,
      points: 0,
    };
    if (hasRestrictiveSnippet) {
      score -= 15;
      issues.push({
        severity: 'warning',
        message: 'Restrictive snippet controls (nosnippet/max-snippet:0) prevent AI citation',
        impact: 15,
      });
      recommendations.push('Remove nosnippet or increase max-snippet value for AI citability');
    } else {
      checks.snippetControls.points = 15;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarNames.aiCrawlAccess,
    };
  }

  /**
   * Check for AI-specific blocking signals
   */
  checkAIBlockingSignals(pageData) {
    const robotsMeta = (pageData.robotsMeta || '').toLowerCase();
    // Check for specific AI bot blocking patterns
    return robotsMeta.includes('noai') ||
           robotsMeta.includes('noimageai') ||
           robotsMeta.includes('notranslate');
  }

  /**
   * Pillar 2: Product Metadata Readiness (0-100)
   * How easily shopping engines can ingest correct product facts
   */
  analyzeProductMetadata(pageData) {
    const maxScore = 100;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const isProductPage = pageData.pageType?.isProductPage;

    // For non-product pages, give a neutral baseline score
    if (!isProductPage) {
      return {
        score: 60,
        maxScore,
        percentage: 60,
        passed: true,
        checks: {
          notApplicable: {
            value: 'Non-product page',
            passed: true,
            points: 60,
          },
        },
        issues: [],
        recommendations: [],
        pillarName: this.pillarNames.productMetadata,
      };
    }

    const productSchema = pageData.productSchema;
    const productData = pageData.productData || {};

    // Check 1: Product Schema Completeness (30 points)
    checks.productSchema = {
      value: productSchema ? 'Present' : 'Missing',
      passed: !!productSchema,
      points: 0,
    };
    if (!productSchema) {
      score -= 30;
      issues.push({
        severity: 'critical',
        message: 'Missing Product schema - AI shopping engines cannot read product data',
        impact: 30,
      });
      recommendations.push('Add Product schema with name, image, description, and offers');
    } else {
      // Check required fields
      let schemaPoints = 30;
      if (!productSchema.name) schemaPoints -= 5;
      if (!productSchema.image) schemaPoints -= 5;
      if (!productSchema.description) schemaPoints -= 5;
      checks.productSchema.points = schemaPoints;
      score -= (30 - schemaPoints);
    }

    // Check 2: Offer Fields (25 points)
    const hasOffers = productSchema?.offers || productData.price;
    checks.offerFields = {
      value: hasOffers ? 'Present' : 'Missing',
      passed: !!hasOffers,
      points: 0,
    };
    if (!hasOffers) {
      score -= 25;
      issues.push({
        severity: 'critical',
        message: 'Missing price/offer information in schema',
        impact: 25,
      });
      recommendations.push('Add Offer schema with price, priceCurrency, and availability');
    } else {
      const offer = productSchema?.offers;
      let offerPoints = 25;
      if (offer) {
        if (!offer.price) offerPoints -= 8;
        if (!offer.priceCurrency) offerPoints -= 5;
        if (!offer.availability) offerPoints -= 7;
      }
      checks.offerFields.points = offerPoints;
      score -= (25 - offerPoints);
    }

    // Check 3: Schema-Visible Content Consistency (15 points)
    checks.schemaConsistency = {
      value: 'Checking...',
      passed: true,
      points: 15,
    };
    // Check if schema price matches visible price (simplified check)
    if (productSchema?.offers?.price && productData.price) {
      const schemaPrice = String(productSchema.offers.price);
      const visiblePrice = String(productData.price).replace(/[^0-9.]/g, '');
      if (!visiblePrice.includes(schemaPrice) && !schemaPrice.includes(visiblePrice)) {
        score -= 10;
        checks.schemaConsistency.passed = false;
        checks.schemaConsistency.points = 5;
        issues.push({
          severity: 'warning',
          message: 'Schema price may not match visible price - AI may distrust data',
          impact: 10,
        });
        recommendations.push('Ensure structured data matches visible page content');
      }
    }

    // Check 4: Open Graph/Twitter Cards (15 points)
    checks.socialMeta = {
      value: pageData.hasOpenGraph ? 'Present' : 'Missing',
      passed: pageData.hasOpenGraph,
      points: 0,
    };
    if (!pageData.hasOpenGraph) {
      score -= 10;
      issues.push({
        severity: 'info',
        message: 'Missing Open Graph tags - reduces shareability and scraper compatibility',
        impact: 10,
      });
      recommendations.push('Add Open Graph and Twitter Card meta tags');
    } else {
      checks.socialMeta.points = 15;
    }

    // Check 5: Variant Handling (15 points)
    const hasVariants = productData.hasVariants;
    checks.variantHandling = {
      value: hasVariants ? 'Has variants' : 'No variants detected',
      passed: true, // Variants aren't required
      points: hasVariants ? 15 : 10,
    };
    if (!hasVariants && isProductPage) {
      // Only informational - some products don't have variants
      checks.variantHandling.points = 10;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarNames.productMetadata,
    };
  }

  /**
   * Pillar 3: Entity Disambiguation & Identifiers (0-100)
   * How confidently a generative engine can identify "which exact product is this?"
   */
  analyzeEntityDisambiguation(pageData) {
    const maxScore = 100;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const isProductPage = pageData.pageType?.isProductPage;
    const productData = pageData.productData || {};
    const productSchema = pageData.productSchema;

    // For non-product pages, check for entity clarity in general
    if (!isProductPage) {
      // Check for clear topic identification
      const h1 = pageData.headings?.h1?.[0] || '';
      const title = pageData.title || '';
      checks.topicClarity = {
        value: h1 ? 'Clear topic' : 'Unclear topic',
        passed: !!h1 && !!title,
        points: h1 && title ? 70 : 40,
      };
      return {
        score: h1 && title ? 70 : 40,
        maxScore,
        percentage: h1 && title ? 70 : 40,
        passed: !!(h1 && title),
        checks,
        issues: h1 ? [] : [{ severity: 'warning', message: 'Page topic unclear - missing H1', impact: 30 }],
        recommendations: h1 ? [] : ['Add clear H1 heading to identify page topic'],
        pillarName: this.pillarNames.entityDisambiguation,
      };
    }

    // Check 1: Brand + Product Name + Model (25 points)
    const hasFullName = productData.name && (productData.brand || productSchema?.brand);
    checks.productIdentity = {
      value: hasFullName ? 'Complete' : 'Incomplete',
      passed: !!hasFullName,
      points: 0,
    };
    if (!productData.name) {
      score -= 20;
      issues.push({
        severity: 'critical',
        message: 'Product name not clearly identified',
        impact: 20,
      });
      recommendations.push('Ensure product name is clearly visible and in structured data');
    }
    if (!productData.brand && !productSchema?.brand) {
      score -= 5;
      issues.push({
        severity: 'warning',
        message: 'Brand not specified in schema or visible content',
        impact: 5,
      });
      recommendations.push('Add brand information to Product schema');
    }
    checks.productIdentity.points = 25 - (hasFullName ? 0 : 25);

    // Check 2: SKU + MPN + GTIN/UPC/EAN (25 points)
    const hasSKU = productData.sku || productSchema?.sku;
    const hasMPN = productData.mpn || productSchema?.mpn;
    const hasGTIN = productData.gtin || productSchema?.gtin || productSchema?.gtin13 || productSchema?.gtin12;
    checks.productIdentifiers = {
      value: `SKU: ${hasSKU ? 'Yes' : 'No'}, MPN: ${hasMPN ? 'Yes' : 'No'}, GTIN: ${hasGTIN ? 'Yes' : 'No'}`,
      passed: hasSKU || hasGTIN,
      points: 0,
    };
    let identifierPoints = 25;
    if (!hasSKU && !hasGTIN) {
      identifierPoints -= 15;
      issues.push({
        severity: 'warning',
        message: 'Missing product identifiers (SKU/GTIN) - AI cannot uniquely identify product',
        impact: 15,
      });
      recommendations.push('Add SKU and/or GTIN (UPC/EAN) to Product schema');
    }
    if (!hasMPN) {
      identifierPoints -= 5;
    }
    checks.productIdentifiers.points = identifierPoints;
    score -= (25 - identifierPoints);

    // Check 3: Same identifiers in schema (20 points)
    const schemaHasIdentifiers = productSchema && (productSchema.sku || productSchema.gtin || productSchema.mpn);
    checks.schemaIdentifiers = {
      value: schemaHasIdentifiers ? 'In schema' : 'Not in schema',
      passed: !!schemaHasIdentifiers,
      points: 0,
    };
    if (!schemaHasIdentifiers) {
      score -= 20;
      issues.push({
        severity: 'warning',
        message: 'Product identifiers not in structured data schema',
        impact: 20,
      });
      recommendations.push('Include sku, mpn, and gtin in your Product JSON-LD');
    } else {
      checks.schemaIdentifiers.points = 20;
    }

    // Check 4: Category Taxonomy (15 points)
    const hasBreadcrumbs = pageData.hasBreadcrumbs || pageData.hasBreadcrumbSchema;
    checks.categoryTaxonomy = {
      value: hasBreadcrumbs ? 'Present' : 'Missing',
      passed: !!hasBreadcrumbs,
      points: 0,
    };
    if (!hasBreadcrumbs) {
      score -= 15;
      issues.push({
        severity: 'info',
        message: 'No category/breadcrumb navigation - product context unclear',
        impact: 15,
      });
      recommendations.push('Add breadcrumb navigation showing category hierarchy');
    } else {
      checks.categoryTaxonomy.points = 15;
    }

    // Check 5: Variant Identifiers (15 points)
    if (productData.hasVariants) {
      checks.variantIdentifiers = {
        value: 'Has variants',
        passed: true,
        points: 15,
      };
    } else {
      checks.variantIdentifiers = {
        value: 'N/A',
        passed: true,
        points: 12, // Neutral for products without variants
      };
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarNames.entityDisambiguation,
    };
  }

  /**
   * Pillar 4: Machine-Scannable Information Architecture (0-100)
   * How "extractable" and "chunkable" the page is for RAG/AI search
   */
  analyzeInformationArchitecture(pageData) {
    const maxScore = 100;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};

    // Check 1: Clear Heading Hierarchy (25 points)
    const h1Count = pageData.headings?.h1?.length || 0;
    const h2Count = pageData.headings?.h2?.length || 0;
    const h3Count = pageData.headings?.h3?.length || 0;
    checks.headingHierarchy = {
      value: `H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}`,
      passed: h1Count === 1 && h2Count >= 2,
      points: 0,
    };
    let headingPoints = 25;
    if (h1Count !== 1) {
      headingPoints -= 10;
      issues.push({
        severity: h1Count === 0 ? 'critical' : 'warning',
        message: h1Count === 0 ? 'Missing H1 heading' : `Multiple H1 headings (${h1Count})`,
        impact: 10,
      });
    }
    if (h2Count < 2) {
      headingPoints -= 10;
      issues.push({
        severity: 'warning',
        message: 'Insufficient H2 section headings for AI chunking',
        impact: 10,
      });
      recommendations.push('Add H2 headings like "Specs", "Compatibility", "Shipping", "Returns"');
    }
    checks.headingHierarchy.points = Math.max(0, headingPoints);
    score -= (25 - Math.max(0, headingPoints));

    // Check 2: Bullet Lists for Key Specs (20 points)
    const listCount = pageData.lists?.length || 0;
    const totalListItems = pageData.lists?.reduce((sum, list) => sum + list.items.length, 0) || 0;
    checks.bulletLists = {
      value: `${listCount} lists, ${totalListItems} items`,
      passed: listCount >= 2,
      points: 0,
    };
    if (listCount === 0) {
      score -= 20;
      issues.push({
        severity: 'warning',
        message: 'No bullet/numbered lists - key specs not scannable',
        impact: 20,
      });
      recommendations.push('Use bullet lists for key specs and "what\'s included"');
    } else if (listCount < 2) {
      score -= 10;
      checks.bulletLists.points = 10;
    } else {
      checks.bulletLists.points = 20;
    }

    // Check 3: Short Paragraphs (15 points)
    const paragraphs = pageData.paragraphs || [];
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 100).length;
    checks.paragraphLength = {
      value: longParagraphs > 0 ? `${longParagraphs} long paragraphs` : 'Good',
      passed: longParagraphs === 0,
      points: 0,
    };
    if (longParagraphs > paragraphs.length * 0.3) {
      score -= 15;
      issues.push({
        severity: 'info',
        message: 'Many long paragraphs - harder for AI to extract key points',
        impact: 15,
      });
      recommendations.push('Keep paragraphs short (2-3 sentences) for better AI extraction');
    } else {
      checks.paragraphLength.points = 15;
    }

    // Check 4: Tables for Specifications (15 points)
    const tableCount = pageData.tables?.length || 0;
    checks.specTables = {
      value: tableCount > 0 ? `${tableCount} table(s)` : 'None',
      passed: tableCount > 0 || listCount >= 2,
      points: 0,
    };
    if (tableCount === 0 && listCount < 2) {
      score -= 10;
      issues.push({
        severity: 'info',
        message: 'No specification tables - add tables or lists for structured specs',
        impact: 10,
      });
      recommendations.push('Add a specs table AND a "Key Specs" bullet list for AI compatibility');
    } else {
      checks.specTables.points = 15;
    }

    // Check 5: Semantic HTML Elements (15 points)
    const hasSemanticElements = pageData.hasMainElement ||
      pageData.articles?.length > 0 ||
      pageData.sections?.length > 0;
    checks.semanticHTML = {
      value: hasSemanticElements ? 'Present' : 'Missing',
      passed: hasSemanticElements,
      points: 0,
    };
    if (!hasSemanticElements) {
      score -= 15;
      issues.push({
        severity: 'info',
        message: 'No semantic HTML elements (main, article, section)',
        impact: 15,
      });
      recommendations.push('Use semantic HTML elements for better content structure');
    } else {
      checks.semanticHTML.points = 15;
    }

    // Check 6: Content Not Hidden (10 points)
    // Can't fully check this without JS execution analysis, give benefit of doubt
    checks.contentVisible = {
      value: 'Assumed visible',
      passed: true,
      points: 10,
    };

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarNames.informationArchitecture,
    };
  }

  /**
   * Pillar 5: Shopping Intent Coverage (Answerability) (0-100)
   * Can the page answer common question patterns that trigger AI shopping behavior?
   */
  analyzeShoppingIntentCoverage(pageData) {
    const maxScore = 100;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const text = (pageData.textContent || '').toLowerCase();
    const isProductPage = pageData.pageType?.isProductPage;

    // For non-product pages, adjust scoring
    if (!isProductPage) {
      const hasContent = pageData.wordCount > 300;
      return {
        score: hasContent ? 60 : 40,
        maxScore,
        percentage: hasContent ? 60 : 40,
        passed: hasContent,
        checks: {
          generalContent: {
            value: hasContent ? 'Sufficient content' : 'Thin content',
            passed: hasContent,
            points: hasContent ? 60 : 40,
          },
        },
        issues: hasContent ? [] : [{ severity: 'warning', message: 'Thin content for AI extraction', impact: 20 }],
        recommendations: hasContent ? [] : ['Add more comprehensive content'],
        pillarName: this.pillarNames.shoppingIntentCoverage,
      };
    }

    // Check 1: "Who it's for" / Use Cases (15 points)
    const hasUseCases = /(?:perfect for|ideal for|designed for|great for|suitable for|best for|who.*for|use case)/i.test(text);
    checks.useCases = {
      value: hasUseCases ? 'Present' : 'Missing',
      passed: hasUseCases,
      points: 0,
    };
    if (!hasUseCases) {
      score -= 15;
      issues.push({
        severity: 'warning',
        message: 'No "who it\'s for" or use case content',
        impact: 15,
      });
      recommendations.push('Add content describing who the product is for and use cases');
    } else {
      checks.useCases.points = 15;
    }

    // Check 2: Compatibility Information (15 points)
    const hasCompatibility = /(?:compatible with|works with|fits|requires|supports|compatible|connectivity)/i.test(text);
    checks.compatibility = {
      value: hasCompatibility ? 'Present' : 'Missing',
      passed: hasCompatibility,
      points: 0,
    };
    if (!hasCompatibility) {
      score -= 10;
      issues.push({
        severity: 'info',
        message: 'No compatibility information found',
        impact: 10,
      });
      recommendations.push('Add compatibility details (devices, standards, sizes)');
    } else {
      checks.compatibility.points = 15;
    }

    // Check 3: Constraints/Exclusions (10 points)
    const hasConstraints = /(?:does not|doesn't|not compatible|not suitable|not included|excluding|except)/i.test(text);
    checks.constraints = {
      value: hasConstraints ? 'Present' : 'Missing',
      passed: true, // Not all products need this
      points: hasConstraints ? 10 : 5,
    };

    // Check 4: What's Included (15 points)
    const hasWhatsIncluded = /(?:what's included|includes|in the box|package contents|comes with|you get)/i.test(text);
    checks.whatsIncluded = {
      value: hasWhatsIncluded ? 'Present' : 'Missing',
      passed: hasWhatsIncluded,
      points: 0,
    };
    if (!hasWhatsIncluded) {
      score -= 15;
      issues.push({
        severity: 'warning',
        message: 'No "what\'s included" or package contents information',
        impact: 15,
      });
      recommendations.push('List what\'s included in the box/package');
    } else {
      checks.whatsIncluded.points = 15;
    }

    // Check 5: Care/Materials/Safety (10 points)
    const hasCareInfo = /(?:material|fabric|care instruction|wash|clean|safety|warning|caution)/i.test(text);
    checks.careInfo = {
      value: hasCareInfo ? 'Present' : 'Missing',
      passed: true,
      points: hasCareInfo ? 10 : 5,
    };

    // Check 6: Warranty/Returns/Shipping (15 points)
    const policies = pageData.policies || {};
    const hasPolicies = policies.hasShippingInfo || policies.hasReturnsInfo || policies.hasWarrantyInfo;
    checks.policies = {
      value: hasPolicies ? 'Present' : 'Missing',
      passed: hasPolicies,
      points: 0,
    };
    if (!hasPolicies) {
      score -= 15;
      issues.push({
        severity: 'warning',
        message: 'Missing warranty, returns, or shipping information',
        impact: 15,
      });
      recommendations.push('Add clear warranty, returns, and shipping policy information');
    } else {
      checks.policies.points = 15;
    }

    // Check 7: FAQ Content (20 points)
    const hasFAQ = pageData.hasFAQSchema ||
      /(?:faq|frequently asked|common questions)/i.test(text) ||
      (pageData.faqContent?.length > 0);
    checks.faqContent = {
      value: hasFAQ ? 'Present' : 'Missing',
      passed: hasFAQ,
      points: 0,
    };
    if (!hasFAQ) {
      score -= 20;
      issues.push({
        severity: 'warning',
        message: 'No FAQ content - missing common questions users ask',
        impact: 20,
      });
      recommendations.push('Add FAQ section with 5-8 common product questions');
    } else {
      checks.faqContent.points = 20;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarNames.shoppingIntentCoverage,
    };
  }

  /**
   * Pillar 6: Evidence, Justification & Citability (0-100)
   * How strongly the content behaves like a source that should be cited
   * Based on KDD'24 GEO research: quotations, statistics, citations perform best
   */
  analyzeEvidenceCitability(pageData) {
    const maxScore = 100;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const text = pageData.textContent || '';
    const wordCount = pageData.wordCount || 0;

    // Check 1: Quantified Claims / Statistics (25 points)
    const statsPatterns = [
      /\d+%/g,                                        // Percentages
      /\d+(?:\.\d+)?\s*(?:mm|cm|m|kg|lb|oz|inch|ft|hours?|minutes?|days?)/gi, // Measurements
      /\d+\s*(?:million|billion|thousand|k|K)/gi,    // Large numbers
      /\d{1,3}(?:,\d{3})+/g,                         // Formatted numbers
      /rated\s*\d/gi,                                 // Ratings
      /\d+\s*(?:times|x)\s*(?:faster|better|stronger)/gi, // Comparisons
    ];
    let statsCount = 0;
    for (const pattern of statsPatterns) {
      const matches = text.match(pattern);
      if (matches) statsCount += matches.length;
    }
    const statsPer200Words = wordCount > 0 ? (statsCount / wordCount) * 200 : 0;
    checks.statistics = {
      value: `${statsCount} stats (${statsPer200Words.toFixed(1)} per 200 words)`,
      passed: statsPer200Words >= 1,
      points: 0,
    };
    if (statsPer200Words < 0.5) {
      score -= 25;
      issues.push({
        severity: 'critical',
        message: 'Very low statistics density - content lacks quantified claims',
        impact: 25,
      });
      recommendations.push('Add specific numbers, measurements, and percentages every 150-200 words');
    } else if (statsPer200Words < 1) {
      score -= 12;
      checks.statistics.points = 13;
    } else {
      checks.statistics.points = 25;
    }

    // Check 2: Attributed Quotes / Source Citations (25 points)
    const sourcePatterns = [
      /according to/gi,
      /research shows/gi,
      /studies? (?:show|found|indicate)/gi,
      /experts? say/gi,
      /certified by/gi,
      /tested by/gi,
      /approved by/gi,
      /recommended by/gi,
      /"[^"]{20,}"/g, // Actual quotes
    ];
    let sourceCount = 0;
    for (const pattern of sourcePatterns) {
      const matches = text.match(pattern);
      if (matches) sourceCount += matches.length;
    }
    checks.sourceCitations = {
      value: sourceCount > 0 ? `${sourceCount} citation(s)` : 'None',
      passed: sourceCount > 0,
      points: 0,
    };
    if (sourceCount === 0) {
      score -= 25;
      issues.push({
        severity: 'warning',
        message: 'No source citations or attributed claims - reduces citability',
        impact: 25,
      });
      recommendations.push('Add citations: "According to...", "Research shows...", certified/tested by claims');
    } else if (sourceCount < 2) {
      score -= 10;
      checks.sourceCitations.points = 15;
    } else {
      checks.sourceCitations.points = 25;
    }

    // Check 3: Clear Definitions / Explanations (20 points)
    const definitionPatterns = [
      /is a\s+\w+/gi,
      /refers to/gi,
      /defined as/gi,
      /meaning/gi,
      /which means/gi,
    ];
    let definitionCount = 0;
    for (const pattern of definitionPatterns) {
      const matches = text.match(pattern);
      if (matches) definitionCount += matches.length;
    }
    checks.definitions = {
      value: definitionCount > 0 ? `${definitionCount} definition(s)` : 'None',
      passed: definitionCount > 0,
      points: 0,
    };
    if (definitionCount === 0) {
      score -= 15;
      issues.push({
        severity: 'info',
        message: 'No clear definitions - add explanatory content',
        impact: 15,
      });
      recommendations.push('Include clear definitions (e.g., "X is a...", "X refers to...")');
    } else {
      checks.definitions.points = 20;
    }

    // Check 4: Authoritative Writing Cues (15 points)
    const authorityPatterns = [
      /iso\s*\d+/gi,
      /certified/gi,
      /patent/gi,
      /award/gi,
      /rated/gi,
      /tested/gi,
      /verified/gi,
      /authentic/gi,
      /official/gi,
      /genuine/gi,
    ];
    let authorityCount = 0;
    for (const pattern of authorityPatterns) {
      const matches = text.match(pattern);
      if (matches) authorityCount += matches.length;
    }
    checks.authorityCues = {
      value: authorityCount > 0 ? `${authorityCount} cue(s)` : 'None',
      passed: authorityCount > 0,
      points: authorityCount > 0 ? 15 : 5,
    };
    if (authorityCount === 0) {
      score -= 10;
    }

    // Check 5: Outbound References (15 points)
    const externalLinks = pageData.linkStats?.totalExternal || 0;
    checks.outboundRefs = {
      value: `${externalLinks} external links`,
      passed: true,
      points: externalLinks > 0 ? 15 : 10,
    };
    if (externalLinks === 0) {
      issues.push({
        severity: 'info',
        message: 'No outbound links to authoritative sources',
        impact: 5,
      });
      recommendations.push('Link to authoritative references (standards, certifications, datasheets)');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarNames.evidenceCitability,
    };
  }

  /**
   * Pillar 7: Multimodal Readiness (0-100)
   * If AI can "understand" the product through images/video context
   */
  analyzeMultimodalReadiness(pageData) {
    const maxScore = 100;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const imageStats = pageData.imageStats || { total: 0, withAlt: 0, withoutAlt: 0 };

    // Check 1: Multiple High-Quality Images (30 points)
    checks.imageCount = {
      value: `${imageStats.total} images`,
      passed: imageStats.total >= 3,
      points: 0,
    };
    if (imageStats.total === 0) {
      score -= 30;
      issues.push({
        severity: 'critical',
        message: 'No images found - AI cannot understand product visually',
        impact: 30,
      });
      recommendations.push('Add multiple high-quality product images');
    } else if (imageStats.total < 3) {
      score -= 15;
      issues.push({
        severity: 'warning',
        message: `Only ${imageStats.total} image(s) - add more for better AI understanding`,
        impact: 15,
      });
      recommendations.push('Add more product images (angles, packaging, size reference)');
      checks.imageCount.points = 15;
    } else {
      checks.imageCount.points = 30;
    }

    // Check 2: Descriptive Alt Text (30 points)
    if (imageStats.total > 0) {
      const altPercentage = Math.round((imageStats.withAlt / imageStats.total) * 100);
      checks.imageAlt = {
        value: `${altPercentage}% with alt text`,
        passed: altPercentage >= 90,
        points: 0,
      };
      if (imageStats.withoutAlt > 0) {
        const penalty = Math.min(30, Math.ceil((imageStats.withoutAlt / imageStats.total) * 30));
        score -= penalty;
        if (imageStats.withoutAlt > imageStats.total / 2) {
          issues.push({
            severity: 'critical',
            message: `${imageStats.withoutAlt} images missing alt text - AI cannot understand images`,
            impact: penalty,
          });
        } else {
          issues.push({
            severity: 'warning',
            message: `${imageStats.withoutAlt} images missing descriptive alt text`,
            impact: penalty,
          });
        }
        recommendations.push('Add descriptive, variant-specific alt text to all images');
        checks.imageAlt.points = 30 - penalty;
      } else {
        checks.imageAlt.points = 30;
      }
    } else {
      checks.imageAlt = {
        value: 'No images',
        passed: false,
        points: 0,
      };
    }

    // Check 3: Images Referenced in Text (20 points)
    const text = (pageData.textContent || '').toLowerCase();
    const hasImageRefs = /(?:see (?:the )?(?:image|photo|picture)|as shown|pictured|illustrated)/i.test(text);
    checks.imageReferences = {
      value: hasImageRefs ? 'Referenced' : 'Not referenced',
      passed: hasImageRefs || imageStats.total === 0,
      points: 0,
    };
    if (!hasImageRefs && imageStats.total > 0) {
      score -= 10;
      issues.push({
        severity: 'info',
        message: 'Images not referenced in text content',
        impact: 10,
      });
      recommendations.push('Reference images in text (e.g., "see sizing chart image")');
    } else {
      checks.imageReferences.points = 20;
    }

    // Check 4: Video Content (10 points) - bonus
    // We can't easily detect video, so give neutral score
    checks.videoContent = {
      value: 'Not detected',
      passed: true,
      points: 5, // Neutral
    };

    // Check 5: Image Schema (10 points)
    const productSchema = pageData.productSchema;
    const hasImageInSchema = productSchema?.image;
    checks.imageSchema = {
      value: hasImageInSchema ? 'In schema' : 'Not in schema',
      passed: !!hasImageInSchema || !pageData.pageType?.isProductPage,
      points: 0,
    };
    if (!hasImageInSchema && pageData.pageType?.isProductPage) {
      score -= 10;
      issues.push({
        severity: 'warning',
        message: 'Product image not included in structured data',
        impact: 10,
      });
      recommendations.push('Add image URL to Product schema');
    } else {
      checks.imageSchema.points = 10;
    }

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarNames.multimodalReadiness,
    };
  }

  /**
   * Pillar 8: Authority Signals (On-site + Off-site) (0-100)
   * Likelihood an engine considers the page/domain "safe to cite"
   */
  analyzeAuthoritySignals(pageData) {
    const maxScore = 100;
    let score = maxScore;
    const issues = [];
    const recommendations = [];
    const checks = {};
    const text = (pageData.textContent || '').toLowerCase();
    const policies = pageData.policies || {};

    // Check 1: Clear Seller Identity / Organization (25 points)
    const hasOrganization = pageData.hasOrganizationSchema;
    checks.sellerIdentity = {
      value: hasOrganization ? 'Organization schema present' : 'Not identified',
      passed: hasOrganization,
      points: 0,
    };
    if (!hasOrganization) {
      score -= 20;
      issues.push({
        severity: 'warning',
        message: 'No Organization schema - seller identity unclear to AI',
        impact: 20,
      });
      recommendations.push('Add Organization schema with name, logo, and contact info');
    } else {
      checks.sellerIdentity.points = 25;
    }

    // Check 2: Transparent Policies (20 points)
    const policyCount = [
      policies.hasShippingInfo,
      policies.hasReturnsInfo,
      policies.hasWarrantyInfo,
      policies.hasPrivacyPolicy,
      policies.hasTermsOfService,
    ].filter(Boolean).length;
    checks.transparentPolicies = {
      value: `${policyCount}/5 policies found`,
      passed: policyCount >= 3,
      points: 0,
    };
    if (policyCount < 2) {
      score -= 20;
      issues.push({
        severity: 'warning',
        message: 'Limited policy information - reduces trust signals',
        impact: 20,
      });
      recommendations.push('Add shipping, returns, warranty, privacy, and terms policies');
    } else if (policyCount < 4) {
      score -= 10;
      checks.transparentPolicies.points = 10;
    } else {
      checks.transparentPolicies.points = 20;
    }

    // Check 3: Review System Integrity (20 points)
    const productData = pageData.productData || {};
    const hasReviews = productData.rating || productData.reviewCount > 0;
    checks.reviewIntegrity = {
      value: hasReviews ? `${productData.reviewCount || 0} reviews` : 'No reviews',
      passed: true, // Not all pages need reviews
      points: hasReviews ? 20 : 10,
    };
    if (!hasReviews && pageData.pageType?.isProductPage) {
      score -= 10;
      issues.push({
        severity: 'info',
        message: 'No customer reviews - consider adding review system',
        impact: 10,
      });
    }

    // Check 4: Authority Credentials in Content (20 points)
    const authorityPatterns = [
      /certified/gi,
      /iso\s*\d+/gi,
      /award[\-\s]?winning/gi,
      /accredited/gi,
      /licensed/gi,
      /years?\s*(?:of\s*)?experience/gi,
      /trusted by/gi,
      /\d+\+?\s*(?:customers|clients|users|reviews)/gi,
      /official/gi,
      /authorized/gi,
      /patent/gi,
    ];
    let credentialCount = 0;
    for (const pattern of authorityPatterns) {
      const matches = text.match(pattern);
      if (matches) credentialCount += matches.length;
    }
    checks.authorityCredentials = {
      value: credentialCount > 0 ? `${credentialCount} credential(s)` : 'None found',
      passed: credentialCount > 0,
      points: 0,
    };
    if (credentialCount === 0) {
      score -= 15;
      issues.push({
        severity: 'info',
        message: 'No authority credentials detected (certifications, awards, etc.)',
        impact: 15,
      });
      recommendations.push('Add trust signals: certifications, awards, "trusted by X customers"');
    } else if (credentialCount < 3) {
      score -= 5;
      checks.authorityCredentials.points = 15;
    } else {
      checks.authorityCredentials.points = 20;
    }

    // Check 5: Contact Information (15 points)
    checks.contactInfo = {
      value: policies.hasContactInfo ? 'Present' : 'Missing',
      passed: policies.hasContactInfo,
      points: 0,
    };
    if (!policies.hasContactInfo) {
      score -= 15;
      issues.push({
        severity: 'warning',
        message: 'No clear contact information found',
        impact: 15,
      });
      recommendations.push('Add visible contact information (email, phone, address)');
    } else {
      checks.contactInfo.points = 15;
    }

    // Note: Off-site authority (backlinks, third-party mentions) would require
    // external API integration (Ahrefs, Moz, etc.) - not measured here
    // Using neutral score for off-site portion
    checks.offSiteAuthority = {
      value: 'Not measured (requires external API)',
      passed: true,
      points: 0, // Neutral - not penalized
    };

    return {
      score: Math.max(0, score),
      maxScore,
      percentage: Math.round((Math.max(0, score) / maxScore) * 100),
      passed: score >= 70,
      checks,
      issues,
      recommendations,
      pillarName: this.pillarNames.authoritySignals,
    };
  }

  /**
   * Calculate overall GEO score (0-800)
   */
  calculateScore(pillars) {
    let totalScore = 0;
    for (const pillar of Object.values(pillars)) {
      totalScore += pillar.score;
    }
    return Math.round(totalScore);
  }

  /**
   * Get score band (credit score style)
   */
  getScoreBand(score) {
    if (score >= 700) return { band: 'Excellent', color: '#22c55e', description: 'Highly optimized for AI citation' };
    if (score >= 550) return { band: 'Very Good', color: '#84cc16', description: 'Well-positioned for AI search' };
    if (score >= 400) return { band: 'Good', color: '#eab308', description: 'Moderate AI visibility' };
    if (score >= 200) return { band: 'Fair', color: '#f97316', description: 'Limited AI citation potential' };
    return { band: 'Poor', color: '#ef4444', description: 'Unlikely to be cited by AI' };
  }

  /**
   * Collect all issues from pillars
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

    // Sort by severity then impact
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
  generateRecommendations(pillars) {
    const allRecommendations = [];

    for (const [pillarName, pillar] of Object.entries(pillars)) {
      const percentageLost = ((pillar.maxScore - pillar.score) / pillar.maxScore) * 100;

      for (const rec of pillar.recommendations || []) {
        const priority = percentageLost > 50 ? 'high' : percentageLost > 25 ? 'medium' : 'low';
        allRecommendations.push({
          pillar: pillarName,
          pillarDisplayName: pillar.pillarName,
          recommendation: rec,
          priority,
          potentialImpact: Math.round(percentageLost / 10),
        });
      }
    }

    // Sort by priority then potential impact
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allRecommendations.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.potentialImpact - a.potentialImpact;
    });

    return allRecommendations.slice(0, 20); // Top 20 recommendations
  }

  /**
   * Transform pillars to checks format for frontend compatibility
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
   * Generate summary
   */
  generateSummary(score, band, issues) {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    return {
      score,
      maxScore: 800,
      band: band.band,
      bandColor: band.color,
      description: band.description,
      criticalIssues: criticalCount,
      warnings: warningCount,
      message: this.getSummaryMessage(score, band, criticalCount),
    };
  }

  getSummaryMessage(score, band, criticalCount) {
    if (score >= 700) {
      return 'Excellent! Your content is highly optimized for AI citation by ChatGPT, Perplexity, and other AI search engines.';
    } else if (score >= 550) {
      return 'Very good GEO optimization. Your content is well-positioned to be cited by AI systems.';
    } else if (score >= 400) {
      return `Good foundation for AI visibility. Address ${criticalCount} critical issues to improve citation likelihood.`;
    } else if (score >= 200) {
      return `Fair GEO readiness. Significant improvements needed - ${criticalCount} critical issues require attention.`;
    } else {
      return `Poor AI visibility. Your content is unlikely to be cited by generative AI. Address ${criticalCount} critical issues immediately.`;
    }
  }
}
