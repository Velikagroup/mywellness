import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, Activity } from 'lucide-react';

export default function MealPlanGenerating({ generationProgress, generationStatus, nutritionData, t }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-8 md:pt-4">
      <style>{`
        @keyframes energyPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4)); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.8)); }
        }
        @keyframes containerGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(38, 132, 127, 0.3), 0 0 40px rgba(38, 132, 127, 0.2), inset 0 0 15px rgba(34, 197, 94, 0.1); }
          50% { box-shadow: 0 0 30px rgba(38, 132, 127, 0.5), 0 0 60px rgba(38, 132, 127, 0.3), inset 0 0 25px rgba(34, 197, 94, 0.2); }
        }
        @keyframes progressShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animated-nutrition-container { 
          animation: containerGlow 2s ease-in-out infinite; 
          background: linear-gradient(135deg, #26847F 0%, #14b8a6 50%, #22c55e 100%); 
        }
        .animated-energy-icon { animation: energyPulse 1.5s ease-in-out infinite; }
        .shimmer-progress {
          background: linear-gradient(90deg, #26847F 0%, #14b8a6 25%, #26847F 50%, #14b8a6 75%, #26847F 100%);
          background-size: 200% 100%;
          animation: progressShimmer 2s linear infinite;
        }
      `}</style>
      
      <div className="max-w-xl w-full">
        <Card className="bg-white/60 backdrop-blur-md border-gray-200/40 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden animated-nutrition-container flex items-center justify-center">
              <Activity className="w-8 h-8 text-white animated-energy-icon" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 text-center">
              {t('meals.loadingTitle')}
            </CardTitle>
            <p className="text-sm text-gray-600 text-center mt-2">{t('meals.loadingDesc')}</p>
            <p className="text-xs text-amber-600 text-center mt-3 font-semibold">⏱️ {t('workouts.timeWarning')}</p>
            <p className="text-xs text-red-600 text-center mt-2 font-bold">⚠️ {t('workouts.dontLeavePage')}</p>
          </CardHeader>
          
          <CardContent className="space-y-5 px-6 pb-6">
            <div className="space-y-2">
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full shimmer-progress transition-all duration-300" style={{ width: `${generationProgress}%` }} />
              </div>
              <p className="text-sm text-[#26847F] font-semibold text-center min-h-[20px]">{generationStatus}</p>
            </div>
            
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/60">
              <h4 className="font-semibold text-gray-800 text-sm mb-3">{t('meals.analysisInProgress')}</h4>
              <ul className="space-y-2 text-xs">
                {[
                  { threshold: 10, label: t('meals.metabolicProfile').replace('{bmr}', nutritionData?.bmr) },
                  { threshold: 25, label: t('meals.caloricTarget').replace('{calories}', nutritionData?.daily_calories) },
                  { threshold: 50, label: t('meals.autoBalancing') },
                  { threshold: 60, label: t('meals.planGenerated') },
                  { threshold: 70, label: t('meals.ingredientValidation') },
                  { threshold: 85, label: t('meals.imageGeneration') },
                  { threshold: 95, label: t('meals.savingPlan') },
                ].map(({ threshold, label }) => (
                  <li key={threshold} className="flex items-center">
                    {generationProgress >= threshold ? (
                      <CheckCircle className="inline w-4 h-4 mr-2 text-[#26847F]" />
                    ) : generationProgress >= threshold - 15 ? (
                      <Loader2 className="inline w-4 h-4 mr-2 text-[#26847F] animate-spin" />
                    ) : (
                      <CheckCircle className="inline w-4 h-4 mr-2 text-gray-300" />
                    )}
                    <span className="text-gray-700">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200/60">
              <p className="text-xs text-amber-800 leading-relaxed">{t('meals.disclaimer')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}