import express from 'express';
import { WebScraper } from '../../src/scrapers/webScraper.js';
import { SEOAnalyzer } from '../../src/analyzers/seoAnalyzer.js';
import { GEOAnalyzer } from '../../src/analyzers/geoAnalyzer.js';
import { ResultsStorage } from '../../src/storage/resultsStorage.js';

const router = express.Router();
const storage = new ResultsStorage();

/**
 * POST /api/analyze
 * Analyze a URL for SEO (0-100) and GEO (0-800) optimization
 * Based on the LuMinoSity Algorithm specification
 */
router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    console.log(`Starting analysis for: ${url}`);

    // Phase 1 & 2: Scrape the webpage (Acquire & Understand)
    const scraper = new WebScraper();
    const pageData = await scraper.scrape(url);

    // Phase 3: Run SEO Analysis (0-100 score)
    const seoAnalyzer = new SEOAnalyzer();
    const seoResults = seoAnalyzer.analyze(pageData);

    // Phase 4: Run GEO Analysis (0-800 score)
    const geoAnalyzer = new GEOAnalyzer();
    const geoResults = geoAnalyzer.analyze(pageData);

    // Phase 5: Compile overall results
    const overallResults = {
      id: crypto.randomUUID(),
      url,
      analyzedAt: new Date().toISOString(),

      // Page metadata
      pageInfo: {
        title: pageData.title,
        url: pageData.url,
        finalUrl: pageData.finalUrl,
        loadTime: pageData.loadTime,
        statusCode: pageData.statusCode,
        pageType: pageData.pageType,
        wordCount: pageData.wordCount,
      },

      // SEO Results (0-100)
      seo: seoResults,

      // GEO Results (0-800)
      geo: geoResults,

      // Combined scoring
      overallScore: calculateOverallScore(seoResults, geoResults),

      // Extracted product data (for e-commerce pages)
      extractedProduct: pageData.pageType?.isProductPage ? pageData.productData : null,
    };

    // Store results
    await storage.save(overallResults);

    console.log(`Analysis complete for: ${url}`);
    console.log(`  SEO Score: ${seoResults.score}/100`);
    console.log(`  GEO Score: ${geoResults.score}/800 (${geoResults.band?.band})`);

    res.json(overallResults);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze URL',
      message: error.message,
    });
  }
});

/**
 * Calculate overall score combining SEO and GEO
 * SEO: 0-100, GEO: 0-800
 * Overall: weighted combination normalized to 0-100
 */
function calculateOverallScore(seoResults, geoResults) {
  // Normalize GEO score to 0-100 scale
  const geoNormalized = (geoResults.score / 800) * 100;

  // Weight: 50% SEO, 50% GEO
  const seoWeight = 0.5;
  const geoWeight = 0.5;

  const combinedScore = (seoResults.score * seoWeight) + (geoNormalized * geoWeight);

  // Calculate letter grade
  let grade;
  if (combinedScore >= 90) grade = 'A+';
  else if (combinedScore >= 85) grade = 'A';
  else if (combinedScore >= 80) grade = 'A-';
  else if (combinedScore >= 75) grade = 'B+';
  else if (combinedScore >= 70) grade = 'B';
  else if (combinedScore >= 65) grade = 'B-';
  else if (combinedScore >= 60) grade = 'C+';
  else if (combinedScore >= 55) grade = 'C';
  else if (combinedScore >= 50) grade = 'C-';
  else if (combinedScore >= 45) grade = 'D+';
  else if (combinedScore >= 40) grade = 'D';
  else grade = 'F';

  return {
    score: Math.round(combinedScore),
    grade,
    breakdown: {
      seo: {
        score: seoResults.score,
        maxScore: 100,
        weight: '50%',
      },
      geo: {
        score: geoResults.score,
        maxScore: 800,
        normalized: Math.round(geoNormalized),
        band: geoResults.band?.band,
        weight: '50%',
      },
    },
  };
}

export { router as analyzeRouter };
