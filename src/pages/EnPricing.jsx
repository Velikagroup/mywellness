import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PricingPageContent from '@/components/pricing/PricingPageContent';

// SEO-friendly English pricing page at /en-pricing
export default function EnPricing() {
  useEffect(() => {
    localStorage.setItem('preferred_language', 'en');
  }, []);

  return (
    <LanguageProvider forcedLanguage="en">
      <PricingPageContent />
    </LanguageProvider>
  );
}