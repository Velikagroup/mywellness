import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';

function ItQuizContent() {
  const { t } = useLanguage();
  const quizTranslations = translations['it']?.quiz || translations['it'] || {};
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'it');
  }, []);
  
  return <QuizContainer translations={quizTranslations} language="it" />;
}

export default function itquiz() {
  return (
    <LanguageProvider forcedLanguage="it">
      <ItQuizContent />
    </LanguageProvider>
  );
}