import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../i18n/LanguageContext';
import { Upload, Loader2, AlertCircle, CheckCircle2, Flame, Dumbbell, Wind, FileText } from 'lucide-react';

const i18n = {
  it: {
    title: 'Importa Piano di Allenamento',
    description: 'Carica un file PDF, Excel o CSV con i tuoi esercizi. L\'AI analizzerà il contenuto e creerà automaticamente una bozza del piano.',
    clickToSelect: 'Clicca per selezionare un file',
    fileFormats: 'PDF, Excel, CSV o JSON',
    analyzing: 'Analisi in corso...',
    analyzingDesc: 'L\'AI sta elaborando gli esercizi dal tuo file',
    aiDraft: '✨ Bozza creata con',
    exercises: 'esercizi',
    warnings: 'Avvisi',
    rest: 'Riposo',
    groups: 'Muscoli',
    sets: 'Serie',
    saving: 'Salvataggio in corso...',
    imported: 'Piano importato con successo!',
    importedDesc: 'Gli esercizi sono stati aggiunti al tuo piano settimanale',
    cancel: 'Annulla',
    analyze: 'Analizza File',
    confirm: 'Conferma e Salva',
    selectFile: 'Seleziona un file prima di continuare',
    warmup: 'Riscaldamento',
    mainExercises: 'Esercizi Principali',
    cooldown: 'Defaticamento',
    noExercises: 'Nessun esercizio per questo giorno',
    dropFile: 'Trascina qui il tuo file',
  },
  en: {
    title: 'Import Workout Plan',
    description: 'Upload a PDF, Excel or CSV file with your exercises. AI will analyze the content and automatically create a draft plan.',
    clickToSelect: 'Click to select a file',
    fileFormats: 'PDF, Excel, CSV or JSON',
    analyzing: 'Analyzing...',
    analyzingDesc: 'AI is processing the exercises from your file',
    aiDraft: '✨ Draft created with',
    exercises: 'exercises',
    warnings: 'Warnings',
    rest: 'Rest',
    groups: 'Muscles',
    sets: 'Sets',
    saving: 'Saving...',
    imported: 'Plan imported successfully!',
    importedDesc: 'Exercises have been added to your weekly plan',
    cancel: 'Cancel',
    analyze: 'Analyze File',
    confirm: 'Confirm & Save',
    selectFile: 'Please select a file first',
    warmup: 'Warm-up',
    mainExercises: 'Main Exercises',
    cooldown: 'Cool-down',
    noExercises: 'No exercises for this day',
    dropFile: 'Drop your file here',
  },
  es: {
    title: 'Importar Plan de Entrenamiento',
    description: 'Sube un archivo PDF, Excel o CSV con tus ejercicios. La IA analizará el contenido y creará automáticamente un borrador del plan.',
    clickToSelect: 'Haz clic para seleccionar un archivo',
    fileFormats: 'PDF, Excel, CSV o JSON',
    analyzing: 'Analizando...',
    analyzingDesc: 'La IA está procesando los ejercicios de tu archivo',
    aiDraft: '✨ Borrador creado con',
    exercises: 'ejercicios',
    warnings: 'Advertencias',
    rest: 'Descanso',
    groups: 'Músculos',
    sets: 'Series',
    saving: 'Guardando...',
    imported: '¡Plan importado con éxito!',
    importedDesc: 'Los ejercicios se han añadido a tu plan semanal',
    cancel: 'Cancelar',
    analyze: 'Analizar Archivo',
    confirm: 'Confirmar y Guardar',
    selectFile: 'Selecciona un archivo primero',
    warmup: 'Calentamiento',
    mainExercises: 'Ejercicios Principales',
    cooldown: 'Enfriamiento',
    noExercises: 'No hay ejercicios para este día',
    dropFile: 'Suelta tu archivo aquí',
  },
  pt: {
    title: 'Importar Plano de Treino',
    description: 'Carrega um ficheiro PDF, Excel ou CSV com os teus exercícios. A IA irá analisar o conteúdo e criar automaticamente um rascunho do plano.',
    clickToSelect: 'Clica para selecionar um ficheiro',
    fileFormats: 'PDF, Excel, CSV ou JSON',
    analyzing: 'A analisar...',
    analyzingDesc: 'A IA está a processar os exercícios do teu ficheiro',
    aiDraft: '✨ Rascunho criado com',
    exercises: 'exercícios',
    warnings: 'Avisos',
    rest: 'Descanso',
    groups: 'Músculos',
    sets: 'Séries',
    saving: 'A guardar...',
    imported: 'Plano importado com sucesso!',
    importedDesc: 'Os exercícios foram adicionados ao teu plano semanal',
    cancel: 'Cancelar',
    analyze: 'Analisar Ficheiro',
    confirm: 'Confirmar e Guardar',
    selectFile: 'Seleciona um ficheiro primeiro',
    warmup: 'Aquecimento',
    mainExercises: 'Exercícios Principais',
    cooldown: 'Arrefecimento',
    noExercises: 'Sem exercícios para este dia',
    dropFile: 'Arrasta o teu ficheiro aqui',
  },
  de: {
    title: 'Trainingsplan Importieren',
    description: 'Lade eine PDF-, Excel- oder CSV-Datei mit deinen Übungen hoch.',
    clickToSelect: 'Klicken um Datei auszuwählen',
    fileFormats: 'PDF, Excel, CSV oder JSON',
    analyzing: 'Analyse läuft...',
    analyzingDesc: 'Die KI verarbeitet die Übungen aus deiner Datei',
    aiDraft: '✨ Entwurf erstellt mit',
    exercises: 'Übungen',
    warnings: 'Hinweise',
    rest: 'Pause',
    groups: 'Muskeln',
    sets: 'Sätze',
    saving: 'Wird gespeichert...',
    imported: 'Plan erfolgreich importiert!',
    importedDesc: 'Die Übungen wurden deinem Wochenplan hinzugefügt',
    cancel: 'Abbrechen',
    analyze: 'Datei Analysieren',
    confirm: 'Bestätigen & Speichern',
    selectFile: 'Bitte zuerst eine Datei auswählen',
    warmup: 'Aufwärmen',
    mainExercises: 'Hauptübungen',
    cooldown: 'Abkühlen',
    noExercises: 'Keine Übungen für diesen Tag',
    dropFile: 'Datei hier ablegen',
  },
  fr: {
    title: 'Importer un Plan d\'Entraînement',
    description: 'Télécharge un fichier PDF, Excel ou CSV avec tes exercices.',
    clickToSelect: 'Clique pour sélectionner un fichier',
    fileFormats: 'PDF, Excel, CSV ou JSON',
    analyzing: 'Analyse en cours...',
    analyzingDesc: 'L\'IA traite les exercices de ton fichier',
    aiDraft: '✨ Brouillon créé avec',
    exercises: 'exercices',
    warnings: 'Avertissements',
    rest: 'Repos',
    groups: 'Muscles',
    sets: 'Séries',
    saving: 'Enregistrement...',
    imported: 'Plan importé avec succès !',
    importedDesc: 'Les exercices ont été ajoutés à ton plan hebdomadaire',
    cancel: 'Annuler',
    analyze: 'Analyser le Fichier',
    confirm: 'Confirmer et Enregistrer',
    selectFile: 'Sélectionne d\'abord un fichier',
    warmup: 'Échauffement',
    mainExercises: 'Exercices Principaux',
    cooldown: 'Récupération',
    noExercises: 'Aucun exercice pour ce jour',
    dropFile: 'Dépose ton fichier ici',
  },
};

