import React from 'react';
import QuizHeader from './QuizHeader';

const MALE_BODY_TYPES = [
  { percentage: 8, label: '8%', description: 'Estremamente Definito', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/1acaba3b0_Male-body-fat-8.png' },
  { percentage: 10, label: '10%', description: 'Molto Definito', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/96a00655d_Male-body-fat-10.png' },
  { percentage: 15, label: '15%', description: 'Atletico', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/69302b19e_Male-body-fat-15.png' },
  { percentage: 20, label: '20%', description: 'Fit', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/b7be7a4c5_Male-body-fat-20.png' },
  { percentage: 25, label: '25%', description: 'Media', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/3b887d54b_Male-body-fat-25.png' },
  { percentage: 30, label: '30%', description: 'Sopra Media', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/f54bb3688_Male-body-fat-30.png' },
  { percentage: 35, label: '35%', description: 'Sovrappeso', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/ee93c412f_Male-body-fat-35.png' },
  { percentage: 40, label: '40%', description: 'Obeso', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/717800cd5_Male-body-fat-40.png' },
  { percentage: 45, label: '45%', description: 'Obeso Grave', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/99df4e995_Male-body-fat-45.png' }
];

const FEMALE_BODY_TYPES = [
  { percentage: 12, label: '12%', description: 'Estremamente Definita', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/772b8960d_Female-body-fat-12.png' },
  { percentage: 15, label: '15%', description: 'Molto Definita', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/f0c622feb_Female-body-fat-15.png' },
  { percentage: 20, label: '20%', description: 'Atletica', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2439ba582_Female-body-fat-20.png' },
  { percentage: 25, label: '25%', description: 'Fit', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/37e8213a8_Female-body-fat-25.png' },
  { percentage: 30, label: '30%', description: 'Media', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/1a67a83de_Female-body-fat-30.png' },
  { percentage: 35, label: '35%', description: 'Sopra Media', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/020311e64_Female-body-fat-35.png' },
  { percentage: 40, label: '40%', description: 'Sovrappeso', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2bc13882f_Female-body-fat-40.png' },
  { percentage: 45, label: '45%', description: 'Obesa', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/124ac4fdb_Female-body-fat-45.png' },
  { percentage: 50, label: '50%', description: 'Obesa Grave', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/61e4d162e_Female-body-fat-50.png' }
];

export default function TargetBodyTypeStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};

  const MALE_BODY_TYPES = [
    { percentage: 8, label: '8%', description: t.bodyTypeMale8 || 'Estremamente Definito', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/1acaba3b0_Male-body-fat-8.png' },
    { percentage: 10, label: '10%', description: t.bodyTypeMale10 || 'Molto Definito', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/96a00655d_Male-body-fat-10.png' },
    { percentage: 15, label: '15%', description: t.bodyTypeMale15 || 'Atletico', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/69302b19e_Male-body-fat-15.png' },
    { percentage: 20, label: '20%', description: t.bodyTypeMale20 || 'Fit', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/b7be7a4c5_Male-body-fat-20.png' },
    { percentage: 25, label: '25%', description: t.bodyTypeMale25 || 'Media', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/3b887d54b_Male-body-fat-25.png' },
    { percentage: 30, label: '30%', description: t.bodyTypeMale30 || 'Sopra Media', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/f54bb3688_Male-body-fat-30.png' },
    { percentage: 35, label: '35%', description: t.bodyTypeMale35 || 'Sovrappeso', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/ee93c412f_Male-body-fat-35.png' },
    { percentage: 40, label: '40%', description: t.bodyTypeMale40 || 'Obeso', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/717800cd5_Male-body-fat-40.png' },
    { percentage: 45, label: '45%', description: t.bodyTypeMale45 || 'Obeso Grave', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/99df4e995_Male-body-fat-45.png' }
  ];

  const FEMALE_BODY_TYPES = [
    { percentage: 12, label: '12%', description: t.bodyTypeFemale12 || 'Estremamente Definita', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/772b8960d_Female-body-fat-12.png' },
    { percentage: 15, label: '15%', description: t.bodyTypeFemale15 || 'Molto Definita', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/f0c622feb_Female-body-fat-15.png' },
    { percentage: 20, label: '20%', description: t.bodyTypeFemale20 || 'Atletica', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2439ba582_Female-body-fat-20.png' },
    { percentage: 25, label: '25%', description: t.bodyTypeFemale25 || 'Fit', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/37e8213a8_Female-body-fat-25.png' },
    { percentage: 30, label: '30%', description: t.bodyTypeFemale30 || 'Media', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/1a67a83de_Female-body-fat-30.png' },
    { percentage: 35, label: '35%', description: t.bodyTypeFemale35 || 'Sopra Media', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/020311e64_Female-body-fat-35.png' },
    { percentage: 40, label: '40%', description: t.bodyTypeFemale40 || 'Sovrappeso', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2bc13882f_Female-body-fat-40.png' },
    { percentage: 45, label: '45%', description: t.bodyTypeFemale45 || 'Obesa', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/124ac4fdb_Female-body-fat-45.png' },
    { percentage: 50, label: '50%', description: t.bodyTypeFemale50 || 'Obesa Grave', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/61e4d162e_Female-body-fat-50.png' }
  ];

  const bodyTypes = data.gender === 'male' ? MALE_BODY_TYPES : FEMALE_BODY_TYPES;

  const handleSelection = (percentage) => {
    onDataChange({ target_body_fat_visual: percentage });
  };

  return (
    <div className="space-y-6 pt-20 w-full max-w-[416px] mx-auto px-4 md:px-0">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.quizTargetBodyTypeTitle || "Come vorresti diventare?"}</h2>
        <p className="text-gray-600">{t.quizTargetBodyTypeSubtitle || "Scegli il tuo obiettivo fisico desiderato"}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
        {bodyTypes.map((type) => (
          <button
            key={type.percentage}
            onClick={() => handleSelection(type.percentage)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              data.target_body_fat_visual === type.percentage
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-lg scale-105'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <img 
              src={type.image} 
              alt={type.label} 
              className="w-full h-32 object-cover rounded-lg mb-2"
            />
            <p className="font-bold text-gray-900 text-lg">{type.label}</p>
            <p className="text-xs text-gray-600">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}