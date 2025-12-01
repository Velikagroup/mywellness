import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from '../i18n/LanguageContext';

export default function WorkoutStyleStep({ data, onDataChange, nextStep }) {
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState([0]);
  const [selected, setSelected] = useState(data?.workout_style || null);

  const WORKOUT_STYLES = [
  {
    category: t('workouts.catStrengthHypertrophy'),
    styles: [
      { id: 'bodybuilding', label: 'Bodybuilding' },
      { id: 'powerlifting', label: 'Powerlifting' },
      { id: 'weightlifting', label: 'Weightlifting (Sollevamento Olimpico)' },
      { id: 'streetlifting', label: 'Streetlifting' },
      { id: 'calisthenics', label: 'Calisthenics' },
      { id: 'functional_training', label: 'Functional Training' },
      { id: 'trx', label: 'Allenamento in sospensione (TRX)' }
    ]
  },
  {
    category: t('workouts.catHighIntensity'),
    styles: [
      { id: 'hiit', label: 'HIIT (High Intensity Interval Training)' },
      { id: 'crossfit', label: 'CrossFit' },
      { id: 'tabata', label: 'Tabata' },
      { id: 'bootcamp', label: 'Bootcamp' },
      { id: 'circuit_training', label: 'Circuit Training' }
    ]
  },
  {
    category: t('workouts.catConditioning'),
    styles: [
      { id: 'athletic_training', label: 'Athletic Training' },
      { id: 'plyometrics', label: 'Plyometrics' },
      { id: 'sprint_training', label: 'Sprint Training' },
      { id: 'endurance_training', label: 'Endurance Training' },
      { id: 'metcon', label: 'Metabolic Conditioning (MetCon)' }
    ]
  },
  {
    category: t('workouts.catMobilityBodyweight'),
    styles: [
      { id: 'ginnastica', label: 'Ginnastica artistica / corpo libero' },
      { id: 'animal_flow', label: 'Animal Flow' },
      { id: 'movnat', label: 'MovNat' },
      { id: 'yoga_strength', label: 'Yoga strength / Power Yoga' },
      { id: 'pilates', label: 'Pilates Matwork e Reformer' }
    ]
  },
  {
    category: t('workouts.catDance'),
    styles: [
      { id: 'zumba', label: 'Zumba' },
      { id: 'dance_fitness', label: 'Dance Fitness' },
      { id: 'step', label: 'Step Coreografico' },
      { id: 'bodyjam', label: 'BodyJam (Les Mills)' },
      { id: 'shbam', label: "Sh'Bam" },
      { id: 'pound', label: 'Pound Workout' }
    ]
  },
  {
    category: t('workouts.catMindBody'),
    styles: [
      { id: 'yoga', label: 'Yoga (Hatha, Vinyasa, Yin, Power)' },
      { id: 'pilates_mindful', label: 'Pilates' },
      { id: 'stretching', label: 'Stretching / Mobility Flow' },
      { id: 'tai_chi', label: 'Tai Chi' },
      { id: 'mindfulness', label: 'Mindfulness Movement' }
    ]
  },
  {
    category: t('workouts.catCombat'),
    styles: [
      { id: 'kickboxing', label: 'Kickboxing Fitness' },
      { id: 'boxing', label: 'Boxe / Functional Boxing' },
      { id: 'mma', label: 'MMA Conditioning' },
      { id: 'fit_kombat', label: 'Fit Kombat' },
      { id: 'krav_maga', label: 'Krav Maga (versione fitness)' }
    ]
  },
  {
    category: t('workouts.catEquipment'),
    styles: [
      { id: 'spinning', label: 'Spinning / Indoor Cycling' },
      { id: 'ellittica', label: 'Ellittica Training' },
      { id: 'rowing', label: 'Remoergometro (Rowing)' },
      { id: 'kettlebell', label: 'Kettlebell Training' },
      { id: 'sandbag', label: 'Sandbag Training' },
      { id: 'battle_ropes', label: 'Battle Ropes' }
    ]
  },
  {
    category: t('workouts.catBranded'),
    styles: [
      { id: 'bodypump', label: 'BodyPump' },
      { id: 'bodycombat', label: 'BodyCombat' },
      { id: 'bodybalance', label: 'BodyBalance' },
      { id: 'bodyattack', label: 'BodyAttack' },
      { id: 'grit', label: 'GRIT' },
      { id: 'cxworx', label: 'CXWorx/Core' },
      { id: 'booty_barre', label: 'Booty Barre' }
    ]
  }
];

const toggleCategory = (index) => {
    setExpandedCategories(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelect = (styleId) => {
    setSelected(styleId);
    onDataChange({ workout_style: styleId });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">💪 {t('workouts.workoutStyleTitle')}</h3>
        <p className="text-gray-600">{t('workouts.workoutStyleSubtitle')}</p>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {WORKOUT_STYLES.map((category, categoryIndex) => (
          <div key={categoryIndex} className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white/80">
            <button
              onClick={() => toggleCategory(categoryIndex)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900 text-left">{category.category}</span>
              {expandedCategories.includes(categoryIndex) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedCategories.includes(categoryIndex) && (
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleSelect(style.id)}
                    className={`px-4 py-3 rounded-lg border-2 text-left transition-all text-sm font-medium ${
                      selected === style.id
                        ? 'border-[#26847F] bg-[#E0F2F1] text-[#26847F] shadow-md'
                        : 'border-gray-200 hover:border-[#26847F]/50 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mt-4">
        <p className="text-sm text-blue-900 text-center">
          💡 {t('workouts.workoutStyleHint')}
        </p>
      </div>
    </div>
  );
}