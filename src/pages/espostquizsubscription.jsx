import React from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PostQuizSubscription from './PostQuizSubscription';

export default function EsPostQuizSubscription() {
  return (
    <LanguageProvider forcedLanguage="es">
      <PostQuizSubscription />
    </LanguageProvider>
  );
}