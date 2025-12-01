import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";
import { useLanguage } from '../i18n/LanguageContext';

export default function PerformanceOrientedStep({ data, onDataChange, nextStep }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(data?.is_performance_oriented ?? null);

  const handleSelect = (value) => {
    setSelected(value);
    onDataChange({ is_performance_oriented: value });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">🎯 {t('workouts.goalTypeTitle')}</h3>
        <p className="text-gray-600">{t('workouts.goalTypeSubtitle')}</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => handleSelect(true)}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            selected === true
              ? 'border-[#26847F] bg-[#E0F2F1] shadow-lg'
              : 'border-gray-200 hover:border-[#26847F]/50 bg-white hover:shadow-md'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              selected === true ? 'bg-[#26847F]' : 'bg-gray-100'
            }`}>
              <TrendingUp className={`w-6 h-6 ${selected === true ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">{t('workouts.yesPerformance')}</h4>
              <p className="text-sm text-gray-600">
                {t('workouts.yesPerformanceDesc')}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleSelect(false)}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            selected === false
              ? 'border-[#26847F] bg-[#E0F2F1] shadow-lg'
              : 'border-gray-200 hover:border-[#26847F]/50 bg-white hover:shadow-md'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              selected === false ? 'bg-[#26847F]' : 'bg-gray-100'
            }`}>
              <Target className={`w-6 h-6 ${selected === false ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">{t('workouts.noWellbeing')}</h4>
              <p className="text-sm text-gray-600">
                {t('workouts.noWellbeingDesc')}
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mt-6">
        <p className="text-sm text-blue-900 text-center">
          💡 {t('workouts.goalTypeHint')}
        </p>
      </div>
    </div>
  );
}