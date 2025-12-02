import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '../i18n/LanguageContext';

export default function IntermittentFastingStep({ onDataChange, onNext }) {
  const { t } = useLanguage();
  
  const handleChoice = (choice) => {
    onDataChange({ intermittent_fasting: choice });
    setTimeout(() => onNext(), 300);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 text-center">
          🕐 {t('meals.ifTitle')}
        </CardTitle>
        <p className="text-gray-600 text-center mt-2">
          {t('meals.ifSubtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleChoice(false)}
            className="p-6 rounded-xl border-2 border-gray-200 hover:border-[#26847F] hover:bg-[#E0F2F1] transition-all text-center group"
          >
            <div className="text-4xl mb-3">🍽️</div>
            <div className="font-bold text-lg text-gray-900 mb-2">{t('meals.ifNo')}</div>
          </button>

          <button
            onClick={() => handleChoice(true)}
            className="p-6 rounded-xl border-2 border-[#26847F] bg-[#E0F2F1] hover:bg-[#26847F] hover:text-white transition-all text-center group"
          >
            <div className="text-4xl mb-3">⏱️</div>
            <div className="font-bold text-lg text-gray-900 group-hover:text-white mb-2">{t('meals.ifYes')}</div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}