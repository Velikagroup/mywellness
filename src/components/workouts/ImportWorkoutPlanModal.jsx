import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../i18n/LanguageContext';
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const i18n = {
  it: {
    title: 'Importa Piano di Allenamento',
    description: 'Carica un file PDF, Excel o CSV con i tuoi esercizi. L\'AI analizzerà il contenuto e creerà automaticamente una bozza del piano.',
    clickToSelect: 'Clicca per selezionare un file',
    fileFormats: 'PDF, Excel, CSV o JSON',
    analyzing: 'Analisi in corso...',
    analyzingDesc: 'L\'AI sta elaborando gli esercizi dal tuo file',
    aiDraft: '✨ L\'AI ha analizzato il file e creato una bozza con',
    exercises: 'esercizi',
    warnings: '⚠️ Avvisi:',
    rest: 'Riposo',
    groups: 'Muscoli',
    saving: 'Salvataggio in corso...',
    imported: 'Piano importato con successo!',
    importedDesc: 'Gli esercizi sono stati aggiunti al tuo piano settimanale',
    cancel: 'Annulla',
    analyze: 'Analizza File',
    confirm: 'Conferma e Salva',
    selectFile: 'Seleziona un file prima di continuare',
  },
  en: {
    title: 'Import Workout Plan',
    description: 'Upload a PDF, Excel or CSV file with your exercises. AI will analyze the content and automatically create a draft plan.',
    clickToSelect: 'Click to select a file',
    fileFormats: 'PDF, Excel, CSV or JSON',
    analyzing: 'Analyzing...',
    analyzingDesc: 'AI is processing the exercises from your file',
    aiDraft: '✨ AI analyzed the file and created a draft with',
    exercises: 'exercises',
    warnings: '⚠️ Warnings:',
    rest: 'Rest',
    groups: 'Muscles',
    saving: 'Saving...',
    imported: 'Plan imported successfully!',
    importedDesc: 'Exercises have been added to your weekly plan',
    cancel: 'Cancel',
    analyze: 'Analyze File',
    confirm: 'Confirm & Save',
    selectFile: 'Please select a file first',
  },
  es: {
    title: 'Importar Plan de Entrenamiento',
    description: 'Sube un archivo PDF, Excel o CSV con tus ejercicios. La IA analizará el contenido y creará automáticamente un borrador del plan.',
    clickToSelect: 'Haz clic para seleccionar un archivo',
    fileFormats: 'PDF, Excel, CSV o JSON',
    analyzing: 'Analizando...',
    analyzingDesc: 'La IA está procesando los ejercicios de tu archivo',
    aiDraft: '✨ La IA analizó el archivo y creó un borrador con',
    exercises: 'ejercicios',
    warnings: '⚠️ Advertencias:',
    rest: 'Descanso',
    groups: 'Músculos',
    saving: 'Guardando...',
    imported: '¡Plan importado con éxito!',
    importedDesc: 'Los ejercicios se han añadido a tu plan semanal',
    cancel: 'Cancelar',
    analyze: 'Analizar Archivo',
    confirm: 'Confirmar y Guardar',
    selectFile: 'Selecciona un archivo primero',
  },
  pt: {
    title: 'Importar Plano de Treino',
    description: 'Carrega um ficheiro PDF, Excel ou CSV com os teus exercícios. A IA irá analisar o conteúdo e criar automaticamente um rascunho do plano.',
    clickToSelect: 'Clica para selecionar um ficheiro',
    fileFormats: 'PDF, Excel, CSV ou JSON',
    analyzing: 'A analisar...',
    analyzingDesc: 'A IA está a processar os exercícios do teu ficheiro',
    aiDraft: '✨ A IA analisou o ficheiro e criou um rascunho com',
    exercises: 'exercícios',
    warnings: '⚠️ Avisos:',
    rest: 'Descanso',
    groups: 'Músculos',
    saving: 'A guardar...',
    imported: 'Plano importado com sucesso!',
    importedDesc: 'Os exercícios foram adicionados ao teu plano semanal',
    cancel: 'Cancelar',
    analyze: 'Analisar Ficheiro',
    confirm: 'Confirmar e Guardar',
    selectFile: 'Seleciona um ficheiro primeiro',
  },
  de: {
    title: 'Trainingsplan Importieren',
    description: 'Lade eine PDF-, Excel- oder CSV-Datei mit deinen Übungen hoch. Die KI analysiert den Inhalt und erstellt automatisch einen Planentwurf.',
    clickToSelect: 'Klicken um Datei auszuwählen',
    fileFormats: 'PDF, Excel, CSV oder JSON',
    analyzing: 'Analyse läuft...',
    analyzingDesc: 'Die KI verarbeitet die Übungen aus deiner Datei',
    aiDraft: '✨ Die KI hat die Datei analysiert und einen Entwurf mit',
    exercises: 'Übungen erstellt',
    warnings: '⚠️ Hinweise:',
    rest: 'Pause',
    groups: 'Muskeln',
    saving: 'Wird gespeichert...',
    imported: 'Plan erfolgreich importiert!',
    importedDesc: 'Die Übungen wurden deinem Wochenplan hinzugefügt',
    cancel: 'Abbrechen',
    analyze: 'Datei Analysieren',
    confirm: 'Bestätigen & Speichern',
    selectFile: 'Bitte zuerst eine Datei auswählen',
  },
  fr: {
    title: 'Importer un Plan d\'Entraînement',
    description: 'Télécharge un fichier PDF, Excel ou CSV avec tes exercices. L\'IA analysera le contenu et créera automatiquement un brouillon du plan.',
    clickToSelect: 'Clique pour sélectionner un fichier',
    fileFormats: 'PDF, Excel, CSV ou JSON',
    analyzing: 'Analyse en cours...',
    analyzingDesc: 'L\'IA traite les exercices de ton fichier',
    aiDraft: '✨ L\'IA a analysé le fichier et créé un brouillon avec',
    exercises: 'exercices',
    warnings: '⚠️ Avertissements :',
    rest: 'Repos',
    groups: 'Muscles',
    saving: 'Enregistrement...',
    imported: 'Plan importé avec succès !',
    importedDesc: 'Les exercices ont été ajoutés à ton plan hebdomadaire',
    cancel: 'Annuler',
    analyze: 'Analyser le Fichier',
    confirm: 'Confirmer et Enregistrer',
    selectFile: 'Sélectionne d\'abord un fichier',
    assignDay: 'Assigner au Jour',
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  },
};

