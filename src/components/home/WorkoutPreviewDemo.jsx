import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Clock, Flame, Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

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
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
          💪 Allenamento di Oggi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workout Title */}
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
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💪</span>
            <span className="font-semibold text-gray-900">{demoWorkout.exercises.length} esercizi</span>
          </div>
          <div className="space-y-2">
            {demoWorkout.exercises.slice(0, 3).map((exercise, idx) => (
              <div 
                key={idx}
                className="bg-white/70 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-700 font-medium border border-gray-200/30"
              >
                {exercise.name}
                {idx === 2 && demoWorkout.exercises.length > 3 && (
                  <span className="ml-2 text-gray-400">+{demoWorkout.exercises.length - 3}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            disabled
            className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl py-5 cursor-not-allowed opacity-70"
          >
            <Dumbbell className="w-4 h-4 mr-2" />
            Vai alla Scheda
          </Button>
          <Button
            disabled
            variant="outline"
            className="px-5 py-5 border-gray-300 hover:bg-gray-50 rounded-xl cursor-not-allowed opacity-70"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Progress Analysis Button */}
        <Button
          disabled
          className="w-full py-6 rounded-xl text-base font-semibold cursor-not-allowed opacity-70"
          style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(196, 181, 253, 0.15) 100%)',
            border: '2px solid rgba(167, 139, 250, 0.3)',
            color: '#7c3aed'
          }}
        >
          <Camera className="w-5 h-5 mr-2" />
          Analisi Progressi con AI
          <Sparkles className="w-5 h-5 ml-2" />
        </Button>

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