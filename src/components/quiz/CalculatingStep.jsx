import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function CalculatingStep({ translations }) {
  const t = translations?.quiz || {};
  const [progress, setProgress] = useState(0);
  const [completedItems, setCompletedItems] = useState([]);

  const items = [
    { id: 'calories', label: t.quizCalories || 'Calorías' },
    { id: 'carbs', label: t.quizCarbs || 'Hidratos' },
    { id: 'protein', label: t.quizProtein || 'Proteína' },
    { id: 'fats', label: t.quizFats || 'Grasas' }
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) {
          clearInterval(progressInterval);
          return 99;
        }
        return prev + 1;
      });
    }, 50);

    const itemInterval = setInterval(() => {
      setCompletedItems(prev => {
        if (prev.length >= items.length) {
          clearInterval(itemInterval);
          return prev;
        }
        return [...prev, items[prev.length].id];
      });
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(itemInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Percentage */}
        <div className="space-y-2">
          <h1 className="text-7xl font-semibold text-gray-900">
            {progress}%
          </h1>
          <p className="text-xl font-bold text-gray-900">
            {t.quizConfiguringTitle || 'Estamos configurándolo todo para ti'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#26847F] to-teal-400 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Text */}
        <p className="text-base text-gray-600">
          {progress < 90 
            ? (t.quizPersonalizingPlan || 'Personalizando el plan de salud...')
            : (t.quizFinalizingResults || 'Finalizando resultados...')}
        </p>

        {/* Checklist */}
        <div className="pt-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-left">
            {t.quizDailyRecommendation || 'Recomendación diaria'}
          </h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-left">
                <span className="text-base text-gray-700">• {item.label}</span>
                {completedItems.includes(item.id) && (
                  <CheckCircle2 className="w-6 h-6 text-gray-900" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}