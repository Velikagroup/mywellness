import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';

function FrQuizContent() {
  const { t } = useLanguage();
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'fr');
  }, []);
  
  return <QuizContainer translations={t} language="fr" />;
}

export default function FrQuiz() {
  return (
    <LanguageProvider forcedLanguage="fr">
      <FrQuizContent />
    </LanguageProvider>
  );
}