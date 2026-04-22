import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import BlogArticleContent from '@/components/blog/BlogArticleContent';

export default function Esblogarticle() {
  const urlParams = new URLSearchParams(window.location.search);
  const slugFromQuery = urlParams.get('slug');
  const pathParts = window.location.pathname.split('/');
  const slugFromPath = pathParts[pathParts.length - 1];
  const slug = slugFromQuery || (slugFromPath !== 'esblogarticle' ? slugFromPath : null);

  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'es');
  }, []);

  return (
    <LanguageProvider forcedLanguage="es">
      <BlogArticleContent slug={slug} />
    </LanguageProvider>
  );
}