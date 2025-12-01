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

export function LanguageProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize language from URL, localStorage, or browser preference
  const [language, setLanguageState] = useState(() => {
    const urlLang = getLanguageFromPath(window.location.pathname);
    if (urlLang) return urlLang;
    
    const storedLang = localStorage.getItem('preferred_language');
    if (storedLang && SUPPORTED_LANGUAGES.some(l => l.code === storedLang)) {
      return storedLang;
    }
    
    return getBrowserLanguage();
  });

  // Update language when URL changes
  useEffect(() => {
    const urlLang = getLanguageFromPath(location.pathname);
    if (urlLang && urlLang !== language) {
      setLanguageState(urlLang);
      localStorage.setItem('preferred_language', urlLang);
    }
  }, [location.pathname, language]);

  // Change language and update URL
  const setLanguage = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === newLang)) return;
    
    setLanguageState(newLang);
    localStorage.setItem('preferred_language', newLang);
    
    // Update URL with new language prefix
    const currentPath = location.pathname;
    const currentLang = getLanguageFromPath(currentPath);
    
    let newPath;
    if (currentLang) {
      // Replace existing language prefix
      newPath = currentPath.replace(`/${currentLang}`, `/${newLang}`);
    } else {
      // Add language prefix
      newPath = `/${newLang}${currentPath}`;
    }
    
    navigate(newPath + location.search, { replace: true });
  }, [location, navigate]);

  // Translation function
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // Fallback to default language
        value = translations[DEFAULT_LANGUAGE];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object') {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }
    
    if (typeof value !== 'string') return key;
    
    // Replace parameters like {name} with actual values
    return value.replace(/\{(\w+)\}/g, (match, paramName) => {
      return params[paramName] !== undefined ? params[paramName] : match;
    });
  }, [language]);

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
  const langPrefix = `/${language}`;
  
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
  let url = `${langPrefix}${path}`;
  
  // Add query parameters
  const queryString = new URLSearchParams(params).toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
}