import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';

function DeQuizContent() {
  const { t } = useLanguage();
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'de');
  }, []);
  
  return <QuizContainer translations={t} language="de" />;
}

export default function dequiz() {
  return (
    <LanguageProvider forcedLanguage="de">
      <DeQuizContent />
    </LanguageProvider>
  );
}