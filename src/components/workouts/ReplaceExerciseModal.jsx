import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Dumbbell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ReplaceExerciseModal({ 
  isOpen, 
  onClose, 
  exercise, 
  workoutPlan,
  onExerciseReplaced 
}) {
  const [exerciseName, setExerciseName] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const [error, setError] = useState('');

  const handleReplace = async () => {
    if (!exerciseName.trim()) {
      setError('Inserisci il nome dell\'esercizio');
      return;
    }

    setIsReplacing(true);
    setError('');

    try {
      // Usa le stesse serie e ripetizioni dell'esercizio originale
      const originalSets = exercise.sets;
      const originalReps = exercise.reps;
      const originalRest = exercise.rest;

      const prompt = `Sei un personal trainer esperto. L'utente vuole sostituire l'esercizio "${exercise.name}" con: "${exerciseName}"

CREA i dettagli per questo esercizio mantenendo lo stesso schema di allenamento.

REGOLE:
- Usa NOME ITALIANO per l'esercizio
- Mantieni le stesse serie: ${originalSets}
- Mantieni le stesse ripetizioni: ${originalReps}
- Mantieni lo stesso riposo: ${originalRest}
- Fornisci una descrizione utile per l'esecuzione
- Identifica i gruppi muscolari coinvolti
- Identifica l'attrezzatura necessaria
- Identifica il livello di difficoltà

Restituisci i dati nel formato JSON richiesto.`;

      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            muscle_groups: { 
              type: "array", 
              items: { type: "string" } 
            },
            equipment: { type: "string" },
            difficulty: { 
              type: "string",
              enum: ["beginner", "intermediate", "advanced"]
            }
          },
          required: ["name", "description", "muscle_groups", "equipment", "difficulty"]
        }
      });

      // Crea il nuovo esercizio con i dati originali + nuovi dettagli
      const newExercise = {
        name: llmResult.name,
        sets: originalSets,
        reps: originalReps,
        rest: originalRest,
        description: llmResult.description,
        muscle_groups: llmResult.muscle_groups,
        equipment: llmResult.equipment,
        difficulty: llmResult.difficulty
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
            Sostituisci Esercizio
          </DialogTitle>
          <DialogDescription>
            Scrivi il nome dell'esercizio che vuoi fare al posto di quello attuale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-xs text-gray-500 mb-1">Esercizio attuale:</p>
            <p className="font-semibold text-gray-800">{exercise?.name}</p>
            <p className="text-sm text-gray-600">{exercise?.sets} × {exercise?.reps}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuovo esercizio:
            </label>
            <Input
              placeholder="Es: Panca inclinata, Squat bulgaro, Rematore..."
              value={exerciseName}
              onChange={(e) => {
                setExerciseName(e.target.value);
                setError('');
              }}
              className="w-full"
              disabled={isReplacing}
            />
            <p className="text-xs text-gray-500 mt-1">
              Puoi inserire l'esercizio che ti ha dato il tuo istruttore
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
              Annulla
            </Button>
            <Button
              onClick={handleReplace}
              disabled={isReplacing || !exerciseName.trim()}
              className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
            >
              {isReplacing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sostituzione...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Sostituisci
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}