import React from 'react';
import { LanguageProvider } from '../components/i18n/LanguageContext';
import CheckoutPage from '../components/checkout/CheckoutPage';

export default function EnCheckout() {
  return (
    <LanguageProvider forcedLanguage="en">
      <CheckoutPage />
    </LanguageProvider>
  );
}