const dayTranslations = {
  it: { monday: 'Lunedì', tuesday: 'Martedì', wednesday: 'Mercoledì', thursday: 'Giovedì', friday: 'Venerdì', saturday: 'Sabato', sunday: 'Domenica' },
  en: { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' },
  es: { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' },
  pt: { monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo' },
  de: { monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch', thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag' },
  fr: { monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche' },
};

export default function ImportWorkoutPlanModal({ isOpen, onClose, user, onWorkoutImported }) {
  const { language } = useLanguage();
  const tx = i18n[language] || i18n.it;

  const [step, setStep] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setError(tx.selectFile);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStep('analyzing');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedFile });

      const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
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
                  muscle_groups: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      });

      if (extractedData.status !== 'success' || !extractedData.output) {
        throw new Error(extractedData.details || 'Extraction error');
      }

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these exercises extracted from a file and structure them correctly:
        
${JSON.stringify(extractedData.output.exercises, null, 2)}

For each exercise ensure it has:
- name: exercise name
- sets: number of sets
- reps: number of reps (as string, e.g.: "10-12 reps")
- rest: rest time (as string, e.g.: "60 seconds")
- muscle_groups: array of muscle groups

Validate that exercises are reasonable and fix obvious errors (e.g.: negative reps, sets = 0).
Return a structured and validated array of exercises.`,
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
                  muscle_groups: { type: 'array', items: { type: 'string' } },
                  difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] }
                },
                required: ['name', 'sets', 'reps', 'rest', 'muscle_groups']
              }
            },
            warnings: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['exercises']
        }
      });

      setAnalysisResult(aiResponse);
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
      await base44.functions.invoke('importWorkoutPlanFromAnalysis', {
        user_id: user?.id,
        exercises: analysisResult.exercises
      });

      setStep('success');
      setTimeout(() => {
        onWorkoutImported?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error saving workout plan:', err);
      setError(err.message || 'Save error');
      setStep('review');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tx.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{tx.description}</p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv,.json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-[#26847F] hover:text-[#1f6b66]">
                    {tx.clickToSelect}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2">{tx.fileFormats}</p>
              </div>

              {uploadedFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-800">{uploadedFile.name}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 text-[#26847F] animate-spin" />
              <p className="text-gray-700 font-medium">{tx.analyzing}</p>
              <p className="text-sm text-gray-500">{tx.analyzingDesc}</p>
            </div>
          )}

          {step === 'review' && analysisResult && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  {tx.aiDraft} {analysisResult.exercises.length} {tx.exercises}
                </p>
              </div>

              {analysisResult.warnings?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-900 mb-2">{tx.warnings}</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {analysisResult.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                <div className="space-y-2 p-4">
                  {analysisResult.exercises.map((ex, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-gray-900">{ex.name}</h4>
                        <span className="text-xs bg-[#26847F] text-white px-2 py-1 rounded">
                          {ex.sets}x{ex.reps}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {tx.rest}: {ex.rest} • {tx.groups}: {ex.muscle_groups?.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 text-[#26847F] animate-spin" />
              <p className="text-gray-700 font-medium">{tx.saving}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
              <p className="text-gray-700 font-medium">{tx.imported}</p>
              <p className="text-sm text-gray-500">{tx.importedDesc}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAnalyzing || isSaving || step === 'success'}
          >
            {tx.cancel}
          </Button>
          {step === 'upload' && (
            <Button
              onClick={handleAnalyze}
              disabled={!uploadedFile || isAnalyzing}
              className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tx.analyzing}
                </>
              ) : tx.analyze}
            </Button>
          )}
          {step === 'review' && (
            <Button
              onClick={handleConfirm}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tx.saving}
                </>
              ) : tx.confirm}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}