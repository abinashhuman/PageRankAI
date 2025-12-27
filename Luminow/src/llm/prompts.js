/**
 * LLM Prompt Templates
 *
 * Centralized prompts for GEO analysis LLM calls.
 * Designed for both Claude and GPT models.
 *
 * Template variables use {{VARIABLE}} syntax.
 */

/**
 * Prompt for assessing citation likelihood
 * Evaluates how likely AI search engines would cite this content
 */
export const CITATION_ASSESSMENT_PROMPT = `You are simulating how AI search engines (ChatGPT, Perplexity, Claude) evaluate sources for citation.

PAGE CONTENT (truncated to 3000 chars):
{{CONTENT}}

PAGE METADATA:
- URL: {{URL}}
- Title: {{TITLE}}
- Word Count: {{WORD_COUNT}}
- Page Type: {{PAGE_TYPE}}
- Has Schema: {{HAS_SCHEMA}}

CURRENT GEO SCORE: {{GEO_SCORE}}/800

TASK: Evaluate this page's likelihood of being cited by AI systems. Score each factor 1-10:

1. SPECIFICITY: Contains specific facts, numbers, measurements that AI can quote?
2. AUTHORITY: Claims backed by sources, certifications, or demonstrated expertise?
3. STRUCTURE: Information organized in a way that's easy to extract in chunks?
4. FRESHNESS: Signals that this content is current and maintained?
5. UNIQUENESS: Offers information not easily found elsewhere?

Then provide:
- OVERALL_CITATION_SCORE: 1-100 (likelihood of being cited)
- TOP_3_IMPROVEMENTS: Specific, actionable changes to increase citation likelihood
- SAMPLE_QUERIES: 3 queries this page could rank for in AI search

Format response as JSON:
{
  "scores": {
    "specificity": 0,
    "authority": 0,
    "structure": 0,
    "freshness": 0,
    "uniqueness": 0
  },
  "overallScore": 0,
  "improvements": ["...", "...", "..."],
  "sampleQueries": ["...", "...", "..."],
  "reasoning": "One paragraph explanation of the assessment"
}`;

/**
 * Prompt for analyzing query coverage
 * Identifies what questions the page can answer
 */
export const QUERY_COVERAGE_PROMPT = `Given this page content, identify what questions it can answer.

PAGE CONTENT (truncated):
{{CONTENT}}

TITLE: {{TITLE}}

Generate a list of 5-10 questions this page could answer. For each:
- Rate 1-5 how COMPLETELY the page answers it (5 = fully answered with evidence)
- Note if answer is EXPLICIT (directly stated) or INFERRED (requires interpretation)

Also identify:
- Main topics covered
- Topics that SHOULD be covered but aren't (content gaps)

Format as JSON:
{
  "queries": [
    {
      "question": "...",
      "answerQuality": 0,
      "answerType": "explicit|inferred",
      "evidence": "Brief quote or description of where answer is found"
    }
  ],
  "topicsCovered": ["topic1", "topic2", "..."],
  "missingTopics": ["topic that should be covered but isn't"],
  "overallCoverage": "Brief assessment of query coverage depth"
}`;

/**
 * Prompt for generating content suggestions
 * Provides specific improvements to increase AI citability
 */
export const CONTENT_SUGGESTIONS_PROMPT = `You are an expert in Generative Engine Optimization (GEO) - optimizing content for AI search citation.

PAGE: {{TITLE}}
WEAK AREAS: {{WEAK_PILLARS}}

CONTENT SAMPLE:
{{CONTENT}}

Generate 3 SPECIFIC content improvements that would increase AI citation likelihood.

For each suggestion:
1. Quote the EXACT sentence to improve (or describe location to add content)
2. Provide the improved/new text (ready to copy-paste)
3. Explain why this increases citability

Focus on:
- Adding specific statistics or measurements
- Including source citations ("According to...")
- Creating quotable definitions or facts
- Improving structure for AI extraction

Format as JSON:
{
  "suggestions": [
    {
      "location": "Exact quote or description of where to make change",
      "currentText": "Existing text if modifying (or null if adding new)",
      "improvedText": "New or improved text - ready to use",
      "rationale": "Why this increases AI citation likelihood",
      "pillarImpact": "Which GEO pillar this improves",
      "estimatedImpact": "low|medium|high"
    }
  ],
  "quickWins": ["1-2 immediate changes that take <5 minutes"],
  "strategicChanges": ["Larger changes requiring more effort but higher impact"]
}`;

