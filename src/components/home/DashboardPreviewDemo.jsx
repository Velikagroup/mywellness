import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Activity, BarChart3, Calendar, TrendingDown, Scale } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Componente DEMO per Homepage - Dashboard
 * Replica ESATTAMENTE il layout della dashboard dall'immagine
 */
export default function DashboardPreviewDemo() {
  const { t, language } = useLanguage();
  
  const translations = React.useMemo(() => ({
    it: {
      scientificAnalysis: '✅ Analisi Scientifica',
      scientificDashboard: 'Dashboard Scientifico',
      subtitle: 'Visualizza TMB, necessità caloriche, grasso corporeo e proiezioni di obiettivi in tempo reale.',
      startWeight: 'Peso Iniziale',
      targetWeight: 'Peso Target',
      variation: 'Variazione',
      trajectory: 'Traiettoria Massa Corporea',
      currentWeight: 'Peso attuale',
      target: 'Target',
      calorieBreakdown: 'Scomposizione Calorica Obiettivo',
      completed: 'completato',
      completedLabel: 'Completato',
      remaining: 'Rimanente',
      calorieCalc: 'Calcolo basato su 7700 kcal = 1kg di variazione',
      targetCalories: 'Target Calorico',
      bmr: 'Metabolismo Basale (BMR)',
      bodyFat: 'Massa Grassa',
      workoutDays: 'Giorni di Allenamento',
      daysPerWeek: 'giorni/sett',
      stable: 'stabile',
      registerWeight: 'Registra Peso',
      saveWeight: 'Salva Peso'
    },
    en: {
      scientificAnalysis: '✅ Scientific Analysis',
      scientificDashboard: 'Scientific Dashboard',
      subtitle: 'Visualize BMR, calorie needs, body fat and goal projections in real-time.',
      startWeight: 'Starting Weight',
      targetWeight: 'Target Weight',
      variation: 'Variation',
      trajectory: 'Body Mass Trajectory',
      currentWeight: 'Current weight',
      target: 'Target',
      calorieBreakdown: 'Calorie Goal Breakdown',
      completed: 'completed',
      completedLabel: 'Completed',
      remaining: 'Remaining',
      calorieCalc: 'Calculation based on 7700 kcal = 1kg change',
      targetCalories: 'Calorie Target',
      bmr: 'Basal Metabolic Rate (BMR)',
      bodyFat: 'Body Fat',
      workoutDays: 'Workout Days',
      daysPerWeek: 'days/week',
      stable: 'stable',
      registerWeight: 'Log Weight',
      saveWeight: 'Save Weight'
    },
    es: {
      scientificAnalysis: '✅ Análisis Científico',
      scientificDashboard: 'Dashboard Científico',
      subtitle: 'Visualiza TMB, necesidades calóricas, grasa corporal y proyecciones de objetivos en tiempo real.',
      startWeight: 'Peso Inicial',
      targetWeight: 'Peso Objetivo',
      variation: 'Variación',
      trajectory: 'Trayectoria de Masa Corporal',
      currentWeight: 'Peso actual',
      target: 'Objetivo',
      calorieBreakdown: 'Desglose Calórico del Objetivo',
      completed: 'completado',
      completedLabel: 'Completado',
      remaining: 'Restante',
      calorieCalc: 'Cálculo basado en 7700 kcal = 1kg de cambio',
      targetCalories: 'Objetivo Calórico',
      bmr: 'Metabolismo Basal (TMB)',
      bodyFat: 'Grasa Corporal',
      workoutDays: 'Días de Entrenamiento',
      daysPerWeek: 'días/sem',
      stable: 'estable',
      registerWeight: 'Registrar Peso',
      saveWeight: 'Guardar Peso'
    },
    pt: {
      scientificAnalysis: '✅ Análise Científica',
      scientificDashboard: 'Dashboard Científico',
      subtitle: 'Visualize TMB, necessidades calóricas, gordura corporal e projeções de objetivos em tempo real.',
      startWeight: 'Peso Inicial',
      targetWeight: 'Peso Alvo',
      variation: 'Variação',
      trajectory: 'Trajetória de Massa Corporal',
      currentWeight: 'Peso atual',
      target: 'Alvo',
      calorieBreakdown: 'Detalhamento da Meta Calórica',
      completed: 'completado',
      completedLabel: 'Completado',
      remaining: 'Restante',
      calorieCalc: 'Cálculo baseado em 7700 kcal = 1kg de mudança',
      targetCalories: 'Meta Calórica',
      bmr: 'Taxa Metabólica Basal (TMB)',
      bodyFat: 'Gordura Corporal',
      workoutDays: 'Dias de Treino',
      daysPerWeek: 'dias/sem',
      stable: 'estável',
      registerWeight: 'Registrar Peso',
      saveWeight: 'Salvar Peso'
    },
    de: {
      scientificAnalysis: '✅ Wissenschaftliche Analyse',
      scientificDashboard: 'Wissenschaftliches Dashboard',
      subtitle: 'Visualisieren Sie BMR, Kalorienbedarf, Körperfett und Zielprognosen in Echtzeit.',
      startWeight: 'Startgewicht',
      targetWeight: 'Zielgewicht',
      variation: 'Variation',
      trajectory: 'Körpermassenentwicklung',
      currentWeight: 'Aktuelles Gewicht',
      target: 'Ziel',
      calorieBreakdown: 'Kalorische Zielaufschlüsselung',
      completed: 'abgeschlossen',
      completedLabel: 'Abgeschlossen',
      remaining: 'Verbleibend',
      calorieCalc: 'Berechnung basiert auf 7700 kcal = 1 kg Änderung',
      targetCalories: 'Kalorienziel',
      bmr: 'Grundumsatz (BMR)',
      bodyFat: 'Körperfett',
      workoutDays: 'Trainingstage',
      daysPerWeek: 'Tage/Woche',
      stable: 'stabil',
      registerWeight: 'Gewicht Erfassen',
      saveWeight: 'Gewicht Speichern'
    },
    fr: {
      scientificAnalysis: '✅ Analyse Scientifique',
      scientificDashboard: 'Dashboard Scientifique',
      subtitle: 'Visualisez MB, besoins caloriques, masse grasse et projections d\'objectifs en temps réel.',
      startWeight: 'Poids Initial',
      targetWeight: 'Poids Cible',
      variation: 'Variation',
      trajectory: 'Trajectoire de Masse Corporelle',
      currentWeight: 'Poids actuel',
      target: 'Cible',
      calorieBreakdown: 'Répartition de l\'Objectif Calorique',
      completed: 'complété',
      completedLabel: 'Complété',
      remaining: 'Restant',
      calorieCalc: 'Calcul basé sur 7700 kcal = 1 kg de changement',
      targetCalories: 'Objectif Calorique',
      bmr: 'Métabolisme de Base (MB)',
      bodyFat: 'Masse Grasse',
      workoutDays: 'Jours d\'Entraînement',
      daysPerWeek: 'jours/sem',
      stable: 'stable',
      registerWeight: 'Enregistrer le Poids',
      saveWeight: 'Sauvegarder le Poids'
    }
  }), []);

  const tr = translations[language] || translations.it;
  
  const weightData = React.useMemo(() => [
    { date: language === 'es' ? '24 Sep' : language === 'pt' ? '24 Set' : language === 'en' ? '24 Sep' : language === 'de' ? '24 Sep' : language === 'fr' ? '24 Sep' : '24 Set', weight: 83.0 },
    { date: language === 'es' ? '28 Sep' : language === 'pt' ? '28 Set' : language === 'en' ? '28 Sep' : language === 'de' ? '28 Sep' : language === 'fr' ? '28 Sep' : '28 Set', weight: 81.5 },
    { date: language === 'es' ? '01 Oct' : language === 'pt' ? '01 Out' : language === 'en' ? '01 Oct' : language === 'de' ? '01 Okt' : language === 'fr' ? '01 Oct' : '01 Ott', weight: 80.2 },
    { date: language === 'es' ? '02 Oct' : language === 'pt' ? '02 Out' : language === 'en' ? '02 Oct' : language === 'de' ? '02 Okt' : language === 'fr' ? '02 Oct' : '02 Ott', weight: 79.0 }
  ], [language]);

  const startWeight = 83.0;
  const currentWeight = 79.0;
  const targetWeight = 73.0;
  const variation = currentWeight - startWeight;

  const totalDistance = Math.abs(startWeight - targetWeight);
  const distanceCovered = Math.abs(startWeight - currentWeight);
  const progress = Math.round((distanceCovered / totalDistance) * 100);

  const targetCalories = 7700;
  const totalCaloriesToBurn = totalDistance * targetCalories;
  const caloriesBurned = distanceCovered * targetCalories;
  const caloriesRemaining = totalCaloriesToBurn - caloriesBurned;

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
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Colonna Sinistra - 8 colonne */}
      <div className="lg:col-span-8 space-y-4">
        {/* Top Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-lg">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">{tr.startWeight}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-gray-900">{startWeight}</span>
                <span className="text-sm text-gray-500 font-medium">kg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-lg">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">{tr.targetWeight}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-gray-900">{targetWeight}</span>
                <span className="text-sm text-gray-500 font-medium">kg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="water-glass-effect border border-green-200/50 shadow-lg rounded-lg">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium text-green-700 mb-1 uppercase tracking-wider">{tr.variation}</p>
              <div className="flex items-baseline gap-1.5">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <span className="text-3xl font-black text-green-700">{variation.toFixed(1)}</span>
                <span className="text-sm text-green-600 font-medium">kg</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Weight Chart */}
          <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-lg">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                {tr.trajectory}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 9, fill: '#6b7280' }}
                      stroke="#d1d5db"
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[71, 85]}
                      tick={{ fontSize: 9, fill: '#6b7280' }}
                      stroke="#d1d5db"
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '10px',
                        padding: '4px 8px'
                      }}
                    />
                    <ReferenceLine 
                      y={73} 
                      stroke="#10b981" 
                      strokeDasharray="4 4" 
                      label={{ value: tr.target, fontSize: 8, fill: '#10b981', position: 'right' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#26847F" 
                      strokeWidth={2.5}
                      dot={{ fill: '#26847F', r: 3 }}
                      name={tr.currentWeight}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]"></div>
                  <span className="text-gray-600 font-medium">{tr.currentWeight}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 bg-green-500"></div>
                  <span className="text-gray-600 font-medium">{tr.target}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calorie Breakdown */}
          <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-lg">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-gray-900">
                {tr.calorieBreakdown}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center justify-center mb-3 relative">
                {/* Circular Progress */}
                <svg className="w-24 h-24" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="#26847F"
                    strokeWidth="8"
                    strokeDasharray={`${progress * 2.827} ${282.7 - progress * 2.827}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="55" textAnchor="middle" className="text-2xl font-black" fill="#1f2937">
                    {progress}%
                  </text>
                  <text x="60" y="70" textAnchor="middle" className="text-[9px]" fill="#6b7280">
                    {tr.completed}
                  </text>
                </svg>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-[var(--brand-primary-light)]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]"></div>
                    <span className="text-[11px] font-semibold text-gray-700">{tr.completedLabel}</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-900">{caloriesBurned.toLocaleString('it-IT')} kcal</span>
                </div>
                
                <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-gray-50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                    <span className="text-[11px] font-semibold text-gray-700">{tr.remaining}</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-900">{caloriesRemaining.toLocaleString('it-IT')} kcal</span>
                </div>
              </div>
              
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-[9px] text-gray-500 text-center flex items-center justify-center gap-1">
                  <Activity className="w-2.5 h-2.5" />
                  {tr.calorieCalc}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weight Logger */}
        <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Scale className="w-4 h-4 text-[var(--brand-primary)]" />
              <h3 className="text-xs font-semibold text-gray-900">{tr.registerWeight}</h3>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  disabled
                  className="w-full h-10 px-3 pr-10 text-base font-semibold rounded-lg border border-gray-200 bg-white/70 cursor-not-allowed opacity-80"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">kg</span>
              </div>
              <button
                disabled
                className="px-5 h-10 bg-[var(--brand-primary)] text-white text-sm font-semibold rounded-lg cursor-not-allowed opacity-80"
              >
                {tr.saveWeight}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colonna Destra - 4 colonne */}
      <div className="lg:col-span-4 space-y-3">
        {/* Target Calorico */}
        <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{tr.targetCalories}</p>
              <span className="text-[9px] text-green-600 font-semibold">↗ +2.3%</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--brand-primary)]" />
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900">1935</span>
                <span className="text-xs text-gray-500 font-medium">kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metabolismo Basale */}
        <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{tr.bmr}</p>
              <span className="text-[9px] text-green-600 font-semibold">↗ +1.8%</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900">1876</span>
                <span className="text-xs text-gray-500 font-medium">kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Massa Grassa */}
        <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{tr.bodyFat}</p>
              <span className="text-[9px] text-gray-500 font-medium">— {tr.stable}</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900">18.3</span>
                <span className="text-xs text-gray-500 font-medium">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Giorni di Allenamento */}
        <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{tr.workoutDays}</p>
              <span className="text-[9px] text-gray-500 font-medium">— {tr.stable}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900">5</span>
                <span className="text-[11px] text-gray-500 font-medium">{tr.daysPerWeek}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Notice - Full Width */}
      <div className="lg:col-span-12 text-center">
        <p className="text-[10px] text-gray-400 italic">
          {t('home.quizDemoPreview')}
        </p>
      </div>
    </div>
    </>
  );
}