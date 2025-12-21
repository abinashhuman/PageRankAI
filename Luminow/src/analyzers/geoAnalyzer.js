/**
 * GEO (Generative Engine Optimization) Analyzer Module
 * Analyzes webpage content for AI/LLM citation optimization
 * Based on research showing factors that increase AI citation probability
 */

export class GEOAnalyzer {
  constructor() {
    this.weights = {
      structuredData: 15,
      contentCitability: 20,
      factDensity: 15,
      directAnswers: 15,
      semanticStructure: 10,
      authoritySignals: 10,
      faqContent: 10,
      contentFreshness: 5,
    };
  }

  /**
   * Main analysis method
   * @param {Object} pageData - Scraped page data
   * @returns {Object} GEO analysis results
   */
  analyze(pageData) {
    const checks = {
      structuredData: this.analyzeStructuredData(pageData),
      contentCitability: this.analyzeContentCitability(pageData),
      factDensity: this.analyzeFactDensity(pageData),
      directAnswers: this.analyzeDirectAnswers(pageData),
      semanticStructure: this.analyzeSemanticStructure(pageData),
      authoritySignals: this.analyzeAuthoritySignals(pageData),
      faqContent: this.analyzeFAQContent(pageData),
      contentFreshness: this.analyzeContentFreshness(pageData),
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
      aiReadinessLevel: this.getAIReadinessLevel(score),
    };
  }

