import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PricingPageContent from '@/components/pricing/PricingPageContent';

// SEO-friendly French pricing page at /fr-pricing
export default function FrPricing() {
  useEffect(() => {
    localStorage.setItem('preferred_language', 'fr');
  }, []);

  return (
    <LanguageProvider forcedLanguage="fr">
      <PricingPageContent />
    </LanguageProvider>
  );
}