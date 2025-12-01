import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Languages, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react';

export default function AdminExerciseTranslations() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentExercise, setCurrentExercise] = useState('');
  const [stats, setStats] = useState({ total: 0, translated: 0, pending: 0 });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    const allExercises = await base44.entities.Exercise.list();
    setExercises(allExercises);
    
    const translated = allExercises.filter(e => e.name_translations && Object.keys(e.name_translations).length >= 5).length;
    setStats({
      total: allExercises.length,
      translated,
      pending: allExercises.length - translated
    });
    setLoading(false);
  };

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev.slice(-50), { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const translateExercise = async (exercise) => {
    const prompt = `Translate this exercise name to all these languages. The exercise is: "${exercise.name}"

Return ONLY a JSON object with translations for each language code:
- "it": Italian name (keep original if already Italian, or translate)
- "en": English name
- "es": Spanish name  
- "pt": Portuguese name
- "de": German name
- "fr": French name

Use the proper fitness/gym terminology for each language. If the exercise name is already in English (like "Squat", "Deadlift", "Bench Press"), keep it in English for all languages where that's the common term, but provide local alternatives where commonly used.

Examples:
- "Panca Piana" → {"it": "Panca Piana", "en": "Bench Press", "es": "Press de Banca", "pt": "Supino Reto", "de": "Bankdrücken", "fr": "Développé Couché"}
- "Squat" → {"it": "Squat", "en": "Squat", "es": "Sentadilla", "pt": "Agachamento", "de": "Kniebeuge", "fr": "Squat"}
- "Stacco da Terra" → {"it": "Stacco da Terra", "en": "Deadlift", "es": "Peso Muerto", "pt": "Levantamento Terra", "de": "Kreuzheben", "fr": "Soulevé de Terre"}

Return ONLY the JSON object, no explanation.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          it: { type: "string" },
          en: { type: "string" },
          es: { type: "string" },
          pt: { type: "string" },
          de: { type: "string" },
          fr: { type: "string" }
        },
        required: ["it", "en", "es", "pt", "de", "fr"]
      }
    });

    return result;
  };

  const startTranslation = async () => {
    setProcessing(true);
    setPaused(false);
    setLogs([]);
    
    const pendingExercises = exercises.filter(e => !e.name_translations || Object.keys(e.name_translations).length < 5);
    
    addLog(`Starting translation for ${pendingExercises.length} exercises...`, 'info');
    
    for (let i = 0; i < pendingExercises.length; i++) {
      if (paused) {
        addLog('Translation paused by user', 'warning');
        break;
      }
      
      const exercise = pendingExercises[i];
      setCurrentExercise(exercise.name);
      setProgress(Math.round((i / pendingExercises.length) * 100));
      
      try {
        addLog(`Translating: ${exercise.name}...`, 'info');
        const translations = await translateExercise(exercise);
        
        await base44.entities.Exercise.update(exercise.id, {
          name_translations: translations
        });
        
        addLog(`✓ ${exercise.name} → EN: ${translations.en}, ES: ${translations.es}`, 'success');
        
        // Update stats
        setStats(prev => ({
          ...prev,
          translated: prev.translated + 1,
          pending: prev.pending - 1
        }));
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        addLog(`✗ Error translating ${exercise.name}: ${error.message}`, 'error');
      }
    }
    
    setProgress(100);
    setCurrentExercise('');
    setProcessing(false);
    addLog('Translation completed!', 'success');
    loadExercises();
  };

  const pauseTranslation = () => {
    setPaused(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#26847F]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-6 h-6 text-[#26847F]" />
            Exercise Translations Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Exercises</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.translated}</div>
              <div className="text-sm text-gray-500">Translated</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>

          {processing && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Translating: <strong>{currentExercise}</strong>
                </span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex gap-3">
            {!processing ? (
              <Button 
                onClick={startTranslation}
                disabled={stats.pending === 0}
                className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Translation ({stats.pending} pending)
              </Button>
            ) : (
              <Button 
                onClick={pauseTranslation}
                variant="outline"
                className="border-amber-500 text-amber-600"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button 
              onClick={loadExercises}
              variant="outline"
              disabled={processing}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Translation Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Start translation to see progress.</div>
            ) : (
              logs.map((log, i) => (
                <div 
                  key={i} 
                  className={`py-1 ${
                    log.type === 'success' ? 'text-green-400' : 
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'warning' ? 'text-amber-400' : 
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">[{log.time}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercise List Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Exercises Preview (first 20)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {exercises.slice(0, 20).map(ex => (
              <div key={ex.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{ex.name}</span>
                  {ex.name_translations && (
                    <span className="text-xs text-gray-500 ml-2">
                      EN: {ex.name_translations.en} | ES: {ex.name_translations.es}
                    </span>
                  )}
                </div>
                {ex.name_translations && Object.keys(ex.name_translations).length >= 5 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}