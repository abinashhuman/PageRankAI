import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      <div className="auth-content">
        {children}
      </div>
      <div className="auth-branding">
        <h1>PageRankAI</h1>
        <p>AI-Powered SEO for Shopify Stores</p>
      </div>
    </div>
  );
};

export default AuthLayout;
