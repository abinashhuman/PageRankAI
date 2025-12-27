import express from 'express';
import { LLMProcessor, getLLMProcessor } from '../../src/llm/llmProcessor.js';

const router = express.Router();

/**
 * GET /api/llm/status
 * Check LLM configuration status
 */
router.get('/status', (req, res) => {
  const processor = getLLMProcessor();
  const info = processor.getProviderInfo();

  res.json({
    available: info.isConfigured,
    provider: info.provider,
    model: info.model,
    message: info.isConfigured
      ? `LLM ready with ${info.provider} (${info.model})`
      : `LLM not configured. Set ${info.provider.toUpperCase()}_API_KEY environment variable.`,
  });
});

/**
 * POST /api/llm/enhance
 * Enhance existing GEO analysis with LLM insights
 *
 * Request body:
 * {
 *   pageData: { url, textContent, title, wordCount, ... },
 *   geoResults: { score, pageType, pillars, ... }
 * }
 */
router.post('/enhance', async (req, res) => {
  try {
    const { pageData, geoResults } = req.body;

    if (!pageData || !geoResults) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['pageData', 'geoResults'],
      });
    }

    const processor = getLLMProcessor();

    if (!processor.isReady()) {
      return res.status(503).json({
        error: 'LLM not configured',
        message: 'Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable',
        fallback: true,
      });
    }

    const enhancement = await processor.enhanceAnalysis(pageData, geoResults);

    res.json({
      success: !enhancement.error,
      enhancement,
      provider: processor.getProviderInfo(),
      cost: {
        estimated: '$0.01-0.03',
        model: processor.getProviderInfo().model,
      },
    });
  } catch (error) {
    console.error('LLM enhancement error:', error);
    res.status(500).json({
      error: 'LLM enhancement failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/llm/simulate-query
 * Simulate AI search response for a specific query
 *
 * Request body:
 * {
 *   query: "user search query",
 *   pageContent: "page text content",
 *   pageUrl: "https://..."
 * }
 */
router.post('/simulate-query', async (req, res) => {
  try {
    const { query, pageContent, pageUrl } = req.body;

    if (!query || !pageContent) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['query', 'pageContent'],
      });
    }

    const processor = getLLMProcessor();

    if (!processor.isReady()) {
      return res.status(503).json({
        error: 'LLM not configured',
        message: 'Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable',
      });
    }

    const simulation = await processor.simulateQueryTest(query, pageContent, pageUrl);

    res.json({
      success: !simulation.error,
      query,
      simulation,
      provider: processor.getProviderInfo(),
    });
  } catch (error) {
    console.error('Query simulation error:', error);
    res.status(500).json({
      error: 'Query simulation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/llm/citation-likelihood
 * Assess citation likelihood for a page
 *
 * Request body:
 * {
 *   pageData: { url, textContent, title, ... },
 *   geoResults: { score, pageType, ... }
 * }
 */
router.post('/citation-likelihood', async (req, res) => {
  try {
    const { pageData, geoResults } = req.body;

    if (!pageData) {
      return res.status(400).json({
        error: 'Missing pageData',
      });
    }

    const processor = getLLMProcessor();

    if (!processor.isReady()) {
      return res.status(503).json({
        error: 'LLM not configured',
      });
    }

    const assessment = await processor.assessCitationLikelihood(
      pageData,
      geoResults || { score: 0, pageType: 'other' }
    );

    res.json({
      success: !assessment.error,
      assessment,
      provider: processor.getProviderInfo(),
    });
  } catch (error) {
    console.error('Citation assessment error:', error);
    res.status(500).json({
      error: 'Citation assessment failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/llm/content-suggestions
 * Generate specific content improvement suggestions
 *
 * Request body:
 * {
 *   pageData: { url, textContent, title, ... },
 *   geoResults: { pillars, ... }
 * }
 */
router.post('/content-suggestions', async (req, res) => {
  try {
    const { pageData, geoResults } = req.body;

    if (!pageData) {
      return res.status(400).json({
        error: 'Missing pageData',
      });
    }

    const processor = getLLMProcessor();

    if (!processor.isReady()) {
      return res.status(503).json({
        error: 'LLM not configured',
      });
    }

    const suggestions = await processor.generateContentSuggestions(
      pageData,
      geoResults || { pillars: {} }
    );

    res.json({
      success: !suggestions.error,
      suggestions,
      provider: processor.getProviderInfo(),
    });
  } catch (error) {
    console.error('Content suggestions error:', error);
    res.status(500).json({
      error: 'Content suggestions failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/llm/query-simulation
 * Query simulation endpoint (alias for simulate-query with frontend-friendly response)
 *
 * Request body:
 * {
 *   query: "user search query",
 *   url: "https://...",
 *   pageContent: "page text content",
 *   geoScore: 500
 * }
 */
router.post('/query-simulation', async (req, res) => {
  try {
    const { query, url, pageContent, geoScore } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Missing required query field',
      });
    }

    const processor = getLLMProcessor();

    if (!processor.isReady()) {
      // Return a mock response when LLM is not configured
      return res.json({
        wouldCite: geoScore >= 500,
        confidence: 'Low (LLM not configured)',
        simulatedResponse: `Based on GEO score of ${geoScore}/800, this page ${geoScore >= 500 ? 'would likely' : 'may not'} be cited by AI search engines.`,
        reasoning: 'LLM not configured - using heuristic analysis based on GEO score.',
        improvements: geoScore < 500 ? [
          'Improve content depth and specificity',
          'Add more citable facts and statistics',
          'Include authoritative sources and citations',
        ] : [],
      });
    }

    const simulation = await processor.simulateQueryTest(query, pageContent || '', url);

    // Transform to frontend-friendly format
    res.json({
      wouldCite: simulation.wouldCite !== false,
      confidence: simulation.confidence || 'Medium',
      simulatedResponse: simulation.response || simulation.simulatedResponse || 'Analysis complete.',
      reasoning: simulation.reasoning || simulation.explanation,
      improvements: simulation.improvements || simulation.suggestions || [],
    });
  } catch (error) {
    console.error('Query simulation error:', error);
    res.status(500).json({
      error: 'Query simulation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/llm/deep-analysis
 * Deep AI analysis of page for GEO optimization
 *
 * Request body:
 * {
 *   url: "https://...",
 *   pageContent: "page text content",
 *   geoResults: { score, pillars, ... },
 *   seoResults: { score, categories, ... }
 * }
 */
router.post('/deep-analysis', async (req, res) => {
  try {
    const { url, pageContent, geoResults, seoResults } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'Missing required url field',
      });
    }

    const processor = getLLMProcessor();

    if (!processor.isReady()) {
      // Return a mock analysis when LLM is not configured
      const geoScore = geoResults?.score || 0;
      const seoScore = seoResults?.score || 0;

      return res.json({
        analysis: {
          summary: `Page analysis for ${url}: GEO Score ${geoScore}/800, SEO Score ${seoScore}/100. Configure LLM for detailed AI insights.`,
          strengths: geoScore >= 500 ? [
            'Good baseline GEO optimization',
            'Content meets minimum AI visibility requirements',
          ] : ['Analysis requires LLM configuration'],
          weaknesses: geoScore < 500 ? [
            'GEO score below optimal threshold',
            'May need more citable content',
          ] : [],
          actionItems: [
            'Configure Anthropic or OpenAI API key for deep analysis',
            'Review GEO pillars for improvement opportunities',
            'Add more structured data and citations',
          ],
        },
      });
    }

    // Use the enhance analysis for deep insights
    const pageData = {
      url,
      textContent: pageContent || '',
      title: '',
      wordCount: pageContent ? pageContent.split(/\s+/).length : 0,
    };

    const enhancement = await processor.enhanceAnalysis(pageData, geoResults || { score: 0 });

    res.json({
      analysis: {
        summary: enhancement.summary || enhancement.contentAnalysis?.summary,
        strengths: enhancement.strengths || [],
        weaknesses: enhancement.weaknesses || enhancement.contentAnalysis?.gaps || [],
        actionItems: enhancement.actionItems || enhancement.recommendations?.map(r => r.recommendation) || [],
        competitorInsights: enhancement.competitorInsights || null,
      },
      provider: processor.getProviderInfo(),
    });
  } catch (error) {
    console.error('Deep analysis error:', error);
    res.status(500).json({
      error: 'Deep analysis failed',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/llm/cache
 * Clear LLM response cache
 */
router.delete('/cache', (req, res) => {
  const processor = getLLMProcessor();
  processor.clearCache();

  res.json({
    success: true,
    message: 'LLM cache cleared',
  });
});

export { router as llmRouter };
