# PageRankAI

AI-Powered SEO Optimization for Shopify Stores

## Overview

PageRankAI is a Shopify app that leverages advanced AI to optimize product pages and improve search engine rankings. The app provides intelligent SEO analysis, content optimization, and keyword generation to help merchants boost their organic traffic and sales.

## Features

- 🎯 **AI-Powered SEO Analysis**: Analyze product pages with advanced AI algorithms
- 📝 **Content Optimization**: Generate SEO-optimized product descriptions
- 🔑 **Keyword Generation**: Discover high-impact keywords for your products
- 📊 **Analytics Dashboard**: Track performance and improvements
- ⚡ **Fast Integration**: Seamlessly integrate with your Shopify store

## Directory Structure

```
PageRankAI/
├── app/                    # Application code
│   ├── pages/             # Page components
│   │   ├── login/         # Login page
│   │   └── landing/       # Landing page
│   ├── components/        # Reusable components
│   │   ├── auth/         # Authentication components
│   │   └── common/       # Common UI components
│   ├── api/              # API endpoints
│   ├── utils/            # Utility functions
│   └── styles/           # Global styles
├── config/               # Configuration files
├── prompts/              # AI prompts
│   ├── system/          # System-level prompts
│   └── user/            # User-facing prompts
├── public/              # Static assets
│   ├── images/          # Images and logos
│   └── fonts/           # Web fonts
└── package.json         # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Shopify Partner account
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abinashhuman/PageRankAI.git
cd PageRankAI
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

See `config/README.md` for detailed configuration instructions.

### Environment Variables

Create a `.env.local` file with:

```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=your_app_url
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
```

## AI Prompts

The `prompts/` directory contains carefully crafted prompts for consistent AI interactions:

- **System Prompts** (`prompts/system/`): Core AI instructions for SEO analysis, content optimization, and keyword generation
- **User Prompts** (`prompts/user/`): Templates and examples for users to interact with AI features

See `prompts/user/examples.md` for usage examples.

## Pages

### Login Page (`app/pages/login/`)
- User authentication
- Email/password login
- Forgot password functionality

### Landing Page (`app/pages/landing/`)
- Marketing content
- Feature showcase
- Call-to-action sections
- Responsive design

## Components

### Authentication (`app/components/auth/`)
- AuthLayout: Wrapper for authentication pages

### Common (`app/components/common/`)
- Button: Reusable button component with variants
- Input: Form input component with validation

## API Endpoints

- `/api/auth` - Authentication
- `/api/seo-analysis` - SEO analysis of product pages
- `/api/optimize-content` - Content optimization

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Development

### Project Structure

- **Pages**: React components in `app/pages/`
- **Components**: Reusable UI components in `app/components/`
- **Styles**: CSS files co-located with components
- **Utils**: Helper functions in `app/utils/`
- **API**: Backend endpoints in `app/api/`

### Styling

- Uses CSS modules and global styles
- CSS variables for theming (see `app/styles/variables.css`)
- Responsive design with mobile-first approach

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For support, email support@pagerankai.com or open an issue in the repository.

## Acknowledgments

- Built with Next.js and React
- Powered by OpenAI
- Designed for Shopify