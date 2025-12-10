import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, TrendingUp, CheckCircle2, X, Sparkles, ArrowRight, Utensils, Dumbbell, Save, TrendingDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProgressPhotoPreviewDemo() {
  const { t, language } = useLanguage();

  const translations = React.useMemo(() => ({
    it: {
      title: 'Analisi Foto Progresso AI',
      target: 'Zona Target',
      days: 'giorni',
      excellent: 'Eccellente',
      before: 'Prima',
      daysAgo: 'giorni fa',
      after: 'Dopo',
      today: 'Oggi',
      scientific: 'Analisi Scientifica Dettagliata',
      muscle: 'Definizione Muscolare',
      fat: 'Riduzione Grasso',
      waist: 'vita',
      skin: 'Tono Pelle',
      posture: 'Postura',
      recommendations: 'Raccomandazioni AI Personalizzate',
      dietChanges: 'Modifiche Dieta',
      workoutChanges: 'Modifiche Allenamento',
      applyDiet: 'Applica Modifiche Dieta',
      applyWorkout: 'Applica Modifiche Allenamento',
      save: 'Salva Analisi',
      preview: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup',
      zone: 'Addome',
      diet1: 'Aumenta proteine a 2.2g/kg per preservare massa muscolare',
      diet2: 'Riduci carboidrati serali del 15% per ottimizzare perdita grasso',
      diet3: 'Aggiungi 200ml acqua ogni 2h per idratazione e metabolismo',
      workout1: 'Incrementa volume allenamento addominali +20%',
      workout2: 'Aggiungi 15min HIIT 3x/settimana post-allenamento',
      workout3: 'Focus su esercizi composti per massimo dispendio calorico'
    },
    en: {
      title: 'AI Progress Photo Analysis',
      target: 'Target Zone',
      days: 'days',
      excellent: 'Excellent',
      before: 'Before',
      daysAgo: 'days ago',
      after: 'After',
      today: 'Today',
      scientific: 'Detailed Scientific Analysis',
      muscle: 'Muscle Definition',
      fat: 'Fat Reduction',
      waist: 'waist',
      skin: 'Skin Tone',
      posture: 'Posture',
      recommendations: 'Personalized AI Recommendations',
      dietChanges: 'Diet Changes',
      workoutChanges: 'Workout Changes',
      applyDiet: 'Apply Diet Changes',
      applyWorkout: 'Apply Workout Changes',
      save: 'Save Analysis',
      preview: 'Interface preview • Features available after signup',
      zone: 'Abdomen',
      diet1: 'Increase protein to 2.2g/kg to preserve muscle mass',
      diet2: 'Reduce evening carbs by 15% to optimize fat loss',
      diet3: 'Add 200ml water every 2h for hydration and metabolism',
      workout1: 'Increase abdominal training volume +20%',
      workout2: 'Add 15min HIIT 3x/week post-workout',
      workout3: 'Focus on compound exercises for maximum calorie expenditure'
    },
    es: {
      title: 'Análisis de Foto de Progreso IA',
      target: 'Zona Objetivo',
      days: 'días',
      excellent: 'Excelente',
      before: 'Antes',
      daysAgo: 'días atrás',
      after: 'Después',
      today: 'Hoy',
      scientific: 'Análisis Científico Detallado',
      muscle: 'Definición Muscular',
      fat: 'Reducción de Grasa',
      waist: 'cintura',
      skin: 'Tono de Piel',
      posture: 'Postura',
      recommendations: 'Recomendaciones IA Personalizadas',
      dietChanges: 'Cambios de Dieta',
      workoutChanges: 'Cambios de Entrenamiento',
      applyDiet: 'Aplicar Cambios de Dieta',
      applyWorkout: 'Aplicar Cambios de Entrenamiento',
      save: 'Guardar Análisis',
      preview: 'Vista previa de interfaz • Funciones disponibles después del registro',
      zone: 'Abdomen',
      diet1: 'Aumenta proteínas a 2.2g/kg para preservar masa muscular',
      diet2: 'Reduce carbohidratos nocturnos 15% para optimizar pérdida grasa',
      diet3: 'Añade 200ml agua cada 2h para hidratación y metabolismo',
      workout1: 'Incrementa volumen entrenamiento abdominales +20%',
      workout2: 'Añade 15min HIIT 3x/semana post-entrenamiento',
      workout3: 'Enfócate en ejercicios compuestos para máximo gasto calórico'
    },
    pt: {
      title: 'Análise de Foto de Progresso IA',
      target: 'Zona Alvo',
      days: 'dias',
      excellent: 'Excelente',
      before: 'Antes',
      daysAgo: 'dias atrás',
      after: 'Depois',
      today: 'Hoje',
      scientific: 'Análise Científica Detalhada',
      muscle: 'Definição Muscular',
      fat: 'Redução de Gordura',
      waist: 'cintura',
      skin: 'Tom de Pele',
      posture: 'Postura',
      recommendations: 'Recomendações IA Personalizadas',
      dietChanges: 'Mudanças na Dieta',
      workoutChanges: 'Mudanças no Treino',
      applyDiet: 'Aplicar Mudanças na Dieta',
      applyWorkout: 'Aplicar Mudanças no Treino',
      save: 'Salvar Análise',
      preview: 'Prévia da interface • Funcionalidades disponíveis após o cadastro',
      zone: 'Abdômen',
      diet1: 'Aumenta proteínas para 2.2g/kg para preservar massa muscular',
      diet2: 'Reduz carboidratos noturnos 15% para otimizar perda de gordura',
      diet3: 'Adiciona 200ml água a cada 2h para hidratação e metabolismo',
      workout1: 'Incrementa volume treino abdominal +20%',
      workout2: 'Adiciona 15min HIIT 3x/semana pós-treino',
      workout3: 'Foca em exercícios compostos para máximo gasto calórico'
    },
    de: {
      title: 'KI-Fortschrittsphoto-Analyse',
      target: 'Zielzone',
      days: 'Tage',
      excellent: 'Ausgezeichnet',
      before: 'Vorher',
      daysAgo: 'Tage her',
      after: 'Nachher',
      today: 'Heute',
      scientific: 'Detaillierte Wissenschaftliche Analyse',
      muscle: 'Muskeldefinition',
      fat: 'Fettreduktion',
      waist: 'Taille',
      skin: 'Hautton',
      posture: 'Haltung',
      recommendations: 'Personalisierte KI-Empfehlungen',
      dietChanges: 'Diätänderungen',
      workoutChanges: 'Trainingsänderungen',
      applyDiet: 'Diätänderungen Anwenden',
      applyWorkout: 'Trainingsänderungen Anwenden',
      save: 'Analyse Speichern',
      preview: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar',
      zone: 'Bauch',
      diet1: 'Erhöhe Protein auf 2.2g/kg um Muskelmasse zu erhalten',
      diet2: 'Reduziere Abend-Kohlenhydrate um 15% für optimalen Fettabbau',
      diet3: 'Füge alle 2h 200ml Wasser für Hydratation und Stoffwechsel hinzu',
      workout1: 'Erhöhe Bauchmuskel-Trainingsvolumen +20%',
      workout2: 'Füge 15min HIIT 3x/Woche nach Training hinzu',
      workout3: 'Fokus auf Verbundübungen für maximalen Kalorienverbrauch'
    },
    fr: {
      title: 'Analyse de Photo de Progrès IA',
      target: 'Zone Cible',
      days: 'jours',
      excellent: 'Excellent',
      before: 'Avant',
      daysAgo: 'jours passés',
      after: 'Après',
      today: 'Aujourd\'hui',
      scientific: 'Analyse Scientifique Détaillée',
      muscle: 'Définition Musculaire',
      fat: 'Réduction Graisse',
      waist: 'taille',
      skin: 'Teint',
      posture: 'Posture',
      recommendations: 'Recommandations IA Personnalisées',
      dietChanges: 'Modifications Régime',
      workoutChanges: 'Modifications Entraînement',
      applyDiet: 'Appliquer Modifications Régime',
      applyWorkout: 'Appliquer Modifications Entraînement',
      save: 'Sauvegarder Analyse',
      preview: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription',
      zone: 'Abdomen',
      diet1: 'Augmente protéines à 2.2g/kg pour préserver masse musculaire',
      diet2: 'Réduis glucides du soir de 15% pour optimiser perte de graisse',
      diet3: 'Ajoute 200ml eau toutes les 2h pour hydratation et métabolisme',
      workout1: 'Augmente volume entraînement abdominaux +20%',
      workout2: 'Ajoute 15min HIIT 3x/semaine post-entraînement',
      workout3: 'Focus sur exercices composés pour dépense calorique maximale'
    }
  }), []);

  const tr = translations[language] || translations.it;

  const analysisData = {
    targetZone: tr.zone,
    comparison: 'improved',
    daysSince: 28,
    detailedAnalysis: {
      muscleDefinition: {
        score: 6.8,
        previous: 4.5,
        change: '+51%'
      },
      fatReduction: {
        score: 7.2,
        previous: 4.8,
        change: '-22%',
        waistReduction: '6cm'
      },
      skinTone: {
        score: 7.5,
        previous: 6.2,
        change: '+21%'
      },
      posture: {
        score: 8.1,
        previous: 6.5,
        change: '+25%'
      }
    },
    recommendations: {
      diet: [
        tr.diet1,
        tr.diet2,
        tr.diet3
      ],
      workout: [
        tr.workout1,
        tr.workout2,
        tr.workout3
      ]
    }
  };

  return (
    <>
      <style>{`
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>

      <Card className="w-full max-w-6xl mx-auto water-glass-effect border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
        <div className="slide-up">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-900">{tr.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{tr.target}: {analysisData.targetZone} • {analysisData.daysSince} {tr.days}</p>
              </div>
              <div className="px-4 py-2 bg-green-100 rounded-full">
                <span className="text-sm font-bold text-green-700">✓ {tr.excellent}</span>
              </div>
            </div>
            
            {/* Before/After Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/8eb701ee9_ModelPre.png"
                  alt="Before"
                  className="w-full h-56 object-cover rounded-xl"
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {tr.before} - {analysisData.daysSince} {tr.daysAgo}
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/3fb8677cc_ModelPost.png"
                  alt="After"
                  className="w-full h-56 object-cover rounded-xl"
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  {tr.after} - {tr.today}
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Analysis Section */}
          <div className="p-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                {tr.scientific}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Muscle Definition Score */}
                  <div className="bg-white/90 rounded-xl p-4 border border-blue-100 text-center">
                    <p className="text-xs text-gray-600 mb-2">{tr.muscle}</p>
                    <div className="relative inline-flex items-center justify-center mb-2">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                        <circle 
                          cx="40" cy="40" r="32" fill="none" 
                          stroke="#3b82f6" strokeWidth="6"
                          strokeDasharray={`${(analysisData.detailedAnalysis.muscleDefinition.score / 10) * 201} ${201 - (analysisData.detailedAnalysis.muscleDefinition.score / 10) * 201}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-blue-600">{analysisData.detailedAnalysis.muscleDefinition.score}</span>
                        <span className="text-xs text-gray-500">/10</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-gray-500">{analysisData.detailedAnalysis.muscleDefinition.previous}</span>
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-bold text-green-600">{analysisData.detailedAnalysis.muscleDefinition.change}</span>
                    </div>
                  </div>

                  {/* Fat Reduction Score */}
                  <div className="bg-white/90 rounded-xl p-4 border border-green-100 text-center">
                    <p className="text-xs text-gray-600 mb-2">{tr.fat}</p>
                    <div className="relative inline-flex items-center justify-center mb-2">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                        <circle 
                          cx="40" cy="40" r="32" fill="none" 
                          stroke="#10b981" strokeWidth="6"
                          strokeDasharray={`${(analysisData.detailedAnalysis.fatReduction.score / 10) * 201} ${201 - (analysisData.detailedAnalysis.fatReduction.score / 10) * 201}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-green-600">{analysisData.detailedAnalysis.fatReduction.score}</span>
                        <span className="text-xs text-gray-500">/10</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-gray-500">{analysisData.detailedAnalysis.fatReduction.previous}</span>
                      <TrendingDown className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-bold text-green-600">{analysisData.detailedAnalysis.fatReduction.change}</span>
                    </div>
                    <p className="text-xs text-green-700 font-semibold mt-1">-{analysisData.detailedAnalysis.fatReduction.waistReduction} {tr.waist}</p>
                  </div>

                  {/* Skin Tone Score */}
                  <div className="bg-white/90 rounded-xl p-4 border border-purple-100 text-center">
                    <p className="text-xs text-gray-600 mb-2">{tr.skin}</p>
                    <div className="relative inline-flex items-center justify-center mb-2">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                        <circle 
                          cx="40" cy="40" r="32" fill="none" 
                          stroke="#a855f7" strokeWidth="6"
                          strokeDasharray={`${(analysisData.detailedAnalysis.skinTone.score / 10) * 201} ${201 - (analysisData.detailedAnalysis.skinTone.score / 10) * 201}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-purple-600">{analysisData.detailedAnalysis.skinTone.score}</span>
                        <span className="text-xs text-gray-500">/10</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-gray-500">{analysisData.detailedAnalysis.skinTone.previous}</span>
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-bold text-green-600">{analysisData.detailedAnalysis.skinTone.change}</span>
                    </div>
                  </div>

                  {/* Posture Score */}
                  <div className="bg-white/90 rounded-xl p-4 border border-teal-100 text-center">
                    <p className="text-xs text-gray-600 mb-2">{tr.posture}</p>
                    <div className="relative inline-flex items-center justify-center mb-2">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                        <circle 
                          cx="40" cy="40" r="32" fill="none" 
                          stroke="#14b8a6" strokeWidth="6"
                          strokeDasharray={`${(analysisData.detailedAnalysis.posture.score / 10) * 201} ${201 - (analysisData.detailedAnalysis.posture.score / 10) * 201}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-teal-600">{analysisData.detailedAnalysis.posture.score}</span>
                        <span className="text-xs text-gray-500">/10</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-gray-500">{analysisData.detailedAnalysis.posture.previous}</span>
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-bold text-green-600">{analysisData.detailedAnalysis.posture.change}</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* Recommendations Section - Full Width */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                {tr.recommendations}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Diet Recommendations with Button */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    🍽️ {tr.dietChanges}
                  </h4>
                  <div className="space-y-2 mb-4">
                    {analysisData.recommendations.diet.map((rec, idx) => (
                      <div key={idx} className="bg-white/90 rounded-lg p-3 text-xs text-gray-700 flex items-start gap-2 border border-amber-100">
                        <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled
                    className="w-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-bold py-2.5 rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {tr.applyDiet}
                  </button>
                </div>

                {/* Workout Recommendations with Button */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    💪 {tr.workoutChanges}
                  </h4>
                  <div className="space-y-2 mb-4">
                    {analysisData.recommendations.workout.map((rec, idx) => (
                      <div key={idx} className="bg-white/90 rounded-lg p-3 text-xs text-gray-700 flex items-start gap-2 border border-amber-100">
                        <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-2.5 rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {tr.applyWorkout}
                  </button>
                </div>
              </div>
            </div>

            {/* Save Analysis Button - Full Width */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <button
                disabled
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2 text-base"
              >
                <Save className="w-5 h-5" />
                {tr.save}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
            <p className="text-xs text-gray-400 italic text-center">
              {tr.preview}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}