/**
 * Content Analysis Utility Module
 *
 * Provides content analysis functions for GEO scoring.
 * Based on KDD'24 GEO research (arXiv:2311.09735):
 * - 76.4% of ChatGPT's cited pages updated within 30 days
 * - 2000+ word content gets 3x more citations
 * - Listicles account for 50% of top AI citations
 * - Tables increase citation rates 2.5x
 */

import {
  countStatistics,
  calculateFactDensity,
  countCitationSignals,
  countOriginalResearchSignals,
  analyzeEEATSignals,
  findUncitableContent,
  extractDates,
  findQuotableSentences,
} from './patternMatchers.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT FRESHNESS ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze content freshness with 30-day window optimization
 * Research: 76.4% of ChatGPT's most-cited pages updated within 30 days
 *
 * @param {Object} pageData - Scraped page data
 * @param {string} textContent - Page text content
 * @returns {Object} Freshness analysis result
 */
export const analyzeContentFreshness = (pageData, textContent = '') => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);

  let effectiveDate = null;
  let dateSource = null;

  // Priority 1: Meta dates from page data
  if (pageData.lastModified) {
    const parsed = new Date(pageData.lastModified);
    if (!isNaN(parsed)) {
      effectiveDate = parsed;
      dateSource = 'lastModified meta';
    }
  }

  if (!effectiveDate && pageData.dateModified) {
    const parsed = new Date(pageData.dateModified);
    if (!isNaN(parsed)) {
      effectiveDate = parsed;
      dateSource = 'schema dateModified';
    }
  }

  if (!effectiveDate && pageData.datePublished) {
    const parsed = new Date(pageData.datePublished);
    if (!isNaN(parsed)) {
      effectiveDate = parsed;
      dateSource = 'schema datePublished';
    }
  }

  // Priority 2: Extract dates from visible content
  if (!effectiveDate && textContent) {
    const extractedDates = extractDates(textContent);
    if (extractedDates.length > 0) {
      effectiveDate = extractedDates[0]; // Most recent
      dateSource = 'visible content';
    }
  }

  // Calculate freshness status
  const daysSinceUpdate = effectiveDate
    ? Math.floor((now - effectiveDate) / (24 * 60 * 60 * 1000))
    : null;

  const isWithin30Days = effectiveDate && effectiveDate > thirtyDaysAgo;
  const isWithin90Days = effectiveDate && effectiveDate > ninetyDaysAgo;
  const isWithin6Months = effectiveDate && effectiveDate > sixMonthsAgo;

  // Calculate points (max 15 for this check)
  let points = 0;
  let status = 'unknown';
  let recommendation = null;

  if (isWithin30Days) {
    points = 15;
    status = 'fresh';
  } else if (isWithin90Days) {
    points = 10;
    status = 'recent';
    recommendation = 'Update content or add "Last reviewed" date to boost freshness signals';
  } else if (isWithin6Months) {
    points = 5;
    status = 'aging';
    recommendation = 'Content is aging - consider updating with current information';
  } else if (effectiveDate) {
    points = 2;
    status = 'stale';
    recommendation = 'Content is stale - major update recommended for AI citation eligibility';
  } else {
    points = 0;
    status = 'unknown';
    recommendation = 'Add visible "Last updated" date to signal freshness to AI crawlers';
  }

  return {
    effectiveDate: effectiveDate?.toISOString() || null,
    dateSource,
    daysSinceUpdate,
    status,
    isWithin30Days: !!isWithin30Days,
    isWithin90Days: !!isWithin90Days,
    isWithin6Months: !!isWithin6Months,
    points,
    maxPoints: 15,
    benchmark: '76.4% of top-cited pages updated within 30 days',
    recommendation,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT DEPTH ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze content depth and length
 * Research: 2000+ words get 3x more AI citations
 *
 * @param {Object} pageData - Scraped page data
 * @returns {Object} Content depth analysis
 */
export const analyzeContentDepth = (pageData) => {
  const textContent = pageData.textContent || '';
  const wordCount = pageData.wordCount || textContent.split(/\s+/).filter((w) => w.length > 0).length;

  // Points based on word count (max 25)
  let lengthPoints = 0;
  let status = 'thin';

  if (wordCount >= 2500) {
    lengthPoints = 25;
    status = 'comprehensive';
  } else if (wordCount >= 2000) {
    lengthPoints = 22;
    status = 'thorough';
  } else if (wordCount >= 1500) {
    lengthPoints = 18;
    status = 'substantial';
  } else if (wordCount >= 1000) {
    lengthPoints = 12;
    status = 'moderate';
  } else if (wordCount >= 500) {
    lengthPoints = 6;
    status = 'brief';
  } else {
    lengthPoints = 2;
    status = 'thin';
  }

  // Check for content sections (headings)
  const headingCount = pageData.headings?.length || 0;
  const hasStructure = headingCount >= 3;

  // Check reading time (average 200 wpm)
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return {
    wordCount,
    status,
    lengthPoints,
    maxLengthPoints: 25,
    headingCount,
    hasStructure,
    readingTimeMinutes,
    benchmark: '2000+ words for 3x citation likelihood',
    recommendation: wordCount < 2000
      ? `Add ${2000 - wordCount} more words to reach optimal citation length`
      : null,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LISTICLE & STRUCTURE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze listicle structure
 * Research: Listicles account for 50% of top AI citations
 *
 * @param {Object} pageData - Scraped page data
 * @returns {Object} Listicle analysis
 */
export const analyzeListicleStructure = (pageData) => {
  const lists = pageData.lists || [];
  const textContent = pageData.textContent || '';

  // Count list items
  const totalListItems = lists.reduce((sum, list) => sum + (list.items?.length || 0), 0);
  const orderedLists = lists.filter((l) => l.type === 'ol').length;
  const unorderedLists = lists.filter((l) => l.type === 'ul').length;

  // Check for numbered patterns in text (fallback)
  const numberedPatterns = (textContent.match(/^\s*\d+\.\s+/gm) || []).length;

  // Calculate points (max 20)
  let listPoints = 0;
  if (totalListItems >= 15 && lists.length >= 3) {
    listPoints = 20;
  } else if (totalListItems >= 10) {
    listPoints = 15;
  } else if (totalListItems >= 5) {
    listPoints = 10;
  } else if (lists.length > 0) {
    listPoints = 5;
  } else if (numberedPatterns >= 3) {
    listPoints = 3;
  }

  return {
    listCount: lists.length,
    orderedLists,
    unorderedLists,
    totalListItems,
    numberedPatterns,
    points: listPoints,
    maxPoints: 20,
    hasStrongListicle: listPoints >= 15,
    benchmark: 'Listicles account for 50% of top AI citations',
    recommendation: totalListItems < 10
      ? 'Add structured lists with 10+ items for better citation rates'
      : null,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze comparison tables
 * Research: Tables increase citation rates 2.5x
 *
 * @param {Object} pageData - Scraped page data
 * @returns {Object} Table analysis
 */
export const analyzeTableStructure = (pageData) => {
  const tables = pageData.tables || [];
  const textContent = pageData.textContent || '';

  // Check for comparison patterns
  const hasComparisonPatterns = /vs\.?|versus|compared|comparison|pros|cons|advantages|disadvantages/i.test(textContent);

  // Calculate table quality
  let qualityTables = 0;
  let totalCells = 0;

  for (const table of tables) {
    const rows = table.rows || 0;
    const cols = table.cols || table.columns || 0;
    const cells = rows * cols;
    totalCells += cells;

    // Quality table: at least 3 rows and 2 columns
    if (rows >= 3 && cols >= 2) {
      qualityTables++;
    }
  }

  // Calculate points (max 20)
  let tablePoints = 0;
  if (qualityTables >= 2) {
    tablePoints = 20;
  } else if (qualityTables === 1) {
    tablePoints = 15;
  } else if (tables.length > 0) {
    tablePoints = 8;
  } else if (hasComparisonPatterns) {
    tablePoints = 3; // Has comparison content but no tables
  }

  return {
    tableCount: tables.length,
    qualityTables,
    totalCells,
    hasComparisonPatterns,
    points: tablePoints,
    maxPoints: 20,
    benchmark: 'Tables increase citation rates 2.5x',
    recommendation: qualityTables === 0 && hasComparisonPatterns
      ? 'Convert comparison content into structured tables'
      : qualityTables === 0
        ? 'Add comparison tables to increase citation likelihood'
        : null,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORIGINAL RESEARCH ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze original research indicators
 *
 * @param {string} textContent - Page text content
 * @returns {Object} Original research analysis
 */
export const analyzeOriginalResearch = (textContent) => {
  const originalCount = countOriginalResearchSignals(textContent);
  const statCount = countStatistics(textContent);
  const factDensity = calculateFactDensity(textContent);

  // Calculate points (max 20)
  let points = 0;
  if (originalCount >= 5 && statCount >= 10) {
    points = 20;
  } else if (originalCount >= 3 && statCount >= 5) {
    points = 15;
  } else if (originalCount >= 1 && statCount >= 3) {
    points = 10;
  } else if (statCount >= 5) {
    points = 8;
  } else if (originalCount >= 1 || statCount >= 2) {
    points = 5;
  }

  return {
    originalResearchIndicators: originalCount,
    statisticsCount: statCount,
    factDensity: Math.round(factDensity * 100) / 100,
    points,
    maxPoints: 20,
    hasOriginalResearch: originalCount >= 3,
    recommendation: originalCount < 3
      ? 'Add original research phrases like "we tested", "our analysis found"'
      : null,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE CONTENT QUALITY SCORE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate comprehensive content quality score
 * Replaces productMetadata for non-product pages
 *
 * @param {Object} pageData - Scraped page data
 * @param {string} pageType - Detected page type
 * @returns {Object} Content quality analysis
 */
export const analyzeContentQuality = (pageData, pageType = 'other') => {
  const textContent = pageData.textContent || '';

  // Run all sub-analyses
  const depthAnalysis = analyzeContentDepth(pageData);
  const listicleAnalysis = analyzeListicleStructure(pageData);
  const tableAnalysis = analyzeTableStructure(pageData);
  const researchAnalysis = analyzeOriginalResearch(textContent);
  const freshnessAnalysis = analyzeContentFreshness(pageData, textContent);
  const eeatAnalysis = analyzeEEATSignals(textContent);

  // Find quotable content
  const quotableSentences = findQuotableSentences(textContent, 5);
  const uncitableContent = findUncitableContent(textContent);

  // Calculate total score (max 100)
  const totalPoints =
    depthAnalysis.lengthPoints +
    listicleAnalysis.points +
    tableAnalysis.points +
    researchAnalysis.points +
    freshnessAnalysis.points;

  const maxPoints = 100;
  const percentage = Math.round((totalPoints / maxPoints) * 100);

  // Compile all checks
  const checks = {
    contentLength: {
      value: `${depthAnalysis.wordCount} words`,
      passed: depthAnalysis.lengthPoints >= 18,
      points: depthAnalysis.lengthPoints,
      maxPoints: 25,
      status: depthAnalysis.status,
      benchmark: depthAnalysis.benchmark,
    },
    listicleStructure: {
      value: `${listicleAnalysis.listCount} lists, ${listicleAnalysis.totalListItems} items`,
      passed: listicleAnalysis.points >= 15,
      points: listicleAnalysis.points,
      maxPoints: 20,
      benchmark: listicleAnalysis.benchmark,
    },
    comparisonTables: {
      value: tableAnalysis.qualityTables > 0
        ? `${tableAnalysis.qualityTables} quality table(s)`
        : tableAnalysis.tableCount > 0
          ? `${tableAnalysis.tableCount} table(s)`
          : 'None',
      passed: tableAnalysis.points >= 10,
      points: tableAnalysis.points,
      maxPoints: 20,
      benchmark: tableAnalysis.benchmark,
    },
    originalResearch: {
      value: researchAnalysis.originalResearchIndicators > 0
        ? `${researchAnalysis.originalResearchIndicators} indicator(s), ${researchAnalysis.statisticsCount} stats`
        : 'None detected',
      passed: researchAnalysis.points >= 10,
      points: researchAnalysis.points,
      maxPoints: 20,
      factDensity: researchAnalysis.factDensity,
    },
    contentFreshness: {
      value: freshnessAnalysis.status,
      passed: freshnessAnalysis.isWithin30Days,
      points: freshnessAnalysis.points,
      maxPoints: 15,
      daysSinceUpdate: freshnessAnalysis.daysSinceUpdate,
      dateSource: freshnessAnalysis.dateSource,
      benchmark: freshnessAnalysis.benchmark,
    },
  };

  // Compile recommendations
  const recommendations = [
    depthAnalysis.recommendation,
    listicleAnalysis.recommendation,
    tableAnalysis.recommendation,
    researchAnalysis.recommendation,
    freshnessAnalysis.recommendation,
  ].filter(Boolean);

  // Compile issues
  const issues = [];
  if (depthAnalysis.lengthPoints < 12) {
    issues.push(`Content is too thin (${depthAnalysis.wordCount} words)`);
  }
  if (listicleAnalysis.points < 10) {
    issues.push('Lacks listicle structure');
  }
  if (tableAnalysis.points < 10) {
    issues.push('No comparison tables');
  }
  if (freshnessAnalysis.status === 'stale' || freshnessAnalysis.status === 'unknown') {
    issues.push('Content freshness signals missing or outdated');
  }
  if (uncitableContent.length > 5) {
    issues.push(`High amount of vague/uncitable content (${uncitableContent.length} phrases)`);
  }

  return {
    score: totalPoints,
    maxScore: maxPoints,
    percentage,
    passed: percentage >= 60,
    pillarName: 'Content Quality & Depth',
    checks,
    issues,
    recommendations,
    details: {
      depth: depthAnalysis,
      listicle: listicleAnalysis,
      tables: tableAnalysis,
      research: researchAnalysis,
      freshness: freshnessAnalysis,
      eeat: eeatAnalysis,
      quotableSentences,
      uncitableContent,
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT CHUNKING FOR "WHAT AI SEES" VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Chunk content into AI-digestible pieces with quality scores
 *
 * @param {string} textContent - Page text content
 * @param {number} targetTokens - Target tokens per chunk (default 200)
 * @returns {Array} Array of analyzed chunks
 */
export const chunkContentForAI = (textContent, targetTokens = 200) => {
  // Approximate: 1 token ~ 4 characters
  const sentences = textContent.match(/[^.!?]+[.!?]+/g) || [];
  const chunks = [];
  let currentChunk = { text: '', tokens: 0, sentences: [] };

  for (const sentence of sentences) {
    const sentenceTokens = Math.ceil(sentence.length / 4);

    if (currentChunk.tokens + sentenceTokens > targetTokens && currentChunk.text) {
      chunks.push(analyzeChunk(currentChunk));
      currentChunk = { text: '', tokens: 0, sentences: [] };
    }

    currentChunk.text += sentence + ' ';
    currentChunk.tokens += sentenceTokens;
    currentChunk.sentences.push(sentence.trim());
  }

  if (currentChunk.text) {
    chunks.push(analyzeChunk(currentChunk));
  }

  return chunks.slice(0, 10); // Return first 10 chunks
};

/**
 * Analyze a single chunk for citation quality
 */
const analyzeChunk = (chunk) => {
  const text = chunk.text;
  let score = 50; // Base score
  const signals = [];

  // Check for statistics
  if (countStatistics(text) > 0) {
    score += 15;
    signals.push({ type: 'pass', label: 'Statistics' });
  } else {
    signals.push({ type: 'fail', label: 'No statistics' });
  }

  // Check for citations
  if (countCitationSignals(text) > 0) {
    score += 15;
    signals.push({ type: 'pass', label: 'Citation' });
  } else {
    signals.push({ type: 'fail', label: 'No sources' });
  }

  // Check for specific claims
  if (/\d+\s*(?:x|times)|scored\s+\d+|ranked\s+#?\d+/i.test(text)) {
    score += 10;
    signals.push({ type: 'pass', label: 'Specific claim' });
  } else {
    signals.push({ type: 'fail', label: 'Vague claims' });
  }

  // Check for fluff words (penalty)
  const fluffWords = text.match(/really|very|amazing|great|super|awesome/gi) || [];
  if (fluffWords.length > 2) {
    score -= 10;
    signals.push({ type: 'fail', label: 'Marketing fluff' });
  }

  // Highlight important parts
  let highlightedText = text;
  // Highlight statistics
  highlightedText = highlightedText.replace(
    /(\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*(?:hours?|GB|MP|mAh|Hz|fps))/gi,
    '<mark class="highlight-stat">$1</mark>'
  );
  // Highlight citations
  highlightedText = highlightedText.replace(
    /(according to [^,.\n]+|certified by [^,.\n]+)/gi,
    '<mark class="highlight-cite">$1</mark>'
  );

  return {
    ...chunk,
    score: Math.max(0, Math.min(100, score)),
    signals,
    highlightedText,
  };
};

export default {
  analyzeContentFreshness,
  analyzeContentDepth,
  analyzeListicleStructure,
  analyzeTableStructure,
  analyzeOriginalResearch,
  analyzeContentQuality,
  chunkContentForAI,
};
