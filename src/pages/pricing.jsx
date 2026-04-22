import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PricingPageContent from '@/components/pricing/PricingPageContent.jsx';

export default function Pricing() {
  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'en');
  }, []);

  return (
    <LanguageProvider forcedLanguage="en">
      <PricingPageContent />
    </LanguageProvider>
  );
}