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
  const { t, language } = useLanguage();
  const [selected, setSelected] = React.useState('moderato');

  const translations = React.useMemo(() => ({
    it: {
      questionsCompleted: 'domande completate',
      aiPersonalization: 'Personalizzazione AI',
      title: 'A che velocità vuoi perdere peso?',
      subtitle: 'Imposteremo calorie e macros in base al tuo obiettivo',
      optionSlow: 'Lento e Costante',
      optionSlowSubtitle: '-0.5kg/settimana • Sostenibile lungo termine',
      optionModerate: 'Moderato',
      optionModerateSubtitle: '-0.8kg/settimana • Equilibrio ideale',
      optionFast: 'Veloce',
      optionFastSubtitle: '-1kg/settimana • Deficit più marcato',
      preview: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup'
    },
    en: {
      questionsCompleted: 'questions completed',
      aiPersonalization: 'AI Personalization',
      title: 'How fast do you want to lose weight?',
      subtitle: 'We\'ll set calories and macros based on your goal',
      optionSlow: 'Slow and Steady',
      optionSlowSubtitle: '-0.5kg/week • Sustainable long-term',
      optionModerate: 'Moderate',
      optionModerateSubtitle: '-0.8kg/week • Ideal balance',
      optionFast: 'Fast',
      optionFastSubtitle: '-1kg/week • More marked deficit',
      preview: 'Interface preview • Features available after signup'
    },
    es: {
      questionsCompleted: 'preguntas completadas',
      aiPersonalization: 'Personalización IA',
      title: '¿A qué velocidad quieres perder peso?',
      subtitle: 'Estableceremos calorías y macros según tu objetivo',
      optionSlow: 'Lento y Constante',
      optionSlowSubtitle: '-0.5kg/semana • Sostenible largo plazo',
      optionModerate: 'Moderado',
      optionModerateSubtitle: '-0.8kg/semana • Equilibrio ideal',
      optionFast: 'Rápido',
      optionFastSubtitle: '-1kg/semana • Déficit más marcado',
      preview: 'Vista previa de interfaz • Funciones disponibles después del registro'
    },
    pt: {
      questionsCompleted: 'perguntas completadas',
      aiPersonalization: 'Personalização IA',
      title: 'Qual velocidade você quer perder peso?',
      subtitle: 'Definiremos calorias e macros com base no seu objetivo',
      optionSlow: 'Lento e Constante',
      optionSlowSubtitle: '-0.5kg/semana • Sustentável longo prazo',
      optionModerate: 'Moderado',
      optionModerateSubtitle: '-0.8kg/semana • Equilíbrio ideal',
      optionFast: 'Rápido',
      optionFastSubtitle: '-1kg/semana • Déficit mais marcado',
      preview: 'Prévia da interface • Funcionalidades disponíveis após o cadastro'
    },
    de: {
      questionsCompleted: 'Fragen abgeschlossen',
      aiPersonalization: 'KI-Personalisierung',
      title: 'Wie schnell möchten Sie abnehmen?',
      subtitle: 'Wir stellen Kalorien und Makros basierend auf Ihrem Ziel ein',
      optionSlow: 'Langsam und Stetig',
      optionSlowSubtitle: '-0.5kg/Woche • Langfristig nachhaltig',
      optionModerate: 'Moderat',
      optionModerateSubtitle: '-0.8kg/Woche • Ideales Gleichgewicht',
      optionFast: 'Schnell',
      optionFastSubtitle: '-1kg/Woche • Stärkeres Defizit',
      preview: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar'
    },
    fr: {
      questionsCompleted: 'questions complétées',
      aiPersonalization: 'Personnalisation IA',
      title: 'À quelle vitesse voulez-vous perdre du poids?',
      subtitle: 'Nous définirons les calories et macros selon votre objectif',
      optionSlow: 'Lent et Régulier',
      optionSlowSubtitle: '-0.5kg/semaine • Durable long terme',
      optionModerate: 'Modéré',
      optionModerateSubtitle: '-0.8kg/semaine • Équilibre idéal',
      optionFast: 'Rapide',
      optionFastSubtitle: '-1kg/semaine • Déficit plus marqué',
      preview: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription'
    }
  }), []);

  const tr = translations[language] || translations.it;

  const options = [
    { id: 'lento', label: tr.optionSlow, subtitle: tr.optionSlowSubtitle, emoji: '🐢' },
    { id: 'moderato', label: tr.optionModerate, subtitle: tr.optionModerateSubtitle, emoji: '⚡' },
    { id: 'veloce', label: tr.optionFast, subtitle: tr.optionFastSubtitle, emoji: '🚀' }
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
          <span className="text-sm text-gray-500 font-medium ml-2">{tr.questionsCompleted}</span>
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
            <span className="text-[var(--brand-primary-dark-text)] font-semibold">{tr.aiPersonalization}</span>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            {tr.title}
          </h3>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            {tr.subtitle}
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
            {tr.preview}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}