const dayTranslations = {
  it: { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Gio', friday: 'Ven', saturday: 'Sab', sunday: 'Dom' },
  en: { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' },
  es: { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom' },
  pt: { monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sáb', sunday: 'Dom' },
  de: { monday: 'Mo', tuesday: 'Di', wednesday: 'Mi', thursday: 'Do', friday: 'Fr', saturday: 'Sa', sunday: 'So' },
  fr: { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu', friday: 'Ven', saturday: 'Sam', sunday: 'Dim' },
};

function ExerciseCard({ ex, idx, editingExercises, setEditingExercises, tx }) {
  const current = editingExercises[ex.originalIndex] || {};
  const name = current.name ?? ex.name;
  const sets = current.sets ?? ex.sets;
  const reps = current.reps ?? ex.reps;
  const rest = current.rest ?? ex.rest;

  const update = (field, value) =>
    setEditingExercises(prev => ({
      ...prev,
      [ex.originalIndex]: { ...prev[ex.originalIndex], [field]: value }
    }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => update('name', e.target.value)}
        className="w-full font-semibold text-gray-900 text-sm bg-transparent border-b border-gray-200 focus:border-[#26847F] outline-none pb-1 transition-colors"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-[#26847F]/10 rounded-xl px-3 py-1.5">
          <span className="text-xs text-[#26847F] font-medium">{tx.sets}:</span>
          <input
            type="number"
            value={sets}
            onChange={(e) => update('sets', parseInt(e.target.value))}
            className="w-8 text-xs font-bold text-[#26847F] bg-transparent outline-none text-center"
          />
        </div>
        <div className="flex items-center gap-1 bg-purple-50 rounded-xl px-3 py-1.5">
          <span className="text-xs text-purple-600 font-medium">Reps:</span>
          <input
            type="text"
            value={reps}
            onChange={(e) => update('reps', e.target.value)}
            className="w-12 text-xs font-bold text-purple-600 bg-transparent outline-none text-center"
          />
        </div>
        <div className="flex items-center gap-1 bg-orange-50 rounded-xl px-3 py-1.5">
          <span className="text-xs text-orange-500 font-medium">{tx.rest}:</span>
          <input
            type="text"
            value={rest}
            onChange={(e) => update('rest', e.target.value)}
            className="w-16 text-xs font-bold text-orange-500 bg-transparent outline-none text-center"
          />
        </div>
        {(current.rpe ?? ex.rpe) && (
          <div className="flex items-center gap-1 bg-red-50 rounded-xl px-3 py-1.5">
            <span className="text-xs text-red-500 font-medium">RPE:</span>
            <input
              type="text"
              value={current.rpe ?? ex.rpe}
              onChange={(e) => update('rpe', e.target.value)}
              className="w-8 text-xs font-bold text-red-500 bg-transparent outline-none text-center"
            />
          </div>
        )}
      </div>
      {ex.muscle_groups?.length > 0 && (
        <p className="text-xs text-gray-400">{tx.groups}: {ex.muscle_groups.join(', ')}</p>
      )}
      {ex.notes && (
        <p className="text-xs text-gray-400 italic">📝 {ex.notes}</p>
      )}
    </div>
  );
}

function SectionBlock({ icon: Icon, label, color, bgColor, borderColor, exercises, editingExercises, setEditingExercises, tx }) {
  if (!exercises || exercises.length === 0) return null;
  return (
    <div className={`rounded-2xl border-2 ${borderColor} ${bgColor} p-4 space-y-3`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-800 text-sm">{label}</span>
        <span className="ml-auto text-xs text-gray-400 font-medium">{exercises.length} esercizi</span>
      </div>
      <div className="space-y-2">
        {exercises.map((ex, idx) => (
          <ExerciseCard
            key={idx}
            ex={ex}
            idx={idx}
            editingExercises={editingExercises}
            setEditingExercises={setEditingExercises}
            tx={tx}
          />
        ))}
      </div>
    </div>
  );
}

export default function ImportWorkoutPlanModal({ isOpen, onClose, user, onWorkoutImported }) {
  const { language } = useLanguage();
  const tx = i18n[language] || i18n.it;

  const [step, setStep] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [editingExercises, setEditingExercises] = useState({});
  const [exercisesByDay, setExercisesByDay] = useState({});

  const handleFileChange = (file) => {
    if (file) {
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) { setError(tx.selectFile); return; }
    setIsAnalyzing(true);
    setError(null);
    setStep('analyzing');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedFile });

      // Read the PDF directly with vision — no intermediate extraction step
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a fitness assistant. Read the attached workout plan document and extract EVERY exercise exactly as written.

CRITICAL RULES:
- Extract ONLY exercises that actually appear in the document. DO NOT invent or add any exercise.
- Copy exercise names EXACTLY as written in the document (same language, same spelling).
- Extract sets, reps, rest, RPE exactly as written. If a field is missing, use null.
- Classify "phase": "warm_up" if the exercise is in a warm-up section, "cool_down" if in a cool-down/stretching section, "main" for all other exercises.
- Extract ALL exercises from ALL days/sections shown in the document.
- Include notes/tempo if written next to the exercise.

Return every single exercise found in the document. Nothing more, nothing less.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            exercises: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  sets: { type: 'number' },
                  reps: { type: 'string' },
                  rest: { type: 'string' },
                  rpe: { type: 'string' },
                  muscle_groups: { type: 'array', items: { type: 'string' } },
                  phase: { type: 'string', enum: ['warm_up', 'main', 'cool_down'] },
                  notes: { type: 'string' }
                },
                required: ['name', 'phase']
              }
            },
            warnings: { type: 'array', items: { type: 'string' } }
          },
          required: ['exercises']
        }
      });

      setAnalysisResult(aiResponse);

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayExercises = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
      aiResponse.exercises?.forEach((ex, idx) => {
        const dayIndex = idx % 7;
        dayExercises[days[dayIndex]].push({ ...ex, originalIndex: idx });
      });

      setExercisesByDay(dayExercises);
      setSelectedDay('monday');
      setStep('review');
    } catch (err) {
      console.error('Error analyzing file:', err);
      setError(err.message || 'File analysis error');
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!analysisResult?.exercises) return;
    setIsSaving(true);
    setStep('saving');

    try {
      const exercisesToSave = analysisResult.exercises.map((ex, idx) => ({
        ...ex,
        ...editingExercises[idx],
        day_of_week: selectedDay
      }));

      await base44.functions.invoke('importWorkoutPlanFromAnalysis', {
        user_id: user?.id,
        exercises: exercisesToSave,
        day_of_week: selectedDay
      });

      setStep('success');
      setTimeout(() => { onWorkoutImported?.(); onClose(); }, 2000);
    } catch (err) {
      console.error('Error saving workout plan:', err);
      setError(err.message || 'Save error');
      setStep('review');
    } finally {
      setIsSaving(false);
    }
  };

  const dayExs = exercisesByDay[selectedDay] || [];
  const warmupExs = dayExs.filter(e => e.phase === 'warm_up');
  const mainExs = dayExs.filter(e => e.phase === 'main' || !e.phase);
  const cooldownExs = dayExs.filter(e => e.phase === 'cool_down');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#26847F] to-[#1f6b66] flex items-center justify-center shadow-lg shadow-[#26847F]/20">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{tx.title}</h2>
              <p className="text-xs text-gray-400">AI-powered import</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* UPLOAD STEP */}
          {step === 'upload' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 leading-relaxed">{tx.description}</p>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#26847F] bg-[#e9f6f5]'
                    : uploadedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-[#26847F] hover:bg-[#f0faf9]'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv,.json"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {uploadedFile ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-green-700 text-sm">{uploadedFile.name}</p>
                    <p className="text-xs text-green-500 mt-1">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-[#26847F]" />
                    </div>
                    <p className="font-semibold text-gray-700 text-sm mb-1">{tx.dropFile}</p>
                    <p className="text-xs text-[#26847F] font-medium">{tx.clickToSelect}</p>
                    <p className="text-xs text-gray-400 mt-2">{tx.fileFormats}</p>
                  </>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}
            </div>
          )}

          {/* ANALYZING STEP */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#26847F] to-[#1f6b66] flex items-center justify-center shadow-xl shadow-[#26847F]/30">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-base">{tx.analyzing}</p>
                <p className="text-sm text-gray-500 mt-1">{tx.analyzingDesc}</p>
              </div>
            </div>
          )}

          {/* REVIEW STEP */}
          {step === 'review' && analysisResult && (
            <div className="space-y-5">
              {/* Summary pill */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#e9f6f5] to-[#f0faf9] border border-[#26847F]/20 rounded-2xl px-4 py-3">
                <span className="text-lg">✨</span>
                <p className="text-sm font-medium text-[#26847F]">
                  {tx.aiDraft} <strong>{analysisResult.exercises.length}</strong> {tx.exercises}
                </p>
              </div>

              {analysisResult.warnings?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">{tx.warnings}</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {analysisResult.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              )}

              {/* Day tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const count = exercisesByDay[day]?.length || 0;
                  const isActive = selectedDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl text-xs font-semibold transition-all min-w-[52px] ${
                        isActive
                          ? 'bg-[#26847F] text-white shadow-lg shadow-[#26847F]/30'
                          : 'bg-gray-100 text-gray-500 hover:bg-[#e9f6f5] hover:text-[#26847F]'
                      }`}
                    >
                      <span>{dayTranslations[language][day]}</span>
                      <span className={`mt-0.5 text-[10px] font-bold ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Exercises by section */}
              {dayExs.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">{tx.noExercises}</div>
              ) : (
                <div className="space-y-4">
                  <SectionBlock
                    icon={Flame}
                    label={tx.warmup}
                    color="bg-orange-400"
                    bgColor="bg-orange-50/50"
                    borderColor="border-orange-200"
                    exercises={warmupExs}
                    editingExercises={editingExercises}
                    setEditingExercises={setEditingExercises}
                    tx={tx}
                  />
                  <SectionBlock
                    icon={Dumbbell}
                    label={tx.mainExercises}
                    color="bg-[#26847F]"
                    bgColor="bg-[#e9f6f5]/50"
                    borderColor="border-[#26847F]/20"
                    exercises={mainExs}
                    editingExercises={editingExercises}
                    setEditingExercises={setEditingExercises}
                    tx={tx}
                  />
                  <SectionBlock
                    icon={Wind}
                    label={tx.cooldown}
                    color="bg-blue-400"
                    bgColor="bg-blue-50/50"
                    borderColor="border-blue-200"
                    exercises={cooldownExs}
                    editingExercises={editingExercises}
                    setEditingExercises={setEditingExercises}
                    tx={tx}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}
            </div>
          )}

          {/* SAVING STEP */}
          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#26847F] to-[#1f6b66] flex items-center justify-center shadow-xl shadow-[#26847F]/30">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <p className="font-bold text-gray-900">{tx.saving}</p>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-400/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">{tx.imported}</p>
                <p className="text-sm text-gray-500 mt-1">{tx.importedDesc}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAnalyzing || isSaving || step === 'success'}
            className="rounded-xl border-gray-200"
          >
            {tx.cancel}
          </Button>
          {step === 'upload' && (
            <Button
              onClick={handleAnalyze}
              disabled={!uploadedFile || isAnalyzing}
              className="bg-[#26847F] hover:bg-[#1f6b66] text-white rounded-xl shadow-lg shadow-[#26847F]/25 px-6"
            >
              {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{tx.analyzing}</> : tx.analyze}
            </Button>
          )}
          {step === 'review' && (
            <Button
              onClick={handleConfirm}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#26847F] to-[#1f6b66] hover:opacity-90 text-white rounded-xl shadow-lg shadow-[#26847F]/25 px-6"
            >
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{tx.saving}</> : tx.confirm}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}