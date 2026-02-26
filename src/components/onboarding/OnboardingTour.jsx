import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';

const discoveryOptions = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'google_search', label: 'Google' },
  { id: 'friend_recommendation', label: 'Un amico' },
  { id: 'influencer', label: 'Influencer' },
  { id: 'blog_article', label: 'Blog' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'other', label: 'Altro' }
];

const accessDashboardLabels = {
  it: 'Accedi alla Dashboard',
  en: 'Access Dashboard',
  es: 'Acceder al Panel',
  pt: 'Acessar o Painel',
  de: 'Zum Dashboard',
  fr: 'Accéder au tableau de bord'
};

const savingLabels = {
  it: 'Salvataggio...',
  en: 'Saving...',
  es: 'Guardando...',
  pt: 'Salvando...',
  de: 'Speichern...',
  fr: 'Enregistrement...'
};

export default function OnboardingTour({ user, onComplete }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceDetails, setSourceDetails] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const hasScrolledToTarget = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const steps = [
    {
      id: 'welcome',
      title: 'Benvenuto in MyWellness!',
      subtitle: 'Come ci hai scoperti?',
      description: 'Raccontaci come sei arrivato fino a noi. La tua risposta ci aiuta a migliorare.',
      type: 'modal'
    }
  ];

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (currentStepData?.target) {
      hasScrolledToTarget.current = false;
      updateTargetPosition();
      window.addEventListener('resize', updateTargetPosition);
      window.addEventListener('scroll', updateTargetPosition);
      return () => {
        window.removeEventListener('resize', updateTargetPosition);
        window.removeEventListener('scroll', updateTargetPosition);
      };
    }
  }, [currentStep, currentStepData]);

  const updateTargetPosition = () => {
    if (!currentStepData?.target) return;
    
    const element = document.querySelector(currentStepData.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      
      // Auto-scroll su mobile per portare l'elemento in vista - VELOCE
      if (isMobile && !hasScrolledToTarget.current) {
        hasScrolledToTarget.current = true;
        
        // Delay minimo per rendering + scroll immediato
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'auto',           // Scroll immediato
            block: 'center',
            inline: 'center'
          });
        }, 10);  // 10ms - quasi istantaneo
      }
    }
  };

  const handleSourceSelect = async () => {
    if (!selectedSource) return;

    setIsSaving(true);
    try {
      console.log('💾 Saving onboarding data for user:', user.id);

      // Crea il record nel DB
      const result = await base44.entities.UserOnboarding.create({
        user_id: user.id,
        discovery_source: selectedSource,
        discovery_details: sourceDetails,
        current_step: 1,
        onboarding_completed: true,
        completed_date: new Date().toISOString()
      });
      console.log('✅ Onboarding record created:', result.id);

      // Salva il flag in localStorage immediatamente
      const onboardingCompletedKey = `onboarding_completed_${user.id}`;
      localStorage.setItem(onboardingCompletedKey, 'true');
      console.log('💾 Saved to localStorage');

      // Aggiorna il user flag
      await base44.auth.updateMe({ onboarding_completed: true });
      console.log('✅ User flag updated');

      onComplete();
    } catch (error) {
      console.error('❌ Error saving discovery source:', error);
      // Salva in localStorage comunque per evitare loop
      const onboardingCompletedKey = `onboarding_completed_${user.id}`;
      localStorage.setItem(onboardingCompletedKey, 'true');
      onComplete();
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
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

          * {
            font-family: 'Inter', sans-serif;
          }

          @keyframes gradientShift {
            0% {
              background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
            }
            33% {
              background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%;
            }
            66% {
              background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%;
            }
            100% {
              background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
            }
          }
          
          .animated-gradient-bg-onboarding {
            background: #f9fafb;
            background-image: 
              radial-gradient(circle at 10% 20%, #f5f9ff 0%, transparent 50%),
              radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
              radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, #d4bbff 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
              radial-gradient(circle at 90% 85%, #e0ccff 0%, transparent 50%);
            background-size: 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%;
            animation: gradientShift 45s ease-in-out infinite;
            background-attachment: fixed;
          }
          
          .liquid-glass-modal {
            backdrop-filter: blur(20px) saturate(180%);
            background: linear-gradient(135deg, 
              rgba(249, 250, 251, 0.85) 0%,
              rgba(243, 244, 246, 0.75) 50%,
              rgba(249, 250, 241, 0.85) 100%
            );
            box-shadow: 
              0 8px 32px 0 rgba(31, 38, 135, 0.1),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
          }
          
          .liquid-glass-button {
            backdrop-filter: blur(12px) saturate(180%);
            background: linear-gradient(135deg, 
              rgba(249, 250, 251, 0.6) 0%,
              rgba(243, 244, 246, 0.5) 50%,
              rgba(249, 250, 241, 0.6) 100%
            );
            box-shadow: 
              0 4px 16px 0 rgba(31, 38, 135, 0.06),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.8),
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.03);
            transition: all 0.2s ease;
          }
          
          .liquid-glass-button:hover {
            background: linear-gradient(135deg, 
              rgba(249, 250, 251, 0.75) 0%,
              rgba(243, 244, 246, 0.65) 50%,
              rgba(249, 250, 241, 0.75) 100%
            );
            box-shadow: 
              0 6px 20px 0 rgba(31, 38, 135, 0.08),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.04);
          }
          
          .liquid-glass-button-selected {
            backdrop-filter: blur(12px) saturate(180%);
            background: linear-gradient(135deg, 
              rgba(38, 132, 127, 0.25) 0%,
              rgba(20, 184, 166, 0.20) 50%,
              rgba(38, 132, 127, 0.25) 100%
            );
            box-shadow: 
              0 4px 16px 0 rgba(38, 132, 127, 0.15),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
          }
        `}</style>
        
        <div className="fixed inset-0 z-[200] flex items-center justify-center animated-gradient-bg-onboarding backdrop-blur-md p-4">
          <div className="max-w-md w-full liquid-glass-modal rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                {currentStepData.description}
              </p>
              
              <div className="space-y-2 mb-6">
                {discoveryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedSource(option.id)}
                    className={`w-full px-4 py-3 text-left text-sm font-medium rounded-lg ${
                      selectedSource === option.id
                        ? 'liquid-glass-button-selected text-[#26847F]'
                        : 'liquid-glass-button text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {(selectedSource === 'influencer' || selectedSource === 'other') && (
                <div className="mb-6">
                  <input
                    type="text"
                    value={sourceDetails}
                    onChange={(e) => setSourceDetails(e.target.value)}
                    placeholder={selectedSource === 'influencer' ? 'Nome influencer (opzionale)' : 'Dettagli (opzionale)'}
                    className="w-full px-4 py-2.5 text-sm liquid-glass-button rounded-lg focus:outline-none border border-gray-200/30"
                  />
                </div>
              )}
              
              <Button
                onClick={handleSourceSelect}
                disabled={!selectedSource || isSaving}
                className="w-full liquid-glass-button-selected hover:opacity-90 text-[#26847F] font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-none"
              >
                {isSaving ? 'Salvataggio...' : 'Continua'}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Spotlight overlay per gli step successivi
  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const padding = 20;
    const tooltipWidth = isMobile ? 320 : 380;
    const tooltipHeight = 250;
    
    // Desktop: posiziona a destra o sinistra del target
    if (!isMobile) {
      const spaceRight = window.innerWidth - (targetRect.left + targetRect.width);
      const spaceLeft = targetRect.left;
      
      if (spaceRight > tooltipWidth + padding) {
        // A destra
        return {
          top: `${targetRect.top + (targetRect.height / 2)}px`,
          left: `${targetRect.left + targetRect.width + padding}px`,
          transform: 'translateY(-50%)'
        };
      } else if (spaceLeft > tooltipWidth + padding) {
        // A sinistra
        return {
          top: `${targetRect.top + (targetRect.height / 2)}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
          transform: 'translateY(-50%)'
        };
      } else {
        // Sotto
        return {
          top: `${targetRect.top + targetRect.height + padding}px`,
          left: `${targetRect.left + (targetRect.width / 2)}px`,
          transform: 'translateX(-50%)'
        };
      }
    } else {
      // Mobile: sempre centrato in basso
      return {
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)'
      };
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', sans-serif;
        }
        
        .spotlight-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          z-index: 199;
          pointer-events: none;
        }
        
        .spotlight-target {
          position: fixed;
          z-index: 200;
          pointer-events: none;
          border-radius: 16px;
          box-shadow: 
            0 0 0 4px rgba(38, 132, 127, 0.5),
            0 0 0 9999px rgba(0, 0, 0, 0.75);
          transition: all 0.3s ease-out;
        }
        
        .liquid-glass-modal {
          backdrop-filter: blur(20px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.85) 0%,
            rgba(243, 244, 246, 0.75) 50%,
            rgba(249, 250, 241, 0.85) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.1),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
        
        .liquid-glass-button {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.6) 0%,
            rgba(243, 244, 246, 0.5) 50%,
            rgba(249, 250, 241, 0.6) 100%
          );
          box-shadow: 
            0 4px 16px 0 rgba(31, 38, 135, 0.06),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.03);
        }
        
        .liquid-glass-button-selected {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(38, 132, 127, 0.25) 0%,
            rgba(20, 184, 166, 0.20) 50%,
            rgba(38, 132, 127, 0.25) 100%
          );
          box-shadow: 
            0 4px 16px 0 rgba(38, 132, 127, 0.15),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>
      
      {/* Spotlight highlight */}
      {targetRect && (
        <div
          className="spotlight-target"
          style={{
            top: `${targetRect.top - 8}px`,
            left: `${targetRect.left - 8}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`
          }}
        />
      )}
      
      {/* Tooltip popup */}
      <div
        className="fixed z-[201] px-4"
        style={getTooltipPosition()}
      >
        <div className={`liquid-glass-modal rounded-xl shadow-2xl overflow-hidden ${isMobile ? 'w-[320px]' : 'w-[380px]'}`}>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 pr-8">
                {currentStepData.title}
              </h2>
              <button 
                onClick={handleSkip} 
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              {currentStepData.description}
            </p>
            
            {currentStepData.final ? (
              <div className="space-y-3">
                <Button
                  onClick={handleNavigateToMeals}
                  className="w-full liquid-glass-button-selected hover:opacity-90 text-[#26847F] font-semibold border-none"
                >
                  Vai a Nutrizione
                </Button>
                
                <button
                  onClick={handleSkip}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Resta sulla Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-1.5">
                  {steps.slice(1).map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index + 1 <= currentStep 
                          ? 'bg-[#26847F] w-8' 
                          : 'bg-gray-300 w-1.5'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  {currentStep > 1 && (
                    <Button
                      onClick={handlePrevious}
                      className="flex-1 font-semibold liquid-glass-button text-gray-700 border-none hover:opacity-90"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Indietro
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleNext}
                    className={`liquid-glass-button-selected hover:opacity-90 text-[#26847F] font-semibold border-none ${currentStep > 1 ? 'flex-1' : 'w-full'}`}
                  >
                    Avanti
                    <ArrowRight className="w-4 h-4 ml-1" />
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