import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';

function FrQuizContent() {
  const { t } = useLanguage();
  const quizTranslations = translations['fr']?.quiz || translations['fr'] || {};
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'fr');
  }, []);
  
  return <QuizContainer translations={quizTranslations} language="fr" />;
}

export default function frquiz() {
  return (
    <LanguageProvider forcedLanguage="fr">
      <FrQuizContent />
    </LanguageProvider>
  );
}