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
      scientificDashboard: 'Dashboard Scientifica',
      subtitle: 'Monitora il tuo bilancio calorico giornaliero in tempo reale - la metrica più importante per raggiungere i tuoi obiettivi. Visualizza anche BMR, fabbisogno calorico, massa grassa e proiezioni.',
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
      subtitle: 'Track your daily calorie balance in real-time - the most important metric to achieve your goals. Also view BMR, calorie needs, body fat and projections.',
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
      subtitle: 'Monitorea tu balance calórico diario en tiempo real - la métrica más importante para lograr tus objetivos. También visualiza TMB, necesidades calóricas, grasa corporal y proyecciones.',
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
      subtitle: 'Monitore seu balanço calórico diário em tempo real - a métrica mais importante para alcançar seus objetivos. Também visualize TMB, necessidades calóricas, gordura corporal e projeções.',
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
      subtitle: 'Verfolgen Sie Ihre tägliche Kalorienbilanz in Echtzeit - die wichtigste Metrik, um Ihre Ziele zu erreichen. Sehen Sie auch BMR, Kalorienbedarf, Körperfett und Prognosen.',
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
      subtitle: 'Suivez votre bilan calorique quotidien en temps réel - la métrique la plus importante pour atteindre vos objectifs. Visualisez aussi MB, besoins caloriques, masse grasse et projections.',
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

  const meals = [
    {
      name: "Pranzo",
      description: "Fritatine di Carne con Capuette e Nueces",
      calories: 824,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"
    },
    {
      name: "Snack Pomeridiano",
      description: "Snack Torino de Arete con Llenage con Carne de Jeu y Queso",
      calories: 557,
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop"
    },
    {
      name: "Cena",
      description: "Pesto de Merluza/Ripe Frito con Aguacate e Insalata Verde",
      calories: 618,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop"
    }
  ];

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

      <Card className="water-glass-effect border-gray-200/40 shadow-2xl overflow-hidden">
        <CardContent className="p-6">
          {/* Header: Bilancio Calorico + Weight Box */}
          <div className="relative flex items-start justify-between mb-6 pb-6">
            {/* Left: Bilancio Calorico */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {language === 'it' ? 'Bilancio di oggi' : language === 'es' ? 'Balance de hoy' : language === 'pt' ? 'Balanço de hoje' : language === 'de' ? 'Heutiger Saldo' : language === 'fr' ? 'Bilan d\'aujourd\'hui' : 'Today\'s Balance'}
                </p>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-5xl font-bold text-green-700 leading-tight" style={{
                  filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.18)) drop-shadow(0 0 16px rgba(34, 197, 94, 0.12))'
                }}>
                  -1721
                </p>
                <p className="text-xl font-medium text-green-700">kcal</p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium inline-block bg-green-100/70 text-green-700">
                {language === 'it' ? 'In forte deficit' : language === 'es' ? 'En fuerte déficit' : language === 'pt' ? 'Em forte déficit' : language === 'de' ? 'Stark im Defizit' : language === 'fr' ? 'En fort déficit' : 'Strong deficit'}
              </div>
            </div>

            {/* Right: Peso Attuale → Target */}
            <div className="absolute top-0 right-0 flex items-center gap-1 border border-gray-200/60 rounded-lg px-2 py-1">
              <div className="text-right">
                <div className="flex items-baseline gap-0.5">
                  <p className="font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent" style={{ fontSize: '16px' }}>81.9</p>
                  <p className="text-xs font-semibold text-green-600">kg</p>
                </div>
              </div>
              <div className="font-light text-gray-400" style={{ fontSize: '16px' }}>&gt;</div>
              <div className="text-left">
                <div className="flex items-baseline gap-0.5">
                  <p className="font-bold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent" style={{ fontSize: '16px' }}>76.0</p>
                  <p className="text-xs font-semibold text-teal-600">kg</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weight Chart */}
          <div className="h-64 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 25, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="weightLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#26847F" stopOpacity={0.4}/>
                    <stop offset="50%" stopColor="#26847F" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#26847F" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" tickLine={false} axisLine={{ stroke: '#e0e0e0' }} style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" tickLine={false} axisLine={false} domain={[71, 85]} tickFormatter={(value) => `${value}kg`} style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <ReferenceLine 
                  y={76} 
                  stroke="#26847F" 
                  strokeDasharray="4 4" 
                  strokeWidth={2}
                  label={{ 
                    value: 'Target', 
                    position: 'insideTopRight', 
                    fill: '#26847F', 
                    fontSize: 13,
                    fontWeight: 'bold'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="url(#weightLineGradient)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#26847F', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 2 }} 
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Progress Bars - Calorie Consumate e Bruciate */}
          <div className="space-y-4 mb-6 pt-4 border-t border-gray-200/50">
            {/* Calorie Consumate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  {language === 'it' ? 'Calorie Consumate' : language === 'es' ? 'Calorías Consumidas' : language === 'pt' ? 'Calorias Consumidas' : language === 'de' ? 'Verbrauchte Kalorien' : language === 'fr' ? 'Calories Consommées' : 'Calories Consumed'}
                </span>
                <span className="font-bold text-red-500">3099 kcal</span>
              </div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-medium text-gray-600 text-xs">
                  {language === 'it' ? 'Target Calorico' : 'Calorie Target'}: <span className="font-bold text-red-500">2000 kcal</span>
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Calorie Bruciate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  {language === 'it' ? 'Calorie Bruciate' : language === 'es' ? 'Calorías Quemadas' : language === 'pt' ? 'Calorias Queimadas' : language === 'de' ? 'Verbrannte Kalorien' : language === 'fr' ? 'Calories Brûlées' : 'Calories Burned'}
                </span>
                <span className="font-bold text-green-600">3720 kcal</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600 text-xs">
                  BMR: <span className="text-green-600">1800 kcal</span>
                </span>
                <span className="font-medium text-gray-600 text-xs">
                  NEAT: <span className="text-green-400">675 kcal</span>
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div className="h-full bg-green-600" style={{ width: '48%' }}></div>
                  <div className="w-[2px] h-full bg-white opacity-80"></div>
                  <div className="h-full bg-green-400" style={{ width: '18%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Macros + Meals */}
          <div className="space-y-6">
            {/* Macro Circles */}
            <div className="flex items-center justify-around py-4">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <span className="text-xl">🥩</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">0g</p>
                <p className="text-xs text-gray-600">{language === 'it' ? 'Proteine' : language === 'es' ? 'Proteínas' : language === 'pt' ? 'Proteínas' : language === 'de' ? 'Proteine' : language === 'fr' ? 'Protéines' : 'Protein'}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <span className="text-xl">🌾</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">0g</p>
                <p className="text-xs text-gray-600">{language === 'it' ? 'Carboidrati' : language === 'es' ? 'Carbohidratos' : language === 'pt' ? 'Carboidratos' : language === 'de' ? 'Kohlenhydrate' : language === 'fr' ? 'Glucides' : 'Carbs'}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <span className="text-xl">🥑</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">0g</p>
                <p className="text-xs text-gray-600">{language === 'it' ? 'Grassi' : language === 'es' ? 'Grasas' : language === 'pt' ? 'Gorduras' : language === 'de' ? 'Fette' : language === 'fr' ? 'Graisses' : 'Fat'}</p>
              </div>
            </div>

            {/* Meals List */}
            <div className="space-y-3">
              {meals.map((meal, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <img src={meal.image} alt={meal.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{meal.name}</p>
                      <p className="text-xs text-gray-600 line-clamp-1">{meal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{meal.calories}</p>
                    <p className="text-xs text-gray-600">kcal</p>
                    <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
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