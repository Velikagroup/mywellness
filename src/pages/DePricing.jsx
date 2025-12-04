import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PricingPageContent from '@/components/pricing/PricingPageContent';

// SEO-friendly German pricing page at /de-pricing
export default function DePricing() {
  useEffect(() => {
    localStorage.setItem('preferred_language', 'de');
  }, []);

  return (
    <LanguageProvider forcedLanguage="de">
      <PricingPageContent />
    </LanguageProvider>
  );
}