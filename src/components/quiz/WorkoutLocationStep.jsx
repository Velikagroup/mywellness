import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function WorkoutLocationStep({ data, onDataChange, nextStep }) {
  const { t } = useLanguage();
  
  const LOCATIONS = [
    { id: 'gym', label: t('workouts.locationGym'), icon: '🏋️', description: t('workouts.locationGymDesc') },
    { id: 'home', label: t('workouts.locationHome'), icon: '🏠', description: t('workouts.locationHomeDesc') },
    { id: 'outdoors', label: t('workouts.locationOutdoor'), icon: '🌳', description: t('workouts.locationOutdoorDesc') }
  ];
  const handleSelection = (location) => {
    onDataChange({ workout_location: location });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#26847F] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(38,132,127,0.3)]">
          <span className="text-2xl">📍</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('workouts.locationTitle')}</h2>
        <p className="text-gray-600">{t('workouts.locationSubtitle')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {LOCATIONS.map((location) => (
          <button
            key={location.id}
            onClick={() => handleSelection(location.id)}
            className={`p-6 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              data.workout_location === location.id
                ? 'border-[#26847F] bg-[#e9f6f5] shadow-[0_4px_16px_rgba(38,132,127,0.2)]'
                : 'border-gray-200 hover:border-[#26847F]'
            }`}
          >
            <div className="text-4xl mb-4">{location.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{location.label}</h3>
            <p className="text-sm text-gray-600">{location.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}