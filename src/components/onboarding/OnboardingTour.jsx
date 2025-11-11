import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, CheckCircle, Sparkles, Target, TrendingUp, Utensils, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const discoveryOptions = [
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'facebook', label: 'Facebook', emoji: '👥' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️' },
  { id: 'google_search', label: 'Ricerca Google', emoji: '🔍' },
  { id: 'friend_recommendation', label: 'Consiglio di un amico', emoji: '🤝' },
  { id: 'influencer', label: 'Influencer', emoji: '⭐' },
  { id: 'blog_article', label: 'Articolo/Blog', emoji: '📰' },
  { id: 'podcast', label: 'Podcast', emoji: '🎙️' },
  { id: 'other', label: 'Altro', emoji: '💡' }
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
      title: '👋 Benvenuto in MyWellness!',
      description: 'Prima di iniziare, vorremmo conoscerti meglio. Come ci hai scoperti?',
      type: 'modal',
      action: 'select_source'
    },
    {
      id: 'dashboard_intro',
      title: '📊 La Tua Dashboard Personale',
      description: 'Qui visualizzi tutti i tuoi dati metabolici calcolati con precisione scientifica: BMR, massa grassa, target calorico e progressi verso il tuo obiettivo.',
      icon: Activity,
      iconBg: 'from-blue-500 to-blue-600'
    },
    {
      id: 'track_progress',
      title: '📈 Traccia i Tuoi Progressi',
      description: 'Monitora l\'andamento del tuo peso, registra nuove pesate e visualizza il tuo percorso verso l\'obiettivo con grafici dettagliati.',
      icon: TrendingUp,
      iconBg: 'from-[var(--brand-primary)] to-teal-600'
    },
    {
      id: 'nutrition_start',
      title: '🍽️ Crea il Tuo Piano Nutrizionale',
      description: 'Sei pronto per iniziare! Vai alla sezione Nutrizione per generare il tuo piano alimentare personalizzato con l\'intelligenza artificiale.',
      icon: Utensils,
      iconBg: 'from-green-500 to-emerald-600',
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
      alert('Errore nel salvataggio. Continuo comunque...');
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
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <Card className="max-w-2xl w-full bg-white shadow-2xl">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{currentStepData.title}</h2>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6 text-base md:text-lg text-center">{currentStepData.description}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {discoveryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedSource(option.id)}
                  className={`p-3 md:p-4 rounded-xl border-2 transition-all text-left hover:scale-105 ${
                    selectedSource === option.id
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-lg'
                      : 'border-gray-200 hover:border-[var(--brand-primary)]/50'
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-2xl md:text-3xl">{option.emoji}</span>
                    <span className="font-semibold text-gray-800 text-sm md:text-base">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
            
            {(selectedSource === 'influencer' || selectedSource === 'other') && (
              <div className="mb-6">
                <input
                  type="text"
                  value={sourceDetails}
                  onChange={(e) => setSourceDetails(e.target.value)}
                  placeholder={selectedSource === 'influencer' ? 'Nome dell\'influencer (opzionale)' : 'Raccontaci di più (opzionale)'}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[var(--brand-primary)] focus:outline-none"
                />
              </div>
            )}
            
            <div className="flex items-center justify-center">
              <Button
                onClick={handleSourceSelect}
                disabled={!selectedSource || isSaving}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-8 w-full md:w-auto"
              >
                {isSaving ? 'Salvataggio...' : (
                  <>
                    Continua
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Info cards per gli step successivi
  const Icon = currentStepData?.icon;
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="max-w-xl w-full bg-white shadow-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {Icon && (
                <div className={`w-14 h-14 bg-gradient-to-br ${currentStepData.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              )}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{currentStepData.title}</h2>
            </div>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-8 text-base md:text-lg leading-relaxed">
            {currentStepData.description}
          </p>
          
          {/* Se è l'ultimo step, mostra il bottone speciale per andare a Nutrizione */}
          {currentStepData.final ? (
            <div className="space-y-4">
              <Button
                onClick={handleNavigateToMeals}
                className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
              >
                <Utensils className="w-5 h-5 mr-2" />
                Vai a Nutrizione
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleSkip}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Salta e resta sulla Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {steps.slice(1).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index + 1 <= currentStep ? 'bg-[var(--brand-primary)] w-8' : 'bg-gray-300 w-2'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {currentStep > 1 && (
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Indietro
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
                  size="sm"
                >
                  Avanti
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}