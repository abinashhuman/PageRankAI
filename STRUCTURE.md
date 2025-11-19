# Project Structure Guide

This guide explains the organization and purpose of each directory in the PageRankAI Shopify app.

## Directory Overview

### `/app`
Main application code directory containing all the client and server-side logic.

#### `/app/pages`
React page components that represent different routes in the application.

- **`/login`**: User authentication page
  - `index.jsx`: Login page component
  - `login.css`: Login page styles
  
- **`/landing`**: Marketing/home page
  - `index.jsx`: Landing page component
  - `landing.css`: Landing page styles

#### `/app/components`
Reusable React components organized by functionality.

- **`/auth`**: Authentication-related components
  - `AuthLayout.jsx`: Layout wrapper for auth pages
  - `AuthLayout.css`: Auth layout styles
  
- **`/common`**: Common UI components used throughout the app
  - `Button.jsx`: Reusable button component
  - `Button.css`: Button styles
  - `Input.jsx`: Form input component
  - `Input.css`: Input styles

#### `/app/api`
Backend API endpoints (serverless functions).

- `auth.js`: Authentication endpoint
- `seo-analysis.js`: SEO analysis endpoint
- `optimize-content.js`: Content optimization endpoint

#### `/app/utils`
Utility functions and helper modules.

- `api-client.js`: HTTP request wrapper
- `auth.js`: Authentication utilities
- `validation.js`: Form validation helpers

#### `/app/styles`
Global styles and CSS variables.

- `globals.css`: Global styles and utility classes
- `variables.css`: CSS custom properties for theming

---

### `/config`
Configuration files for the application.

- `shopify.app.toml`: Shopify app configuration
- `app.config.js`: Application-level configuration
- `README.md`: Configuration documentation

---

### `/prompts`
AI prompt templates for consistent AI interactions.

#### `/prompts/system`
System-level prompts used internally by the AI service.

- `seo-analysis.txt`: SEO analysis instructions
- `content-optimization.txt`: Content optimization instructions
- `keyword-generation.txt`: Keyword generation instructions

#### `/prompts/user`
User-facing prompt templates and examples.

- `analysis-request.txt`: Template for SEO analysis requests
- `optimization-request.txt`: Template for content optimization
- `examples.md`: Comprehensive usage examples

---

### `/public`
Static assets served directly to the browser.

- **`/images`**: Image files (logos, icons, illustrations)
- **`/fonts`**: Custom web fonts
- `README.md`: Asset guidelines

---

## File Naming Conventions

- **React Components**: PascalCase (e.g., `Button.jsx`, `AuthLayout.jsx`)
- **Utility Files**: camelCase (e.g., `api-client.js`, `validation.js`)
- **CSS Files**: kebab-case or match component name (e.g., `login.css`, `Button.css`)
- **Config Files**: kebab-case (e.g., `app.config.js`)

## Import Patterns

### Component Imports
```javascript
// Import individual components
import Button from './components/common/Button';
import Input from './components/common/Input';

// Or use index exports
import { Button, Input } from './components/common';
```

### Page Imports
```javascript
import LoginPage from './pages/login';
import LandingPage from './pages/landing';

// Or use index exports
import { LoginPage, LandingPage } from './pages';
```

### Utility Imports
```javascript
import apiClient from './utils/api-client';
import { validateEmail, validatePassword } from './utils/validation';
import { isAuthenticated, login, logout } from './utils/auth';
```

## Adding New Features

### Adding a New Page
1. Create directory in `/app/pages/[page-name]/`
2. Add `index.jsx` for the component
3. Add `[page-name].css` for styles
4. Export from `/app/pages/index.js`

### Adding a New Component
1. Create component file in appropriate directory
2. Create corresponding CSS file
3. Export from directory's `index.js`

### Adding a New API Endpoint
1. Create new file in `/app/api/`
2. Export default handler function
3. Follow existing patterns for error handling

### Adding New Prompts
1. Add prompt file to `/prompts/system/` or `/prompts/user/`
2. Update README in respective directory
3. Reference prompt in API endpoints as needed

## Best Practices

1. **Colocation**: Keep related files together (component + styles)
2. **Index Exports**: Use index files for cleaner imports
3. **CSS Modules**: Consider using CSS modules for component-specific styles
4. **Validation**: Use validation utilities for all form inputs
5. **API Client**: Use the api-client utility for all HTTP requests
6. **Error Handling**: Always handle errors in API endpoints
7. **Documentation**: Update README files when adding new features

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in required environment variables
3. Never commit `.env.local` to version control

## Development Workflow

1. Make changes in appropriate directories
2. Test locally with `npm run dev`
3. Run linter with `npm run lint`
4. Build for production with `npm run build`
5. Commit and push changes

## Next Steps

To start developing:

1. Install dependencies: `npm install`
2. Set up environment variables
3. Run development server: `npm run dev`
4. Start building features!

For detailed setup instructions, see the main [README.md](../README.md).
