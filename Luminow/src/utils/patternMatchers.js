/**
 * Pattern Matchers Utility Module
 *
 * Centralized regex patterns for content analysis.
 * Used across page type detection, content quality analysis, and GEO scoring.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICS & DATA PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Patterns that indicate quantitative data (highly citable)
 */
export const STATISTIC_PATTERNS = {
  // Percentages: "50%", "50.5%"
  percentage: /\d+(?:\.\d+)?%/g,

  // Currency: "$100", "€50.99", "£25"
  currency: /[$€£¥₹]\s*\d+(?:,\d{3})*(?:\.\d{1,2})?/g,

  // Measurements: "10GB", "500mAh", "6.1 inches"
  measurements: /\d+(?:\.\d+)?\s*(?:GB|MB|TB|KB|mAh|Hz|kHz|MHz|GHz|fps|MP|mm|cm|m|km|kg|g|lb|oz|inches?|ft|mi)/gi,

  // Time durations: "30 hours", "2 days", "5 minutes"
  durations: /\d+(?:\.\d+)?\s*(?:hours?|hrs?|days?|weeks?|months?|years?|minutes?|mins?|seconds?|secs?)/gi,

  // Multipliers: "2x faster", "10x more", "3x better"
  multipliers: /\d+(?:\.\d+)?x\s+(?:faster|slower|more|less|better|worse|larger|smaller|higher|lower)/gi,

  // Ratings: "4.5/5", "8.7/10", "★★★★☆"
  ratings: /\d+(?:\.\d+)?\/(?:5|10)|★+☆*/g,

  // Year references: "2024", "in 2025"
  years: /(?:in\s+)?20[1-9]\d/g,

  // Generic numbers with context
  numberedFacts: /(?:over|more than|less than|approximately|about|nearly|up to)\s+\d+(?:,\d{3})*(?:\.\d+)?/gi,
};

/**
 * Match all statistics in text and return count
 */
export const countStatistics = (text) => {
  let count = 0;
  for (const pattern of Object.values(STATISTIC_PATTERNS)) {
    const matches = text.match(pattern) || [];
    count += matches.length;
  }
  return count;
};

/**
 * Calculate fact density (statistics per 100 words)
 */
export const calculateFactDensity = (text) => {
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount === 0) return 0;
  const statCount = countStatistics(text);
  return (statCount / wordCount) * 100;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CITATION & AUTHORITY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

export const CITATION_PATTERNS = {
  // Attribution: "According to...", "Research by..."
  attribution: /(?:according to|research (?:by|from|shows)|study (?:by|from)|data (?:from|by)|survey (?:by|from)|analysis (?:by|from)|report (?:by|from))\s+[A-Z][^,.]+/gi,

  // Quotes: Direct quotations
  directQuotes: /"[^"]{20,200}"/g,

  // Source mentions: "Source: ...", "(Source: ...)"
  sourceMentions: /(?:\(source:|\bsource:)\s*[^).\n]+/gi,

  // Study references: "A 2024 study", "Recent research"
  studyReferences: /(?:a\s+)?(?:recent|new|latest|20\d{2})\s+(?:study|research|survey|analysis|report)/gi,

  // Expert mentions
  expertMentions: /(?:expert|specialist|researcher|professor|dr\.?|phd)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/gi,
};

/**
 * Count citation signals in text
 */
