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

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000); // Cambia step ogni 3 secondi

    return () => clearInterval(interval);
  }, [isPaused]);

  const CurrentComponent = steps[currentStep].component;

  return (
    <div 
      className="relative w-full max-w-md mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Step Indicator */}
      <div className="mb-6 text-center">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50"
        >
          <span className="text-2xl">{steps[currentStep].icon}</span>
          <div className="text-left">
            <p className="text-xs text-gray-500 font-medium">Step {currentStep + 1}/10</p>
            <p className="text-sm font-bold text-gray-900">{steps[currentStep].label}</p>
          </div>
        </motion.div>
      </div>

      {/* Animation Container */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full"
          >
            <CurrentComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {steps.map((_, index) => (
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

      {/* Progress Bar */}
      <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}