import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';

function EsQuizContent() {
  const { t } = useLanguage();
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'es');
  }, []);
  
  return <QuizContainer translations={t} language="es" />;
}

export default function esquiz() {
  return (
    <LanguageProvider forcedLanguage="es">
      <EsQuizContent />
    </LanguageProvider>
  );
}