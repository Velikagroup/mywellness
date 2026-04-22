import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import BlogPageContent from '@/components/blog/BlogPageContent';

export default function Itblog() {
  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'it');
  }, []);

  return (
    <LanguageProvider forcedLanguage="it">
      <BlogPageContent />
    </LanguageProvider>
  );
}