import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';

function EnQuizContent() {
  const { t } = useLanguage();
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'en');
  }, []);
  
  return <QuizContainer translations={t} language="en" />;
}

export default function enquiz() {
  return (
    <LanguageProvider forcedLanguage="en">
      <EnQuizContent />
    </LanguageProvider>
  );
}