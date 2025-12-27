/**
 * Scoring Profiles Configuration Module
 *
 * Defines pillar weight multipliers for each page type.
 * Different page types have different optimization priorities.
 *
 * Multipliers adjust the base pillar weights:
 * - 1.0 = default weight
 * - >1.0 = increased importance for this page type
 * - <1.0 = decreased importance for this page type
 *
 * Research basis:
 * - Products need strong metadata and images
 * - Articles need citations and authority
 * - SaaS pages need clear value propositions and social proof
 * - Local businesses need trust signals and contact info
 */

/**
 * Base pillar configuration with weights
 * Total weights sum to 100% (1.0)
 */
export const PILLAR_CONFIG = {
  aiCrawlAccess: {
    name: 'AI Crawl Access & Snippet Controls',
    weight: 0.15,
    isGating: true,
    maxPoints: 100,
  },
  contentQuality: {
    name: 'Content Quality & Depth',
    weight: 0.12, // Replaces productMetadata for non-products
    isGating: false,
    maxPoints: 100,
  },
  productMetadata: {
    name: 'Product Metadata Readiness',
    weight: 0.12,
    isGating: false,
    maxPoints: 100,
  },
  entityDisambiguation: {
    name: 'Entity Disambiguation & Identifiers',
    weight: 0.08,
    isGating: false,
    maxPoints: 100,
  },
  informationArchitecture: {
    name: 'Machine-Scannable Information Architecture',
    weight: 0.10,
    isGating: false,
    maxPoints: 100,
  },
  answerability: {
    name: 'Answerability & Query Coverage',
    weight: 0.13,
    isGating: false,
    maxPoints: 100,
  },
  evidenceCitability: {
    name: 'Evidence, Justification & Citability',
    weight: 0.18,
    isGating: false,
    maxPoints: 100,
  },
  multimodalReadiness: {
    name: 'Multimodal Readiness',
    weight: 0.08,
    isGating: false,
    maxPoints: 100,
  },
  authoritySignals: {
    name: 'Authority & Trust Signals',
    weight: 0.16,
    isGating: false,
    maxPoints: 100,
  },
};

/**
 * Scoring profiles by page type
 * Each profile defines multipliers for pillar weights
 */
