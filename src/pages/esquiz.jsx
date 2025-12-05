import React from 'react';
import QuizContainer from '../components/quiz/QuizContainer';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';

function EsQuizContent() {
  const { t } = useLanguage();
  const quizTranslations = translations['es']?.quiz || translations['es'] || {};
  
  React.useEffect(() => {
    localStorage.setItem('preferred_language', 'es');
  }, []);
  
  return <QuizContainer translations={quizTranslations} language="es" />;
}

export default function esquiz() {
  return (
    <LanguageProvider forcedLanguage="es">
      <EsQuizContent />
    </LanguageProvider>
  );
}