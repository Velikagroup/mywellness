import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';

function DeQuizContent() {
  const { t } = useLanguage();
  const quizTranslations = translations['de']?.quiz || translations['de'] || {};
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'de');
  }, []);
  
  return <QuizContainer translations={quizTranslations} language="de" />;
}

export default function dequiz() {
  return (
    <LanguageProvider forcedLanguage="de">
      <DeQuizContent />
    </LanguageProvider>
  );
}