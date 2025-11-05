import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Plus, Minus, Save } from 'lucide-react';
import { WorkoutLog } from '@/entities/WorkoutLog';
import { Badge } from '@/components/ui/badge';

export default function WorkoutLogger({ workout, user, onClose, onLogSaved }) {
  const [exercisesLog, setExercisesLog] = useState(
    workout.exercises?.map(ex => ({
      exercise_name: ex.name,
      sets_completed: Array.from({ length: ex.sets }, (_, i) => ({
        set_number: i + 1,
        reps: 0,
        weight: 0,
        notes: ''
      }))
    })) || []
  );
  const [notes, setNotes] = useState('');
  const [feeling, setFeeling] = useState('good');
  const [duration, setDuration] = useState(workout.total_duration || 0);
  const [isSaving, setIsSaving] = useState(false);

  const updateSet = (exerciseIdx, setIdx, field, value) => {
    const newLog = [...exercisesLog];
    newLog[exerciseIdx].sets_completed[setIdx][field] = field === 'notes' ? value : parseFloat(value) || 0;
    setExercisesLog(newLog);
  };

  const addSet = (exerciseIdx) => {
    const newLog = [...exercisesLog];
    const currentSets = newLog[exerciseIdx].sets_completed;
    newLog[exerciseIdx].sets_completed.push({
      set_number: currentSets.length + 1,
      reps: 0,
      weight: 0,
      notes: ''
    });
    setExercisesLog(newLog);
  };

  const removeSet = (exerciseIdx) => {
    const newLog = [...exercisesLog];
    if (newLog[exerciseIdx].sets_completed.length > 1) {
      newLog[exerciseIdx].sets_completed.pop();
    }
    setExercisesLog(newLog);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await WorkoutLog.create({
        user_id: user.id,
        workout_plan_id: workout.id,
        date: today,
        completed: true,
        exercises_log: exercisesLog,
        total_duration: duration,
        notes: notes,
        feeling: feeling
      });

      if (onLogSaved) onLogSaved();
      onClose();
    } catch (error) {
      console.error("Error saving workout log:", error);
      alert("Errore nel salvataggio. Riprova.");
    }
    setIsSaving(false);
  };

  const feelingOptions = {
    excellent: { label: 'Eccellente', emoji: '🔥', color: 'bg-green-100 text-green-800' },
    good: { label: 'Bene', emoji: '💪', color: 'bg-blue-100 text-blue-800' },
    normal: { label: 'Normale', emoji: '👍', color: 'bg-gray-100 text-gray-800' },
    tired: { label: 'Stanco', emoji: '😓', color: 'bg-yellow-100 text-yellow-800' },
    exhausted: { label: 'Esausto', emoji: '😵', color: 'bg-red-100 text-red-800' }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">📊 Registra Allenamento</DialogTitle>
          <p className="text-sm text-gray-500">{workout.plan_name} - {new Date().toLocaleDateString('it-IT')}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feeling & Duration */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Come ti sei sentito?</label>
              <Select value={feeling} onValueChange={setFeeling}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(feelingOptions).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{val.emoji}</span>
                        <span>{val.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Durata effettiva (min)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="text-center"
              />
            </div>
          </div>

          {/* Exercises Log */}
          {exercisesLog.map((exLog, exIdx) => (
            <div key={exIdx} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{exLog.exercise_name}</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={() => addSet(exIdx)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => removeSet(exIdx)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={exLog.sets_completed.length <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {exLog.sets_completed.map((set, setIdx) => (
                  <div key={setIdx} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded">
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-medium text-gray-600">Set {set.set_number}</span>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Rip"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        className="h-9 text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Kg"
                        value={set.weight || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        className="h-9 text-center"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="text"
                        placeholder="Note..."
                        value={set.notes}
                        onChange={(e) => updateSet(exIdx, setIdx, 'notes', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* General Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Note generali</label>
            <Textarea
              placeholder="Come è andato l'allenamento? Qualcosa di particolare da annotare?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">Annulla</Button>
          <Button
            onClick={handleSave}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvataggio...' : 'Salva Allenamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}