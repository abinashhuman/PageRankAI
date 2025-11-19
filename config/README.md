# Shopify App Configuration

This directory contains configuration files for the PageRankAI Shopify app.

## Files

- `shopify.app.toml` - Main Shopify app configuration
- `app.config.js` - Application-specific configuration
- `routes.js` - API and page routes configuration

## Environment Variables

Create a `.env.local` file with the following variables:

```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=your_app_url
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
```

## Setup

1. Install dependencies: `npm install`
2. Configure environment variables
3. Run development server: `npm run dev`
