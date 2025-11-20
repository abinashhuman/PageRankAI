# Quick Start Guide

Get your PageRankAI Shopify app up and running in minutes!

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Shopify Partner account
- OpenAI API key

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the environment template:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key
```

### 3. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Available Pages

- **Landing Page**: `/` or `/landing` - Marketing page
- **Login Page**: `/login` - User authentication

## Project Structure

```
PageRankAI/
├── app/
│   ├── pages/           # Login & Landing pages
│   ├── components/      # Reusable UI components
│   ├── api/            # Backend endpoints
│   ├── utils/          # Helper functions
│   └── styles/         # Global styles
├── prompts/
│   ├── system/         # AI system prompts
│   └── user/           # User prompt templates
├── config/             # App configuration
└── public/             # Static assets
```

## Next Steps

### 1. Customize Pages
- Edit `app/pages/login/index.jsx` for login customization
- Edit `app/pages/landing/index.jsx` for landing page content

### 2. Configure Prompts
- Review prompts in `prompts/system/` for AI behavior
- Check `prompts/user/examples.md` for usage examples

### 3. Implement API Logic
- Add authentication in `app/api/auth.js`
- Integrate AI service in `app/api/seo-analysis.js`
- Connect to Shopify API in API endpoints

### 4. Add Components
- Create new components in `app/components/`
- Use existing Button and Input components

### 5. Style Your App
- Modify CSS variables in `app/styles/variables.css`
- Update global styles in `app/styles/globals.css`

## Common Tasks

### Adding a New Page
1. Create folder in `app/pages/[name]/`
2. Add `index.jsx` and `[name].css`
3. Export from `app/pages/index.js`

### Adding a Component
1. Create file in `app/components/common/[Name].jsx`
2. Add styles in `[Name].css`
3. Export from `app/components/common/index.js`

### Using Prompts
Load prompts in your API endpoints:
```javascript
import fs from 'fs';
import path from 'path';

const promptPath = path.join(process.cwd(), 'prompts/system/seo-analysis.txt');
const systemPrompt = fs.readFileSync(promptPath, 'utf-8');
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Check code style

## Troubleshooting

### Port Already in Use
```bash
# Use a different port
PORT=3001 npm run dev
```

### Missing Dependencies
```bash
# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading
- Ensure file is named `.env.local` (not `.env`)
- Restart the development server after changes

## Documentation

- **README.md** - Project overview and features
- **STRUCTURE.md** - Detailed structure guide
- **config/README.md** - Configuration details
- **prompts/*/README.md** - Prompt documentation

## Support

Need help? Check:
1. Documentation files in the repository
2. Shopify Partner documentation
3. Next.js documentation
4. Create an issue on GitHub

## Ready to Build! 🚀

Your Shopify app structure is ready. Start building amazing features!

For detailed information, see [README.md](README.md) and [STRUCTURE.md](STRUCTURE.md).
