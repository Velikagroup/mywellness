import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import BlogPageContent from '@/components/blog/BlogPageContent';

export default function Frblog() {
  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'fr');
  }, []);

  return (
    <LanguageProvider forcedLanguage="fr">
      <BlogPageContent />
    </LanguageProvider>
  );
}