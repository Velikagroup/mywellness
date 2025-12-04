import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PricingPageContent from '@/components/pricing/PricingPageContent.jsx';

// Redirect to main /pricing page (English is now default)
export default function EnPricing() {
  useEffect(() => {
    window.location.replace('/pricing');
  }, []);

  return null;
}