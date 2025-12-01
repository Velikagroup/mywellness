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
  const { t, language } = useLanguage();
  
  // Formati default in base alla lingua
  const defaultFormats = {
    it: { reps: '10-12 ripetizioni', rest: '60 secondi' },
    en: { reps: '10-12 reps', rest: '60 seconds' },
    es: { reps: '10-12 repeticiones', rest: '60 segundos' },
    pt: { reps: '10-12 repetições', rest: '60 segundos' },
    de: { reps: '10-12 Wiederholungen', rest: '60 Sekunden' },
    fr: { reps: '10-12 répétitions', rest: '60 secondes' }
  };
  const defaults = defaultFormats[language] || defaultFormats.it;
  
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(defaults.reps);
  const [rest, setRest] = useState(defaults.rest);
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

      const prompt = `You are an expert personal trainer and physiotherapist. The user wants to add the exercise: "${exerciseName}"

CREATE COMPLETE details for this exercise, as if you were an instructor explaining the exercise to a beginner.

CRITICAL: ALL OUTPUT MUST BE IN ${targetLanguage.toUpperCase()}.

CRITICAL RULES:
1. Create a correct ${targetLanguage} TITLE for the exercise
2. GENERATE a detailed description of 2-3 sentences on how to perform the exercise correctly - IN ${targetLanguage}
3. GENERATE 6-8 specific tips on correct form (form_tips) - must be practical and detailed - IN ${targetLanguage}
4. IDENTIFY specific muscles involved - IN ${targetLanguage} (target_muscles)
5. IDENTIFY main muscle groups - IN ${targetLanguage} (muscle_groups)
6. IDENTIFY required equipment - IN ${targetLanguage} (equipment)
7. IDENTIFY difficulty level
8. CRITICAL - GENERATE LOAD/INTENSITY tips (intensity_tips) IN ${targetLanguage}

Output the JSON in ${targetLanguage}.`;

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