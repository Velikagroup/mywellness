import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';

function DeQuizContent() {
  const { t } = useLanguage();
  
  React.useEffect(() => {
    document.title = 'Quiz | MyWellness';
    localStorage.setItem('preferred_language', 'de');
  }, []);
  
  return <QuizContainer translations={translations.de} language="de" />;
}

export default function dequiz() {
  return (
    <LanguageProvider forcedLanguage="de">
      <DeQuizContent />
    </LanguageProvider>
  );
}