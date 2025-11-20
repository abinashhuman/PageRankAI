module.exports = {
  app: {
    name: 'PageRankAI',
    version: '1.0.0',
    description: 'AI-Powered SEO optimization for Shopify stores',
  },
  
  features: {
    seoAnalysis: true,
    contentOptimization: true,
    keywordGeneration: true,
    competitorAnalysis: true,
  },
  
  ai: {
    provider: 'openai',
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7,
  },
  
  shopify: {
    apiVersion: '2024-01',
    scopes: [
      'read_products',
      'write_products',
      'read_content',
      'write_content',
    ],
  },
  
  routes: {
    home: '/',
    login: '/login',
    landing: '/landing',
    dashboard: '/dashboard',
    analysis: '/analysis',
    optimization: '/optimization',
  },
  
  theme: {
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};