/**
 * Prompt for simulating AI search response
 * Tests whether AI would cite this page for a specific query
 */
export const QUERY_SIMULATION_PROMPT = `You are simulating an AI search engine (like Perplexity or ChatGPT with browsing).

USER QUERY: "{{QUERY}}"

CANDIDATE SOURCE:
URL: {{URL}}
CONTENT (first 2500 chars):
{{CONTENT}}

TASK: Would you cite this source when answering the query?

Consider:
1. Does it directly answer the query? (not tangentially related)
2. Does it have specific facts/numbers to cite? (not vague claims)
3. Is it authoritative/trustworthy? (credible source)
4. Is the information current? (not outdated)

Respond in JSON:
{
  "wouldCite": true,
  "citationProbability": 0,
  "reasoning": "Why this source would or would not be cited",
  "whatWouldGetCited": "Specific sentence or fact that would be quoted (if cited)",
  "whatsMissing": ["List of things needed to be cited for this query"],
  "competitorAdvantages": ["What top-ranking sources for this query probably have that this page lacks"],
  "suggestedImprovements": ["Specific changes to make this page more citable for this query"]
}`;

/**
 * Prompt for competitive citation analysis
 * Compares page against competitors for specific queries
 */
export const COMPETITIVE_ANALYSIS_PROMPT = `Analyze why AI search engines might prefer competitor content over this page.

YOUR PAGE:
URL: {{YOUR_URL}}
CONTENT SUMMARY: {{YOUR_CONTENT}}
GEO SCORE: {{YOUR_SCORE}}/800

TARGET QUERY: "{{QUERY}}"

COMPETITOR URLS (top-cited for this query):
{{COMPETITOR_URLS}}

Based on typical AI citation patterns, analyze:
1. What do top-cited pages for this query usually have?
2. What specific elements is this page missing?
3. What would make this page the #1 cited source?

Format as JSON:
{
  "queryIntent": "What the user is really asking",
  "typicalTopSource": "Description of what a top-cited source looks like",
  "thisPageGaps": [
    {
      "gap": "What's missing",
      "importance": "high|medium|low",
      "howToFix": "Specific action"
    }
  ],
  "competitiveAdvantages": ["What this page does better than typical sources"],
  "pathToTop": "Step-by-step plan to become the most-cited source"
}`;

/**
 * Prompt for E-E-A-T signal enhancement
 * Suggests improvements for Experience, Expertise, Authority, Trust
 */
export const EEAT_ENHANCEMENT_PROMPT = `Analyze and enhance E-E-A-T signals for AI citation.

PAGE CONTENT:
{{CONTENT}}

CURRENT E-E-A-T SIGNALS DETECTED:
{{EEAT_SIGNALS}}

For each E-E-A-T dimension, provide specific additions:

EXPERIENCE: First-hand experience signals (tested, used, tried)
EXPERTISE: Credential and knowledge signals
AUTHORITY: Recognition and citation signals
TRUST: Transparency and reliability signals

Format as JSON:
{
  "experience": {
    "currentSignals": ["What's already there"],
    "missing": ["What's missing"],
    "addThisText": "Specific sentence to add for experience signal"
  },
  "expertise": {
    "currentSignals": [],
    "missing": [],
    "addThisText": ""
  },
  "authority": {
    "currentSignals": [],
    "missing": [],
    "addThisText": ""
  },
  "trust": {
    "currentSignals": [],
    "missing": [],
    "addThisText": ""
  },
  "overallEEATScore": 0,
  "priorityFix": "The single most impactful E-E-A-T improvement"
}`;

export default {
  CITATION_ASSESSMENT_PROMPT,
  QUERY_COVERAGE_PROMPT,
  CONTENT_SUGGESTIONS_PROMPT,
  QUERY_SIMULATION_PROMPT,
  COMPETITIVE_ANALYSIS_PROMPT,
  EEAT_ENHANCEMENT_PROMPT,
};
