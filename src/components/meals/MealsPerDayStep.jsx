import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '../i18n/LanguageContext';

export default function MealsPerDayStep({ onDataChange, onNext, dailyCalories }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(5);

  const handleSelect = (num) => {
    setSelected(num);
    onDataChange({ meals_per_day: num });
  };

  const handleContinue = () => {
    if (selected) {
      onNext();
    }
  };

  // Calcola la distribuzione calorica stimata per pasto
  const getCalorieDistribution = (numMeals) => {
    if (!dailyCalories || numMeals === 0) return null;
    
    // Distribuzione tipica: pasti principali più calorici, snack meno
    const distributions = {
      1: [100], // 1 pasto = 100%
      2: [60, 40], // 2 pasti
      3: [30, 40, 30], // colazione, pranzo, cena
      4: [25, 35, 10, 30], // colazione, pranzo, snack, cena
      5: [25, 30, 10, 30, 5], // colazione, pranzo, snack1, cena, snack2
      6: [25, 10, 28, 10, 22, 5], // colazione, snack1, pranzo, snack2, cena, snack3
      7: [22, 8, 25, 8, 25, 7, 5] // colazione, snack1, pranzo, snack2, cena, snack3, snack4
    };
    
    const percentages = distributions[numMeals] || Array(numMeals).fill(100 / numMeals);
    return percentages.map(p => Math.round(dailyCalories * p / 100));
  };

  const calorieDistribution = selected ? getCalorieDistribution(selected) : null;
  const avgCaloriesPerMeal = dailyCalories && selected ? Math.round(dailyCalories / selected) : null;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 text-center">
          🍽️ {t('meals.mealsPerDayTitle')}
        </CardTitle>
        <p className="text-gray-600 text-center mt-2">
          {t('meals.mealsPerDaySubtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <button
              key={num}
              onClick={() => handleSelect(num)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selected === num
                  ? 'border-[#26847F] bg-[#E0F2F1] shadow-lg scale-105'
                  : 'border-gray-200 hover:border-[#26847F]/50 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl font-bold text-gray-900">{num}</div>
            </button>
          ))}
        </div>

        {/* Distribuzione calorica stimata */}
        {dailyCalories && selected && calorieDistribution && (
          <div className="bg-gradient-to-r from-[#E0F2F1] to-[#f0fdf4] rounded-xl p-4 border border-[#26847F]/20">
            <div className="text-center mb-3">
              <p className="text-sm font-medium text-gray-700">{t('meals.estimatedDistribution')}</p>
              <p className="text-xs text-gray-500">
                {t('meals.dailyTarget')}: <span className="font-bold text-[#26847F]">{dailyCalories} kcal</span>
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {calorieDistribution.map((cal, idx) => {
                const mealLabels = {
                  1: [t('meals.lunch')],
                  2: [t('meals.lunch'), t('meals.dinner')],
                  3: [t('meals.breakfast'), t('meals.lunch'), t('meals.dinner')],
                  4: [t('meals.breakfast'), t('meals.lunch'), t('meals.snack1'), t('meals.dinner')],
                  5: [t('meals.breakfast'), t('meals.lunch'), t('meals.snack1'), t('meals.dinner'), t('meals.snack2')],
                  6: [t('meals.breakfast'), t('meals.snack1'), t('meals.lunch'), t('meals.snack2'), t('meals.dinner'), t('meals.snack3')],
                  7: [t('meals.breakfast'), t('meals.snack1'), t('meals.lunch'), t('meals.snack2'), t('meals.dinner'), t('meals.snack3'), t('meals.snack4')]
                };
                const labels = mealLabels[selected] || [];
                const label = labels[idx] || `Pasto ${idx + 1}`;
                
                return (
                  <div key={idx} className="bg-white rounded-lg px-3 py-2 text-center shadow-sm border border-gray-100 min-w-[80px]">
                    <p className="text-xs text-gray-500 truncate">{label}</p>
                    <p className="text-sm font-bold text-[#26847F]">{cal} kcal</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              ~{avgCaloriesPerMeal} kcal {t('meals.perMealAvg')}
            </p>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleContinue}
            disabled={!selected}
            className="bg-[#26847F] hover:bg-[#1f6b66] text-white px-8 py-6 text-lg font-semibold rounded-xl"
          >
            {t('meals.continue')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}