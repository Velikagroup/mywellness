import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Camera, Crown, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';

export default function TrainingStatus({ workout, onProgressPhotoClick, userPlan, onViewGalleryClick }) {
  const navigate = useNavigate();

  if (!workout) {
    return (
      <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <div className="w-12 h-12 bg-[#26847F]/10 rounded-full flex items-center justify-center shadow-sm">
              <Dumbbell className="w-6 h-6 text-[#26847F]" />
            </div>
            Allenamento di Oggi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium mb-4">Giorno di Riposo</p>
            <Button
              onClick={() => navigate(createPageUrl("Workouts"))}
              className="bg-[#26847F] hover:bg-[#1f6b66] text-white text-sm"
            >
              Vedi Programmazione
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl h-full">
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

        .liquid-glass-button:hover {
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

        .liquid-glass-button-ai:hover {
          background: linear-gradient(135deg, 
            rgba(147, 51, 234, 0.25) 0%,
            rgba(99, 102, 241, 0.2) 50%,
            rgba(147, 51, 234, 0.25) 100%
          );
          border: 2px solid rgba(147, 51, 234, 0.4);
          box-shadow: 
            0 12px 32px 0 rgba(147, 51, 234, 0.25),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.7),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }
      `}</style>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <div className="w-12 h-12 bg-[#26847F]/10 rounded-full flex items-center justify-center shadow-sm">
            <Dumbbell className="w-6 h-6 text-[#26847F]" />
          </div>
          Allenamento di Oggi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">{workout.plan_name}</h4>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              ⏱️ {workout.total_duration || 0} min
            </span>
            <span className="flex items-center gap-1">
              🔥 {workout.calories_burned || 0} kcal
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#e9f6f5] to-blue-50 rounded-lg p-3 border border-[#26847F]/20">
          <p className="text-sm text-gray-700 font-medium mb-2">
            💪 {workout.exercises?.length || 0} esercizi
          </p>
          <div className="flex flex-wrap gap-1.5">
            {workout.exercises?.slice(0, 3).map((ex, idx) => (
              <span
                key={idx}
                className="text-xs bg-white/70 px-2 py-1 rounded-full text-gray-700 font-medium border border-gray-200"
              >
                {ex.name}
              </span>
            ))}
            {workout.exercises?.length > 3 && (
              <span className="text-xs bg-white/70 px-2 py-1 rounded-full text-gray-600 border border-gray-200">
                +{workout.exercises.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Pulsanti Vai alla Scheda e Galleria - Stessa riga con liquid glass */}
          {hasFeatureAccess(userPlan, 'progress_photo_analysis') ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(createPageUrl("Workouts"))}
                className="liquid-glass-button text-[#26847F] font-semibold text-sm py-3 rounded-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Dumbbell className="w-4 h-4" />
                  <span>Vai alla Scheda</span>
                </div>
              </button>
              <button
                onClick={onViewGalleryClick}
                className="liquid-glass-button text-[#26847F] font-semibold text-sm py-3 rounded-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Image className="w-4 h-4" />
                  <span>Galleria</span>
                </div>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate(createPageUrl("Workouts"))}
              className="w-full liquid-glass-button text-[#26847F] font-semibold text-sm py-3 rounded-xl transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                <span>Vai alla Scheda Completa</span>
              </div>
            </button>
          )}

          {/* Pulsante Analisi Progressi - Più alto con liquid glass */}
          {hasFeatureAccess(userPlan, 'progress_photo_analysis') ? (
            <button
              onClick={onProgressPhotoClick}
              className="w-full liquid-glass-button-ai text-purple-700 font-bold text-base py-5 rounded-xl transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Analisi Progressi con AI</span>
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </div>
            </button>
          ) : (
            <button
              onClick={onProgressPhotoClick}
              className="w-full liquid-glass-button-ai text-purple-700 font-bold text-base py-5 rounded-xl transition-all hover:scale-[1.02] group relative"
            >
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Analisi Progressi con AI</span>
                <Crown className="w-5 h-5 animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                Premium
              </div>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}