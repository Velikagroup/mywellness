import React from 'react';
import { LanguageProvider } from '../components/i18n/LanguageContext';
import CheckoutPage from '../components/checkout/CheckoutPage';

export default function PtCheckout() {
  return (
    <LanguageProvider forcedLanguage="pt">
      <CheckoutPage />
    </LanguageProvider>
  );
}