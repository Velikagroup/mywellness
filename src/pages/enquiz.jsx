import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';

function EnQuizContent() {
  const { t } = useLanguage();
  const quizTranslations = translations['en']?.quiz || translations['en'] || {};
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'en');
  }, []);
  
  return <QuizContainer translations={quizTranslations} language="en" />;
}

export default function enquiz() {
  return (
    <LanguageProvider forcedLanguage="en">
      <EnQuizContent />
    </LanguageProvider>
  );
}