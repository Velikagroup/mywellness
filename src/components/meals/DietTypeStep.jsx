import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '../i18n/LanguageContext';

export default function DietTypeStep({ onDataChange, onNext, currentDietType }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(currentDietType || 'mediterranean');

  const dietTypes = [
    { id: 'mediterranean', label: t('meals.dietMediterranean'), emoji: '🍝', desc: t('meals.dietMediterraneanDesc') },
    { id: 'low_carb', label: t('meals.dietLowCarb'), emoji: '🥩', desc: t('meals.dietLowCarbDesc') },
    { id: 'soft_low_carb', label: t('meals.dietSoftLowCarb'), emoji: '🥗', desc: t('meals.dietSoftLowCarbDesc') },
    { id: 'paleo', label: t('meals.dietPaleo'), emoji: '🦴', desc: t('meals.dietPaleoDesc') },
    { id: 'keto', label: t('meals.dietKeto'), emoji: '🥓', desc: t('meals.dietKetoDesc') },
    { id: 'carnivore', label: t('meals.dietCarnivore'), emoji: '🍖', desc: t('meals.dietCarnivoreDesc') },
    { id: 'vegetarian', label: t('meals.dietVegetarian'), emoji: '🥕', desc: t('meals.dietVegetarianDesc') },
    { id: 'vegan', label: t('meals.dietVegan'), emoji: '🌱', desc: t('meals.dietVeganDesc') }
  ];

  const handleSelect = (id) => {
    setSelected(id);
    onDataChange({ diet_type: id });
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
          🥗 {t('meals.dietTypeTitle')}
        </CardTitle>
        <p className="text-gray-600 text-center mt-2">
          {t('meals.dietTypeSubtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {dietTypes.map((diet) => (
            <button
              key={diet.id}
              onClick={() => handleSelect(diet.id)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selected === diet.id
                  ? 'border-[#26847F] bg-[#E0F2F1] shadow-lg'
                  : 'border-gray-200 hover:border-[#26847F]/50 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl mb-2">{diet.emoji}</div>
              <div className="font-bold text-sm text-gray-900 mb-1">{diet.label}</div>
              <div className="text-xs text-gray-600">{diet.desc}</div>
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