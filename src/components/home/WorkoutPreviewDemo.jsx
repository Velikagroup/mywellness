import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Clock, Flame, Camera, Image, Sparkles } from 'lucide-react';

/**
 * Componente DEMO per Homepage
 * Replica esattamente l'UI di TrainingStatus ma con dati placeholder fissi
 * Non ha funzionalità reali, solo visual preview
 */
export default function WorkoutPreviewDemo() {
  // Dati placeholder fissi
  const demoWorkout = {
    plan_name: "Allenamento della Parte Superiore",
    day_of_week: "thursday",
    total_duration: 65,
    calories_burned: 500,
    exercises: [
      { name: "Panca Piana con Bilanciere" },
      { name: "Shoulder Press con Manubri" },
      { name: "Rematore con Manubrio" },
      { name: "Alzate Laterali" }
    ]
  };

  const dayLabels = {
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica'
  };

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
      <style>{`
        .liquid-glass-button {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(38, 132, 127, 0.15) 0%,
            rgba(20, 184, 166, 0.1) 50%,
            rgba(38, 132, 127, 0.15) 100%
          );
          border: 1px solid rgba(38, 132, 127, 0.3);
          box-shadow: 
            0 4px 16px 0 rgba(38, 132, 127, 0.12),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        .liquid-glass-button-ai {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(147, 51, 234, 0.15) 0%,
            rgba(99, 102, 241, 0.1) 50%,
            rgba(147, 51, 234, 0.15) 100%
          );
          border: 2px solid rgba(147, 51, 234, 0.3);
          box-shadow: 
            0 8px 24px 0 rgba(147, 51, 234, 0.2),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
          💪 Allenamento di Oggi
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Workout Info */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {dayLabels[demoWorkout.day_of_week]}: {demoWorkout.plan_name}
          </h3>
          
          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{demoWorkout.total_duration} min</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">{demoWorkout.calories_burned} kcal</span>
            </div>
          </div>
        </div>

        {/* Exercises Preview */}
        <div className="bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 rounded-lg p-3 border border-[var(--brand-primary)]/20">
          <p className="text-sm text-gray-700 font-medium mb-2">
            💪 {demoWorkout.exercises.length} esercizi
          </p>
          <div className="flex flex-wrap gap-1.5">
            {demoWorkout.exercises.slice(0, 3).map((exercise, idx) => (
              <span
                key={idx}
                className="text-xs bg-white/70 px-2 py-1 rounded-full text-gray-700 font-medium border border-gray-200"
              >
                {exercise.name}
              </span>
            ))}
            {demoWorkout.exercises.length > 3 && (
              <span className="text-xs bg-white/70 px-2 py-1 rounded-full text-gray-600 border border-gray-200">
                +{demoWorkout.exercises.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Pulsanti Vai alla Scheda e Galleria - Con Liquid Glass */}
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled
              className="liquid-glass-button text-[var(--brand-primary)] font-semibold text-sm py-3 rounded-xl cursor-not-allowed opacity-80"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                <span>Vai alla Scheda</span>
              </div>
            </button>
            <button
              disabled
              className="liquid-glass-button text-[var(--brand-primary)] font-semibold text-sm py-3 rounded-xl cursor-not-allowed opacity-80"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Image className="w-4 h-4" />
                <span>Galleria</span>
              </div>
            </button>
          </div>

          {/* AI Progress Analysis Button - Con Liquid Glass */}
          <button
            disabled
            className="w-full liquid-glass-button-ai text-purple-700 font-bold text-base py-5 rounded-xl cursor-not-allowed opacity-80"
          >
            <div className="flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" />
              <span>Analisi Progressi con AI</span>
              <Sparkles className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Demo Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-400 italic">
            Anteprima interfaccia • Funzionalità disponibili dopo il signup
          </p>
        </div>
      </CardContent>
    </Card>
  );
}