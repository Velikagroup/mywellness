import React from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function SessionDurationStep({ data, onDataChange, nextStep }) {
  const { t } = useLanguage();
  
  const DURATIONS = [
    { id: 'under_20', label: t('workouts.durationUnder20'), description: t('workouts.sessionFast') },
    { id: '30_min', label: t('workouts.duration30'), description: t('workouts.sessionStandard') },
    { id: '45_min', label: t('workouts.duration45'), description: t('workouts.sessionExtended') },
    { id: 'over_60', label: t('workouts.durationOver60'), description: t('workouts.sessionLong') }
  ];
  const handleSelection = (duration) => {
    onDataChange({ session_duration: duration });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#26847F] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(38,132,127,0.3)]">
          <Clock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('workouts.sessionDurationTitle')}</h2>
        <p className="text-gray-600">{t('workouts.sessionDurationSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {DURATIONS.map((duration) => (
          <button
            key={duration.id}
            onClick={() => handleSelection(duration.id)}
            className={`p-6 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              data.session_duration === duration.id
                ? 'border-[#26847F] bg-[#e9f6f5] shadow-[0_4px_16px_rgba(38,132,127,0.2)]'
                : 'border-gray-200 hover:border-[#26847F]'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 mb-2">{duration.label}</div>
            <p className="text-sm text-gray-600">{duration.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}