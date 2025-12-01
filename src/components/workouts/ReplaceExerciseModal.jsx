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
  const { t } = useLanguage();
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

      const prompt = `Sei un personal trainer esperto e fisioterapista. L'utente vuole fare l'esercizio: "${exerciseName}"

CREA i dettagli COMPLETI per questo esercizio, come se fossi un istruttore che spiega l'esercizio a un principiante.

REGOLE CRITICHE:
1. Crea un TITOLO ITALIANO corretto per l'esercizio (es: se l'utente scrive "push up" → "Flessioni", "squat" → "Squat", "bench press" → "Panca Piana")
2. Mantieni: ${originalSets} serie, ${originalReps}, riposo ${originalRest}
3. GENERA una descrizione dettagliata di 2-3 frasi su come eseguire l'esercizio correttamente
4. GENERA 6-8 consigli specifici sulla forma corretta (form_tips) - devono essere pratici e dettagliati
5. IDENTIFICA i muscoli specifici coinvolti in italiano (target_muscles)
6. IDENTIFICA i gruppi muscolari principali (muscle_groups)
7. IDENTIFICA l'attrezzatura necessaria (equipment)
8. IDENTIFICA il livello di difficoltà
9. CRITICO - GENERA indicazioni sul CARICO/INTENSITÀ (intensity_tips):
   - Per esercizi con pesi: indica la percentuale del massimale (es: "70-80% del tuo massimale") o RPE (es: "RPE 7-8, dovresti riuscire a fare 2-3 ripetizioni in più")
   - Per esercizi a corpo libero: indica come regolare la difficoltà (es: "Se troppo facile, rallenta la fase eccentrica a 3 secondi")
   - Per esercizi cardio/resistenza: indica frequenza cardiaca o percezione dello sforzo
   - Dai SEMPRE un riferimento pratico che l'utente può usare per capire se sta usando il carico giusto

ESEMPIO DI OUTPUT ATTESO:
- name: "Panca Piana con Bilanciere"
- detailed_description: "Esercizio fondamentale per lo sviluppo del petto..."
- form_tips: ["Mantieni le scapole retratte...", ...]
- target_muscles: ["Grande pettorale", "Deltoide anteriore", "Tricipite brachiale"]
- intensity_tips: ["Usa un carico pari al 70-75% del tuo massimale", "Dovresti arrivare a fine serie con 2-3 ripetizioni di riserva (RPE 7-8)"]

Restituisci i dati nel formato JSON richiesto.`;

      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nome italiano corretto dell'esercizio" },
            detailed_description: { type: "string", description: "Descrizione dettagliata di 2-3 frasi su come eseguire l'esercizio" },
            form_tips: { 
              type: "array", 
              items: { type: "string" },
              description: "6-8 consigli dettagliati sulla forma corretta"
            },
            target_muscles: {
              type: "array",
              items: { type: "string" },
              description: "Muscoli specifici coinvolti in italiano"
            },
            muscle_groups: { 
              type: "array", 
              items: { type: "string" },
              description: "Gruppi muscolari principali"
            },
            equipment: { type: "string", description: "Attrezzatura necessaria" },
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