  /**
   * Analyze structured data for AI comprehension
   */
  analyzeStructuredData(pageData) {
    const structuredData = pageData.structuredData || [];
    const issues = [];
    const recommendations = [];
    let score = 100;

    if (structuredData.length === 0) {
      score = 20;
      issues.push({ severity: 'critical', message: 'No JSON-LD structured data found' });
      recommendations.push('Add comprehensive JSON-LD structured data (Product, Organization, FAQPage, etc.)');
    } else {
      // Check for essential schema types
      const schemaTypes = structuredData.map(sd => sd['@type']).flat();

      const essentialSchemas = ['Product', 'Organization', 'WebPage', 'Article', 'FAQPage', 'HowTo', 'LocalBusiness'];
      const foundSchemas = essentialSchemas.filter(s => schemaTypes.includes(s));

      if (foundSchemas.length === 0) {
        score -= 30;
        issues.push({ severity: 'warning', message: 'No essential schema types found' });
        recommendations.push('Add relevant schema types: Product, Article, FAQPage, or Organization');
      }

      // Check for nested/comprehensive data
      const hasRichData = structuredData.some(sd =>
        sd.description || sd.offers || sd.aggregateRating || sd.mainEntity
      );

      if (!hasRichData) {
        score -= 20;
        issues.push({ severity: 'info', message: 'Structured data lacks rich properties' });
        recommendations.push('Enhance structured data with descriptions, ratings, and offers');
      }

      // Check for FAQ schema specifically (high value for GEO)
      if (!schemaTypes.includes('FAQPage') && !schemaTypes.includes('Question')) {
        score -= 15;
        issues.push({ severity: 'info', message: 'No FAQ structured data' });
        recommendations.push('Add FAQPage schema with Q&A pairs to increase AI citability');
      }
    }

    return {
      count: structuredData.length,
      types: structuredData.map(sd => sd['@type']).flat(),
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze content citability for AI/LLMs
   */
  analyzeContentCitability(pageData) {
    const text = pageData.textContent || '';
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check for clear, quotable sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const clearSentences = sentences.filter(s => {
      const words = s.trim().split(/\s+/);
      return words.length >= 5 && words.length <= 30;
    });

    const citabilityRatio = sentences.length > 0 ? clearSentences.length / sentences.length : 0;

    if (citabilityRatio < 0.5) {
      score -= 30;
      issues.push({ severity: 'warning', message: 'Many sentences are too long or too short for AI citation' });
      recommendations.push('Write clear, concise sentences (10-25 words) that can stand alone as quotes');
    }

    // Check for definition-style content (highly citable)
    const definitionPatterns = [
      /is a\s+\w+/i,
      /refers to/i,
      /defined as/i,
      /means that/i,
      /is the process of/i,
    ];

    const hasDefinitions = definitionPatterns.some(p => p.test(text));
    if (!hasDefinitions) {
      score -= 15;
      issues.push({ severity: 'info', message: 'No clear definitions or explanations found' });
      recommendations.push('Include clear definitions (e.g., "X is a..." or "X refers to...")');
    }

    // Check for listicle/bullet content (easy for AI to parse)
    const lists = pageData.lists || [];
    if (lists.length === 0) {
      score -= 10;
      issues.push({ severity: 'info', message: 'No bullet lists or numbered lists found' });
      recommendations.push('Use bullet points and numbered lists for key information');
    }

    return {
      totalSentences: sentences.length,
      citableSentences: clearSentences.length,
      citabilityRatio: Math.round(citabilityRatio * 100),
      hasDefinitions,
      listCount: lists.length,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze fact density (statistics, numbers, specifications)
   * Research shows facts every 150-200 words increases AI citation
   */
  analyzeFactDensity(pageData) {
    const text = pageData.textContent || '';
    const issues = [];
    const recommendations = [];
    let score = 100;

    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Find statistics and numbers
    const numberPatterns = [
      /\d+%/g,                           // Percentages
      /\$[\d,]+(?:\.\d{2})?/g,           // Currency
      /\d+(?:\.\d+)?\s*(?:mm|cm|m|kg|lb|oz|inch|feet|ft)/gi, // Measurements
      /\d{4}/g,                           // Years
      /\d+(?:,\d{3})+/g,                 // Large numbers
      /\d+\s*(?:million|billion|thousand)/gi, // Word numbers
    ];

    let factCount = 0;
    for (const pattern of numberPatterns) {
      const matches = text.match(pattern);
      if (matches) factCount += matches.length;
    }

    // Calculate facts per 200 words
    const factsPer200Words = wordCount > 0 ? (factCount / wordCount) * 200 : 0;

    if (factsPer200Words < 1) {
      score -= 40;
      issues.push({ severity: 'critical', message: 'Very low fact density - content lacks statistics' });
      recommendations.push('Add statistics, numbers, and specific data points every 150-200 words');
    } else if (factsPer200Words < 2) {
      score -= 20;
      issues.push({ severity: 'warning', message: 'Fact density could be improved' });
      recommendations.push('Include more specific numbers, percentages, and measurements');
    }

    // Check for authoritative sources
    const sourcePatterns = [
      /according to/i,
      /research shows/i,
      /study found/i,
      /data indicates/i,
      /experts say/i,
    ];

    const hasSources = sourcePatterns.some(p => p.test(text));
    if (!hasSources) {
      score -= 15;
      issues.push({ severity: 'info', message: 'No source citations or references' });
      recommendations.push('Reference authoritative sources (e.g., "According to [Source]...")');
    }

    return {
      factCount,
      wordCount,
      factsPer200Words: Math.round(factsPer200Words * 10) / 10,
      hasSources,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze for direct answers (first 40-60 words should answer "What is this?")
   */
  analyzeDirectAnswers(pageData) {
    const text = pageData.textContent || '';
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Get first paragraph or first ~60 words
    const firstWords = text.split(/\s+/).slice(0, 60).join(' ');
    const paragraphs = pageData.paragraphs || [];
    const firstParagraph = paragraphs[0] || firstWords;

    // Check if first paragraph contains definitive statements
    const answerPatterns = [
      /^[A-Z][^.!?]+(?:is|are|was|were|provides|offers|helps|enables)/i,
      /^(?:This|The|Our|A|An)\s+\w+\s+(?:is|are|provides|offers)/i,
    ];

    const hasDirectAnswer = answerPatterns.some(p => p.test(firstParagraph));

    if (!hasDirectAnswer) {
      score -= 35;
      issues.push({ severity: 'warning', message: 'Opening content does not directly answer "What is this?"' });
      recommendations.push('Start with a clear, direct statement explaining what the page/product is');
    }

    // Check for question-answer patterns in content
    const qaPatterns = text.match(/\?[^?]+(?:\.|$)/g) || [];
    const hasQA = qaPatterns.length > 0;

    if (!hasQA) {
      score -= 15;
      issues.push({ severity: 'info', message: 'No question-answer patterns in content' });
      recommendations.push('Include and answer common questions users might ask');
    }

    return {
      firstParagraphLength: firstParagraph?.length || 0,
      hasDirectAnswer,
      questionAnswerPairs: qaPatterns.length,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze semantic HTML structure (important for LLM parsing)
   */
  analyzeSemanticStructure(pageData) {
    const headings = pageData.headings || {};
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check heading hierarchy
    const h1Count = headings.h1?.length || 0;
    const h2Count = headings.h2?.length || 0;
    const h3Count = headings.h3?.length || 0;

    if (h1Count === 0) {
      score -= 30;
      issues.push({ severity: 'critical', message: 'Missing H1 - main topic unclear to AI' });
      recommendations.push('Add an H1 heading that clearly states the main topic');
    }

    if (h2Count < 2) {
      score -= 20;
      issues.push({ severity: 'warning', message: 'Insufficient section headings (H2)' });
      recommendations.push('Break content into sections with clear H2 headings');
    }

    // Check for semantic elements
    const hasSemanticElements =
      (pageData.articles?.length > 0) ||
      (pageData.sections?.length > 0) ||
      (pageData.nav?.length > 0) ||
      (pageData.aside?.length > 0);

    if (!hasSemanticElements) {
      score -= 15;
      issues.push({ severity: 'info', message: 'Limited semantic HTML elements' });
      recommendations.push('Use semantic HTML (article, section, nav, aside) for better structure');
    }

    return {
      h1Count,
      h2Count,
      h3Count,
      hasSemanticElements,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze authority signals (certifications, awards, credentials)
   */
  analyzeAuthoritySignals(pageData) {
    const text = pageData.textContent || '';
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check for authority patterns
    const authorityPatterns = [
      /certified/i,
      /ISO\s*\d+/i,
      /award[\-\s]?winning/i,
      /accredited/i,
      /licensed/i,
      /patent/i,
      /trademark/i,
      /official/i,
      /\d+\s*years?\s*(?:of\s*)?experience/i,
      /trusted by/i,
      /\d+\+?\s*(?:customers|clients|users)/i,
    ];

    const foundSignals = authorityPatterns.filter(p => p.test(text));

    if (foundSignals.length === 0) {
      score -= 30;
      issues.push({ severity: 'warning', message: 'No authority signals detected' });
      recommendations.push('Include certifications, awards, or trust signals (e.g., "ISO certified", "10+ years experience")');
    } else if (foundSignals.length < 2) {
      score -= 15;
      issues.push({ severity: 'info', message: 'Limited authority signals' });
      recommendations.push('Add more credibility indicators to increase AI trust signals');
    }

    // Check for author/expert information
    const hasAuthor = pageData.author || /written by|author:|by [A-Z][a-z]+/i.test(text);

    if (!hasAuthor) {
      score -= 20;
      issues.push({ severity: 'info', message: 'No author attribution found' });
      recommendations.push('Add author information with credentials for E-E-A-T signals');
    }

    return {
      authoritySignalCount: foundSignals.length,
      hasAuthor,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze FAQ content (high value for GEO)
   */
  analyzeFAQContent(pageData) {
    const text = pageData.textContent || '';
    const structuredData = pageData.structuredData || [];
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check for FAQ schema
    const hasFAQSchema = structuredData.some(sd =>
      sd['@type'] === 'FAQPage' || sd['@type'] === 'Question'
    );

    // Check for FAQ-style content
    const questionMarks = (text.match(/\?/g) || []).length;
    const faqSectionPattern = /(?:FAQ|frequently asked|common questions)/i;
    const hasFAQSection = faqSectionPattern.test(text);

    // Check for how-to content
    const howToPattern = /(?:how to|step \d|first,|next,|finally,)/i;
    const hasHowTo = howToPattern.test(text);

    if (!hasFAQSchema && !hasFAQSection) {
      score -= 35;
      issues.push({ severity: 'warning', message: 'No FAQ content or schema found' });
      recommendations.push('Add an FAQ section with FAQPage schema markup');
    } else if (!hasFAQSchema) {
      score -= 20;
      issues.push({ severity: 'info', message: 'FAQ content exists but lacks schema markup' });
      recommendations.push('Add FAQPage structured data for your FAQ content');
    }

    if (questionMarks < 3 && !hasHowTo) {
      score -= 15;
      issues.push({ severity: 'info', message: 'Limited question-based content' });
      recommendations.push('Include 5-8 common questions users might ask about your topic');
    }

    return {
      hasFAQSchema,
      hasFAQSection,
      questionCount: questionMarks,
      hasHowTo,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze content freshness
   */
  analyzeContentFreshness(pageData) {
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check for date indicators
    const hasDateModified = pageData.dateModified || pageData.lastModified;
    const hasDatePublished = pageData.datePublished;

    if (!hasDateModified && !hasDatePublished) {
      score -= 30;
      issues.push({ severity: 'warning', message: 'No publication or modification date found' });
      recommendations.push('Add datePublished and dateModified to your structured data');
    }

    // Check structured data for dates
    const structuredData = pageData.structuredData || [];
    const hasDateInSchema = structuredData.some(sd =>
      sd.datePublished || sd.dateModified || sd.dateCreated
    );

    if (!hasDateInSchema) {
      score -= 20;
      issues.push({ severity: 'info', message: 'No dates in structured data' });
      recommendations.push('Include datePublished and dateModified in your JSON-LD');
    }

    return {
      hasDateModified: !!hasDateModified,
      hasDatePublished: !!hasDatePublished,
      hasDateInSchema,
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      recommendations,
    };
  }

  /**
   * Calculate overall GEO score
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
   * Get AI readiness level
   */
  getAIReadinessLevel(score) {
    if (score >= 90) return { level: 'Excellent', description: 'Highly optimized for AI citation' };
    if (score >= 75) return { level: 'Good', description: 'Well-prepared for AI search engines' };
    if (score >= 60) return { level: 'Moderate', description: 'Some improvements needed for AI optimization' };
    if (score >= 40) return { level: 'Fair', description: 'Significant work needed for AI readiness' };
    return { level: 'Poor', description: 'Major optimization required for AI citation' };
  }

  /**
   * Generate summary
   */
  generateSummary(score, issues) {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    return {
      status: this.getAIReadinessLevel(score).level,
      criticalIssues: criticalCount,
      warnings: warningCount,
      message: this.getSummaryMessage(score, criticalCount),
    };
  }

  getSummaryMessage(score, criticalCount) {
    if (score >= 90) {
      return 'Your content is highly optimized for AI search engines like ChatGPT and Perplexity.';
    } else if (score >= 75) {
      return 'Good GEO optimization. Your content is well-positioned for AI citation.';
    } else if (score >= 60) {
      return `Moderate GEO readiness. Address ${criticalCount} critical issues to improve AI visibility.`;
    } else {
      return `Your content needs significant GEO optimization to be cited by AI systems.`;
    }
  }
}
