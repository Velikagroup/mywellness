import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Dumbbell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../i18n/LanguageContext';

export default function ReplaceExerciseModal({ 
  isOpen, 
  onClose, 
  exercise, 
  workoutPlan,
  onExerciseReplaced 
}) {
  const { t, language } = useLanguage();
  const [exerciseName, setExerciseName] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const [error, setError] = useState('');

  const handleReplace = async () => {
    if (!exerciseName.trim()) {
      setError(t('workouts.enterExerciseName'));
      return;
    }

    setIsReplacing(true);
    setError('');

    try {
      // Usa le stesse serie e ripetizioni dell'esercizio originale
      const originalSets = exercise.sets;
      const originalReps = exercise.reps;
      const originalRest = exercise.rest;
      
      // Lingua target
      const langNames = {
        'it': 'Italian',
        'en': 'English', 
        'es': 'Spanish', 
        'pt': 'Portuguese', 
        'de': 'German', 
        'fr': 'French'
      };
      const targetLanguage = langNames[language] || 'Italian';

      const prompt = `You are an expert personal trainer and physiotherapist. The user wants to do the exercise: "${exerciseName}"

CREATE COMPLETE details for this exercise, as if you were an instructor explaining the exercise to a beginner.

CRITICAL: ALL OUTPUT MUST BE IN ${targetLanguage.toUpperCase()}. 

CRITICAL RULES:
1. Create a correct ${targetLanguage} TITLE for the exercise
2. Keep: ${originalSets} sets, ${originalReps}, rest ${originalRest}
3. GENERATE a detailed description of 2-3 sentences on how to perform the exercise correctly - IN ${targetLanguage}
4. GENERATE 6-8 specific tips on correct form (form_tips) - must be practical and detailed - IN ${targetLanguage}
5. IDENTIFY specific muscles involved - IN ${targetLanguage} (target_muscles)
6. IDENTIFY main muscle groups - IN ${targetLanguage} (muscle_groups)
7. IDENTIFY required equipment - IN ${targetLanguage} (equipment)
8. IDENTIFY difficulty level
9. CRITICAL - GENERATE LOAD/INTENSITY tips (intensity_tips) IN ${targetLanguage}:
   - For weighted exercises: indicate percentage of max (e.g. "70-80% of your max") or RPE
   - For bodyweight: how to adjust difficulty
   - Always give a practical reference

Output the JSON in ${targetLanguage}.`;

      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string", description: `Exercise name in ${langNames[language] || 'Italian'}` },
            detailed_description: { type: "string", description: `Detailed description in ${langNames[language] || 'Italian'}` },
            form_tips: { 
              type: "array", 
              items: { type: "string" },
              description: `6-8 detailed form tips in ${langNames[language] || 'Italian'}`
            },
            target_muscles: {
              type: "array",
              items: { type: "string" },
              description: `Target muscles in ${langNames[language] || 'Italian'}`
            },
            muscle_groups: { 
              type: "array", 
              items: { type: "string" },
              description: `Main muscle groups in ${langNames[language] || 'Italian'}`
            },
            equipment: { type: "string", description: `Required equipment in ${langNames[language] || 'Italian'}` },
            difficulty: { 
              type: "string",
              enum: ["beginner", "intermediate", "advanced"]
            },
            intensity_tips: {
              type: "array",
              items: { type: "string" },
              description: "2-4 consigli specifici sul carico/intensità da usare"
            }
          },
          required: ["name", "detailed_description", "form_tips", "target_muscles", "muscle_groups", "equipment", "difficulty", "intensity_tips"]
        }
      });

      // Crea il nuovo esercizio con i dati originali + nuovi dettagli completi
      const newExercise = {
        name: llmResult.name,
        sets: originalSets,
        reps: originalReps,
        rest: originalRest,
        description: llmResult.detailed_description,
        detailed_description: llmResult.detailed_description,
        form_tips: llmResult.form_tips,
        target_muscles: llmResult.target_muscles,
        muscle_groups: llmResult.muscle_groups,
        equipment: llmResult.equipment,
        difficulty: llmResult.difficulty,
        intensity_tips: Array.isArray(llmResult.intensity_tips) ? llmResult.intensity_tips : []
      };

      // Aggiorna il workout plan sostituendo l'esercizio
      const updatedExercises = workoutPlan.exercises.map(ex => 
        ex.name === exercise.name ? newExercise : ex
      );

      await base44.entities.WorkoutPlan.update(workoutPlan.id, {
        exercises: updatedExercises
      });

      onExerciseReplaced();
      onClose();
      
    } catch (err) {
      console.error('Error replacing exercise:', err);
      setError(`Errore: ${err.message || 'Riprova tra qualche secondo'}`);
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Dumbbell className="w-6 h-6 text-[#26847F]" />
            {t('workouts.replaceExercise')}
          </DialogTitle>
          <DialogDescription>
            {t('workouts.replaceExerciseDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-xs text-gray-500 mb-1">{t('workouts.currentExercise')}:</p>
            <p className="font-semibold text-gray-800">{exercise?.name}</p>
            <p className="text-sm text-gray-600">{exercise?.sets} × {exercise?.reps}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('workouts.newExercise')}:
            </label>
            <Input
              placeholder={t('workouts.newExercisePlaceholder')}
              value={exerciseName}
              onChange={(e) => {
                setExerciseName(e.target.value);
                setError('');
              }}
              className="w-full"
              disabled={isReplacing}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('workouts.aiWillGenerate')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isReplacing}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleReplace}
              disabled={isReplacing || !exerciseName.trim()}
              className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
            >
              {isReplacing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('workouts.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('workouts.replaceButton')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}