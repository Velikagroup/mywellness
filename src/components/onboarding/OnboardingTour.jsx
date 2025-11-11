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
      id: 'dashboard_overview',
      title: '📊 La Tua Dashboard Scientifica',
      description: 'Qui trovi tutti i tuoi dati metabolici calcolati con precisione scientifica. BMR, massa grassa, target calorico e progressi verso l\'obiettivo.',
      target: '.dashboard-stats-section',
      position: 'center'
    },
    {
      id: 'edit_bmr',
      title: '✏️ Personalizza i Tuoi Dati',
      description: 'Puoi modificare manualmente il metabolismo basale, la massa grassa e il target calorico cliccando sull\'icona di modifica in alto a destra di ogni card.',
      target: '.technical-stats-card',
      position: 'left'
    },
    {
      id: 'progress_chart',
      title: '📈 Traccia i Tuoi Progressi',
      description: 'Questo grafico mostra l\'andamento del tuo peso nel tempo. Puoi aggiungere nuove pesate direttamente da qui!',
      target: '.progress-chart-section',
      position: 'top'
    },
    {
      id: 'nutrition_meals',
      title: '🍽️ Vai al Piano Nutrizionale',
      description: 'Ora sei pronto! Vai alla sezione Nutrizione per generare il tuo piano alimentare personalizzato con l\'AI.',
      target: 'a[href*="Meals"]',
      position: 'bottom',
      final: true
    }
  ];

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (currentStepData?.target) {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      if (currentStep === 0 && !selectedSource) {
        await base44.entities.UserOnboarding.create({
          user_id: user.id,
          discovery_source: 'other',
          discovery_details: 'Skipped',
          onboarding_completed: true,
          completed_date: new Date().toISOString()
        });
      } else {
        const onboardingRecords = await base44.entities.UserOnboarding.filter({ user_id: user.id });
        if (onboardingRecords.length > 0) {
          await base44.entities.UserOnboarding.update(onboardingRecords[0].id, {
            onboarding_completed: true,
            completed_date: new Date().toISOString()
          });
        }
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
    const padding = 12;
    
    return {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2)
    };
  };

  const getTooltipPosition = () => {
    if (!currentStepData?.target) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const element = document.querySelector(currentStepData.target);
    if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const gap = 20;
    
    let style = {};
    
    switch (currentStepData.position) {
      case 'top':
        style = {
          bottom: window.innerHeight - rect.top + gap,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2),
          transform: 'none'
        };
        break;
      case 'bottom':
        style = {
          top: rect.bottom + gap,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2),
          transform: 'none'
        };
        break;
      case 'left':
        style = {
          top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
          right: window.innerWidth - rect.left + gap,
          transform: 'none'
        };
        break;
      case 'right':
        style = {
          top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
          left: rect.right + gap,
          transform: 'none'
        };
        break;
      default:
        style = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
    
    return style;
  };

  if (currentStepData?.type === 'modal') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Card className="max-w-2xl w-full mx-4 bg-white shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{currentStepData.title}</h2>
              </div>
              <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6 text-lg">{currentStepData.description}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {discoveryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedSource(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left hover:scale-105 ${
                    selectedSource === option.id
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-lg'
                      : 'border-gray-200 hover:border-[var(--brand-primary)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{option.emoji}</span>
                    <span className="font-semibold text-gray-800">{option.label}</span>
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
            
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Salta
              </button>
              <Button
                onClick={handleSourceSelect}
                disabled={!selectedSource || isSaving}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-8"
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
        className="absolute bg-white shadow-2xl max-w-md animate-in fade-in slide-in-from-bottom-4"
        style={tooltipStyle}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 pr-8">{currentStepData.title}</h3>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{currentStepData.description}</p>
          
          <div className="flex items-center justify-between">
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
            
            <div className="flex items-center gap-2">
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