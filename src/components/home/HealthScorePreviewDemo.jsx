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
  const { t, language } = useLanguage();

  const translations = React.useMemo(() => ({
    it: {
      title: 'Health Score AI',
      subtitle: 'Analisi nutrizionale automatica',
      scanned: 'Scansionata',
      evaluation: 'Valutazione',
      nutrients: 'Nutrienti Principali',
      calories: 'Calorie',
      totalFat: 'Grassi Totali',
      saturatedFat: 'Grassi Saturi',
      cholesterol: 'Colesterolo',
      dailyValue: 'del valore giornaliero',
      positive: 'Aspetti Positivi',
      critical: 'Punti Critici',
      recommendation: 'Raccomandazione AI',
      productName: 'Olio di Cocco',
      serving: 'Per porzione: 15ml',
      ratingMediumLow: 'Medio-Basso',
      positive1: 'Zero colesterolo',
      positive2: 'Senza grassi trans',
      positive3: '100% naturale',
      negative1: 'Alto contenuto di grassi saturi (63% del valore giornaliero)',
      negative2: '120 calorie per porzione',
      negative3: 'Grassi saturi: 12.5g per porzione',
      recommendationText: 'Usare con moderazione. L\'olio di cocco è calorico e ricco di grassi saturi. Considera alternative più salutari come olio di oliva o olio di avocado per uso giornaliero.',
      preview: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup'
    },
    en: {
      title: 'AI Health Score',
      subtitle: 'Automatic nutritional analysis',
      scanned: 'Scanned',
      evaluation: 'Evaluation',
      nutrients: 'Main Nutrients',
      calories: 'Calories',
      totalFat: 'Total Fat',
      saturatedFat: 'Saturated Fat',
      cholesterol: 'Cholesterol',
      dailyValue: 'of daily value',
      positive: 'Positive Aspects',
      critical: 'Critical Points',
      recommendation: 'AI Recommendation',
      productName: 'Coconut Oil',
      serving: 'Per serving: 15ml',
      ratingMediumLow: 'Medium-Low',
      positive1: 'Zero cholesterol',
      positive2: 'No trans fats',
      positive3: '100% natural',
      negative1: 'High saturated fat content (63% of daily value)',
      negative2: '120 calories per serving',
      negative3: 'Saturated fat: 12.5g per serving',
      recommendationText: 'Use in moderation. Coconut oil is caloric and rich in saturated fats. Consider healthier alternatives like olive oil or avocado oil for daily use.',
      preview: 'Interface preview • Features available after signup'
    },
    es: {
      title: 'Health Score IA',
      subtitle: 'Análisis nutricional automático',
      scanned: 'Escaneado',
      evaluation: 'Evaluación',
      nutrients: 'Nutrientes Principales',
      calories: 'Calorías',
      totalFat: 'Grasas Totales',
      saturatedFat: 'Grasas Saturadas',
      cholesterol: 'Colesterol',
      dailyValue: 'del valor diario',
      positive: 'Aspectos Positivos',
      critical: 'Puntos Críticos',
      recommendation: 'Recomendación IA',
      productName: 'Aceite de Coco',
      serving: 'Por porción: 15ml',
      ratingMediumLow: 'Medio-Bajo',
      positive1: 'Cero colesterol',
      positive2: 'Sin grasas trans',
      positive3: '100% natural',
      negative1: 'Alto contenido de grasas saturadas (63% del valor diario)',
      negative2: '120 calorías por porción',
      negative3: 'Grasas saturadas: 12.5g por porción',
      recommendationText: 'Usar con moderación. El aceite de coco es calórico y rico en grasas saturadas. Considera alternativas más saludables como aceite de oliva o aguacate para uso diario.',
      preview: 'Vista previa de interfaz • Funciones disponibles después del registro'
    },
    pt: {
      title: 'Health Score IA',
      subtitle: 'Análise nutricional automática',
      scanned: 'Digitalizado',
      evaluation: 'Avaliação',
      nutrients: 'Nutrientes Principais',
      calories: 'Calorias',
      totalFat: 'Gorduras Totais',
      saturatedFat: 'Gorduras Saturadas',
      cholesterol: 'Colesterol',
      dailyValue: 'do valor diário',
      positive: 'Aspectos Positivos',
      critical: 'Pontos Críticos',
      recommendation: 'Recomendação IA',
      productName: 'Óleo de Coco',
      serving: 'Por porção: 15ml',
      ratingMediumLow: 'Médio-Baixo',
      positive1: 'Zero colesterol',
      positive2: 'Sem gorduras trans',
      positive3: '100% natural',
      negative1: 'Alto conteúdo de gorduras saturadas (63% do valor diário)',
      negative2: '120 calorias por porção',
      negative3: 'Gorduras saturadas: 12.5g por porção',
      recommendationText: 'Usar com moderação. O óleo de coco é calórico e rico em gorduras saturadas. Considere alternativas mais saudáveis como azeite de oliva ou óleo de abacate para uso diário.',
      preview: 'Prévia da interface • Funcionalidades disponíveis após o cadastro'
    },
    de: {
      title: 'KI-Gesundheitswert',
      subtitle: 'Automatische Ernährungsanalyse',
      scanned: 'Gescannt',
      evaluation: 'Bewertung',
      nutrients: 'Hauptnährstoffe',
      calories: 'Kalorien',
      totalFat: 'Gesamtfett',
      saturatedFat: 'Gesättigte Fettsäuren',
      cholesterol: 'Cholesterin',
      dailyValue: 'des Tageswertes',
      positive: 'Positive Aspekte',
      critical: 'Kritische Punkte',
      recommendation: 'KI-Empfehlung',
      productName: 'Kokosöl',
      serving: 'Pro Portion: 15ml',
      ratingMediumLow: 'Mittel-Niedrig',
      positive1: 'Kein Cholesterin',
      positive2: 'Keine Transfette',
      positive3: '100% natürlich',
      negative1: 'Hoher Gehalt an gesättigten Fettsäuren (63% des Tageswertes)',
      negative2: '120 Kalorien pro Portion',
      negative3: 'Gesättigte Fettsäuren: 12.5g pro Portion',
      recommendationText: 'Mit Maß verwenden. Kokosöl ist kalorienreich und reich an gesättigten Fettsäuren. Erwägen Sie gesündere Alternativen wie Olivenöl oder Avocadoöl für den täglichen Gebrauch.',
      preview: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar'
    },
    fr: {
      title: 'Score Santé IA',
      subtitle: 'Analyse nutritionnelle automatique',
      scanned: 'Numérisé',
      evaluation: 'Évaluation',
      nutrients: 'Nutriments Principaux',
      calories: 'Calories',
      totalFat: 'Lipides Totaux',
      saturatedFat: 'Graisses Saturées',
      cholesterol: 'Cholestérol',
      dailyValue: 'de la valeur quotidienne',
      positive: 'Aspects Positifs',
      critical: 'Points Critiques',
      recommendation: 'Recommandation IA',
      productName: 'Huile de Coco',
      serving: 'Par portion: 15ml',
      ratingMediumLow: 'Moyen-Faible',
      positive1: 'Zéro cholestérol',
      positive2: 'Sans gras trans',
      positive3: '100% naturel',
      negative1: 'Teneur élevée en graisses saturées (63% de la valeur quotidienne)',
      negative2: '120 calories par portion',
      negative3: 'Graisses saturées: 12.5g par portion',
      recommendationText: 'Utiliser avec modération. L\'huile de coco est calorique et riche en graisses saturées. Envisagez des alternatives plus saines comme l\'huile d\'olive ou d\'avocat pour un usage quotidien.',
      preview: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription'
    }
  }), []);

  const tr = translations[language] || translations.it;

  // Analisi dell'etichetta nutrizionale dalla foto
  const nutritionAnalysis = {
    productName: tr.productName,
    servingSize: tr.serving,
    healthScore: 4.2,
    scoreLevel: tr.ratingMediumLow,
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
      tr.positive1,
      tr.positive2,
      tr.positive3
    ],
    negativeAspects: [
      tr.negative1,
      tr.negative2,
      tr.negative3
    ],
    recommendation: tr.recommendationText
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
              {tr.title}
            </span>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              {tr.subtitle}
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
            {tr.scanned}
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
              <span className="text-sm font-bold text-gray-900">{tr.evaluation}</span>
              <span className={`text-sm font-black ${nutritionAnalysis.scoreColor}`}>
                {nutritionAnalysis.scoreLevel}
              </span>
            </div>
          </div>

          {/* Nutrienti Chiave */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-700 mb-2">{tr.nutrients}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/80 rounded-lg p-2 border border-gray-200">
                <p className="text-[10px] text-gray-500 mb-0.5">{tr.calories}</p>
                <p className="text-base font-bold text-gray-900">{nutritionAnalysis.nutrients.calories} kcal</p>
              </div>
              <div className="bg-white/80 rounded-lg p-2 border border-gray-200">
                <p className="text-[10px] text-gray-500 mb-0.5">{tr.totalFat}</p>
                <p className="text-base font-bold text-gray-900">{nutritionAnalysis.nutrients.totalFat}g</p>
              </div>
              <div className="bg-red-50/80 rounded-lg p-2 border border-red-200">
                <p className="text-[10px] text-red-600 mb-0.5 font-semibold">⚠️ {tr.saturatedFat}</p>
                <p className="text-base font-bold text-red-700">{nutritionAnalysis.nutrients.saturatedFat}g</p>
                <p className="text-[9px] text-red-600 mt-0.5">63% {tr.dailyValue}</p>
              </div>
              <div className="bg-green-50/80 rounded-lg p-2 border border-green-200">
                <p className="text-[10px] text-green-600 mb-0.5 font-semibold">✓ {tr.cholesterol}</p>
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
              <h5 className="font-bold text-green-900 text-sm">{tr.positive}</h5>
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
              <h5 className="font-bold text-red-900 text-sm">{tr.critical}</h5>
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
                {tr.recommendation}
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
            {tr.preview}
          </p>
        </div>
      </CardContent>
    </Card>
    </>
  );
}