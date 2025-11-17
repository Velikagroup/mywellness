import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Camera, Sparkles, TrendingDown, Zap, Activity, Target, Calendar, Ruler, BarChart3 } from 'lucide-react';

const ANIMATION_DURATION = 90000;

const preloadImages = () => {
  const images = [
    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/8eb701ee9_ModelPre.png',
    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/3fb8677cc_ModelPost.png'
  ];
  
  images.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

export default function AppDemoFlow() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [dashboardScroll, setDashboardScroll] = useState(0);
  const [dietStep, setDietStep] = useState(0);
  const [mealPlanStep, setMealPlanStep] = useState(0);
  const [substituteStep, setSubstituteStep] = useState(0); // 0: popup normale, 1: click sostituisci, 2: zoom avocado

  useEffect(() => {
    preloadImages();
  }, []);

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
      const elapsed = (Date.now() - startTime) % ANIMATION_DURATION;
      const linearProgress = elapsed / ANIMATION_DURATION;
      
      const easedProgress = 1 - Math.pow(1 - linearProgress, 3);
      setProgress(easedProgress * 100);

      // Timing aggiustato - step 0 e 1 ridotti di 2s ciascuno
      if (elapsed < 2000) setStep(0); // Peso attuale - 2s
      else if (elapsed < 4000) setStep(1); // Peso target - 2s
      else if (elapsed < 8000) setStep(2); // Loading
      else if (elapsed < 15000) {
        setStep(3); // Dashboard - 7 secondi
        const scrollProgress = (elapsed - 11000) / 2000;
        setDashboardScroll(Math.max(0, Math.min(1, scrollProgress)));
      }
      else if (elapsed < 17000) setStep(4); // Genera piano - 2s (era 3s)
      else if (elapsed < 23000) {
        setStep(5); // Scelta dieta
        const dietElapsed = elapsed - 17000;
        if (dietElapsed < 1000) setDietStep(0);
        else if (dietElapsed < 2000) setDietStep(1);
        else if (dietElapsed < 5000) setDietStep(2);
        else setDietStep(3);
      }
      else if (elapsed < 29000) {
        setStep(6); // Piano Settimanale - 6s
        const planElapsed = elapsed - 23000;
        if (planElapsed < 2000) setMealPlanStep(0);
        else setMealPlanStep(1);
      }
      else if (elapsed < 35000) {
        setStep(7); // Popup ingredienti con sostituisci - 6s
        const subElapsed = elapsed - 29000;
        if (subElapsed < 2000) setSubstituteStep(0); // Mostra popup
        else if (subElapsed < 3000) setSubstituteStep(1); // Click sostituisci
        else setSubstituteStep(2); // Zoom avocado
      }
      else if (elapsed < 38000) setStep(8); // Scansiona
      else if (elapsed < 41000) setStep(9); // Aggiungi
      else if (elapsed < 44000) setStep(10); // Piano aggiornato
      else if (elapsed < 47000) setStep(11); // Lista spesa
      else if (elapsed < 50000) setStep(12); // Scan label
      else if (elapsed < 53000) setStep(13); // Health score
      else if (elapsed < 56000) setStep(14); // Colazione fatto
      else if (elapsed < 59000) setStep(15); // Scan pranzo
      else if (elapsed < 62000) setStep(16); // Rebalance
      else if (elapsed < 65000) setStep(17); // Workout quiz
      else if (elapsed < 68000) setStep(18); // Workout plan
      else if (elapsed < 71000) setStep(19); // Exercise detail
      else if (elapsed < 74000) setStep(20); // Modifica workout
      else if (elapsed < 77000) setStep(21); // New exercise
      else if (elapsed < 80000) setStep(22); // Body analysis
      else setStep(23); // Goal reached
    }, 50);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="w-full flex items-center justify-center px-4">
      <div className={`relative ${isDesktop ? 'max-w-[650px]' : 'max-w-[450px]'} w-full`} style={{ margin: '0 auto' }}>
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 15px rgba(38, 132, 127, 0.2); }
            50% { box-shadow: 0 0 25px rgba(38, 132, 127, 0.4); }
          }
        `}</style>

        <div className="relative" style={{ 
          aspectRatio: isDesktop ? '4/3' : '9/19.5', 
          maxHeight: isDesktop ? '490px' : '700px',
          margin: '0 auto'
        }}>
          <div 
            className="absolute bg-white overflow-hidden"
            style={{ 
              top: isDesktop ? 'calc(3.5% - 3px)' : '0.94%',
              left: '50%',
              width: isDesktop ? '610px' : '95.94%',
              height: isDesktop ? 'calc(92.5% + 10px)' : '98.12%',
              transform: isDesktop ? 'translateX(calc(-50% - 3px))' : 'translateX(-50%)',
              borderRadius: isDesktop ? '18px' : '44px',
              zIndex: 1
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 z-50">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="current-weight"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col justify-center ${!isDesktop ? 'pt-16' : 'p-6'} ${isDesktop ? '' : 'p-6'}`}
                >
                  <div className="text-center mb-6">
                    <div className="inline-block px-4 py-1.5 bg-purple-100 rounded-full mb-3">
                      <span className="text-sm font-semibold text-purple-700">Peso Attuale</span>
                    </div>
                    <h3 className="text-xl font-bold mb-6">Quanto pesi attualmente?</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-xl max-w-sm mx-auto">
                    <div className="text-center">
                      <div className="text-6xl font-black text-gray-900 mb-2">70</div>
                      <div className="text-gray-500 text-base">kg</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="target-weight"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col justify-center ${!isDesktop ? 'pt-16' : 'p-6'} ${isDesktop ? '' : 'p-6'}`}
                >
                  <div className="text-center mb-6">
                    <div className="inline-block px-4 py-1.5 bg-green-100 rounded-full mb-3">
                      <span className="text-sm font-semibold text-green-700">Peso Obiettivo</span>
                    </div>
                    <h3 className="text-xl font-bold mb-6">Qual è il tuo peso obiettivo?</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-xl max-w-sm mx-auto">
                    <div className="text-center">
                      <div className="text-6xl font-black text-[var(--brand-primary)] mb-2">65</div>
                      <div className="text-gray-500 text-base">kg</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 ${!isDesktop ? 'pt-16' : ''}`}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full mb-4"
                  />
                  <p className="text-base font-semibold text-gray-700">Analisi in corso...</p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden ${!isDesktop ? 'pt-14' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                >
                  <motion.div
                    animate={{ y: -dashboardScroll * 200 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="text-[10px] text-gray-500 mb-1">PESO INIZIALE</div>
                        <div className="text-2xl font-black text-gray-900">70<span className="text-sm font-normal ml-0.5">kg</span></div>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="text-[10px] text-gray-500 mb-1">PESO TARGET</div>
                        <div className="text-2xl font-black text-gray-900">65<span className="text-sm font-normal ml-0.5">kg</span></div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-3 shadow-sm border border-green-200">
                        <div className="text-[10px] text-gray-600 mb-1">DA PERDERE</div>
                        <div className="text-2xl font-black text-green-600">-5.0<span className="text-sm font-normal ml-0.5">kg</span></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-1 mb-2">
                          <BarChart3 className="w-4 h-4 text-[var(--brand-primary)]" />
                          <div className="text-[10px] font-bold text-gray-800">Traiettoria Massa</div>
                        </div>
                        <div className="relative h-24">
                          <svg viewBox="0 0 100 60" className="w-full h-full">
                            <line x1="0" y1="15" x2="100" y2="15" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                            <line x1="0" y1="30" x2="100" y2="30" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                            <line x1="0" y1="45" x2="100" y2="45" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                            
                            <motion.path
                              d="M 5,25 L 20,22 L 35,20 L 50,18 L 65,17 L 80,16 L 95,15"
                              fill="none"
                              stroke="#26847F"
                              strokeWidth="2"
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                            <circle cx="5" cy="25" r="2" fill="#26847F" />
                            <circle cx="20" cy="22" r="2" fill="#26847F" />
                            <circle cx="35" cy="20" r="2" fill="#26847F" />
                            <circle cx="50" cy="18" r="2" fill="#26847F" />
                            <circle cx="65" cy="17" r="2" fill="#26847F" />
                            <circle cx="80" cy="16" r="2" fill="#26847F" />
                            <circle cx="95" cy="15" r="2.5" fill="#26847F" />
                            
                            <line x1="0" y1="50" x2="100" y2="50" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                          </svg>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[9px]">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)]"></div>
                            <span className="text-gray-600">Peso attuale</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-0.5 bg-gray-400"></div>
                            <span className="text-gray-600">Target</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="text-[10px] font-bold text-gray-800 mb-2">Scomposizione Calorica</div>
                        <div className="flex items-center justify-center mb-2">
                          <div className="relative">
                            <svg className="w-24 h-24" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                              <motion.circle
                                cx="50"
                                cy="50"
                                r="35"
                                fill="none"
                                stroke="#26847F"
                                strokeWidth="12"
                                strokeDasharray="219.9"
                                initial={{ strokeDashoffset: 219.9 }}
                                animate={{ strokeDashoffset: 219.9 * (1 - 0.4) }}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                                transition={{ duration: 1.5, ease: "easeOut" }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black text-[var(--brand-primary)]">40%</span>
                              <span className="text-[8px] text-gray-500">completato</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 text-[9px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]"></div>
                              <span className="text-gray-600">Completato</span>
                            </div>
                            <span className="font-bold">30.800 kcal</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                              <span className="text-gray-600">Rimanente</span>
                            </div>
                            <span className="font-bold">46.200 kcal</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: dashboardScroll > 0 ? 1 : 0, 
                        y: dashboardScroll > 0 ? 0 : 20 
                      }}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 shadow-md border-2 border-green-200"
                    >
                      <div className="text-sm text-gray-600 mb-1 text-center font-semibold">Target Calorico Giornaliero</div>
                      <div className="text-center">
                        <span className="text-4xl font-black text-gray-900">2000</span>
                        <span className="text-lg font-semibold text-gray-700 ml-2">kcal</span>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: dashboardScroll > 0.4 ? 1 : 0, 
                        y: dashboardScroll > 0.4 ? 0 : 20 
                      }}
                      className="bg-white rounded-xl p-4 shadow-md border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-[var(--brand-primary)]" />
                        <span className="text-sm font-bold text-gray-800">Metabolismo Basale (BMR)</span>
                      </div>
                      <div className="text-3xl font-black text-gray-900">1500 <span className="text-base font-normal text-gray-500">kcal/giorno</span></div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: dashboardScroll > 0.7 ? 1 : 0, 
                        y: dashboardScroll > 0.7 ? 0 : 20 
                      }}
                      className="bg-white rounded-xl p-4 shadow-md border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-[var(--brand-primary)]" />
                        <span className="text-sm font-bold text-gray-800">Percentuale Massa Grassa</span>
                      </div>
                      <div className="text-3xl font-black text-gray-900">28.5 <span className="text-base font-normal text-gray-500">%</span></div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="genera-piano"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gray-50 flex flex-col justify-center ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                >
                  <motion.button
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [1, 0.95, 1] }}
                    transition={{ duration: 0.3, times: [0, 0.5, 1] }}
                    className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 text-white rounded-xl py-4 shadow-2xl relative overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 bg-white/20"
                    />
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-base font-bold">Genera Piano Nutrizionale</span>
                    </div>
                  </motion.button>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="dieta"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                >
                  <div className="text-center mb-4">
                    <div className="inline-block px-4 py-2 bg-purple-100 rounded-full mb-3">
                      <span className="text-sm font-semibold text-purple-700">Preferenze Alimentari</span>
                    </div>
                    <h3 className="text-xl font-bold">Che tipo di dieta preferisci?</h3>
                  </div>

                  {dietStep >= 1 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="bg-white rounded-2xl shadow-2xl max-w-sm mx-auto overflow-hidden"
                      style={{ maxHeight: '300px' }}
                    >
                      <motion.div
                        animate={{ 
                          y: dietStep >= 2 ? -120 : 0
                        }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="p-3 space-y-2"
                      >
                        {['Mediterranea', 'Keto', 'Vegetariana', 'Vegana', 'Low Carb', 'Paleo'].map((diet, i) => (
                          <motion.div
                            key={diet}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              dietStep >= 3 && i === 4 
                                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] scale-105' 
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold text-sm ${
                                dietStep >= 3 && i === 4 ? 'text-[var(--brand-primary)]' : 'text-gray-700'
                              }`}>
                                {diet}
                              </span>
                              {dietStep >= 3 && i === 4 && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Check className="w-5 h-5 text-[var(--brand-primary)]" />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 6 && (
                <motion.div
                  key="piano-creato"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gray-50 ${!isDesktop ? 'pt-16' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                >
                  <div className="mb-3">
                    <h3 className="text-base font-bold mb-2">Piano Settimanale</h3>
                    <div className="flex gap-1 overflow-x-auto pb-2">
                      {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, i) => (
                        <div
                          key={day}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            i === 0 
                              ? 'bg-[var(--brand-primary)] text-white' 
                              : 'bg-white text-gray-500 border border-gray-200'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-lg p-3 shadow-md border-2 border-[var(--brand-primary)]"
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src="https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=200&h=200&fit=crop"
                          alt="Pancakes"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900">Colazione</div>
                          <div className="text-xs text-gray-500">Pancakes Proteici</div>
                          <div className="text-xs text-[var(--brand-primary)] font-semibold mt-0.5">450 kcal</div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-lg p-3 shadow-md border-2 border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"
                          alt="Insalata"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900">Pranzo</div>
                          <div className="text-xs text-gray-500">Insalata Caesar</div>
                          <div className="text-xs text-gray-600 font-semibold mt-0.5">650 kcal</div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-lg p-3 shadow-md border-2 border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop"
                          alt="Salmone"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900">Cena</div>
                          <div className="text-xs text-gray-500">Salmone al Forno</div>
                          <div className="text-xs text-gray-600 font-semibold mt-0.5">700 kcal</div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {mealPlanStep >= 1 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center p-4"
                      style={{ backdropFilter: 'blur(4px)' }}
                    >
                      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90%] overflow-y-auto">
                        <img 
                          src="https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&h=400&fit=crop"
                          alt="Pancakes Proteici"
                          className="w-full h-40 object-cover"
                        />

                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">Pancakes Proteici</h3>
                          <p className="text-xs text-gray-500 mb-3">Colazione • Low Carb</p>

                          <div className="grid grid-cols-4 gap-2 mb-3">
                            <div className="bg-orange-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-600">Kcal</div>
                              <div className="text-lg font-black text-orange-700">450</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-600">Prot</div>
                              <div className="text-lg font-black text-blue-700">25g</div>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-600">Carb</div>
                              <div className="text-lg font-black text-amber-700">35g</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-600">Grass</div>
                              <div className="text-lg font-black text-red-700">12g</div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-sm font-bold text-gray-900 mb-1">Ingredienti</div>
                            <div className="space-y-1">
                              {['Farina d\'avena - 50g', 'Uova - 2x', 'Proteine in polvere - 30g', 'Mirtilli - 50g'].map((ing) => (
                                <div key={ing} className="flex items-center gap-2 text-xs text-gray-700">
                                  <div className="w-1 h-1 bg-[var(--brand-primary)] rounded-full"></div>
                                  {ing}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-bold text-gray-900 mb-1">Preparazione</div>
                            <div className="space-y-1">
                              {['Mescola farina e proteine', 'Aggiungi uova e mescola', 'Cuoci in padella 2-3 min per lato'].map((step, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                  <span className="text-[var(--brand-primary)] font-bold flex-shrink-0">{i + 1}.</span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 7 && (
                <motion.div
                  key="popup-colazione"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`absolute inset-0 bg-black/50 flex items-center justify-center ${!isDesktop ? 'pt-20' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                >
                  <div className="bg-white rounded-xl p-4 w-full">
                    <h3 className="text-base font-bold mb-3">Pancakes Proteici</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs">Farina d'avena</span>
                        <span className="text-xs font-semibold">50g</span>
                      </div>
                      
                      <motion.div
                        animate={{ 
                          borderColor: substituteStep === 0 ? ['#e5e7eb', '#26847F', '#e5e7eb'] : '#26847F',
                          scale: substituteStep === 1 ? [1, 0.95, 1] : 1
                        }}
                        transition={{ 
                          borderColor: { duration: 1, repeat: substituteStep === 0 ? Infinity : 0 },
                          scale: { duration: 0.3 }
                        }}
                        className="flex justify-between items-center p-2 bg-blue-50 rounded-lg border-2"
                      >
                        <span className="text-xs font-semibold text-[var(--brand-primary)]">Avocado</span>
                        <motion.button 
                          animate={substituteStep === 1 ? { scale: [1, 0.9, 1] } : {}}
                          transition={{ duration: 0.2 }}
                          className="text-xs bg-[var(--brand-primary)] text-white px-2 py-1 rounded-full"
                        >
                          Sostituisci
                        </motion.button>
                      </motion.div>
                      
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs">Miele</span>
                        <span className="text-xs font-semibold">10g</span>
                      </div>
                    </div>
                  </div>

                  {substituteStep >= 2 && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-white flex items-center justify-center"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-9xl mb-3"
                        >
                          🥑
                        </motion.div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                          <h4 className="font-bold text-base mb-2">Avocado</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white rounded-lg p-2">
                              <div className="text-gray-500">Calorie</div>
                              <div className="font-bold">160 kcal</div>
                            </div>
                            <div className="bg-white rounded-lg p-2">
                              <div className="text-gray-500">Grassi</div>
                              <div className="font-bold">15g</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 8 && (
                <motion.div
                  key="scansiona"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                  style={{
                    background: 'linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <div className="text-9xl">🥑</div>
                  </div>
                  
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="relative w-40 h-40 border-4 border-[var(--brand-primary)] rounded-xl z-10"
                  >
                    <Camera className="w-10 h-10 text-[var(--brand-primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <motion.div
                      animate={{ y: [0, 160] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)] shadow-[0_0_15px_rgba(38,132,127,0.8)]"
                    />
                  </motion.div>
                  <p className="text-gray-900 mt-6 text-sm font-semibold z-10">Scansione avocado...</p>
                </motion.div>
              )}

              {step === 9 && (
                <motion.div
                  key="aggiungi"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-white ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                >
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-3 border border-green-200">
                    <h4 className="font-bold text-sm mb-2">Avocado - Maturo (1x)</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Calorie</div>
                        <div className="font-bold">160 kcal</div>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Grassi</div>
                        <div className="font-bold">15g</div>
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

              {step === 10 && (
                <motion.div
                  key="piano-updated"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gray-50 ${!isDesktop ? 'pt-20' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
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
                          490
                        </motion.div>
                      </div>
                      <div className="bg-blue-50 rounded p-1.5">
                        <div className="text-gray-500">Proteine</div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-bold text-blue-700"
                        >
                          22g
                        </motion.div>
                      </div>
                      <div className="bg-orange-50 rounded p-1.5">
                        <div className="text-gray-500">Grassi</div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-bold text-orange-700"
                        >
                          18g
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

              {step === 11 && (
                <motion.div
                  key="lista-spesa"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className={`absolute inset-0 bg-gray-50 ${!isDesktop ? 'pt-20' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                >
                  <h3 className="text-base font-bold mb-3">Lista della Spesa</h3>
                  <div className="space-y-1.5">
                    {['Farina d\'avena - 200g', 'Avocado - 3x', 'Miele - 250g', 'Pomodori - 1kg'].map((item, i) => (
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

              {step === 12 && (
                <motion.div
                  key="scan-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center bg-white ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-4 opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-3 w-full max-w-xs transform rotate-2" style={{
                      background: 'linear-gradient(145deg, #ffffff 0%, #f3f3f3 100%)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)'
                    }}>
                      <div className="bg-white border border-gray-300 rounded p-2">
                        <div className="text-[8px] font-black mb-1.5 border-b-2 border-black pb-0.5">INFORMAZIONI NUTRIZIONALI</div>
                        <div className="space-y-0.5 text-[7px]">
                          <div className="flex justify-between border-b border-gray-400 py-0.5">
                            <span className="font-bold">Energia</span>
                            <span className="font-semibold">428 kJ / 102 kcal</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-300 py-0.5">
                            <span className="font-bold">Grassi</span>
                            <span>2.1g</span>
                          </div>
                          <div className="flex justify-between pl-2 text-gray-600 border-b border-gray-200 py-0.5">
                            <span className="text-[6px]">di cui acidi grassi saturi</span>
                            <span>0.6g</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-300 py-0.5">
                            <span className="font-bold">Carboidrati</span>
                            <span>14g</span>
                          </div>
                          <div className="flex justify-between pl-2 text-gray-600 border-b border-gray-200 py-0.5">
                            <span className="text-[6px]">di cui zuccheri</span>
                            <span>7.8g</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-300 py-0.5">
                            <span className="font-bold">Fibre</span>
                            <span>1.2g</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-300 py-0.5">
                            <span className="font-bold">Proteine</span>
                            <span>4.8g</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="font-bold">Sale</span>
                            <span>0.28g</span>
                          </div>
                        </div>
                        <div className="mt-1 pt-1 border-t border-gray-300 text-[6px] text-gray-500">
                          <p>*Valori medi per 100g di prodotto</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-56 h-32 bg-white/10 backdrop-blur-sm rounded-lg border-4 border-[var(--brand-primary)] z-10">
                    <motion.div
                      animate={{ y: [0, 128] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)] shadow-[0_0_12px_rgba(38,132,127,1)]"
                    />
                  </div>
                  <p className="text-gray-900 mt-4 text-sm font-semibold z-10">Scansione etichetta...</p>
                </motion.div>
              )}

              {step === 13 && (
                <motion.div
                  key="health-score"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col justify-center ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
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

              {step === 14 && (
                <motion.div
                  key="colazione-fatto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gray-50 ${!isDesktop ? 'pt-20' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
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
                        <div className="text-xs text-gray-500">Pancakes Proteici • 490 kcal</div>
                      </div>
                    </div>
                  </motion.div>
                  <div className="bg-white rounded-lg p-3 shadow-sm opacity-60">
                    <div className="text-xs text-gray-600">Pranzo • 650 kcal</div>
                  </div>
                </motion.div>
              )}

              {step === 15 && (
                <motion.div
                  key="scan-pranzo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600"
                >
                  <motion.div
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full h-full relative flex items-center justify-center"
                  >
                    <div className="text-white text-center">
                      <Camera className="w-12 h-12 mx-auto mb-3" />
                      <p className="text-base font-bold">Analisi AI in corso...</p>
                      <p className="text-xs mt-1">Insalata Caesar rilevata</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {step === 16 && (
                <motion.div
                  key="rebalance"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  className={`absolute inset-0 bg-black/70 flex items-center justify-center ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
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

              {step === 17 && (
                <motion.div
                  key="workout-quiz"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
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

              {step === 18 && (
                <motion.div
                  key="workout-plan"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gray-50 ${!isDesktop ? 'pt-20' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
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

              {step === 19 && (
                <motion.div
                  key="exercise-detail"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`absolute inset-0 bg-white ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
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

              {step === 20 && (
                <motion.div
                  key="modifica-workout"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  className={`absolute inset-0 bg-black/80 flex items-center justify-center ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
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

              {step === 21 && (
                <motion.div
                  key="new-exercise"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className={`absolute inset-0 bg-white ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
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
                    <p className="text-xs text-gray-600">Piega il busto in avanti, mantieni la schiena dritta, porta il bilanciere verso l'ombilico...</p>
                  </div>
                </motion.div>
              )}

              {step === 22 && (
                <motion.div
                  key="body-analysis"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 ${!isDesktop ? 'pt-20 pb-4' : 'p-4'} ${isDesktop ? '' : 'px-3'}`}
                >
                  <h3 className="text-sm font-bold mb-2 text-center">Analisi Progressi</h3>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white rounded-lg p-1.5 overflow-hidden">
                      <div className="text-[9px] text-gray-500 mb-1 text-center">Prima</div>
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/8eb701ee9_ModelPre.png"
                        alt="Before"
                        className="w-full aspect-square object-cover rounded-lg"
                        loading="eager"
                        fetchpriority="high"
                      />
                    </div>
                    <div className="bg-white rounded-lg p-1.5 overflow-hidden">
                      <div className="text-[9px] text-gray-500 mb-1 text-center">Dopo</div>
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/3fb8677cc_ModelPost.png"
                        alt="After"
                        className="w-full aspect-square object-cover rounded-lg"
                        loading="eager"
                        fetchpriority="high"
                      />
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

              {step === 23 && (
                <motion.div
                  key="goal-reached"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-2xl font-black text-white text-center mb-1">Obiettivo Raggiunto!</h2>
                  <p className="text-white text-center text-sm">65kg • -5kg in 12 settimane</p>
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

          {isDesktop ? (
            <svg 
              viewBox="0 0 820 615" 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ left: '-3px', zIndex: 2 }}
            >
              <defs>
                <linearGradient id="frameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1a1a1a" />
                  <stop offset="50%" stopColor="#2a2a2a" />
                  <stop offset="100%" stopColor="#1a1a1a" />
                </linearGradient>
                <filter id="frameShadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                  <feOffset dx="0" dy="3" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.5"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <mask id="screenMask">
                  <rect x="0" y="0" width="820" height="615" fill="white"/>
                  <rect x="29" y="18" width="762" height="579" rx="18" ry="18" fill="black"/>
                </mask>
              </defs>
              
              <rect 
                x="2" y="2" 
                width="816" height="611" 
                rx="32" ry="32"
                fill="url(#frameGradient)"
                stroke="#0a0a0a"
                strokeWidth="1"
                filter="url(#frameShadow)"
                mask="url(#screenMask)"
              />
              
              <circle cx="410" cy="9" r="3" fill="#0a0a0a" opacity="0.9"/>
              
              <rect 
                x="29" y="18" 
                width="762" height="2" 
                rx="1" ry="1"
                fill="white"
                opacity="0.1"
              />
            </svg>
          ) : (
            <svg 
              viewBox="0 0 393 852" 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 2 }}
            >
              <defs>
                <filter id="phoneShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                  <feOffset dx="0" dy="2" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <rect 
                x="5" y="5" 
                width="383" height="842" 
                rx="55" ry="55"
                fill="none"
                stroke="#000000"
                strokeWidth="4"
                filter="url(#phoneShadow)"
              />
              
              <rect 
                x="8" y="8" 
                width="377" height="836" 
                rx="52" ry="52"
                fill="none"
                stroke="#000000"
                strokeWidth="1"
              />
              
              <rect 
                x="136" y="26" 
                width="121" height="37" 
                rx="18.5" ry="18.5"
                fill="#000000"
              />
              
              <rect x="0" y="175" width="4" height="35" rx="2" fill="#000000"/>
              <rect x="0" y="235" width="4" height="58" rx="2" fill="#000000"/>
              <rect x="0" y="310" width="4" height="58" rx="2" fill="#000000"/>
              <rect x="389" y="240" width="4" height="88" rx="2" fill="#000000"/>
              
              <rect x="185" y="842" width="23" height="5" rx="2.5" fill="#000000"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}