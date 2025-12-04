import React from 'react';
import PricingPage from './pricing';

// This page handles localized pricing routes like /es/pricing, /en/pricing, etc.
// The LanguageContext will detect the language from the URL automatically
export default function LocalizedPricing() {
  return <PricingPage />;
}