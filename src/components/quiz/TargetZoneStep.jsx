import React from 'react';
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

export default function TargetZoneStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};
  const selectedZones = data.target_zones || [];

  const TARGET_ZONES = [
    { id: 'arms', label: t.zoneArms || 'Braccia', icon: '💪', description: t.zoneArmsDesc || 'Tonificare bicipiti e tricipiti' },
    { id: 'chest', label: t.zoneChest || 'Petto', icon: '🦸', description: t.zoneChestDesc || 'Sviluppare pettorali' },
    { id: 'shoulders', label: t.zoneShoulders || 'Spalle', icon: '🏋️', description: t.zoneShouldersDesc || 'Rafforzare deltoidi' },
    { id: 'back', label: t.zoneBack || 'Schiena', icon: '🧍', description: t.zoneBackDesc || 'Migliorare postura e dorsali' },
    { id: 'belly', label: t.zoneBelly || 'Addome', icon: '🤰', description: t.zoneBellyDesc || 'Ridurre grasso addominale' },
    { id: 'waist', label: t.zoneWaist || 'Fianchi/Vita', icon: '⏳', description: t.zoneWaistDesc || 'Definire punto vita' },
    { id: 'glutes', label: t.zoneGlutes || 'Glutei', icon: '🍑', description: t.zoneGlutesDesc || 'Sviluppare e modellare glutei' },
    { id: 'thighs', label: t.zoneThighs || 'Cosce', icon: '🦵', description: t.zoneThighsDesc || 'Tonificare quadricipiti e femorali' },
    { id: 'calves', label: t.zoneCalves || 'Polpacci', icon: '🏃', description: t.zoneCalvesDesc || 'Rafforzare parte bassa gambe' },
    { id: 'face_neck', label: t.zoneFaceNeck || 'Viso e Collo', icon: '😊', description: t.zoneFaceNeckDesc || 'Definire lineamenti' },
    { id: 'full_body', label: t.zoneFullBody || 'Corpo Intero', icon: '🎯', description: t.zoneFullBodyDesc || 'Miglioramento generale' }
  ];

  const handleSelection = (zoneId) => {
    let newZones;
    if (selectedZones.includes(zoneId)) {
      newZones = selectedZones.filter(z => z !== zoneId);
    } else {
      newZones = [...selectedZones, zoneId];
    }
    onDataChange({ target_zones: newZones });
  };

  return (
    <div className="space-y-6 pt-20 w-full max-w-[416px] mx-auto px-4 md:px-0">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />
      <QuizQuestionHeader
        title={t.quizTargetZoneTitle || "Su quali zone vuoi concentrarti?"}
        subtitle={t.quizTargetZoneSubtitle || "Seleziona una o più aree di miglioramento"}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {TARGET_ZONES.map((zone) => (
          <button
            key={zone.id}
            onClick={() => handleSelection(zone.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              selectedZones.includes(zone.id)
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-lg'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <div className="text-3xl mb-2">{zone.icon}</div>
            <p className="font-semibold text-gray-900 text-sm mb-1">{zone.label}</p>
            <p className="text-xs text-gray-600">{zone.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}