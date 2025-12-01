import React from 'react';
import { Button } from "@/components/ui/button";
import { Dumbbell, Scale, Target, TrendingUp } from "lucide-react";
import { useLanguage } from '../i18n/LanguageContext';

export default function StrengthLevelStep({ data, onDataChange, nextStep }) {
  const { t } = useLanguage();
  
  const STRENGTH_LEVELS = [
    { 
      id: 'never_lifted', 
      label: t('workouts.strengthNever'),
      description: t('workouts.strengthNeverDesc'),
      icon: Target,
      weight_guidance: 'Inizia sempre senza pesi o con pesi molto leggeri (1-2kg)'
    },
    { 
      id: 'light', 
      label: t('workouts.strengthLight'),
      description: t('workouts.strengthLightDesc'),
      icon: Dumbbell,
      weight_guidance: 'Manubri 4-8kg, bilanciere scarico o 10-20kg totali'
    },
    { 
      id: 'moderate', 
      label: t('workouts.strengthModerate'),
      description: t('workouts.strengthModerateDesc'),
      icon: Scale,
      weight_guidance: 'Manubri 8-15kg, bilanciere 30-50kg'
    },
    { 
      id: 'intermediate', 
      label: t('workouts.strengthIntermediate'),
      description: t('workouts.strengthIntermediateDesc'),
      icon: TrendingUp,
      weight_guidance: 'Usa il 70-75% dei massimali indicati'
    },
    { 
      id: 'advanced', 
      label: t('workouts.strengthAdvanced'),
      description: t('workouts.strengthAdvancedDesc'),
      icon: TrendingUp,
      weight_guidance: 'Calcola i carichi come % del tuo 1RM'
    }
  ];
  const handleSelect = (level) => {
    const selectedLevel = STRENGTH_LEVELS.find(l => l.id === level);
    onDataChange({ 
      strength_level: level,
      weight_guidance: selectedLevel?.weight_guidance 
    });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Dumbbell className="w-12 h-12 text-[#26847F] mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900">
          {t('workouts.strengthLevelTitle')}
        </h3>
        <p className="text-gray-600 mt-2">
          {t('workouts.strengthLevelSubtitle')}
        </p>
      </div>

      <div className="grid gap-3">
        {STRENGTH_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => handleSelect(level.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              data.strength_level === level.id
                ? 'border-[#26847F] bg-[#e9f6f5]'
                : 'border-gray-200 hover:border-[#26847F]/50 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${data.strength_level === level.id ? 'bg-[#26847F] text-white' : 'bg-gray-100 text-gray-600'}`}>
                <level.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{level.label}</p>
                <p className="text-sm text-gray-600">{level.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}