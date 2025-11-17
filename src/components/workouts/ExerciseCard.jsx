import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Dumbbell, Info, Target, Zap, Eye, Check, Square } from "lucide-react";
import { motion } from 'framer-motion';
import SetTrackerModal from './SetTrackerModal';

export default function ExerciseCard({ exercise, isCompleted, onToggleComplete }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showSetTracker, setShowSetTracker] = useState(false);

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (!isCompleted) {
      setShowSetTracker(true);
    } else {
      onToggleComplete();
    }
  };

  const handleComplete = () => {
    onToggleComplete();
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700 border-green-300',
    intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    advanced: 'bg-red-100 text-red-700 border-red-300'
  };

  const difficultyLabels = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzato'
  };

  return (
    <>
      <motion.div
        animate={{
          backgroundColor: isCompleted ? '#f0fdf4' : '#ffffff',
          borderColor: isCompleted ? '#16a34a' : '#e5e7eb'
        }}
        transition={{ duration: 0.4 }}
      >
        <Card className={`shadow-md hover:shadow-lg transition-all relative ${
          isCompleted ? 'border-2' : 'border'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1">
                <button
                  onClick={handleCheckboxClick}
                  className="mt-1 flex-shrink-0"
                >
                  <motion.div
                    animate={{
                      scale: isCompleted ? [1, 1.2, 1] : 1,
                      backgroundColor: isCompleted ? '#16a34a' : '#ffffff',
                      borderColor: isCompleted ? '#15803d' : '#d1d5db'
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-6 h-6 rounded border-2 flex items-center justify-center"
                  >
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </motion.div>
                </button>
                
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-bold text-gray-900 mb-1">{exercise.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-[#26847F] text-white px-2 py-1 rounded font-semibold">
                      {exercise.sets} × {exercise.reps}
                    </span>
                    <span className="text-gray-600">• {exercise.rest}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0 pb-3">
            {exercise.muscle_groups?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {exercise.muscle_groups.slice(0, 3).map((mg, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200">
                    {mg}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {exercise.difficulty && (
                <span className={`text-xs px-2 py-1 rounded border font-semibold ${difficultyColors[exercise.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                  {difficultyLabels[exercise.difficulty] || exercise.difficulty}
                </span>
              )}
              
              {(exercise.detailed_description || exercise.form_tips || exercise.target_muscles || exercise.muscle_image_url) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="text-[#26847F] hover:text-[#1f6b66] hover:bg-[#e9f6f5] ml-auto"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Dettagli
                </Button>
              )}
            </div>
          </CardContent>

          {isCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-2 right-2"
            >
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Fatto
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {showSetTracker && (
        <SetTrackerModal
          isOpen={showSetTracker}
          onClose={() => setShowSetTracker(false)}
          exercise={exercise}
          onComplete={handleComplete}
        />
      )}

      {showDetails && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-[#26847F]" />
                {exercise.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {exercise.sets} serie × {exercise.reps} • {exercise.rest} di riposo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {exercise.muscle_image_url && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#26847F]" />
                    Muscoli Coinvolti
                  </h4>
                  <img 
                    src={exercise.muscle_image_url} 
                    alt="Muscoli target" 
                    className="w-full max-w-md mx-auto rounded-lg shadow-md"
                  />
                </div>
              )}

              {exercise.target_muscles?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🎯 Muscoli Specifici:</h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.target_muscles.map((muscle, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200">
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {exercise.detailed_description && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    Descrizione Dettagliata
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{exercise.detailed_description}</p>
                </div>
              )}

              {exercise.form_tips?.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    Consigli sulla Forma
                  </h4>
                  <ul className="space-y-2">
                    {exercise.form_tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 font-bold flex-shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {exercise.description && !exercise.detailed_description && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Esecuzione</h4>
                  <p className="text-sm text-gray-700">{exercise.description}</p>
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowDetails(false)}
              className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white"
            >
              Chiudi
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}