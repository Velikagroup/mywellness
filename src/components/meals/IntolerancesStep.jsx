import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function IntolerancesStep({ data, onDataChange, nextStep }) {
  const { t } = useLanguage();
  const [selectedIntolerances, setSelectedIntolerances] = useState(
    data?.intolerances || []
  );
  const [customIntolerances, setCustomIntolerances] = useState(
    data?.custom_intolerances || ''
  );

  const COMMON_INTOLERANCES = [
    { id: 'lactose', label: t('meals.intoleranceLactose') },
    { id: 'gluten', label: t('meals.intoleranceGluten') },
    { id: 'nuts', label: t('meals.intoleranceNuts') },
    { id: 'eggs', label: t('meals.intoleranceEggs') },
    { id: 'soy', label: t('meals.intoleranceSoy') },
    { id: 'fish', label: t('meals.intoleranceFish') },
    { id: 'peanuts', label: t('meals.intolerancePeanuts') },
    { id: 'sesame', label: t('meals.intoleranceSesame') },
    { id: 'sulfites', label: t('meals.intoleranceSulfites') },
    { id: 'histamine', label: t('meals.intoleranceHistamine') },
    { id: 'fructose', label: t('meals.intoleranceFructose') },
    { id: 'sorbitol', label: t('meals.intoleranceSorbitol') }
  ];

  const toggleIntolerance = (intolerance) => {
    setSelectedIntolerances(prev => {
      if (prev.includes(intolerance)) {
        return prev.filter(i => i !== intolerance);
      }
      return [...prev, intolerance];
    });
  };

  const handleNext = () => {
    onDataChange({ 
      intolerances: selectedIntolerances,
      custom_intolerances: customIntolerances.trim()
    });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <AlertCircle className="w-12 h-12 text-[var(--brand-primary)] mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {t('meals.intolerancesTitle')}
        </h3>
        <p className="text-gray-600">
          {t('meals.intolerancesSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-2">
        {COMMON_INTOLERANCES.map((intolerance) => (
          <button
            key={intolerance.id}
            onClick={() => toggleIntolerance(intolerance.id)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              selectedIntolerances.includes(intolerance.id)
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-md'
                : 'border-gray-200 hover:border-[var(--brand-primary)]/50 bg-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <p className="font-semibold text-gray-900">{intolerance.label}</p>
              {selectedIntolerances.includes(intolerance.id) && (
                <div className="w-5 h-5 rounded-full bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <textarea
          value={customIntolerances}
          onChange={(e) => setCustomIntolerances(e.target.value)}
          placeholder={t('meals.customIntolerancesPlaceholder')}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#26847F] focus:outline-none resize-none"
          rows={3}
        />
      </div>

      <div className="pt-4">
        <Button
          onClick={handleNext}
          className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white py-6 text-base font-semibold rounded-xl"
        >
          {t('meals.continue')}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}