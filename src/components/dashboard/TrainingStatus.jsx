import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Camera, Crown, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';

export default function TrainingStatus({ workout, onProgressPhotoClick, userPlan, onViewGalleryClick }) {
  const navigate = useNavigate();

  if (!workout) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
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
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-sm"
            >
              Vedi Programmazione
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
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

        <div className="bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 rounded-lg p-3 border border-[var(--brand-primary)]/20">
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

        <div className="space-y-2">
          <Button
            onClick={() => navigate(createPageUrl("Workouts"))}
            className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-sm"
          >
            Vai alla Scheda Completa
          </Button>

          {hasFeatureAccess(userPlan, 'progress_photo_analysis') ? (
            <div className="flex gap-2">
              <Button
                onClick={onProgressPhotoClick}
                variant="outline"
                className="flex-1 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] text-sm"
              >
                <Camera className="w-4 h-4 mr-2" />
                Analisi Progressi con AI
              </Button>
              <Button
                onClick={onViewGalleryClick}
                variant="outline"
                className="border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] text-sm px-3"
                title="Vedi Galleria Foto"
              >
                <Image className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={onProgressPhotoClick}
              variant="outline"
              className="w-full border-amber-400 text-amber-700 hover:bg-amber-50 text-sm relative"
            >
              <Camera className="w-4 h-4 mr-2" />
              Analisi Progressi con AI
              <Crown className="w-4 h-4 absolute -top-1 -right-1 text-purple-600" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}