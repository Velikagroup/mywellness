import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function JointPainStep({ data, onDataChange, nextStep }) {
  const { t } = useLanguage();
  
  const JOINT_PAIN_OPTIONS = [
    { id: 'ginocchia', label: t('workouts.painKnees'), description: t('workouts.painKneesDesc') },
    { id: 'schiena', label: t('workouts.painBack'), description: t('workouts.painBackDesc') },
    { id: 'spalle', label: t('workouts.painShoulders'), description: t('workouts.painShouldersDesc') },
    { id: 'gomiti', label: t('workouts.painElbows'), description: t('workouts.painElbowsDesc') },
    { id: 'polsi', label: t('workouts.painWrists'), description: t('workouts.painWristsDesc') },
    { id: 'anche', label: t('workouts.painHips'), description: t('workouts.painHipsDesc') },
    { id: 'caviglie', label: t('workouts.painAnkles'), description: t('workouts.painAnklesDesc') },
    { id: 'nessuno', label: t('workouts.noPain'), description: t('workouts.noPainDesc') }
  ];
  const [selectedPains, setSelectedPains] = useState(data.joint_pain || []);

  const handleToggle = (painId) => {
    let newSelection;
    
    if (painId === 'nessuno') {
      newSelection = selectedPains.includes('nessuno') ? [] : ['nessuno'];
    } else {
      newSelection = selectedPains.includes(painId)
        ? selectedPains.filter(id => id !== painId)
        : [...selectedPains.filter(id => id !== 'nessuno'), painId];
    }
    
    setSelectedPains(newSelection);
    onDataChange({ joint_pain: newSelection.filter(id => id !== 'nessuno') });
  };

  const handleContinue = () => {
    if (nextStep) {
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#26847F] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(38,132,127,0.3)]">
          <span className="text-2xl">🩺</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('workouts.jointPainTitle')}</h2>
        <p className="text-gray-600">{t('workouts.jointPainSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {JOINT_PAIN_OPTIONS.map((option) => {
          const isSelected = selectedPains.includes(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-[#26847F] bg-[#e9f6f5] shadow-[0_4px_16px_rgba(38,132,127,0.2)]'
                  : 'border-gray-200 hover:border-[#26847F]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {isSelected ? (
                    <CheckCircle className="w-6 h-6 text-[#26847F]" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Button 
          onClick={handleContinue}
          className="bg-[#26847F] hover:bg-[#1f6b66] text-white px-8 shadow-[0_4px_16px_rgba(38,132,127,0.3)] hover:shadow-[0_6px_20px_rgba(38,132,127,0.4)]"
        >
          {t('workouts.continue')}
        </Button>
      </div>
    </div>
  );
}