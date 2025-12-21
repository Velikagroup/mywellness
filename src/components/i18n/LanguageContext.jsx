import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  const languageRef = React.useRef(forcedLanguage || DEFAULT_LANGUAGE);
  
  // ALWAYS use forcedLanguage if provided, otherwise fallback
  const [language, setLanguageState] = useState(() => {
    if (forcedLanguage) {
      languageRef.current = forcedLanguage;
      return forcedLanguage;
    }
    
    const urlLang = getLanguageFromPath(window.location.pathname);
    if (urlLang) {
      languageRef.current = urlLang;
      return urlLang;
    }
    
    const storedLang = localStorage.getItem('preferred_language');
    if (storedLang && SUPPORTED_LANGUAGES.some(l => l.code === storedLang)) {
      languageRef.current = storedLang;
      return storedLang;
    }
    
    const browserLang = getBrowserLanguage();
    languageRef.current = browserLang;
    return browserLang;
  });

  // Update language when forcedLanguage or URL changes
  useEffect(() => {
    if (forcedLanguage) {
      languageRef.current = forcedLanguage;
      setLanguageState(forcedLanguage);
      localStorage.setItem('preferred_language', forcedLanguage);
      return;
    }
    
    const urlLang = getLanguageFromPath(location.pathname);
    if (urlLang && urlLang !== language) {
      languageRef.current = urlLang;
      setLanguageState(urlLang);
      localStorage.setItem('preferred_language', urlLang);
    }
  }, [location.pathname, forcedLanguage, language]);

  // Translation function - no dependencies, reads from ref directly
  const t = React.useCallback((key, params = {}) => {
    const currentLang = languageRef.current;
    const keys = key.split('.');
    let value = translations[currentLang];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation missing for key "${key}" in language "${currentLang}"`, value);
      return key;
    }
    
    return value.replace(/\{(\w+)\}/g, (match, paramName) => {
      return params[paramName] !== undefined ? params[paramName] : match;
    });
  }, []);

  const setLanguage = React.useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === newLang)) return;
    languageRef.current = newLang;
    setLanguageState(newLang);
    localStorage.setItem('preferred_language', newLang);
  }, []);

  const contextValue = React.useMemo(() => ({
    language,
    setLanguage,
    t,
    SUPPORTED_LANGUAGES
  }), [language, setLanguage, t]);
  
  return (
    <LanguageContext.Provider value={contextValue}>
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