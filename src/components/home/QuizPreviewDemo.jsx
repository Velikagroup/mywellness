import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Componente DEMO per Homepage - Quiz
 * Mostra un esempio di domanda del quiz con opzioni
 */
export default function QuizPreviewDemo() {
  const { t } = useLanguage();
  const [selected, setSelected] = React.useState('moderato');

  const options = [
    { id: 'lento', label: t('home.quizDemoOptionSlow'), subtitle: t('home.quizDemoOptionSlowSubtitle'), emoji: '🐢' },
    { id: 'moderato', label: t('home.quizDemoOptionModerate'), subtitle: t('home.quizDemoOptionModerateSubtitle'), emoji: '⚡' },
    { id: 'veloce', label: t('home.quizDemoOptionFast'), subtitle: t('home.quizDemoOptionFastSubtitle'), emoji: '🚀' }
  ];

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="pb-6 pt-8 text-center border-b border-gray-100">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent">
              8
            </span>
            <span className="text-gray-400 font-medium">/</span>
            <span className="text-xl font-bold text-gray-600">12</span>
          </div>
          <span className="text-sm text-gray-500 font-medium ml-2">{t('home.quizDemoQuestionsCompleted')}</span>
        </div>
        
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner max-w-md mx-auto">
          <div 
            className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 rounded-full transition-all duration-500 ease-out shadow-md"
            style={{ width: '67%' }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]/30 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="text-[var(--brand-primary-dark-text)] font-semibold">{t('home.quizDemoAIPersonalization')}</span>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            {t('home.quizDemoWeightLossSpeed')}
          </h3>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            {t('home.quizDemoWeightLossSpeedSubtitle')}
          </p>
        </div>

        <div className="space-y-3 max-w-xl mx-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              disabled
              className={`w-full p-4 rounded-2xl border-2 transition-all cursor-not-allowed opacity-80 ${
                selected === option.id
                  ? 'border-[var(--brand-primary)] bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 shadow-lg'
                  : 'border-gray-200 bg-white/70 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  selected === option.id 
                    ? 'bg-[var(--brand-primary)] text-white shadow-md' 
                    : 'bg-gray-100'
                }`}>
                  {selected === option.id ? <CheckCircle className="w-6 h-6" /> : option.emoji}
                </div>
                <div className="text-left flex-1">
                  <p className={`font-bold text-base mb-1 ${
                    selected === option.id ? 'text-[var(--brand-primary-dark-text)]' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-sm text-gray-600">{option.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Demo Notice */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400 italic">
            {t('home.quizDemoPreview')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}