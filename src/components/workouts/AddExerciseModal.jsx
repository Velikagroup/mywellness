import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../i18n/LanguageContext';

export default function AddExerciseModal({ 
  isOpen, 
  onClose, 
  workoutPlan,
  onExerciseAdded 
}) {
  const { t } = useLanguage();
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('10-12 ripetizioni');
  const [rest, setRest] = useState('60 secondi');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!exerciseName.trim()) {
      setError(t('workouts.enterExerciseName'));
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      const prompt = `Sei un personal trainer esperto e fisioterapista. L'utente vuole aggiungere l'esercizio: "${exerciseName}"

CREA i dettagli COMPLETI per questo esercizio, come se fossi un istruttore che spiega l'esercizio a un principiante.

REGOLE CRITICHE:
1. Crea un TITOLO ITALIANO corretto per l'esercizio (es: se l'utente scrive "push up" → "Flessioni", "squat" → "Squat", "bench press" → "Panca Piana")
2. GENERA una descrizione dettagliata di 2-3 frasi su come eseguire l'esercizio correttamente
3. GENERA 6-8 consigli specifici sulla forma corretta (form_tips) - devono essere pratici e dettagliati
4. IDENTIFICA i muscoli specifici coinvolti in italiano (target_muscles)
5. IDENTIFICA i gruppi muscolari principali (muscle_groups)
6. IDENTIFICA l'attrezzatura necessaria (equipment)
7. IDENTIFICA il livello di difficoltà
8. CRITICO - GENERA indicazioni sul CARICO/INTENSITÀ (intensity_tips):
   - Per esercizi con pesi: indica la percentuale del massimale (es: "70-80% del tuo massimale") o RPE (es: "RPE 7-8, dovresti riuscire a fare 2-3 ripetizioni in più")
   - Per esercizi a corpo libero: indica come regolare la difficoltà (es: "Se troppo facile, rallenta la fase eccentrica a 3 secondi")
   - Per esercizi cardio/resistenza: indica frequenza cardiaca o percezione dello sforzo
   - Dai SEMPRE un riferimento pratico che l'utente può usare per capire se sta usando il carico giusto

ESEMPIO DI OUTPUT ATTESO:
- name: "Panca Piana con Bilanciere"
- detailed_description: "Esercizio fondamentale per lo sviluppo del petto. Sdraiati sulla panca con i piedi ben piantati a terra, afferra il bilanciere con una presa leggermente più larga delle spalle..."
- form_tips: ["Mantieni le scapole retratte e depresse durante tutto il movimento", "I gomiti devono formare un angolo di 45° rispetto al busto", ...]
- target_muscles: ["Grande pettorale", "Deltoide anteriore", "Tricipite brachiale"]
- intensity_tips: ["Usa un carico pari al 70-75% del tuo massimale per l'ipertrofia", "Dovresti arrivare a fine serie con 2-3 ripetizioni di riserva (RPE 7-8)", "Se non conosci il tuo massimale, scegli un peso che ti permetta di completare tutte le ripetizioni con forma perfetta, ma le ultime 2 devono essere impegnative"]

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

      console.log('🏋️ LLM Result for new exercise:', JSON.stringify(llmResult, null, 2));

      // Crea il nuovo esercizio con tutti i dettagli - assicurati che tutti i campi siano presenti
      const newExercise = {
        name: llmResult.name || exerciseName,
        sets: sets,
        reps: reps,
        rest: rest,
        description: llmResult.detailed_description || '',
        detailed_description: llmResult.detailed_description || '',
        form_tips: Array.isArray(llmResult.form_tips) ? llmResult.form_tips : [],
        target_muscles: Array.isArray(llmResult.target_muscles) ? llmResult.target_muscles : [],
        muscle_groups: Array.isArray(llmResult.muscle_groups) ? llmResult.muscle_groups : [],
        equipment: llmResult.equipment || 'corpo_libero',
        difficulty: llmResult.difficulty || 'intermediate',
        intensity_tips: Array.isArray(llmResult.intensity_tips) ? llmResult.intensity_tips : []
      };
      
      console.log('🏋️ New exercise object to save:', JSON.stringify(newExercise, null, 2));

      // Aggiungi l'esercizio al workout plan
      const updatedExercises = [...(workoutPlan.exercises || []), newExercise];

      await base44.entities.WorkoutPlan.update(workoutPlan.id, {
        exercises: updatedExercises
      });

      // Reset form
      setExerciseName('');
      setSets(3);
      setReps('10-12 ripetizioni');
      setRest('60 secondi');
      
      onExerciseAdded();
      onClose();
      
    } catch (err) {
      console.error('Error adding exercise:', err);
      setError(`Errore: ${err.message || 'Riprova tra qualche secondo'}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="w-6 h-6 text-[#26847F]" />
            {t('workouts.addExerciseTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('workouts.addExerciseDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('workouts.exerciseName')}:
            </label>
            <Input
              placeholder={t('workouts.exerciseNamePlaceholder')}
              value={exerciseName}
              onChange={(e) => {
                setExerciseName(e.target.value);
                setError('');
              }}
              className="w-full"
              disabled={isAdding}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('workouts.setsLabel')}</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 3)}
                className="text-center"
                disabled={isAdding}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('workouts.repsLabel')}</label>
              <Input
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="10-12"
                disabled={isAdding}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('workouts.restLabel')}</label>
              <Input
                value={rest}
                onChange={(e) => setRest(e.target.value)}
                placeholder="60 sec"
                disabled={isAdding}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {t('workouts.aiWillGenerate')}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isAdding}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isAdding || !exerciseName.trim()}
              className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('workouts.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('workouts.addButton')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}