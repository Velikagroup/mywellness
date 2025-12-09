import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { translations } from './translations';

export const SUPPORTED_LANGUAGES = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

export const DEFAULT_LANGUAGE = 'it';

const LanguageContext = createContext();

// Utility to extract language from URL path
export const getLanguageFromPath = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const potentialLang = segments[0];
    if (SUPPORTED_LANGUAGES.some(l => l.code === potentialLang)) {
      return potentialLang;
    }
  }
  return null;
};

// Utility to get browser language preference
const getBrowserLanguage = () => {
  const browserLang = navigator.language?.split('-')[0];
  if (SUPPORTED_LANGUAGES.some(l => l.code === browserLang)) {
    return browserLang;
  }
  return DEFAULT_LANGUAGE;
};

export function LanguageProvider({ children, forcedLanguage = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial language
  const getInitialLanguage = () => {
    if (forcedLanguage) return forcedLanguage;
    
    const urlLang = getLanguageFromPath(window.location.pathname);
    if (urlLang) return urlLang;
    
    const storedLang = localStorage.getItem('preferred_language');
    if (storedLang && SUPPORTED_LANGUAGES.some(l => l.code === storedLang)) {
      return storedLang;
    }
    
    return getBrowserLanguage();
  };
  
  // Initialize language state
  const [language, setLanguageState] = useState(getInitialLanguage);

  // Update language when forcedLanguage or URL changes
  useEffect(() => {
    if (forcedLanguage) {
      setLanguageState(forcedLanguage);
      return;
    }
    
    const urlLang = getLanguageFromPath(location.pathname);
    if (urlLang && urlLang !== language) {
      setLanguageState(urlLang);
      localStorage.setItem('preferred_language', urlLang);
    }
  }, [location.pathname, language, forcedLanguage]);

  // Change language (without URL changes for now)
  const setLanguage = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === newLang)) return;
    
    setLanguageState(newLang);
    localStorage.setItem('preferred_language', newLang);
  }, []);

  // Translation function - always uses current language state
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    
    // Use forcedLanguage if available, otherwise use state
    const currentLang = forcedLanguage || language;
    let value = translations[currentLang];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      // Fallback to Italian if translation not found
      const fallbackKeys = key.split('.');
      let fallbackValue = translations[DEFAULT_LANGUAGE];
      for (const k of fallbackKeys) {
        fallbackValue = fallbackValue?.[k];
      }
      if (typeof fallbackValue === 'string') {
        return fallbackValue;
      }
      return key;
    }
    
    // Replace parameters like {name} with actual values
    return value.replace(/\{(\w+)\}/g, (match, paramName) => {
      return params[paramName] !== undefined ? params[paramName] : match;
    });
  }, [language, forcedLanguage]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Export utility for creating localized page URLs
export function createLocalizedPageUrl(pageName, language, params = {}) {
  // For default language (Italian), use normal routes without language prefix
  const langPrefix = language === DEFAULT_LANGUAGE ? '' : `/${language}`;
  
  // Map page names to URL paths
  const pageRoutes = {
    'Home': '',
    'Dashboard': '/dashboard',
    'Meals': '/meals',
    'Workouts': '/workouts',
    'Settings': '/settings',
    'Quiz': '/quiz',
    'pricing': '/pricing',
    'Blog': '/blog',
    'BlogArticle': '/blog',
    'Privacy': '/privacy',
    'Terms': '/terms',
    'Checkout': '/checkout',
    'TrialSetup': '/trial-setup',
    'ThankYou': '/thank-you',
    'LandingCheckout': '/landing-checkout',
    'OneTimeOffer': '/one-time-offer',
    'ResetPassword': '/reset-password',
    'Landing': '/landing',
    'NotFound': '/404',
    // Admin pages
    'AdminClients': '/admin/clients',
    'AdminSupportTickets': '/admin/support-tickets',
    'AdminFeedback': '/admin/feedback',
    'AdminCoupons': '/admin/coupons',
    'AdminBlog': '/admin/blog',
    'AdminEmails': '/admin/emails',
    'AdminAnalytics': '/admin/analytics',
    'AdminMarketing': '/admin/marketing',
    'AdminSalesTax': '/admin/sales-tax'
  };
  
  const path = pageRoutes[pageName] !== undefined ? pageRoutes[pageName] : `/${pageName.toLowerCase()}`;
  let url = langPrefix ? `${langPrefix}${path}` : (path || '/');
  
  // Add query parameters
  const queryString = new URLSearchParams(params).toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
}