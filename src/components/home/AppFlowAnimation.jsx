import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const steps = [
  { component: QuizPreviewDemo, label: 'Quiz Personalizzato', icon: '📋' },
  { component: DashboardPreviewDemo, label: 'Dashboard Scientifica', icon: '📊' },
  { component: MealPlanPreviewDemo, label: 'Pasti AI', icon: '🍽️' },
  { component: ShoppingListPreviewDemo, label: 'Lista Spesa', icon: '🛒' },
  { component: IngredientScannerPreviewDemo, label: 'Scanner Ingredienti', icon: '📱' },
  { component: HealthScorePreviewDemo, label: 'Health Score', icon: '🏷️' },
  { component: MealTrackingPreviewDemo, label: 'Tracking Pasti', icon: '✓' },
  { component: PhotoAnalyzerPreviewDemo, label: 'Analisi Foto', icon: '📷' },
  { component: WorkoutPreviewDemo, label: 'Workout', icon: '💪' },
  { component: ProgressPhotoPreviewDemo, label: 'Progressi AI', icon: '🔬' }
];

export default function AppFlowAnimation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPaused) return;

    // Animazione progressiva continua
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentStep((current) => (current + 1) % steps.length);
          return 0;
        }
        return prev + 0.5; // Incremento molto piccolo per fluidità
      });
    }, 15); // Update ogni 15ms per animazione super fluida

    return () => clearInterval(progressInterval);
  }, [isPaused]);

  const CurrentComponent = steps[currentStep].component;
  const NextComponent = steps[(currentStep + 1) % steps.length].component;

  // Calcola l'opacità per il crossfade
  const currentOpacity = progress < 80 ? 1 : 1 - ((progress - 80) / 20);
  const nextOpacity = progress < 80 ? 0 : (progress - 80) / 20;

  return (
    <div 
      className="relative w-full max-w-md mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Step Indicator con fade continuo */}
      <motion.div
        animate={{ opacity: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6 text-center"
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50"
        >
          <span className="text-2xl">{steps[currentStep].icon}</span>
          <div className="text-left">
            <p className="text-xs text-gray-500 font-medium">Step {currentStep + 1}/10</p>
            <p className="text-sm font-bold text-gray-900">{steps[currentStep].label}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Animation Container con crossfade continuo */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
          {/* Current Step */}
          <motion.div
            className="absolute inset-0 w-full h-full"
            style={{ opacity: currentOpacity }}
            transition={{ duration: 0 }}
          >
            <CurrentComponent />
          </motion.div>

          {/* Next Step (per crossfade) */}
          <motion.div
            className="absolute inset-0 w-full h-full"
            style={{ opacity: nextOpacity }}
            transition={{ duration: 0 }}
          >
            <NextComponent />
          </motion.div>

          {/* Overlay gradient per effetto video */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/5" />
        </div>
      </div>

      {/* Progress Bar fluida */}
      <div className="mt-6">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500"
            style={{ width: `${((currentStep * 100 + progress) / steps.length)}%` }}
            transition={{ duration: 0 }}
          />
        </div>
      </div>

      {/* Mini indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentStep(index);
              setProgress(0);
            }}
            className={`transition-all duration-300 rounded-full ${
              index === currentStep 
                ? 'w-6 h-1.5 bg-[var(--brand-primary)]' 
                : index < currentStep
                ? 'w-1.5 h-1.5 bg-[var(--brand-primary)]/40'
                : 'w-1.5 h-1.5 bg-gray-300'
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}