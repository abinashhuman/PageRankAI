import express from 'express';
import { WebScraper } from '../../src/scrapers/webScraper.js';
import { SEOAnalyzer } from '../../src/analyzers/seoAnalyzer.js';
import { GEOAnalyzer } from '../../src/analyzers/geoAnalyzer.js';
import { ResultsStorage } from '../../src/storage/resultsStorage.js';

const router = express.Router();
const storage = new ResultsStorage();

/**
 * POST /api/analyze
 * Analyze a URL for SEO and GEO optimization
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

    // Step 1: Scrape the webpage
    const scraper = new WebScraper();
    const pageData = await scraper.scrape(url);

    // Step 2: Run SEO Analysis
    const seoAnalyzer = new SEOAnalyzer();
    const seoResults = seoAnalyzer.analyze(pageData);

    // Step 3: Run GEO Analysis
    const geoAnalyzer = new GEOAnalyzer();
    const geoResults = geoAnalyzer.analyze(pageData);

    // Step 4: Calculate overall scores
    const overallResults = {
      id: crypto.randomUUID(),
      url,
      analyzedAt: new Date().toISOString(),
      pageData: {
        title: pageData.title,
        url: pageData.url,
        loadTime: pageData.loadTime,
      },
      seo: seoResults,
      geo: geoResults,
      overallScore: calculateOverallScore(seoResults, geoResults),
    };

    // Step 5: Store results
    await storage.save(overallResults);

    console.log(`Analysis complete for: ${url}`);

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
 */
function calculateOverallScore(seoResults, geoResults) {
  const seoWeight = 0.5;
  const geoWeight = 0.5;

  const combinedScore = (seoResults.score * seoWeight) + (geoResults.score * geoWeight);

  let grade;
  if (combinedScore >= 90) grade = 'A+';
  else if (combinedScore >= 80) grade = 'A';
  else if (combinedScore >= 70) grade = 'B';
  else if (combinedScore >= 60) grade = 'C';
  else if (combinedScore >= 50) grade = 'D';
  else grade = 'F';

  return {
    score: Math.round(combinedScore),
    grade,
    breakdown: {
      seo: seoResults.score,
      geo: geoResults.score,
    },
  };
}

export { router as analyzeRouter };
