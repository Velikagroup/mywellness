import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';

function EnQuizContent() {
  const { t } = useLanguage();
  
  React.useEffect(() => {
    document.title = 'Quiz | MyWellness';
    localStorage.setItem('preferred_language', 'en');
  }, []);
  
  // Pass entire English translations object to QuizContainer
  return <QuizContainer translations={translations.en} language="en" />;
}

export default function enquiz() {
  return (
    <LanguageProvider forcedLanguage="en">
      <EnQuizContent />
    </LanguageProvider>
  );
}