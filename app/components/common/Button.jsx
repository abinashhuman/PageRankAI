import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', size = 'medium', onClick, type = 'button', disabled = false }) => {
  const className = `btn btn-${variant} btn-${size}`;
  
  return (
    <button 
      className={className} 
      onClick={onClick} 
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
