import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dumbbell, ArrowRight, Clock, Zap, Target, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';

export default function TrainingStatus({ workout, onProgressPhotoClick, userPlan }) {
  const handlePhotoClick = () => {
    if (onProgressPhotoClick) {
      onProgressPhotoClick();
    }
  };

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shadow-sm">
              <Dumbbell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="tracking-tight text-lg font-bold text-gray-900">Protocollo di Allenamento</CardTitle>
              <p className="text-sm text-gray-500">Allenamento di oggi</p>
            </div>
          </div>
          <Link to={createPageUrl("Workouts")}>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-200/50 hover:text-gray-900">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {workout && workout.workout_type !== 'rest' ? (
          <div className="space-y-4">
            <div className="bg-[var(--brand-primary-light)] rounded-lg p-4 border-2 border-[var(--brand-primary)]/30">
              <h4 className="font-bold text-[var(--brand-primary-dark-text)] mb-2">{workout.plan_name}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {workout.total_duration || 0} min
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  {workout.calories_burned || 0} kcal
                </span>
                <span className="capitalize px-2 py-1 bg-white rounded-full text-xs font-medium">
                  {workout.difficulty_level === 'beginner' ? 'Principiante' :
                   workout.difficulty_level === 'intermediate' ? 'Intermedio' :
                   workout.difficulty_level === 'advanced' ? 'Avanzato' : workout.difficulty_level}
                </span>
              </div>
            </div>

            {workout.exercises && workout.exercises.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">{workout.exercises.length} esercizi pianificati</p>
                <div className="space-y-2">
                  {workout.exercises.slice(0, 3).map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="font-medium text-gray-800 truncate flex-1">{ex.name}</span>
                      <span className="text-gray-600 text-xs ml-2">{ex.sets} × {ex.reps}</span>
                    </div>
                  ))}
                  {workout.exercises.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">+ altri {workout.exercises.length - 3} esercizi</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : workout && workout.workout_type === 'rest' ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">Giorno di Riposo</p>
            <p className="text-sm text-gray-500 mt-1">Focus su recupero e mobilità</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">Nessun allenamento per oggi</p>
            <p className="text-sm text-gray-500 mt-1">Genera un piano per iniziare</p>
          </div>
        )}

        {/* Progress Photo Button */}
        <Button
          onClick={handlePhotoClick}
          variant="outline"
          className="w-full border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-all relative cursor-pointer"
        >
          <Camera className="w-4 h-4 mr-2" />
          📸 Analisi Foto Progresso con AI
          {!hasFeatureAccess(userPlan, 'progress_photo_analysis') && (
            <span 
              className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold cursor-pointer hover:bg-purple-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handlePhotoClick();
              }}
            >
              Premium
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}