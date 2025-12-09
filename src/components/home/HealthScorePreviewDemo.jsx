import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, TrendingDown, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Componente DEMO per Homepage - Health Score
 * Mostra l'analisi AI di un'etichetta nutrizionale con scoring
 * SCALA 0-10 (come Nutri-Score europeo)
 */
export default function HealthScorePreviewDemo() {
  const { t } = useLanguage();
  // Analisi dell'etichetta nutrizionale dalla foto
  const nutritionAnalysis = {
    productName: "Olio di Cocco",
    servingSize: "1 cucchiaio (15 mL)",
    healthScore: 4.2, // Score su 10 (come Nutri-Score)
    scoreLevel: "Medio-Basso",
    scoreColor: "text-orange-600",
    scoreBg: "bg-orange-50",
    nutrients: {
      calories: 120,
      totalFat: 14,
      saturatedFat: 12.5,
      transFat: 0,
      cholesterol: 0
    },
    positiveAspects: [
      "Zero colesterolo",
      "Nessun grasso trans",
      "100% naturale"
    ],
    negativeAspects: [
      "Alto contenuto di grassi saturi (63% del valore giornaliero)",
      "120 calorie per porzione",
      "Grassi saturi: 12.5g per porzione"
    ],
    recommendation: "Usa con moderazione. L'olio di cocco è ricco di grassi saturi che possono aumentare il colesterolo LDL. Considera alternative più salutari come olio d'oliva o olio di avocado per uso quotidiano."
  };

  // Calcolo circonferenza per il cerchio (scala 0-10)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = (nutritionAnalysis.healthScore / 10) * 100;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  // Determina colore basato sullo score (0-10)
  const getScoreColor = (score) => {
    if (score >= 7) return "#10b981"; // verde (7-10)
    if (score >= 4) return "#f59e0b"; // arancione (4-6.9)
    return "#ef4444"; // rosso (0-3.9)
  };

  const scoreColor = getScoreColor(nutritionAnalysis.healthScore);

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
      
      <Card className="water-glass-effect border-gray-200/30 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="border-b border-gray-200/50 pb-4 bg-gradient-to-br from-white via-purple-50/30 to-white">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold">
              {t('home.healthScoreTitle')}
            </span>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              {t('home.healthScoreSubtitle')}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Foto Etichetta */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200/50 shadow-lg">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e08bc470_etichettatura-alimenti-valori-nutrizionali.jpg"
            alt="Etichetta Nutrizionale"
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {t('home.healthScoreScanned')}
          </div>
        </div>

        {/* Health Score Circle */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-900 mb-1">{nutritionAnalysis.productName}</h4>
              <p className="text-xs text-gray-500">{nutritionAnalysis.servingSize}</p>
            </div>
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}>
                {/* Cerchio di sfondo */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke="#e5e7eb"
                  strokeWidth="10"
                  fill="white"
                />
                {/* Cerchio di progresso */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke={scoreColor}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 8px ${scoreColor}40)`,
                    transition: 'all 0.3s ease'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${nutritionAnalysis.scoreColor}`}>
                  {nutritionAnalysis.healthScore.toFixed(1)}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold">/10</span>
              </div>
            </div>
          </div>

          <div className={`${nutritionAnalysis.scoreBg} border-2 border-orange-200 rounded-xl p-3 mb-4`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">{t('home.healthScoreEvaluation')}</span>
              <span className={`text-sm font-black ${nutritionAnalysis.scoreColor}`}>
                {nutritionAnalysis.scoreLevel}
              </span>
            </div>
          </div>

          {/* Nutrienti Chiave */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-700 mb-2">{t('home.healthScoreNutrients')}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/80 rounded-lg p-2 border border-gray-200">
                <p className="text-[10px] text-gray-500 mb-0.5">{t('home.healthScoreCalories')}</p>
                <p className="text-base font-bold text-gray-900">{nutritionAnalysis.nutrients.calories} kcal</p>
              </div>
              <div className="bg-white/80 rounded-lg p-2 border border-gray-200">
                <p className="text-[10px] text-gray-500 mb-0.5">{t('home.healthScoreTotalFat')}</p>
                <p className="text-base font-bold text-gray-900">{nutritionAnalysis.nutrients.totalFat}g</p>
              </div>
              <div className="bg-red-50/80 rounded-lg p-2 border border-red-200">
                <p className="text-[10px] text-red-600 mb-0.5 font-semibold">⚠️ Grassi Saturi</p>
                <p className="text-base font-bold text-red-700">{nutritionAnalysis.nutrients.saturatedFat}g</p>
                <p className="text-[9px] text-red-600 mt-0.5">63% {t('home.healthScoreDailyValue')}</p>
              </div>
              <div className="bg-green-50/80 rounded-lg p-2 border border-green-200">
                <p className="text-[10px] text-green-600 mb-0.5 font-semibold">✓ {t('home.healthScoreCholesterol')}</p>
                <p className="text-base font-bold text-green-700">{nutritionAnalysis.nutrients.cholesterol}mg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Aspetti Positivi e Negativi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Positivi */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h5 className="font-bold text-green-900 text-sm">{t('home.healthScorePositive')}</h5>
            </div>
            <ul className="space-y-2">
              {nutritionAnalysis.positiveAspects.map((aspect, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-green-800">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{aspect}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Negativi */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h5 className="font-bold text-red-900 text-sm">{t('home.healthScoreCritical')}</h5>
            </div>
            <ul className="space-y-2">
              {nutritionAnalysis.negativeAspects.map((aspect, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-red-800">
                  <span className="text-red-600 mt-0.5">⚠</span>
                  <span>{aspect}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Raccomandazione */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-purple-900 text-sm mb-2">
                {t('home.healthScoreRecommendation')}
              </p>
              <p className="text-xs text-purple-800 leading-relaxed">
                {nutritionAnalysis.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-400 italic">
            {t('home.quizDemoPreview')}
          </p>
        </div>
      </CardContent>
    </Card>
    </>
  );
}