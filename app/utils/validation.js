/**
 * Validation utilities
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters
  return password && password.length >= 8;
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateForm = (fields, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach((field) => {
    const value = fields[field];
    const fieldRules = rules[field];
    
    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = 'This field is required';
    }
    
    if (fieldRules.email && !validateEmail(value)) {
      errors[field] = 'Invalid email address';
    }
    
    if (fieldRules.password && !validatePassword(value)) {
      errors[field] = 'Password must be at least 8 characters';
    }
    
    if (fieldRules.url && !validateUrl(value)) {
      errors[field] = 'Invalid URL';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
