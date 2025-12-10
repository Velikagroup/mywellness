import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, AlertCircle, Sparkles, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Componente DEMO per Homepage - Analisi Foto AI
 * Mostra un esempio di analisi completata con confronto pianificato vs effettivo
 */
export default function PhotoAnalyzerPreviewDemo() {
  const { t, language } = useLanguage();

  const translations = React.useMemo(() => ({
    it: {
      title: 'Contatore Calorie AI',
      subtitle: 'Scatta foto dei pasti: l\'AI analizza calorie e macro. In caso di sforamento, piani alimentari e allenamenti si ribilanciano automaticamente.',
      analyzed: '✓ Analizzato',
      comparison: '📸 Confronto Pianificato vs Reale',
      calories: 'Calorie',
      planned: 'pianificato',
      protein: 'Proteine',
      carbs: 'Carboidrati',
      fat: 'Grassi',
      exceeded: 'Superato di',
      rebalanceDesc: 'Piani alimentari e allenamenti si ribilancieranno automaticamente.',
      rebalanceButton: '🔄 Ribilancia Piano',
      preview: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup'
    },
    en: {
      title: 'AI Calorie Counter',
      subtitle: 'Take meal photos: AI analyzes calories and macros. If exceeded, meal and workout plans rebalance automatically.',
      analyzed: '✓ Analyzed',
      comparison: '📸 Planned vs Actual Comparison',
      calories: 'Calories',
      planned: 'planned',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      exceeded: 'Exceeded by',
      rebalanceDesc: 'Meal and workout plans will rebalance automatically.',
      rebalanceButton: '🔄 Rebalance Plan',
      preview: 'Interface preview • Features available after signup'
    },
    es: {
      title: 'Contador de Calorías IA',
      subtitle: 'Toma fotos de comidas: la IA analiza calorías y macros. En caso de exceso, los planes alimentarios y entrenamientos se rebalancean automáticamente.',
      analyzed: '✓ Analizado',
      comparison: '📸 Comparación Planificado vs Real',
      calories: 'Calorías',
      planned: 'planificado',
      protein: 'Proteínas',
      carbs: 'Carbohidratos',
      fat: 'Grasas',
      exceeded: 'Excedido en',
      rebalanceDesc: 'Los planes alimentarios y entrenamientos se rebalancearán automáticamente.',
      rebalanceButton: '🔄 Rebalancear Plan',
      preview: 'Vista previa de interfaz • Funciones disponibles después del registro'
    },
    pt: {
      title: 'Contador de Calorias IA',
      subtitle: 'Tire fotos das refeições: a IA analisa calorias e macros. Em caso de excesso, planos alimentares e treinos se reequilibram automaticamente.',
      analyzed: '✓ Analisado',
      comparison: '📸 Comparação Planejado vs Real',
      calories: 'Calorias',
      planned: 'planejado',
      protein: 'Proteínas',
      carbs: 'Carboidratos',
      fat: 'Gorduras',
      exceeded: 'Excedido em',
      rebalanceDesc: 'Planos alimentares e treinos se reequilibrarão automaticamente.',
      rebalanceButton: '🔄 Reequilibrar Plano',
      preview: 'Prévia da interface • Funcionalidades disponíveis após o cadastro'
    },
    de: {
      title: 'KI-Kalorienzähler',
      subtitle: 'Machen Sie Fotos von Mahlzeiten: KI analysiert Kalorien und Makros. Bei Überschreitung balancieren sich Ernährungs- und Trainingspläne automatisch aus.',
      analyzed: '✓ Analysiert',
      comparison: '📸 Geplant vs Tatsächlich Vergleich',
      calories: 'Kalorien',
      planned: 'geplant',
      protein: 'Protein',
      carbs: 'Kohlenhydrate',
      fat: 'Fett',
      exceeded: 'Überschritten um',
      rebalanceDesc: 'Ernährungs- und Trainingspläne werden automatisch neu ausbalanciert.',
      rebalanceButton: '🔄 Plan Neu Ausbalancieren',
      preview: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar'
    },
    fr: {
      title: 'Compteur de Calories IA',
      subtitle: 'Prenez des photos de repas : l\'IA analyse calories et macros. En cas de dépassement, plans alimentaires et entraînements se rééquilibrent automatiquement.',
      analyzed: '✓ Analysé',
      comparison: '📸 Comparaison Planifié vs Réel',
      calories: 'Calories',
      planned: 'planifié',
      protein: 'Protéines',
      carbs: 'Glucides',
      fat: 'Lipides',
      exceeded: 'Dépassé de',
      rebalanceDesc: 'Plans alimentaires et entraînements se rééquilibreront automatiquement.',
      rebalanceButton: '🔄 Rééquilibrer le Plan',
      preview: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription'
    }
  }), []);

  const tr = translations[language] || translations.it;

  // Dati demo del pasto pianificato
  const plannedMeal = {
    name: "Bistecca con Verdure",
    calories: 520,
    protein: 45,
    carbs: 28,
    fat: 22
  };

  // Dati demo del pasto effettivo analizzato dall'AI
  const actualMeal = {
    calories: 680,
    protein: 52,
    carbs: 35,
    fat: 32
  };

  const delta = {
    calories: actualMeal.calories - plannedMeal.calories,
    protein: actualMeal.protein - plannedMeal.protein,
    carbs: actualMeal.carbs - plannedMeal.carbs,
    fat: actualMeal.fat - plannedMeal.fat
  };

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="border-b border-gray-200/50 pb-4 bg-gradient-to-br from-white via-[var(--brand-primary-light)]/10 to-white">
        <CardTitle className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 text-xl">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <span className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent font-bold">
              {tr.title}
            </span>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              {tr.subtitle}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Foto del pasto */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200/50 shadow-lg">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/d0350375b_Meal.jpg"
            alt="Pasto Analizzato"
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {tr.analyzed}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200/50">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-[var(--brand-primary)]" />
            {tr.comparison}
          </h4>
          
          <div className="space-y-3">
            {/* Calorie */}
            <div className="bg-white/80 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{tr.calories}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{plannedMeal.calories} kcal {tr.planned}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-gray-900">{actualMeal.calories} kcal</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  delta.calories > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {delta.calories > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {delta.calories > 0 ? '+' : ''}{delta.calories}
                </div>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* Proteine */}
              <div className="bg-white/80 rounded-lg p-3 border border-red-200">
                <p className="text-xs text-gray-500 mb-1">{tr.protein}</p>
                <p className="text-lg font-bold text-red-600">{actualMeal.protein}g</p>
                <p className="text-xs text-gray-400 mt-1">vs {plannedMeal.protein}g</p>
                <div className={`mt-1 text-xs font-semibold ${delta.protein > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {delta.protein > 0 ? '+' : ''}{delta.protein}g
                </div>
              </div>

              {/* Carboidrati */}
              <div className="bg-white/80 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-gray-500 mb-1">{tr.carbs}</p>
                <p className="text-lg font-bold text-blue-600">{actualMeal.carbs}g</p>
                <p className="text-xs text-gray-400 mt-1">vs {plannedMeal.carbs}g</p>
                <div className={`mt-1 text-xs font-semibold ${delta.carbs > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {delta.carbs > 0 ? '+' : ''}{delta.carbs}g
                </div>
              </div>

              {/* Grassi */}
              <div className="bg-white/80 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-gray-500 mb-1">{tr.fat}</p>
                <p className="text-lg font-bold text-yellow-600">{actualMeal.fat}g</p>
                <p className="text-xs text-gray-400 mt-1">vs {plannedMeal.fat}g</p>
                <div className={`mt-1 text-xs font-semibold ${delta.fat > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {delta.fat > 0 ? '+' : ''}{delta.fat}g
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Box */}
        {delta.calories > 50 && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-900 text-sm mb-1">
                  {tr.exceeded} +{delta.calories} kcal
                </p>
                <p className="text-xs text-orange-700 leading-relaxed">
                  {tr.rebalanceDesc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rebalance Button */}
        <Button
          disabled
          className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 text-white font-bold text-base py-5 rounded-xl shadow-lg cursor-not-allowed opacity-80"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          {tr.rebalanceButton}
        </Button>

        {/* Demo Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-400 italic">
            {tr.preview}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}