import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Camera, Sparkles, TrendingDown, Zap, Activity, Target } from 'lucide-react';

const ANIMATION_DURATION = 45000; // 45 secondi totali

export default function AppDemoFlow() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / ANIMATION_DURATION) * 100, 100);
      setProgress(newProgress);

      // Trigger step changes based on time (distributed over 45 seconds)
      if (elapsed < 2500) setStep(0);
      else if (elapsed < 4500) setStep(1);
      else if (elapsed < 6000) setStep(2);
      else if (elapsed < 8500) setStep(3);
      else if (elapsed < 10500) setStep(4);
      else if (elapsed < 12500) setStep(5);
      else if (elapsed < 14500) setStep(6);
      else if (elapsed < 16500) setStep(7);
      else if (elapsed < 18500) setStep(8);
      else if (elapsed < 20500) setStep(9);
      else if (elapsed < 22500) setStep(10);
      else if (elapsed < 24500) setStep(11);
      else if (elapsed < 26500) setStep(12);
      else if (elapsed < 28500) setStep(13);
      else if (elapsed < 30500) setStep(14);
      else if (elapsed < 32000) setStep(15);
      else if (elapsed < 33500) setStep(16);
      else if (elapsed < 35000) setStep(17);
      else if (elapsed < 36500) setStep(18);
      else if (elapsed < 38000) setStep(19);
      else if (elapsed < 39500) setStep(20);
      else if (elapsed < 41000) setStep(21);
      else if (elapsed < 42000) setStep(22);
      else if (elapsed < 43000) setStep(23);
      else if (elapsed < 44000) setStep(24);
      else if (elapsed < 44500) setStep(25);
      else if (elapsed < 45000) setStep(26);
      
      if (elapsed >= ANIMATION_DURATION) {
        clearInterval(progressInterval);
        setTimeout(() => {
          setStep(0);
          setProgress(0);
        }, 500);
      }
    }, 50);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className={`relative w-full mx-auto ${isDesktop ? 'max-w-[600px]' : 'max-w-[280px]'}`}>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(38, 132, 127, 0.2); }
          50% { box-shadow: 0 0 25px rgba(38, 132, 127, 0.4); }
        }
      `}</style>

      {/* Progress bar */}
      <div className="mb-2 h-1 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Main demo container with device frame */}
      <div className="relative">
        {/* Device frame overlay */}
        <img 
          src={isDesktop 
            ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/663f4143c_Ipadtrasparent.png"
            : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/deeb4c0ac_vecteezy_white-smartphone-mockup-blank-screen-isolated-on-transparent_42538623.png"
          }
          alt="Device Frame"
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{ 
            aspectRatio: isDesktop ? '4/3' : '9/16',
            maxHeight: isDesktop ? '500px' : '420px'
          }}
        />

        {/* Content container */}
        <div 
          className="relative bg-white overflow-hidden shadow-xl"
          style={{ 
            aspectRatio: isDesktop ? '4/3' : '9/16',
            maxHeight: isDesktop ? '500px' : '420px',
            borderRadius: isDesktop ? '40px' : '45px',
            margin: isDesktop ? '32px' : '12px'
          }}
        >
          <AnimatePresence mode="wait">
            {/* Step 0-1: Quiz Steps */}
            {(step === 0 || step === 1) && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="absolute inset-0 p-4 bg-gradient-to-br from-blue-50 to-purple-50"
              >
                <div className="text-center mb-4">
                  <div className="w-12 h-0.5 bg-gray-300 rounded-full mx-auto mb-4" />
                  <div className="inline-block px-3 py-1 bg-purple-100 rounded-full mb-2">
                    <span className="text-xs font-semibold text-purple-700">Step {step + 1}/3</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{step === 0 ? 'Peso Attuale?' : 'Peso Obiettivo?'}</h3>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="text-center mb-3">
                    <div className="text-4xl font-black text-gray-900">{step === 0 ? '80' : '73'}</div>
                    <div className="text-gray-500 text-sm mt-1">kg</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="w-10 h-10 bg-[var(--brand-primary)] rounded-full flex items-center justify-center"
                    >
                      <ArrowRight className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Loading */}
            {step === 2 && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full mb-3"
                />
                <p className="text-sm font-semibold text-gray-700">Analisi in corso...</p>
              </motion.div>
            )}

            {/* Step 3: Dashboard */}
            {step === 3 && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-3 bg-gray-50 overflow-hidden"
              >
                <div className="mb-3">
                  <h2 className="text-base font-bold text-gray-900">Dashboard</h2>
                </div>
                <div className="space-y-2">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Peso Iniziale</span>
                      <span className="text-lg font-bold">80.0 kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Peso Target</span>
                      <span className="text-lg font-bold text-[var(--brand-primary)]">73.0 kg</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 shadow-sm border border-green-200">
                    <div className="text-xs text-gray-600 mb-0.5">Target Calorico</div>
                    <div className="text-2xl font-black text-gray-900">2000 <span className="text-sm">kcal</span></div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Zoom Stats */}
            {step === 4 && (
              <motion.div
                key="zoom-stats"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4"
              >
                <div className="bg-white rounded-xl p-4 shadow-2xl w-full">
                  <div className="text-center space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Target Calorico</div>
                      <div className="text-3xl font-black text-gray-900">2000 <span className="text-base">kcal</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">BMR</div>
                      <div className="text-2xl font-bold text-[var(--brand-primary)]">1650 <span className="text-sm">kcal</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Massa Grassa</div>
                      <div className="text-2xl font-bold text-orange-600">24.5 <span className="text-sm">%</span></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Genera Piano */}
            {step === 5 && (
              <motion.div
                key="genera-piano"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-4 bg-gray-50 flex flex-col justify-center"
              >
                <motion.button
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 text-white rounded-xl py-4 shadow-2xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-base font-bold">Genera Piano Nutrizionale</span>
                  </div>
                </motion.button>
              </motion.div>
            )}

            {/* Step 6: Scelta Dieta */}
            {step === 6 && (
              <motion.div
                key="dieta"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-3 bg-white overflow-auto"
              >
                <h3 className="text-sm font-bold mb-2">Scegli Dieta</h3>
                <div className="space-y-1.5">
                  {['Mediterranea', 'Keto', 'Vegetariana', 'Vegana', 'Low Carb', 'Paleo', 'DASH', 'Flexitariana'].map((diet, i) => (
                    <motion.div
                      key={diet}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-2.5 rounded-lg border-2 ${i === 4 ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]' : 'border-gray-200'}`}
                    >
                      <span className={`font-semibold text-xs ${i === 4 ? 'text-[var(--brand-primary)]' : 'text-gray-700'}`}>{diet}</span>
                      {i === 4 && <Check className="w-4 h-4 text-[var(--brand-primary)] inline ml-1" />}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 7: Piano Creato */}
            {step === 7 && (
              <motion.div
                key="piano-creato"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-3 bg-gray-50"
              >
                <div className="mb-3 flex justify-between items-center">
                  <h3 className="text-base font-bold">Piano Settimanale</h3>
                  <span className="text-xs text-gray-500">Lunedì</span>
                </div>
                <div className="space-y-2">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="bg-white rounded-lg p-3 shadow-md border-2 border-[var(--brand-primary)]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg" />
                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-900">Colazione</div>
                        <div className="text-xs text-gray-500">Pancakes Proteici</div>
                        <div className="text-xs text-[var(--brand-primary)] font-semibold mt-0.5">450 kcal</div>
                      </div>
                    </div>
                  </motion.div>
                  <div className="bg-white rounded-lg p-3 shadow-sm opacity-60">
                    <div className="text-xs text-gray-600">Pranzo • 650 kcal</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm opacity-40">
                    <div className="text-xs text-gray-600">Cena • 700 kcal</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 8: Pop-up Colazione */}
            {step === 8 && (
              <motion.div
                key="popup-colazione"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center p-3"
              >
                <div className="bg-white rounded-xl p-4 w-full">
                  <h3 className="text-base font-bold mb-3">Pancakes Proteici</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-xs">Farina d'avena</span>
                      <span className="text-xs font-semibold">50g</span>
                    </div>
                    <motion.div
                      animate={{ borderColor: ['#e5e7eb', '#26847F', '#e5e7eb'] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="flex justify-between items-center p-2 bg-blue-50 rounded-lg border-2"
                    >
                      <span className="text-xs font-semibold text-[var(--brand-primary)]">Uova</span>
                      <button className="text-xs bg-[var(--brand-primary)] text-white px-2 py-1 rounded-full">Sostituisci</button>
                    </motion.div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-xs">Miele</span>
                      <span className="text-xs font-semibold">10g</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 9: Scansiona Ingrediente */}
            {step === 9 && (
              <motion.div
                key="scansiona"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="relative w-32 h-32 border-4 border-white rounded-xl"
                >
                  <Camera className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <motion.div
                    animate={{ y: [0, 128] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)] shadow-[0_0_15px_rgba(38,132,127,0.8)]"
                  />
                </motion.div>
                <p className="text-white mt-4 text-sm font-semibold">Scansione uova...</p>
              </motion.div>
            )}

            {/* Step 10: Aggiungi Ingrediente */}
            {step === 10 && (
              <motion.div
                key="aggiungi"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white p-4"
              >
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-3 border border-green-200">
                  <h4 className="font-bold text-sm mb-2">Uova - Grande (2x)</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2">
                      <div className="text-gray-500 text-xs">Calorie</div>
                      <div className="font-bold">140 kcal</div>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <div className="text-gray-500 text-xs">Proteine</div>
                      <div className="font-bold">12g</div>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg"
                >
                  Aggiungi e Sostituisci Macro
                </motion.button>
              </motion.div>
            )}

            {/* Step 11: Piano Aggiornato */}
            {step === 11 && (
              <motion.div
                key="piano-updated"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-3 bg-gray-50"
              >
                <motion.div
                  animate={{ borderColor: ['#10b981', '#26847F', '#10b981'] }}
                  transition={{ duration: 1.5, repeat: 2 }}
                  className="bg-white rounded-lg p-3 shadow-md border-4"
                >
                  <div className="font-bold text-sm mb-2">Pancakes Proteici - Aggiornato!</div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <div className="bg-green-50 rounded p-1.5">
                      <div className="text-gray-500">Kcal</div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-green-700"
                      >
                        470
                      </motion.div>
                    </div>
                    <div className="bg-blue-50 rounded p-1.5">
                      <div className="text-gray-500">Proteine</div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-blue-700"
                      >
                        25g
                      </motion.div>
                    </div>
                    <div className="bg-orange-50 rounded p-1.5">
                      <div className="text-gray-500">Grassi</div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-orange-700"
                      >
                        12g
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="w-full mt-3 bg-blue-500 text-white py-2.5 rounded-lg text-xs font-semibold"
                >
                  + Aggiungi alla Lista Spesa
                </motion.button>
              </motion.div>
            )}

            {/* Step 12: Lista Spesa */}
            {step === 12 && (
              <motion.div
                key="lista-spesa"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="absolute inset-0 p-3 bg-gray-50"
              >
                <h3 className="text-base font-bold mb-3">Lista della Spesa</h3>
                <div className="space-y-1.5">
                  {['Farina d\'avena - 200g', 'Uova - 12x', 'Miele - 250g', 'Pomodori - 1kg'].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm"
                    >
                      <motion.div
                        animate={i < 3 ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${i < 3 ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]' : 'border-gray-300'}`}
                      >
                        {i < 3 && <Check className="w-3 h-3 text-white" />}
                      </motion.div>
                      <span className={`flex-1 text-xs ${i < 3 ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 13: Scansiona Etichetta */}
            {step === 13 && (
              <motion.div
                key="scan-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-4"
              >
                <div className="relative w-48 h-28 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/50">
                  <motion.div
                    animate={{ y: [0, 112] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)] shadow-[0_0_12px_rgba(38,132,127,1)]"
                  />
                </div>
                <p className="text-white mt-3 text-sm font-semibold">Scansione etichetta...</p>
              </motion.div>
            )}

            {/* Step 14: Health Score */}
            {step === 14 && (
              <motion.div
                key="health-score"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute inset-0 p-4 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col justify-center"
              >
                <div className="bg-white rounded-2xl p-6 shadow-2xl text-center">
                  <div className="relative inline-block mb-3">
                    <svg className="w-24 h-24" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 * (1 - 0.82) }}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-black text-green-600">8.2</span>
                    </div>
                  </div>
                  <h4 className="text-base font-bold mb-1 text-green-700">Ottimo Health Score!</h4>
                  <p className="text-xs text-gray-600">Prodotto salutare per i tuoi obiettivi</p>
                </div>
              </motion.div>
            )}

            {/* Step 15: Colazione Fatto */}
            {step === 15 && (
              <motion.div
                key="colazione-fatto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-3 bg-gray-50"
              >
                <h3 className="text-sm font-bold mb-3">Pasti di Oggi</h3>
                <motion.div
                  animate={{ borderColor: ['#10b981', '#26847F'] }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-lg p-3 shadow-md border-2 mb-2"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <div className="font-bold text-xs">Colazione</div>
                      <div className="text-xs text-gray-500">Pancakes Proteici • 470 kcal</div>
                    </div>
                  </div>
                </motion.div>
                <div className="bg-white rounded-lg p-3 shadow-sm opacity-60">
                  <div className="text-xs text-gray-600">Pranzo • 650 kcal</div>
                </div>
              </motion.div>
            )}

            {/* Step 16: Scansiona Pranzo */}
            {step === 16 && (
              <motion.div
                key="scan-pranzo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900"
              >
                <motion.div
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full h-full relative bg-gradient-to-br from-green-400 to-emerald-600"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Camera className="w-12 h-12 mx-auto mb-3" />
                      <p className="text-base font-bold">Analisi AI in corso...</p>
                      <p className="text-xs mt-1">Insalata Caesar rilevata</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 17: Ribilanciamento */}
            {step === 17 && (
              <motion.div
                key="rebalance"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute inset-0 bg-black/70 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-xl p-4 max-w-sm">
                  <div className="text-center mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Zap className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="text-sm font-bold">Hai superato di 75 kcal!</h4>
                    <p className="text-xs text-gray-600 mt-1">Vuoi ribilanciare i pasti futuri?</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 border-2 border-gray-300 rounded-lg font-semibold text-xs text-gray-700">No</button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 py-2 bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 text-white rounded-lg font-semibold text-xs"
                    >
                      Sì, Ribilancia
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 18: Workout Quiz */}
            {step === 18 && (
              <motion.div
                key="workout-quiz"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="absolute inset-0 p-4 bg-gradient-to-br from-purple-50 to-pink-50"
              >
                <div className="text-center mb-4">
                  <div className="inline-block px-3 py-1 bg-purple-100 rounded-full mb-2">
                    <span className="text-xs font-semibold text-purple-700">Step 2/3</span>
                  </div>
                  <h3 className="text-base font-bold mb-3">Quanti giorni vuoi allenarti?</h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 4, 5, 6].map((days) => (
                      <motion.button
                        key={days}
                        whileHover={{ scale: 1.05 }}
                        className={`py-4 rounded-lg font-bold text-xl ${days === 4 ? 'bg-[var(--brand-primary)] text-white' : 'bg-white text-gray-700'}`}
                      >
                        {days}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 19: Piano Workout */}
            {step === 19 && (
              <motion.div
                key="workout-plan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-3 bg-gray-50"
              >
                <h3 className="text-base font-bold mb-3">Allenamento Lunedì</h3>
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="bg-white rounded-lg p-3 shadow-lg border-2 border-[var(--brand-primary)] mb-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg" />
                    <div className="flex-1">
                      <div className="font-bold text-sm">Shoulder Press</div>
                      <div className="text-xs text-gray-600">4x12 • Spalle</div>
                      <div className="text-xs text-[var(--brand-primary)] font-semibold mt-0.5">Clicca per dettagli</div>
                    </div>
                  </div>
                </motion.div>
                <div className="space-y-1.5 opacity-50">
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs">Panca Piana • 4x10</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs">Lat Machine • 3x12</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 20: Dettagli Esercizio */}
            {step === 20 && (
              <motion.div
                key="exercise-detail"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="absolute inset-0 p-4 bg-white"
              >
                <h3 className="text-base font-bold mb-3">Shoulder Press</h3>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-3 mb-3">
                  <div className="text-xs text-gray-600 mb-1">Muscolo Target</div>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1.2 }}
                    className="text-2xl font-black text-orange-600"
                  >
                    🦾 SPALLE
                  </motion.div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="text-xs font-semibold mb-1">Esecuzione:</div>
                  <p className="text-xs text-gray-600">Siediti con la schiena dritta, porta i manubri all'altezza delle spalle...</p>
                </div>
                <button className="w-full bg-yellow-500 text-white py-2.5 rounded-lg text-sm font-semibold">
                  Modifica Allenamento
                </button>
              </motion.div>
            )}

            {/* Step 21: Modifica Workout */}
            {step === 21 && (
              <motion.div
                key="modifica-workout"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute inset-0 bg-black/80 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-xl p-4 w-full">
                  <h4 className="font-bold text-sm mb-3">Problemi con l'esercizio?</h4>
                  <div className="bg-gray-100 rounded-lg p-2 mb-3">
                    <p className="text-xs text-gray-700">"Mi fa male la spalla"</p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3"
                  >
                    <div className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-800 text-xs mb-0.5">Allenamento Modificato!</div>
                        <p className="text-xs text-green-700">Ho sostituito gli esercizi per le spalle</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Step 22: Nuovo Esercizio */}
            {step === 22 && (
              <motion.div
                key="new-exercise"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="absolute inset-0 p-4 bg-white"
              >
                <h3 className="text-base font-bold mb-3">Rematore con Bilanciere</h3>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 mb-3">
                  <div className="text-xs text-gray-600 mb-1">Muscolo Target</div>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1.2 }}
                    className="text-2xl font-black text-blue-600"
                  >
                    💪 SCHIENA
                  </motion.div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold mb-1">Esecuzione:</div>
                  <p className="text-xs text-gray-600">Piega il busto in avanti, mantieni la schiena dritta, porta il bilanciere verso l'ombelico...</p>
                </div>
              </motion.div>
            )}

            {/* Step 23: Analisi Corpo */}
            {step === 23 && (
              <motion.div
                key="body-analysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-3 bg-gradient-to-br from-purple-50 to-pink-50"
              >
                <h3 className="text-sm font-bold mb-3">Analisi Progressi</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white rounded-lg p-1.5">
                    <div className="text-xs text-gray-500 mb-1">Prima</div>
                    <div className="aspect-square bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg" />
                  </div>
                  <div className="bg-white rounded-lg p-1.5">
                    <div className="text-xs text-gray-500 mb-1">Dopo</div>
                    <div className="aspect-square bg-gradient-to-br from-green-300 to-emerald-400 rounded-lg" />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Definizione Muscolare</span>
                    <span className="font-bold text-green-600">+18%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Riduzione Grasso</span>
                    <span className="font-bold text-green-600">-12%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Tono Pelle</span>
                    <span className="font-bold text-green-600">+15%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 24: Accetta Modifiche */}
            {step === 24 && (
              <motion.div
                key="accept-changes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-3 bg-gray-50 flex flex-col"
              >
                <h3 className="text-sm font-bold mb-3">Raccomandazioni AI</h3>
                <div className="flex-1 space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-semibold text-blue-900 text-xs mb-1">💊 Consigli Nutrizionali</div>
                    <p className="text-xs text-blue-700">Aumenta proteine del 15%</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-semibold text-purple-900 text-xs mb-1">🏋️ Modifiche Allenamento</div>
                    <p className="text-xs text-purple-700">Focus su core e stabilizzazione</p>
                  </div>
                </div>
                <div className="space-y-1.5 mt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2.5 rounded-lg font-semibold text-xs"
                  >
                    Accetta Consigli Nutrizionali
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-lg font-semibold text-xs"
                  >
                    Accetta Modifiche Allenamento
                  </motion.button>
                  <button className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 text-white py-3 rounded-lg font-bold text-xs">
                    Salva Analisi
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 25: Dashboard Finale */}
            {step === 25 && (
              <motion.div
                key="dashboard-final"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-3 bg-gray-50"
              >
                <h3 className="text-base font-bold mb-3">I Tuoi Progressi</h3>
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <svg className="w-full h-32" viewBox="0 0 300 150">
                    <motion.path
                      d="M 10,100 Q 75,90 150,60 T 290,20"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#26847F" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <text x="10" y="120" fontSize="12" fill="#6b7280">Inizio</text>
                    <text x="260" y="40" fontSize="12" fill="#26847F" fontWeight="bold">Oggi</text>
                  </svg>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <div className="text-lg font-black">80kg</div>
                      <div className="text-xs text-gray-500">Iniziale</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-[var(--brand-primary)]">75kg</div>
                      <div className="text-xs text-gray-500">Attuale</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-green-600">73kg</div>
                      <div className="text-xs text-gray-500">Target</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 26: Obiettivo Raggiunto */}
            {step === 26 && (
              <motion.div
                key="goal-reached"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-black text-white text-center mb-1">Obiettivo Raggiunto!</h2>
                <p className="text-white text-center text-sm">73kg • -7kg in 12 settimane</p>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-6 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
                >
                  <span className="text-white text-sm font-bold">MyWellness AI ✨</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}