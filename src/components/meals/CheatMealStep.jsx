import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pizza, Cake, IceCream, Check, AlertCircle, Info } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function CheatMealStep({ weightLossSpeed, onComplete, onSkip }) {
  const { t } = useLanguage();
  const [selectedCheatMeals, setSelectedCheatMeals] = useState([]);

  const DAYS = [
    { id: 'monday', label: t('meals.monday'), short: t('meals.monday').substring(0, 3) },
    { id: 'tuesday', label: t('meals.tuesday'), short: t('meals.tuesday').substring(0, 3) },
    { id: 'wednesday', label: t('meals.wednesday'), short: t('meals.wednesday').substring(0, 3) },
    { id: 'thursday', label: t('meals.thursday'), short: t('meals.thursday').substring(0, 3) },
    { id: 'friday', label: t('meals.friday'), short: t('meals.friday').substring(0, 3) },
    { id: 'saturday', label: t('meals.saturday'), short: t('meals.saturday').substring(0, 3) },
    { id: 'sunday', label: t('meals.sunday'), short: t('meals.sunday').substring(0, 3) }
  ];

  const MEAL_TYPES = [
    { id: 'lunch', label: t('meals.lunch'), icon: '🍝' },
    { id: 'dinner', label: t('meals.dinner'), icon: '🍖' }
  ];
  
  // Determina quanti cheat meal sono consigliati
  const getRecommendedCheatMeals = () => {
    if (weightLossSpeed === 'very_fast') return 1;
    if (weightLossSpeed === 'moderate') return 1;
    if (weightLossSpeed === 'slow') return 2;
    return 1; // Default
  };

  const recommendedCount = getRecommendedCheatMeals();
  const maxCheatMeals = weightLossSpeed === 'slow' ? 2 : 1;

  const toggleCheatMeal = (day, mealType) => {
    const cheatMealKey = `${day}_${mealType}`;
    
    if (selectedCheatMeals.includes(cheatMealKey)) {
      setSelectedCheatMeals(selectedCheatMeals.filter(cm => cm !== cheatMealKey));
    } else {
      if (selectedCheatMeals.length < maxCheatMeals) {
        setSelectedCheatMeals([...selectedCheatMeals, cheatMealKey]);
      }
    }
  };

  const isSelected = (day, mealType) => {
    return selectedCheatMeals.includes(`${day}_${mealType}`);
  };

  const handleContinue = () => {
    const cheatMealConfig = selectedCheatMeals.map(cm => {
      const [day, mealType] = cm.split('_');
      return { day, meal_type: mealType };
    });
    
    onComplete(cheatMealConfig);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Pizza className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('meals.cheatMealTitle')}
        </h2>
        <p className="text-gray-600">
          {t('meals.cheatMealSubtitle')}
        </p>
      </div>

      {/* Selezione Giorni e Pasti */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {t('common.lang') === 'it' ? `Scegli quando (max ${maxCheatMeals})` : `Choose when (max ${maxCheatMeals})`}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Selezionati:</span>
            <span className="font-bold text-[#26847F]">
              {selectedCheatMeals.length}/{maxCheatMeals}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {DAYS.map((day) => (
            <Card key={day.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="min-w-[60px]">
                    <p className="font-semibold text-gray-900 text-sm">{day.short}</p>
                  </div>
                  
                  <div className="flex gap-2 flex-1">
                    {MEAL_TYPES.map((meal) => {
                      const selected = isSelected(day.id, meal.id);
                      const disabled = !selected && selectedCheatMeals.length >= maxCheatMeals;
                      
                      return (
                        <button
                          key={meal.id}
                          onClick={() => toggleCheatMeal(day.id, meal.id)}
                          disabled={disabled}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg border-2 transition-all ${
                            selected
                              ? 'bg-gradient-to-br from-orange-500 to-pink-500 border-orange-500 text-white shadow-lg'
                              : disabled
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700'
                          }`}
                        >
                          <span className="text-base">{meal.icon}</span>
                          <span className="font-medium text-xs">{meal.label}</span>
                          {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onSkip}
          variant="outline"
          className="flex-1 h-14 text-base"
        >
          {t('meals.skipCheatMeal')}
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedCheatMeals.length === 0}
          className="flex-1 h-14 text-base bg-[#26847F] hover:bg-[#1f6b66] text-white disabled:opacity-50"
        >
          {t('meals.continue')}
        </Button>
      </div>
    </div>
  );
}