import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../i18n/LanguageContext';
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ImportWorkoutPlanModal({ isOpen, onClose, user, onWorkoutImported }) {
  const { t } = useLanguage();
  const [step, setStep] = useState('upload'); // upload, analyzing, review, saving
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
      setError(t('workouts.importSelectFile') || 'Seleziona un file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStep('analyzing');

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedFile });

      // Extract data from file
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
        throw new Error(extractedData.details || 'Errore durante l\'estrazione dei dati');
      }

      // Call AI to structure and validate exercises
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analizza questi esercizi estratti da un file e strutturali correttamente:
        
${JSON.stringify(extractedData.output.exercises, null, 2)}

Per ogni esercizio, assicurati che abbia:
- name: nome dell'esercizio
- sets: numero di serie
- reps: numero di ripetizioni (come stringa, es: "10-12 ripetizioni")
- rest: tempo di riposo (come stringa, es: "60 secondi")
- muscle_groups: array di gruppi muscolari

Valida che gli esercizi siano ragionevoli e correggi eventuali errori evidenti (es: reps negative, sets = 0).
Ritorna un array di esercizi strutturato e validato.`,
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
              items: { type: 'string' },
              description: 'Avvisi su esercizi che potrebbero necessitare revisione'
            }
          },
          required: ['exercises']
        }
      });

      setAnalysisResult(aiResponse);
      setStep('review');
    } catch (err) {
      console.error('Error analyzing file:', err);
      setError(err.message || 'Errore durante l\'analisi del file');
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
      // Call backend function to save exercises to workout plans
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
      setError(err.message || 'Errore durante il salvataggio del piano');
      setStep('review');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('workouts.importPlan') || 'Importa Piano di Allenamento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Carica un file PDF o Excel con i tuoi esercizi. L'AI analizzerà il file e creerà una bozza precompilata.
              </p>

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
                    Clicca per selezionare un file
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2">PDF, Excel, CSV o JSON</p>
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

          {/* Step 2: Analyzing */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 text-[#26847F] animate-spin" />
              <p className="text-gray-700 font-medium">Analizzando il file...</p>
              <p className="text-sm text-gray-500">L'AI sta elaborando gli esercizi dal tuo file</p>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && analysisResult && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ✨ L'AI ha analizzato il file e creato una bozza di {analysisResult.exercises.length} esercizi
                </p>
              </div>

              {analysisResult.warnings?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-900 mb-2">⚠️ Avvisi:</p>
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
                        Riposo: {ex.rest} • Gruppi: {ex.muscle_groups?.join(', ')}
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

          {/* Step 4: Saving */}
          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 text-[#26847F] animate-spin" />
              <p className="text-gray-700 font-medium">Salvataggio in corso...</p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
              <p className="text-gray-700 font-medium">Piano di allenamento importato!</p>
              <p className="text-sm text-gray-500">Gli esercizi sono stati aggiunti al tuo piano settimanale</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAnalyzing || isSaving || step === 'success'}
          >
            Annulla
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
                  Analizzando...
                </>
              ) : (
                'Analizza File'
              )}
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
                  Salvataggio...
                </>
              ) : (
                'Conferma e Salva'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}