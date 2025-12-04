import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PricingPageContent from '@/components/pricing/PricingPageContent';

// SEO-friendly Portuguese pricing page at /pt-pricing
export default function PtPricing() {
  useEffect(() => {
    localStorage.setItem('preferred_language', 'pt');
  }, []);

  return (
    <LanguageProvider forcedLanguage="pt">
      <PricingPageContent />
    </LanguageProvider>
  );
}