export const countCitationSignals = (text) => {
  let count = 0;
  for (const pattern of Object.values(CITATION_PATTERNS)) {
    const matches = text.match(pattern) || [];
    count += matches.length;
  }
  return count;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORIGINAL RESEARCH INDICATORS
// ═══════════════════════════════════════════════════════════════════════════════

export const ORIGINAL_RESEARCH_PATTERNS = {
  // First-person research claims
  firstPersonResearch:
    /we\s+(?:found|discovered|analyzed|surveyed|tested|reviewed|examined|measured|compared)/gi,

  // Our data/findings
  ourData: /our\s+(?:research|study|analysis|data|findings|survey|testing|review)/gi,

  // Sample sizes
  sampleSizes: /(?:based on|analyzed|surveyed|tested)\s+\d+(?:,\d{3})*(?:\s+(?:users?|customers?|respondents?|samples?|products?|pages?))?/gi,

  // Methodology mentions
  methodology: /(?:our\s+)?methodology|we\s+(?:measured|calculated|determined)/gi,

  // Data collection
  dataCollection: /(?:collected|gathered|compiled)\s+data/gi,

  // Original labels
  originalLabels: /(?:exclusive|original|proprietary|first-hand|firsthand)\s+(?:research|data|analysis|study)/gi,
};

/**
 * Count original research indicators
 */
export const countOriginalResearchSignals = (text) => {
  let count = 0;
  for (const pattern of Object.values(ORIGINAL_RESEARCH_PATTERNS)) {
    const matches = text.match(pattern) || [];
    count += matches.length;
  }
  return count;
};

// ═══════════════════════════════════════════════════════════════════════════════
// E-E-A-T SIGNAL PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

export const EEAT_PATTERNS = {
  // Experience signals
  experience: {
    firstPerson: /I\s+(?:tested|tried|used|reviewed|recommend|purchased|bought|experienced)/gi,
    personalExperience: /(?:my|our)\s+(?:experience|testing|review|hands-on)/gi,
    timeUsed: /(?:after|for)\s+\d+\s+(?:days?|weeks?|months?|years?)\s+(?:of\s+)?(?:use|using|testing)/gi,
  },

  // Expertise signals
  expertise: {
    credentials: /\b(?:PhD|MD|CPA|CFA|MBA|certified|licensed|registered|accredited)\b/gi,
    yearsExperience: /\d+\+?\s*years?\s+(?:of\s+)?(?:experience|expertise|in the industry)/gi,
    professional: /(?:professional|expert|specialist|consultant|advisor)\s+(?:in|with|for)/gi,
  },

  // Authority signals
  authority: {
    featuredIn: /(?:featured|quoted|cited|published)\s+(?:in|by|on)\s+[A-Z][^,.]+/gi,
    awards: /(?:award|recognition|certification|accreditation)s?\s+(?:from|by)/gi,
    partnerships: /(?:partner|collaborate|work)\s+with\s+[A-Z][^,.]+/gi,
  },

  // Trust signals
  trust: {
    verified: /(?:verified|validated|confirmed|authenticated)\s+(?:by|through)/gi,
    transparent: /(?:disclosure|transparency|honest|unbiased|independent)/gi,
    updated: /(?:last\s+)?(?:updated|reviewed|verified|modified)(?:\s+on)?:?\s*(?:\w+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/gi,
  },
};

/**
 * Analyze E-E-A-T signals and return breakdown
 */
export const analyzeEEATSignals = (text) => {
  const results = {
    experience: { signals: [], count: 0 },
    expertise: { signals: [], count: 0 },
    authority: { signals: [], count: 0 },
    trust: { signals: [], count: 0 },
  };

  for (const [category, patterns] of Object.entries(EEAT_PATTERNS)) {
    for (const [name, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern) || [];
      if (matches.length > 0) {
        results[category].signals.push({ name, matches: matches.slice(0, 3) });
        results[category].count += matches.length;
      }
    }
  }

  return results;
};

// ═══════════════════════════════════════════════════════════════════════════════
// VAGUE/UNCITABLE CONTENT PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

export const VAGUE_CONTENT_PATTERNS = {
  // Superlatives without evidence
  emptySuperlatives: /(?:the\s+)?(?:best|greatest|amazing|incredible|fantastic|awesome|perfect|excellent|outstanding|exceptional|remarkable)\s+(?:ever|available|on the market)?/gi,

  // Subjective qualifiers
  subjectiveQualifiers: /(?:really|very|super|extremely|incredibly|absolutely|totally|completely)\s+\w+/gi,

  // Marketing fluff
  marketingFluff: /(?:game-?changer|revolutionary|cutting-?edge|state-of-the-art|next-?generation|world-?class|industry-?leading|best-in-class)/gi,

  // Vague claims
  vagueClaims: /(?:you'll love|we think you'll|you won't believe|takes? .+ to the next level)/gi,

  // Emotional appeals without facts
  emotionalAppeals: /(?:don't miss|act now|limited time|exclusive offer|hurry|while supplies last)/gi,
};

/**
 * Find uncitable/vague content in text
 */
export const findUncitableContent = (text) => {
  const uncitables = [];

  for (const [category, pattern] of Object.entries(VAGUE_CONTENT_PATTERNS)) {
    const matches = text.match(pattern) || [];
    matches.forEach((match) => {
      uncitables.push({ text: match.trim(), category });
    });
  }

  return [...new Set(uncitables.map((u) => u.text))].slice(0, 15);
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

export const DATE_PATTERNS = {
  // ISO format: 2024-12-25
  isoDate: /\d{4}-\d{2}-\d{2}/g,

  // US format: December 25, 2024 or Dec 25, 2024
  usDate: /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/gi,

  // European format: 25 December 2024
  euDate: /\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi,

  // Update labels
  updateLabels: /(?:updated|modified|reviewed|last updated|last modified)(?:\s+on)?:?\s*/gi,
};

/**
 * Extract dates from text
 */
export const extractDates = (text) => {
  const dates = [];

  // ISO dates
  const isoMatches = text.match(DATE_PATTERNS.isoDate) || [];
  isoMatches.forEach((match) => {
    const parsed = new Date(match);
    if (!isNaN(parsed)) dates.push(parsed);
  });

  // US dates
  const usMatches = text.match(DATE_PATTERNS.usDate) || [];
  usMatches.forEach((match) => {
    const parsed = new Date(match);
    if (!isNaN(parsed)) dates.push(parsed);
  });

  // EU dates
  const euMatches = text.match(DATE_PATTERNS.euDate) || [];
  euMatches.forEach((match) => {
    const parsed = new Date(match);
    if (!isNaN(parsed)) dates.push(parsed);
  });

  return dates.sort((a, b) => b - a); // Most recent first
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTABLE SENTENCE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Criteria that make a sentence quotable by AI
 */
export const QUOTABLE_CRITERIA = {
  hasStatistic: (sentence) => STATISTIC_PATTERNS.percentage.test(sentence) ||
    STATISTIC_PATTERNS.measurements.test(sentence) ||
    STATISTIC_PATTERNS.ratings.test(sentence),

  hasAttribution: (sentence) => CITATION_PATTERNS.attribution.test(sentence),

  hasComparison: (sentence) => /\d+(?:\.\d+)?x\s+(?:faster|better|more)|compared to|versus|vs\.?/i.test(sentence),

  hasDefinition: (sentence) => /\bis\s+(?:a|an|the)\s+|defined as|refers to|means that/i.test(sentence),

  hasSpecificFact: (sentence) => /\d+(?:,\d{3})*(?:\.\d+)?\s+(?:users?|customers?|people|companies|products?)/i.test(sentence),

  isAppropriateLength: (sentence) => {
    const words = sentence.split(/\s+/).length;
    return words >= 8 && words <= 40;
  },
};

/**
 * Find quotable sentences in text
 */
export const findQuotableSentences = (text, limit = 10) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const quotables = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!QUOTABLE_CRITERIA.isAppropriateLength(trimmed)) continue;

    const reasons = [];

    if (QUOTABLE_CRITERIA.hasStatistic(trimmed)) {
      reasons.push('Contains statistic');
    }
    if (QUOTABLE_CRITERIA.hasAttribution(trimmed)) {
      reasons.push('Cites source');
    }
    if (QUOTABLE_CRITERIA.hasComparison(trimmed)) {
      reasons.push('Quantified comparison');
    }
    if (QUOTABLE_CRITERIA.hasDefinition(trimmed)) {
      reasons.push('Clear definition');
    }
    if (QUOTABLE_CRITERIA.hasSpecificFact(trimmed)) {
      reasons.push('Specific fact');
    }

    if (reasons.length > 0) {
      quotables.push({
        text: trimmed,
        reasons,
        score: reasons.length,
      });
    }
  }

  return quotables
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

export default {
  STATISTIC_PATTERNS,
  CITATION_PATTERNS,
  ORIGINAL_RESEARCH_PATTERNS,
  EEAT_PATTERNS,
  VAGUE_CONTENT_PATTERNS,
  DATE_PATTERNS,
  countStatistics,
  calculateFactDensity,
  countCitationSignals,
  countOriginalResearchSignals,
  analyzeEEATSignals,
  findUncitableContent,
  extractDates,
  findQuotableSentences,
};
