import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dumbbell, Calendar, Flame, ArrowRight, Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';

export default function TrainingStatus({ workout, onWorkoutPhotoAnalyze, onWorkoutGallery, userPlan }) {
  if (!workout) {
    return (
      <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
        <style>{`
          .liquid-glass-button-training {
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

          .liquid-glass-button-training:hover {
            background: linear-gradient(135deg, 
              rgba(38, 132, 127, 0.25) 0%,
              rgba(20, 184, 166, 0.2) 50%,
              rgba(38, 132, 127, 0.25) 100%
            );
            border: 1px solid rgba(38, 132, 127, 0.4);
            box-shadow: 
              0 6px 20px 0 rgba(38, 132, 127, 0.18),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.7),
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
          }
        `}</style>
        <CardHeader className="pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shadow-sm">
              <Dumbbell className="w-6 h-6 text-green-600" />
            </div>
            Allenamento di Oggi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg mb-4">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Riposo Attivo</p>
            <p className="text-sm text-gray-500 mt-1">Oggi è un giorno di recupero</p>
          </div>
          <Link to={createPageUrl("Workouts")}>
            <button className="w-full liquid-glass-button-training text-[#26847F] font-semibold text-sm py-2 px-4 rounded-xl transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                <span>Vai al Piano</span>
              </div>
            </button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
      <style>{`
        .liquid-glass-button-training {
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

        .liquid-glass-button-training:hover {
          background: linear-gradient(135deg, 
            rgba(38, 132, 127, 0.25) 0%,
            rgba(20, 184, 166, 0.2) 50%,
            rgba(38, 132, 127, 0.25) 100%
          );
          border: 1px solid rgba(38, 132, 127, 0.4);
          box-shadow: 
            0 6px 20px 0 rgba(38, 132, 127, 0.18),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.7),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shadow-sm">
            <Dumbbell className="w-6 h-6 text-green-600" />
          </div>
          Allenamento di Oggi
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="bg-gradient-to-r from-[#e9f6f5] to-blue-50 rounded-xl p-4 border-2 border-[#26847F]/30 mb-4">
          <h3 className="font-bold text-gray-900 mb-1">{workout.plan_name}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{workout.total_duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4" />
              <span>{workout.calories_burned} kcal</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Esercizi di oggi</p>
          {workout.exercises && workout.exercises.slice(0, 3).map((exercise, index) => (
            <div key={index} className="bg-gray-50/80 rounded-lg p-3 border border-gray-200/60">
              <p className="font-semibold text-gray-800 text-sm">{exercise.name}</p>
              <p className="text-xs text-gray-600">{exercise.sets} serie × {exercise.reps}</p>
            </div>
          ))}
          {workout.exercises && workout.exercises.length > 3 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              +{workout.exercises.length - 3} altri esercizi
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Link to={createPageUrl("Workouts")}>
            <button className="w-full liquid-glass-button-training text-[#26847F] font-semibold text-sm py-2 px-4 rounded-xl transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                <span>Vai al Piano</span>
              </div>
            </button>
          </Link>

          {hasFeatureAccess(userPlan, 'workout_tracking') && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onWorkoutGallery}
                className="w-full bg-white hover:bg-gray-50 border-2 border-[#26847F] text-[#26847F] font-semibold text-sm py-2 px-3 rounded-xl transition-all"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Galleria</span>
                </div>
              </button>
              {hasFeatureAccess(userPlan, 'progress_photo_analysis') && (
                <button
                  onClick={onWorkoutPhotoAnalyze}
                  className="w-full bg-white hover:bg-gray-50 border-2 border-[#26847F] text-[#26847F] font-semibold text-sm py-2 px-3 rounded-xl transition-all"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    <span>Analisi AI</span>
                  </div>
                </button>
              )}
              {!hasFeatureAccess(userPlan, 'progress_photo_analysis') && (
                <button
                  onClick={onWorkoutPhotoAnalyze}
                  className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-400 font-semibold text-sm py-2 px-3 rounded-xl transition-all relative"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    <span>Analisi AI</span>
                  </div>
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}