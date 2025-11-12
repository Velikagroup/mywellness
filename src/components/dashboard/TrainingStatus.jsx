import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Dumbbell, CheckCircle, Clock, Flame, Crown, History } from 'lucide-react';
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';
import ProgressPhotoGallery from '../training/ProgressPhotoGallery';

export default function TrainingStatus({ workout, onProgressPhotoClick, userPlan, userId }) {
  const [showGallery, setShowGallery] = React.useState(false);

  return (
    <>
      <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl h-full flex flex-col">
        <CardHeader className="border-b border-gray-200/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Dumbbell className="w-5 h-5 text-orange-600" />
            </div>
            Allenamento Oggi
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex-1 flex flex-col">
          {workout ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
                  <h3 className="font-bold text-gray-900 mb-1">{workout.plan_name}</h3>
                  <p className="text-sm text-gray-600">
                    {workout.exercises?.length || 0} esercizi • {workout.total_duration || 45} min
                  </p>
                </div>

                {workout.exercises?.slice(0, 3).map((exercise, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-gray-200/60">
                    <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">{exercise.name}</p>
                      <p className="text-xs text-gray-500">
                        {exercise.sets} serie × {exercise.reps}
                      </p>
                    </div>
                  </div>
                ))}

                {workout.exercises?.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{workout.exercises.length - 3} altri esercizi
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                    <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-blue-600 font-medium">{workout.total_duration || 45}min</p>
                  </div>
                  <div className="flex-1 bg-red-50 rounded-lg p-3 text-center border border-red-200">
                    <Flame className="w-4 h-4 text-red-600 mx-auto mb-1" />
                    <p className="text-xs text-red-600 font-medium">{workout.calories_burned || 300}kcal</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Button
                  onClick={onProgressPhotoClick}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white relative"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Analisi Progressi con AI
                  {!hasFeatureAccess(userPlan, 'progress_photo_analysis') && (
                    <Crown className="w-4 h-4 absolute -top-1 -right-1 text-yellow-400" />
                  )}
                </Button>
                
                {hasFeatureAccess(userPlan, 'progress_photo_analysis') && (
                  <Button
                    onClick={() => setShowGallery(true)}
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Vedi Galleria Foto
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Dumbbell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium mb-2">Giorno di Riposo</p>
              <p className="text-sm text-gray-400">Recupero e mobilità</p>
            </div>
          )}
        </CardContent>
      </Card>

      {showGallery && (
        <ProgressPhotoGallery 
          isOpen={showGallery} 
          onClose={() => setShowGallery(false)} 
          userId={userId}
        />
      )}
    </>
  );
}