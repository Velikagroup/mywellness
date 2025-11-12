import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle, Loader2, BrainCircuit, AlertCircle, Zap } from "lucide-react";

export default function AdminExerciseGenerator() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, remaining: 0 });
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          navigate(createPageUrl('Dashboard'));
          return;
        }
        setUser(currentUser);
        await checkProgress();
      } catch (error) {
        navigate(createPageUrl('Dashboard'));
      }
    };
    loadUser();
  }, [navigate]);

  const checkProgress = async () => {
    try {
      const exercises = await base44.entities.Exercise.list();
      const completed = exercises.filter(e => 
        e.detailed_description && e.form_tips && e.target_muscles
      ).length;
      const remaining = exercises.length - completed;
      
      setStats({
        total: exercises.length,
        completed,
        remaining
      });

      return { total: exercises.length, completed, remaining };
    } catch (error) {
      console.error('Error checking progress:', error);
      return null;
    }
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('it-IT');
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const generateAll = async () => {
    setIsGenerating(true);
    setLogs([]);
    addLog('🚀 Avvio generazione automatica di tutti i dettagli esercizi...', 'info');

    let batchNum = 0;
    let shouldContinue = true;

    while (shouldContinue) {
      batchNum++;
      setCurrentBatch(batchNum);
      
      addLog(`\n📦 BATCH ${batchNum} - Chiamata funzione in corso...`, 'info');

      try {
        const response = await base44.functions.invoke('generateExerciseDetails', {});
        const result = response.data || response;

        if (result.success) {
          addLog(`✅ Batch ${batchNum} completato: ${result.successful}/${result.total_exercises} esercizi`, 'success');
          
          if (result.errors > 0) {
            addLog(`⚠️ Errori in questo batch: ${result.errors}`, 'warning');
          }

          // Aggiorna le statistiche
          const progress = await checkProgress();
          
          if (progress && progress.remaining === 0) {
            addLog('\n🎉 COMPLETATO! Tutti gli esercizi hanno i dettagli!', 'success');
            shouldContinue = false;
          } else {
            addLog(`⏳ Ancora ${progress?.remaining || 0} esercizi da processare. Continuo...`, 'info');
            // Pausa di 2 secondi tra un batch e l'altro
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          addLog(`❌ Errore nel batch ${batchNum}: ${result.error || 'Errore sconosciuto'}`, 'error');
          shouldContinue = false;
        }
      } catch (error) {
        addLog(`❌ Errore chiamata funzione batch ${batchNum}: ${error.message}`, 'error');
        
        // Se è un timeout, proviamo a continuare comunque
        if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
          addLog('⚠️ Timeout rilevato, ma potrebbe aver processato alcuni esercizi. Verifico e continuo...', 'warning');
          const progress = await checkProgress();
          
          if (progress && progress.remaining > 0) {
            addLog(`Ancora ${progress.remaining} esercizi. Ritento...`, 'info');
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            shouldContinue = false;
          }
        } else {
          shouldContinue = false;
        }
      }

      // Limite di sicurezza: max 20 batch (dovrebbe essere più che sufficiente)
      if (batchNum >= 20) {
        addLog('⚠️ Raggiunto limite di 20 batch. Controlla manualmente se ci sono esercizi rimanenti.', 'warning');
        shouldContinue = false;
      }
    }

    setIsGenerating(false);
    await checkProgress();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  const progressPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧠 Generatore Dettagli Esercizi AI</h1>
          <p className="text-gray-600">Sistema automatico per generare descrizioni dettagliate, form tips e muscoli target</p>
        </div>

        {/* Statistiche */}
        <Card className="bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 border-2 border-[var(--brand-primary)]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[var(--brand-primary)]" />
              Stato Generazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Progresso Totale</p>
                  <p className="text-3xl font-black text-[var(--brand-primary)]">
                    {stats.completed}/{stats.total}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Completamento</p>
                  <p className="text-3xl font-black text-green-600">{progressPercentage}%</p>
                </div>
              </div>

              <Progress value={progressPercentage} className="h-3 [&>div]:bg-[var(--brand-primary)]" />

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-green-300">
                  <p className="text-xs text-gray-500 mb-1">Completati</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-orange-300">
                  <p className="text-xs text-gray-500 mb-1">Rimanenti</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.remaining}</p>
                </div>
              </div>

              {isGenerating && (
                <div className="bg-white rounded-lg p-3 border border-[var(--brand-primary)]/30">
                  <p className="text-sm font-semibold text-[var(--brand-primary)] mb-1">
                    <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                    Batch {currentBatch} in esecuzione...
                  </p>
                  <p className="text-xs text-gray-600">
                    Il sistema continuerà automaticamente fino al completamento
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controlli */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Controlli
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={generateAll}
                disabled={isGenerating || stats.remaining === 0}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generazione Automatica in Corso...
                  </>
                ) : stats.remaining === 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tutti Completati!
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4 mr-2" />
                    Avvia Generazione Automatica
                  </>
                )}
              </Button>

              <Button
                onClick={checkProgress}
                disabled={isGenerating}
                variant="outline"
              >
                🔄 Aggiorna Statistiche
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                <strong>Come funziona:</strong> Il sistema chiamerà la funzione ripetutamente in batch automatici fino al completamento di tutti i {stats.total} esercizi. Ogni batch processa gli esercizi mancanti e salta quelli già completati.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Log Console */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Log di Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">Nessun log. Avvia la generazione per vedere i dettagli...</p>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`mb-1 ${
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}