export const SCORING_PROFILES = {
  // ════════════════════════════════════════════════════════════════════════════
  // E-COMMERCE PROFILES
  // ════════════════════════════════════════════════════════════════════════════

  product: {
    description: 'Product pages need strong metadata, images, and specs',
    useProductMetadata: true,
    multipliers: {
      productMetadata: 1.0,
      entityDisambiguation: 1.0,
      informationArchitecture: 1.0,
      answerability: 1.0,
      evidenceCitability: 1.0,
      multimodalReadiness: 1.2, // Products need good images
      authoritySignals: 1.0,
    },
  },

  category: {
    description: 'Category pages emphasize navigation and architecture',
    useProductMetadata: true,
    multipliers: {
      productMetadata: 0.4,
      entityDisambiguation: 0.6,
      informationArchitecture: 1.4, // Navigation is key
      answerability: 0.7,
      evidenceCitability: 0.6,
      multimodalReadiness: 0.8,
      authoritySignals: 0.8,
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // CONTENT PROFILES
  // ════════════════════════════════════════════════════════════════════════════

  article: {
    description: 'Articles need strong citations and author authority',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 1.2,
      entityDisambiguation: 0.5,
      informationArchitecture: 1.0,
      answerability: 0.8,
      evidenceCitability: 1.4, // Articles need strong citations
      multimodalReadiness: 0.7,
      authoritySignals: 1.3, // Author authority matters
    },
  },

  news: {
    description: 'News articles emphasize freshness and source citations',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 1.3,
      entityDisambiguation: 0.6,
      informationArchitecture: 1.0,
      answerability: 0.9,
      evidenceCitability: 1.5, // Sources and quotes critical
      multimodalReadiness: 0.8,
      authoritySignals: 1.3, // Publication authority
    },
  },

  documentation: {
    description: 'Docs need clear structure, examples, and howto coverage',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 1.0,
      entityDisambiguation: 0.6,
      informationArchitecture: 1.5, // TOC, code blocks, hierarchy
      answerability: 1.4, // How-to coverage
      evidenceCitability: 1.0, // Examples, code samples
      multimodalReadiness: 0.5,
      authoritySignals: 0.8,
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // BUSINESS PROFILES
  // ════════════════════════════════════════════════════════════════════════════

  saas: {
    description: 'SaaS pages need clear pricing, features, and social proof',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 1.0,
      entityDisambiguation: 0.8,
      informationArchitecture: 1.2, // Feature lists, pricing tables
      answerability: 1.3, // FAQ, "how it works"
      evidenceCitability: 1.0, // Stats, testimonials
      multimodalReadiness: 0.8, // Screenshots, demos
      authoritySignals: 1.2, // Social proof, logos
    },
  },

  localBusiness: {
    description: 'Local businesses need NAP consistency and trust signals',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 0.8,
      entityDisambiguation: 1.3, // NAP consistency critical
      informationArchitecture: 0.8,
      answerability: 1.2, // Hours, services, contact
      evidenceCitability: 0.8,
      multimodalReadiness: 1.2, // Photos of location
      authoritySignals: 1.4, // Reviews, certifications
    },
  },

  portfolio: {
    description: 'Portfolio pages showcase work samples and testimonials',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 1.0,
      entityDisambiguation: 0.7,
      informationArchitecture: 1.0,
      answerability: 0.8,
      evidenceCitability: 1.3, // Case studies, metrics
      multimodalReadiness: 1.4, // Work samples, screenshots
      authoritySignals: 1.2, // Testimonials, client logos
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // COMPARISON & DIRECTORY PROFILES
  // ════════════════════════════════════════════════════════════════════════════

  comparison: {
    description: 'Comparison pages need structured tables and data',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 1.1,
      entityDisambiguation: 1.0,
      informationArchitecture: 1.3, // Tables, structured comparison
      answerability: 1.4, // "Which is better for X?"
      evidenceCitability: 1.2, // Data-backed comparisons
      multimodalReadiness: 0.7,
      authoritySignals: 1.0,
    },
  },

  directory: {
    description: 'Directory pages emphasize filtering and navigation',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 0.8,
      entityDisambiguation: 0.8,
      informationArchitecture: 1.4, // Filtering, navigation
      answerability: 1.0,
      evidenceCitability: 0.7,
      multimodalReadiness: 0.6,
      authoritySignals: 0.9,
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // MARKETING PROFILES
  // ════════════════════════════════════════════════════════════════════════════

  landing: {
    description: 'Landing pages focus on conversion and value proposition',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 1.0,
      entityDisambiguation: 0.9,
      informationArchitecture: 1.1,
      answerability: 1.2,
      evidenceCitability: 1.1, // Social proof, stats
      multimodalReadiness: 1.0,
      authoritySignals: 1.2,
    },
  },

  homepage: {
    description: 'Homepages need clear brand identity and navigation',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 0.9,
      entityDisambiguation: 1.0, // Brand clarity
      informationArchitecture: 1.2, // Navigation, structure
      answerability: 0.8,
      evidenceCitability: 0.9,
      multimodalReadiness: 0.9,
      authoritySignals: 1.3, // Organization schema
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // DEFAULT PROFILE
  // ════════════════════════════════════════════════════════════════════════════

  other: {
    description: 'Default profile with balanced weights',
    useProductMetadata: false,
    multipliers: {
      contentQuality: 1.0,
      entityDisambiguation: 1.0,
      informationArchitecture: 1.0,
      answerability: 1.0,
      evidenceCitability: 1.0,
      multimodalReadiness: 1.0,
      authoritySignals: 1.0,
    },
  },
};

/**
 * Get scoring profile for a page type
 * @param {string} pageType - The detected page type
 * @returns {Object} The scoring profile
 */
export const getScoringProfile = (pageType) => {
  return SCORING_PROFILES[pageType] || SCORING_PROFILES.other;
};

/**
 * Check if page type should use product metadata pillar
 * @param {string} pageType - The detected page type
 * @returns {boolean}
 */
export const shouldUseProductMetadata = (pageType) => {
  const profile = getScoringProfile(pageType);
  return profile.useProductMetadata === true;
};

/**
 * Get effective pillar weight for a page type
 * @param {string} pageType - The detected page type
 * @param {string} pillarKey - The pillar key
 * @returns {number} The effective weight
 */
export const getEffectivePillarWeight = (pageType, pillarKey) => {
  const profile = getScoringProfile(pageType);
  const baseConfig = PILLAR_CONFIG[pillarKey];

  if (!baseConfig) return 0;

  const multiplier = profile.multipliers[pillarKey] || 1.0;
  return baseConfig.weight * multiplier;
};

export default SCORING_PROFILES;
