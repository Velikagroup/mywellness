import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import BlogPageContent from '@/components/blog/BlogPageContent';

export default function Deblog() {
  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'de');
  }, []);

  return (
    <LanguageProvider forcedLanguage="de">
      <BlogPageContent />
    </LanguageProvider>
  );
}