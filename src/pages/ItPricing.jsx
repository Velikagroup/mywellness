import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PricingPageContent from '@/components/pricing/PricingPageContent.jsx';

// SEO-friendly Italian pricing page at /ItPricing
export default function ItPricing() {
  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'it');
  }, []);

  return (
    <LanguageProvider forcedLanguage="it">
      <PricingPageContent />
    </LanguageProvider>
  );
}