import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';

function PtQuizContent() {
  const { t } = useLanguage();
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'pt');
  }, []);
  
  return <QuizContainer translations={translations.pt} language="pt" />;
}

export default function ptquiz() {
  return (
    <LanguageProvider forcedLanguage="pt">
      <PtQuizContent />
    </LanguageProvider>
  );
}