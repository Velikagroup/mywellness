import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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
      id: 'progress_chart',
      title: '📈 Traccia i Tuoi Progressi',
      description: 'Questo grafico mostra l\'andamento del tuo peso nel tempo. Scorri verso il basso per vedere il grafico e aggiungere nuove pesate!',
      target: '.progress-chart-section',
      position: 'center'
    },
    {
      id: 'dashboard_stats',
      title: '📊 Panoramica Giornaliera',
      description: 'Qui vedi il riepilogo nutrizionale e di allenamento della giornata. Dati sempre aggiornati in tempo reale!',
      target: '.dashboard-stats-section',
      position: 'center'
    },
    {
      id: 'nutrition_meals',
      title: '🍽️ Vai al Piano Nutrizionale',
      description: 'Ora sei pronto! Clicca su "Nutrizione" nel menu in basso per generare il tuo piano alimentare personalizzato con l\'AI.',
      target: 'a[href*="Meals"]',
      position: 'center',
      final: true
    }
  ];

  const currentStepData = steps[currentStep];

  // Funzione per verificare se un elemento esiste ed è visibile
  const isElementVisible = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  // Funzione per trovare il prossimo step valido
  const findNextValidStep = (fromStep) => {
    for (let i = fromStep + 1; i < steps.length; i++) {
      const step = steps[i];
      if (!step.target || isElementVisible(step.target)) {
        return i;
      }
    }
    return steps.length;
  };

  useEffect(() => {
    if (currentStepData?.target) {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        // Scroll con più margine per mobile
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      } else {
        // Se l'elemento non esiste, salta allo step successivo
        const nextValid = findNextValidStep(currentStep);
        if (nextValid < steps.length) {
          setCurrentStep(nextValid);
        }
      }
    }
  }, [currentStep, currentStepData]);

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
      
      // Trova il primo step valido dopo il modal
      const nextValid = findNextValidStep(0);
      setCurrentStep(nextValid);
    } catch (error) {
      console.error('Error saving discovery source:', error);
      alert('Errore nel salvataggio. Continuo comunque...');
      const nextValid = findNextValidStep(0);
      setCurrentStep(nextValid);
    }
    setIsSaving(false);
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      const nextValid = findNextValidStep(currentStep);
      if (nextValid < steps.length) {
        setCurrentStep(nextValid);
        
        try {
          const onboardingRecords = await base44.entities.UserOnboarding.filter({ user_id: user.id });
          if (onboardingRecords.length > 0) {
            await base44.entities.UserOnboarding.update(onboardingRecords[0].id, {
              current_step: nextValid
            });
          }
        } catch (error) {
          console.error('Error updating step:', error);
        }
      } else {
        handleComplete();
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      // Trova lo step valido precedente
      for (let i = currentStep - 1; i >= 1; i--) {
        const step = steps[i];
        if (!step.target || isElementVisible(step.target)) {
          setCurrentStep(i);
          break;
        }
      }
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

  const getSpotlightStyle = () => {
    if (!currentStepData?.target) return {};
    
    const element = document.querySelector(currentStepData.target);
    if (!element) return {};
    
    const rect = element.getBoundingClientRect();
    const padding = window.innerWidth < 768 ? 8 : 15;
    const verticalPadding = window.innerWidth < 768 ? 8 : 8;
    
    return {
      top: rect.top - verticalPadding,
      left: rect.left - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (verticalPadding * 2)
    };
  };

  const getTooltipPosition = () => {
    const isMobile = window.innerWidth < 768;
    
    if (!currentStepData?.target) {
      return { 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
      };
    }
    
    const element = document.querySelector(currentStepData.target);
    if (!element) {
      return { 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
      };
    }
    
    // Su mobile, posiziona sempre centrato in basso
    if (isMobile) {
      return {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100vw - 2rem)',
        maxWidth: '500px'
      };
    }
    
    // Desktop: centrato sempre
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  };

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

  const spotlightStyle = getSpotlightStyle();
  const tooltipStyle = getTooltipPosition();

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Overlay con spotlight effect */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={{
          clipPath: currentStepData?.target && spotlightStyle.width
            ? `polygon(
                0% 0%, 0% 100%, 100% 100%, 100% 0%,
                0% 0%, 0% 100%,
                ${spotlightStyle.left}px ${spotlightStyle.top}px,
                ${spotlightStyle.left + spotlightStyle.width}px ${spotlightStyle.top}px,
                ${spotlightStyle.left + spotlightStyle.width}px ${spotlightStyle.top + spotlightStyle.height}px,
                ${spotlightStyle.left}px ${spotlightStyle.top + spotlightStyle.height}px,
                ${spotlightStyle.left}px ${spotlightStyle.top}px
              )`
            : undefined
        }}
      />
      
      {/* Spotlight border glow */}
      {currentStepData?.target && spotlightStyle.width && (
        <div
          className="absolute rounded-xl border-4 border-[var(--brand-primary)] shadow-[0_0_30px_rgba(38,132,127,0.8)] animate-pulse"
          style={{
            top: spotlightStyle.top,
            left: spotlightStyle.left,
            width: spotlightStyle.width,
            height: spotlightStyle.height,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Tooltip */}
      <Card 
        className="absolute bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4"
        style={tooltipStyle}
      >
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 pr-8">{currentStepData.title}</h3>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6 text-sm md:text-base">{currentStepData.description}</p>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {steps.slice(1).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index + 1 <= currentStep ? 'bg-[var(--brand-primary)] w-8' : 'bg-gray-300'
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
                  className="hidden md:flex"
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
                {currentStepData.final ? (
                  <>
                    Completa
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Avanti
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}