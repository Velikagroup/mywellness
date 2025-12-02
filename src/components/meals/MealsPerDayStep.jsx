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