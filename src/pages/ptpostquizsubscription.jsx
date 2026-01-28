import React from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PostQuizSubscription from './PostQuizSubscription';

export default function PtPostQuizSubscription() {
  return (
    <LanguageProvider forcedLanguage="pt">
      <PostQuizSubscription />
    </LanguageProvider>
  );
}