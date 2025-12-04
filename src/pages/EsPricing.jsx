import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PricingPageContent from '@/components/pricing/PricingPageContent';

// SEO-friendly Spanish pricing page at /es-pricing
export default function EsPricing() {
  useEffect(() => {
    localStorage.setItem('preferred_language', 'es');
  }, []);

  return (
    <LanguageProvider forcedLanguage="es">
      <PricingPageContent />
    </LanguageProvider>
  );
}