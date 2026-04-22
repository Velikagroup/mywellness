import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import BlogArticleContent from '@/components/blog/BlogArticleContent';

export default function Itblogarticle() {
  // Get slug from URL path
  const urlParams = new URLSearchParams(window.location.search);
  const slugFromQuery = urlParams.get('slug');
  
  // Also check if slug is in the path (e.g., /itblog/my-article-slug)
  const pathParts = window.location.pathname.split('/');
  const slugFromPath = pathParts[pathParts.length - 1];
  const slug = slugFromQuery || (slugFromPath !== 'itblogarticle' ? slugFromPath : null);

  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'it');
  }, []);

  return (
    <LanguageProvider forcedLanguage="it">
      <BlogArticleContent slug={slug} />
    </LanguageProvider>
  );
}