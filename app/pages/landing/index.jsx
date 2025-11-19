import React from 'react';
import './landing.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <nav className="navbar">
          <div className="logo">
            <h2>PageRankAI</h2>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <a href="/login" className="btn-login">Login</a>
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Boost Your Shopify Store with AI-Powered SEO</h1>
          <p className="hero-subtitle">
            Leverage advanced AI to optimize your product pages and rank higher in search results
          </p>
          <div className="cta-buttons">
            <button className="btn-primary">Get Started</button>
            <button className="btn-secondary">Learn More</button>
          </div>
        </div>
        <div className="hero-image">
          <div className="placeholder-image">
            {/* Placeholder for hero illustration */}
            <span>🚀</span>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>AI-Powered Analysis</h3>
            <p>Analyze your product pages with advanced AI algorithms</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>SEO Optimization</h3>
            <p>Get actionable insights to improve your search rankings</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Integration</h3>
            <p>Seamlessly integrate with your Shopify store in minutes</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics Dashboard</h3>
            <p>Track your performance with detailed analytics</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Grow Your Business?</h2>
        <p>Join thousands of merchants using PageRankAI to boost their sales</p>
        <button className="btn-primary">Start Free Trial</button>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2024 PageRankAI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
