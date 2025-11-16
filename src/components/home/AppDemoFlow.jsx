import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import QuizPreviewDemo from './QuizPreviewDemo';
import DashboardPreviewDemo from './DashboardPreviewDemo';
import MealPlanPreviewDemo from './MealPlanPreviewDemo';
import ShoppingListPreviewDemo from './ShoppingListPreviewDemo';
import IngredientScannerPreviewDemo from './IngredientScannerPreviewDemo';
import HealthScorePreviewDemo from './HealthScorePreviewDemo';
import MealTrackingPreviewDemo from './MealTrackingPreviewDemo';
import PhotoAnalyzerPreviewDemo from './PhotoAnalyzerPreviewDemo';
import WorkoutPreviewDemo from './WorkoutPreviewDemo';
import ProgressPhotoPreviewDemo from './ProgressPhotoPreviewDemo';

const ANIMATION_DURATION = 48000; // 48 secondi totali

const STEPS = [
  { component: QuizPreviewDemo, label: 'Quiz Personalizzato', duration: 4000 },
  { component: DashboardPreviewDemo, label: 'Dashboard Scientifica', duration: 5000 },
  { component: MealPlanPreviewDemo, label: 'Piano Nutrizionale', duration: 5000 },
  { component: ShoppingListPreviewDemo, label: 'Lista della Spesa', duration: 4000 },
  { component: IngredientScannerPreviewDemo, label: 'Scanner Ingredienti', duration: 5000 },
  { component: HealthScorePreviewDemo, label: 'Health Score', duration: 5000 },
  { component: MealTrackingPreviewDemo, label: 'Tracking Pasti', duration: 5000 },
  { component: PhotoAnalyzerPreviewDemo, label: 'Analisi Foto Pasto', duration: 5000 },
  { component: WorkoutPreviewDemo, label: 'Piano Allenamento', duration: 5000 },
  { component: ProgressPhotoPreviewDemo, label: 'Analisi Progressi', duration: 5000 }
];

export default function AppDemoFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / ANIMATION_DURATION) * 100, 100);
      setProgress(newProgress);

      // Calculate which step we should be on based on cumulative duration
      let cumulativeDuration = 0;
      let targetStep = 0;
      
      for (let i = 0; i < STEPS.length; i++) {
        cumulativeDuration += STEPS[i].duration;
        if (elapsed < cumulativeDuration) {
          targetStep = i;
          break;
        }
      }
      
      setCurrentStep(targetStep);
      
      if (elapsed >= ANIMATION_DURATION) {
        clearInterval(progressInterval);
        setTimeout(() => {
          setStep(0);
          setProgress(0);
        }, 1000);
      }
    }, 50);

    return () => clearInterval(progressInterval);
  }, [isPaused]);

  const CurrentComponent = STEPS[currentStep].component;

  return (
    <div className="relative w-full max-w-md mx-auto">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(38, 132, 127, 0.3); }
          50% { box-shadow: 0 0 40px rgba(38, 132, 127, 0.6); }
        }
        
        .demo-container {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Progress bar */}
      <div className="mb-4 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Step indicator */}
      <div className="mb-4 text-center">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-6 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50"
        >
          <span className="text-lg">✨</span>
          <div className="text-left">
            <p className="text-xs text-gray-500 font-medium">Step {currentStep + 1}/{STEPS.length}</p>
            <p className="text-sm font-bold text-gray-900">{STEPS[currentStep].label}</p>
          </div>
        </motion.div>
      </div>

      {/* Main demo container */}
      <div 
        className="demo-container relative bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-900"
        style={{ aspectRatio: '9/19.5' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute inset-0 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
              <CurrentComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-4">
        {STEPS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentStep 
                ? 'w-8 h-2 bg-[var(--brand-primary)]' 
                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>

      {/* Info text */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">Demo 48s • Passa il mouse per mettere in pausa</p>
      </div>
    </div>
  );
}