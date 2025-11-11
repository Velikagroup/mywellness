import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const discoveryOptions = [
  { id: 'instagram', label: 'Instagram', emoji: '📸', gradient: 'from-pink-500 to-purple-600' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', gradient: 'from-gray-900 to-pink-600' },
  { id: 'facebook', label: 'Facebook', emoji: '👥', gradient: 'from-blue-500 to-blue-700' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️', gradient: 'from-red-500 to-red-700' },
  { id: 'google_search', label: 'Google', emoji: '🔍', gradient: 'from-blue-400 to-green-500' },
  { id: 'friend_recommendation', label: 'Un amico', emoji: '🤝', gradient: 'from-amber-500 to-orange-600' },
  { id: 'influencer', label: 'Influencer', emoji: '⭐', gradient: 'from-yellow-400 to-yellow-600' },
  { id: 'blog_article', label: 'Blog', emoji: '📰', gradient: 'from-gray-700 to-gray-900' },
  { id: 'podcast', label: 'Podcast', emoji: '🎙️', gradient: 'from-purple-500 to-indigo-600' },
  { id: 'other', label: 'Altro', emoji: '💡', gradient: 'from-teal-500 to-cyan-600' }
];

export default function OnboardingTour({ user, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceDetails, setSourceDetails] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: 'Benvenuto in MyWellness! 🎉',
      subtitle: 'Come ci hai scoperti?',
      description: 'Raccontaci come sei arrivato fino a noi! La tua risposta ci aiuta a migliorare.',
      type: 'modal',
      action: 'select_source'
    },
    {
      id: 'dashboard_intro',
      title: 'La Tua Dashboard',
      emoji: '📊',
      description: 'Qui visualizzi tutti i tuoi dati metabolici calcolati con precisione scientifica: BMR, massa grassa, target calorico e progressi verso il tuo obiettivo.',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'track_progress',
      title: 'Traccia i Progressi',
      emoji: '📈',
      description: 'Monitora l\'andamento del tuo peso, registra nuove pesate e visualizza il tuo percorso verso l\'obiettivo con grafici dettagliati.',
      gradient: 'from-[#26847F] to-teal-600'
    },
    {
      id: 'nutrition_start',
      title: 'Crea il Tuo Piano',
      emoji: '🍽️',
      description: 'Sei pronto per iniziare! Clicca qui sotto per generare il tuo piano alimentare personalizzato con l\'intelligenza artificiale.',
      gradient: 'from-green-500 to-emerald-600',
      final: true,
      action: 'navigate_to_meals'
    }
  ];

  const currentStepData = steps[currentStep];

  const handleSourceSelect = async () => {
    if (!selectedSource) return;
    
    setIsSaving(true);
    try {
      await base44.entities.UserOnboarding.create({
        user_id: user.id,
        discovery_source: selectedSource,
        discovery_details: sourceDetails,
        current_step: 1,
        onboarding_completed: false
      });
      
      setCurrentStep(1);
    } catch (error) {
      console.error('Error saving discovery source:', error);
      setCurrentStep(1);
    }
    setIsSaving(false);
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      try {
        const onboardingRecords = await base44.entities.UserOnboarding.filter({ user_id: user.id });
        if (onboardingRecords.length > 0) {
          await base44.entities.UserOnboarding.update(onboardingRecords[0].id, {
            current_step: currentStep + 1
          });
        }
      } catch (error) {
        console.error('Error updating step:', error);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const onboardingRecords = await base44.entities.UserOnboarding.filter({ user_id: user.id });
      if (onboardingRecords.length > 0) {
        await base44.entities.UserOnboarding.update(onboardingRecords[0].id, {
          onboarding_completed: true,
          completed_date: new Date().toISOString()
        });
      }
      
      await base44.auth.updateMe({ onboarding_completed: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
    
    onComplete();
  };

  const handleSkip = async () => {
    try {
      const onboardingRecords = await base44.entities.UserOnboarding.filter({ user_id: user.id });
      if (onboardingRecords.length > 0) {
        await base44.entities.UserOnboarding.update(onboardingRecords[0].id, {
          onboarding_completed: true,
          completed_date: new Date().toISOString()
        });
      }
      
      await base44.auth.updateMe({ onboarding_completed: true });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
    
    onComplete();
  };

  const handleNavigateToMeals = async () => {
    await handleComplete();
    navigate(createPageUrl('Meals'));
  };

  // Modal per la prima domanda (obbligatorio)
  if (currentStepData?.type === 'modal') {
    return (
      <>
        <style>{`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }
          
          .animate-fade-in-scale {
            animation: fadeInScale 0.3s ease-out;
          }
          
          .shimmer-text {
            background: linear-gradient(90deg, #26847F 0%, #14b8a6 50%, #26847F 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 3s linear infinite;
          }
          
          .source-button {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .source-button:hover {
            transform: translateY(-2px);
          }
          
          .source-button:active {
            transform: translateY(0px);
          }
        `}</style>
        
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl p-4 animate-fade-in-scale">
          <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-br from-[#26847F] via-teal-600 to-emerald-600 p-8 md:p-10 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-center mb-3">{currentStepData.title}</h2>
                <p className="text-teal-50 text-center text-lg md:text-xl font-medium">{currentStepData.subtitle}</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 md:p-8">
              <p className="text-gray-600 text-center mb-8 text-base md:text-lg leading-relaxed">
                {currentStepData.description}
              </p>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
                {discoveryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedSource(option.id)}
                    className={`source-button relative p-4 md:p-5 rounded-2xl border-2 text-left overflow-hidden ${
                      selectedSource === option.id
                        ? 'border-[#26847F] shadow-xl scale-105'
                        : 'border-gray-200 hover:border-[#26847F]/30 hover:shadow-lg'
                    }`}
                  >
                    {selectedSource === option.id && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-10`}></div>
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-center">
                      <span className="text-4xl md:text-5xl">{option.emoji}</span>
                      <span className={`font-bold text-sm md:text-base ${
                        selectedSource === option.id ? 'text-[#26847F]' : 'text-gray-800'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    {selectedSource === option.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#26847F] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {(selectedSource === 'influencer' || selectedSource === 'other') && (
                <div className="mb-6 animate-fade-in-scale">
                  <input
                    type="text"
                    value={sourceDetails}
                    onChange={(e) => setSourceDetails(e.target.value)}
                    placeholder={selectedSource === 'influencer' ? '✨ Nome dell\'influencer (opzionale)' : '💭 Raccontaci di più (opzionale)'}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#26847F] focus:outline-none text-base transition-all"
                  />
                </div>
              )}
              
              <Button
                onClick={handleSourceSelect}
                disabled={!selectedSource || isSaving}
                className="w-full h-14 bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Salvataggio...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Continua
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Info cards per gli step successivi
  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slideUpFade 0.4s ease-out;
        }
      `}</style>
      
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
          {/* Header con gradiente ed emoji */}
          <div className={`bg-gradient-to-br ${currentStepData.gradient} p-8 md:p-10 text-white relative overflow-hidden`}>
            <button 
              onClick={handleSkip} 
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="text-7xl md:text-8xl mb-4">
                {currentStepData.emoji}
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-2">{currentStepData.title}</h2>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 md:p-8">
            <p className="text-gray-700 text-center text-lg md:text-xl leading-relaxed mb-8">
              {currentStepData.description}
            </p>
            
            {/* Se è l'ultimo step, mostra il bottone speciale per andare a Nutrizione */}
            {currentStepData.final ? (
              <div className="space-y-4">
                <Button
                  onClick={handleNavigateToMeals}
                  className="w-full h-16 bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white text-xl font-black rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🍽️</span>
                    Vai a Nutrizione
                    <ArrowRight className="w-6 h-6" />
                  </span>
                </Button>
                
                <div className="text-center">
                  <button
                    onClick={handleSkip}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    Salta e resta sulla Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2">
                  {steps.slice(1).map((_, index) => (
                    <div
                      key={index}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        index + 1 <= currentStep 
                          ? 'bg-gradient-to-r from-[#26847F] to-teal-600 w-10' 
                          : 'bg-gray-300 w-2.5'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Navigation buttons */}
                <div className="flex items-center justify-center gap-3">
                  {currentStep > 1 && (
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      className="h-12 px-6 rounded-xl border-2 font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Indietro
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleNext}
                    className="h-12 px-8 bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Avanti
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}