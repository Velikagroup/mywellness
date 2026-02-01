import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Camera, Sparkles, TrendingDown, Zap, Activity, Target, Calendar, Ruler, BarChart3, Home as HomeIcon, Trees } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const ANIMATION_DURATION = 108000;

const preloadImages = () => {
  const images = [
    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/8eb701ee9_ModelPre.png',
    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/3fb8677cc_ModelPost.png',
    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/4eccf5fb3_IMG_8711.jpg',
    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png'
  ];

  images.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

export default function AppDemoFlow() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [dashboardScroll, setDashboardScroll] = useState(0);
  const [dietStep, setDietStep] = useState(0);
  const [mealPlanStep, setMealPlanStep] = useState(0);
  const [popupScrollStep, setPopupScrollStep] = useState(0);
  const [substituteStep, setSubstituteStep] = useState(0);
  const [shoppingListStep, setShoppingListStep] = useState(0);
  const [addToListClicked, setAddToListClicked] = useState(false);
  const [mealCheckStep, setMealCheckStep] = useState(0);
  const [lunchScanStep, setLunchScanStep] = useState(0);
  const [workoutDaySelection, setWorkoutDaySelection] = useState(0);
  const [workoutLocationSelected, setWorkoutLocationSelected] = useState(false);
  const [modifyWorkoutStep, setModifyWorkoutStep] = useState(0);
  const [modifyWorkoutButtonZoom, setModifyWorkoutButtonZoom] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [photoAnalysisScroll, setPhotoAnalysisScroll] = useState(0);
  const [photoAnalysisZoom, setPhotoAnalysisZoom] = useState(false);
  const popupRef = useRef(null);
  const analysisRef = useRef(null);

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
    if (popupScrollStep > 0 && popupRef.current) {
      popupRef.current.scrollTo({ top: 200, behavior: 'smooth' });
    }
  }, [popupScrollStep]);

  useEffect(() => {
    if (photoAnalysisScroll > 0 && analysisRef.current) {
      const maxScroll = analysisRef.current.scrollHeight - analysisRef.current.clientHeight;
      analysisRef.current.scrollTo({
        top: maxScroll * photoAnalysisScroll,
        behavior: 'smooth'
      });
    }
  }, [photoAnalysisScroll]);

  useEffect(() => {
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) % ANIMATION_DURATION;
      const linearProgress = elapsed / ANIMATION_DURATION;
      
      const easedProgress = 1 - Math.pow(1 - linearProgress, 3);
      setProgress(easedProgress * 100);

      if (elapsed < 2000) setStep(0);
      else if (elapsed < 4000) setStep(1);
      else if (elapsed < 8000) setStep(2);
      else if (elapsed < 15000) {
        setStep(3);
        const scrollProgress = (elapsed - 11000) / 2000;
        setDashboardScroll(Math.max(0, Math.min(1, scrollProgress)));
      }
      else if (elapsed < 17000) setStep(4);
      else if (elapsed < 23000) {
        setStep(5);
        const dietElapsed = elapsed - 17000;
        if (dietElapsed < 1000) setDietStep(0);
        else if (dietElapsed < 2000) setDietStep(1);
        else if (dietElapsed < 5000) setDietStep(2);
        else setDietStep(3);
      }
      else if (elapsed < 34000) {
        setStep(6);
        const planElapsed = elapsed - 23000;
        if (planElapsed < 2000) {
          setMealPlanStep(0);
          setSubstituteStep(0);
          setAddToListClicked(false);
          setPopupScrollStep(0);
        }
        else if (planElapsed < 3000) {
          setMealPlanStep(1);
          setSubstituteStep(0);
          setAddToListClicked(false);
          setPopupScrollStep(0);
        }
        else if (planElapsed < 4000) {
          setMealPlanStep(1);
          setSubstituteStep(0);
          setAddToListClicked(false);
          setPopupScrollStep(1);
        }
        else if (planElapsed < 6000) {
          setMealPlanStep(1);
          setSubstituteStep(1);
          setAddToListClicked(false);
          setPopupScrollStep(1);
        }
        else if (planElapsed < 6500) {
          setMealPlanStep(1);
          setSubstituteStep(2);
          setAddToListClicked(false);
          setPopupScrollStep(1);
        }
        else if (planElapsed < 8000) {
          setMealPlanStep(1);
          setSubstituteStep(3);
          setAddToListClicked(false);
          setPopupScrollStep(1);
        }
        else if (planElapsed < 9000) {
          setMealPlanStep(0);
          setSubstituteStep(0);
          setAddToListClicked(false);
          setPopupScrollStep(0);
        }
        else if (planElapsed < 9500) {
          setMealPlanStep(0);
          setSubstituteStep(0);
          setAddToListClicked(true);
          setPopupScrollStep(0);
        }
        else {
          setMealPlanStep(0);
          setSubstituteStep(0);
          setAddToListClicked(false);
          setPopupScrollStep(0);
        }
      }
      else if (elapsed < 44000) {
        setStep(7);
        const listElapsed = elapsed - 34000;
        if (listElapsed < 1500) setShoppingListStep(0);
        else if (listElapsed < 3000) setShoppingListStep(1);
        else if (listElapsed < 4500) setShoppingListStep(2);
        else if (listElapsed < 6500) setShoppingListStep(3);
        else setShoppingListStep(4);
      }
      else if (elapsed < 48000) setStep(8);
      else if (elapsed < 51000) setStep(9);
      else if (elapsed < 57000) {
        setStep(10);
        const updateElapsed = elapsed - 51000;
        if (updateElapsed < 3500) {
          setMealCheckStep(0);
          setLunchScanStep(0);
        }
        else if (updateElapsed < 4500) {
          setMealCheckStep(1);
          setLunchScanStep(0);
        }
        else if (updateElapsed < 5500) {
          setMealCheckStep(2);
          setLunchScanStep(0);
        }
        else {
          setMealCheckStep(2);
          setLunchScanStep(1);
        }
      }
      else if (elapsed < 60000) setStep(11);
      else if (elapsed < 66000) {
        setStep(12);
        const scanElapsed = elapsed - 60000;
        if (scanElapsed < 2000) setLunchScanStep(0);
        else if (scanElapsed < 4000) setLunchScanStep(1);
        else setLunchScanStep(2);
      }
      else if (elapsed < 69000) setStep(13);
      else if (elapsed < 75000) {
        setStep(14);
        const dayElapsed = elapsed - 69000;
        if (dayElapsed < 1000) setWorkoutDaySelection(0);
        else if (dayElapsed < 2000) setWorkoutDaySelection(1);
        else if (dayElapsed < 3000) setWorkoutDaySelection(2);
        else setWorkoutDaySelection(3);
      }
      else if (elapsed < 79000) {
        setStep(15);
        const locationElapsed = elapsed - 75000;
        if (locationElapsed < 2000) setWorkoutLocationSelected(false);
        else setWorkoutLocationSelected(true);
      }
      else if (elapsed < 88000) {
        setStep(16);
        const modifyElapsed = elapsed - 79000;
        if (modifyElapsed < 2000) {
          setModifyWorkoutStep(0);
          setModifyWorkoutButtonZoom(false);
          setTypingText('');
        }
        else if (modifyElapsed < 3000) {
          setModifyWorkoutStep(0);
          setModifyWorkoutButtonZoom(true);
          setTypingText('');
        }
        else if (modifyElapsed < 4500) {
          setModifyWorkoutStep(1);
          setModifyWorkoutButtonZoom(false);
          const typingProg = (modifyElapsed - 3000) / 1500;
          const fullText = 'Mi fa male la spalla';
          const charCount = Math.floor(typingProg * fullText.length);
          setTypingText(fullText.substring(0, charCount));
        }
        else if (modifyElapsed < 6500) {
          setModifyWorkoutStep(2);
          setModifyWorkoutButtonZoom(false);
          setTypingText('Mi fa male la spalla');
        }
        else {
          setModifyWorkoutStep(3);
          setModifyWorkoutButtonZoom(false);
          setTypingText('Mi fa male la spalla');
        }
      }
      else if (elapsed < 91000) setStep(17);
      else if (elapsed < 100000) {
        setStep(18);
        const analysisElapsed = elapsed - 91000;
        if (analysisElapsed < 2000) {
          setPhotoAnalysisScroll(Math.min(1, analysisElapsed / 2000));
          setPhotoAnalysisZoom(false);
        } else if (analysisElapsed < 7000) {
          setPhotoAnalysisScroll(1);
          setPhotoAnalysisZoom(false);
        } else {
          setPhotoAnalysisScroll(1);
          setPhotoAnalysisZoom(true);
        }
      }
      else if (elapsed < 103000) setStep(19);
      else if (elapsed < 105000) setStep(20);
      else setStep(21);
    }, 50);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="w-full flex items-center justify-center px-4">
      <div className="relative" style={{ 
        width: isDesktop ? '1024px' : '450px',
        height: isDesktop ? '775px' : '810px',
        minHeight: isDesktop ? '775px' : '810px',
        maxHeight: isDesktop ? '775px' : '810px',
        margin: '0 auto',
        maxWidth: '100%'
      }}>
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 15px rgba(38, 132, 127, 0.2); }
            50% { box-shadow: 0 0 25px rgba(38, 132, 127, 0.4); }
          }
        `}</style>

        <div className="relative w-full h-full" style={{ minHeight: isDesktop ? '775px' : '810px', maxHeight: isDesktop ? '775px' : '810px' }}>
          <div
            className="absolute bg-white"
            style={{
              top: isDesktop ? 'calc(3.5% - 3px)' : '1.5%',
              left: '50%',
              width: isDesktop ? '970px' : '96.5%',
              height: isDesktop ? '728px' : '720px',
              minHeight: isDesktop ? '728px' : '720px',
              maxHeight: isDesktop ? '728px' : '720px',
              transform: isDesktop ? 'translateX(calc(-50% - 3px))' : 'translateX(-50%)',
              borderRadius: isDesktop ? '18px' : '44px',
              zIndex: 1,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 10px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-200 z-50">
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
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <div className="text-center mb-6">
                    <div className="inline-block px-4 py-1.5 bg-purple-100 rounded-full mb-3">
                      <span className="text-sm font-semibold text-purple-700">{t('home.demoCurrentWeight')}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-6">{t('home.demoHowMuchWeight')}</h3>
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
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <div className="text-center mb-6">
                    <div className="inline-block px-4 py-1.5 bg-green-100 rounded-full mb-3">
                      <span className="text-sm font-semibold text-green-700">{t('home.demoTargetWeight')}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-6">{t('home.demoWhatTargetWeight')}</h3>
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
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full mb-4"
                  />
                  <p className="text-base font-semibold text-gray-700">{t('home.demoAnalyzing')}</p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden ${!isDesktop ? 'pt-14' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <motion.div
                    animate={{ y: -dashboardScroll * 200 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="text-[10px] text-gray-500 mb-1">{t('home.demoInitialWeight')}</div>
                        <div className="text-2xl font-black text-gray-900">70<span className="text-sm font-normal ml-0.5">kg</span></div>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="text-[10px] text-gray-500 mb-1">{t('home.demoTargetWeightCaps')}</div>
                        <div className="text-2xl font-black text-gray-900">65<span className="text-sm font-normal ml-0.5">kg</span></div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-3 shadow-sm border border-green-200">
                        <div className="text-[10px] text-gray-600 mb-1">{t('home.demoToLose')}</div>
                        <div className="text-2xl font-black text-green-600">-5.0<span className="text-sm font-normal ml-0.5">kg</span></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-1 mb-2">
                          <BarChart3 className="w-4 h-4 text-[var(--brand-primary)]" />
                          <div className="text-[10px] font-bold text-gray-800">{t('home.demoMassTrajectory')}</div>
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
                            <span className="text-gray-600">{t('home.demoCurrentWeightLower')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-0.5 bg-gray-400"></div>
                            <span className="text-gray-600">{t('home.demoTargetLower')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="text-[10px] font-bold text-gray-800 mb-2">{t('home.demoCalorieBreakdown')}</div>
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
                              <span className="text-[8px] text-gray-500">{t('home.demoCompleted')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 text-[9px]">
                          <div className="flex items-center justify-between">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]"></div>
                            <span className="text-gray-600">{t('home.demoCompletedLabel')}</span>
                            <span className="font-bold">30.800 kcal</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                            <span className="text-gray-600">{t('home.demoRemaining')}</span>
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
                      <div className="text-sm text-gray-600 mb-1 text-center font-semibold">{t('home.demoDailyCalorieTarget')}</div>
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
                        <span className="text-sm font-bold text-gray-800">{t('home.demoBasalMetabolism')}</span>
                      </div>
                      <div className="text-3xl font-black text-gray-900">1500 <span className="text-base font-normal text-gray-500">{t('home.demoKcalPerDay')}</span></div>
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
                        <span className="text-sm font-bold text-gray-800">{t('home.demoBodyFatPercentage')}</span>
                      </div>
                      <div className="text-3xl font-black text-gray-900">28.5 <span className="text-base font-normal text-gray-50">%</span></div>
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
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <motion.button
                    animate={{
                      scale: [1, 0.92, 1.02, 0.98, 1],
                      y: [0, 2, -1, 0, 0]
                    }}
                    transition={{
                      duration: 0.5,
                      times: [0, 0.3, 0.5, 0.7, 1],
                      ease: "easeOut"
                    }}
                    className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 text-white rounded-xl py-4 shadow-2xl relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ opacity: [0, 0.3, 0] }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-white"
                    />
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-base font-bold">{t('home.demoGenerateMealPlan')}</span>
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
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <div className="text-center mb-4">
                    <div className="inline-block px-4 py-2 bg-purple-100 rounded-full mb-3">
                      <span className="text-sm font-semibold text-purple-700">{t('home.demoDietPreferences')}</span>
                    </div>
                    <h3 className="text-xl font-bold">{t('home.demoWhatDietType')}</h3>
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
                        {[t('home.demoDietMediterranean'), t('home.demoDietKeto'), t('home.demoDietVegetarian'), t('home.demoDietVegan'), t('home.demoDietLowCarb'), t('home.demoDietPaleo')].map((diet, i) => (
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
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <div className="mb-3">
                    <h3 className="text-base font-bold mb-2">{t('home.demoWeeklyPlan')}</h3>
                    <div className="flex gap-1 overflow-x-auto pb-2">
                      {[t('home.demoMon'), t('home.demoTue'), t('home.demoWed'), t('home.demoThu'), t('home.demoFri'), t('home.demoSat'), t('home.demoSun')].map((day, i) => (
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
                          src="https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=200&h=200&fit=crop"
                          alt="Porridge"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900">{t('home.demoBreakfast')}</div>
                          <div className="text-xs text-gray-500">{t('home.demoProteicPorridge')}</div>
                          <div className="text-xs text-[var(--brand-primary)] font-semibold mt-0.5">420 kcal</div>
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
                          <div className="font-bold text-sm text-gray-900">{t('home.demoLunch')}</div>
                          <div className="text-xs text-gray-500">{t('home.demoCaesarSalad')}</div>
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
                          <div className="font-bold text-sm text-gray-900">{t('home.demoDinner')}</div>
                          <div className="text-xs text-gray-500">{t('home.demoBakedSalmon')}</div>
                          <div className="text-xs text-gray-600 font-semibold mt-0.5">700 kcal</div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {mealPlanStep === 0 && substituteStep === 0 && (
                    <motion.button
                      animate={addToListClicked ? { scale: [1, 0.92, 1.02, 0.98, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      className="w-full mt-3 bg-blue-500 text-white py-2.5 rounded-lg text-xs font-semibold shadow-md"
                    >
                      📋 {t('home.demoShoppingList')}
                    </motion.button>
                  )}

                  {mealPlanStep >= 1 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{
                        scale: mealPlanStep === 0 ? 0.8 : 1,
                        opacity: mealPlanStep === 0 ? 0 : 1
                      }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center p-4"
                      style={{ backdropFilter: 'blur(4px)', zIndex: 100 }}
                    >
                      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90%] overflow-y-auto" ref={popupRef}>
                        <img
                          src="https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=600&h=400&fit=crop"
                          alt="Porridge Proteico"
                          className="w-full h-40 object-cover"
                        />

                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{t('home.demoProteicPorridge')}</h3>
                          <p className="text-xs text-gray-500 mb-3">{t('home.demoBreakfast')} • Low Carb</p>

                          <div className="grid grid-cols-4 gap-2 mb-3">
                            <div className="bg-orange-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-600">Kcal</div>
                              <div className="text-lg font-black text-orange-700">420</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-600">Prot</div>
                              <div className="text-lg font-black text-blue-700">28g</div>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-600">Carb</div>
                              <div className="text-lg font-black text-amber-700">32g</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-600">Grass</div>
                              <div className="text-lg font-black text-red-700">10g</div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-sm font-bold text-gray-900 mb-2">{t('home.demoIngredients')}</div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-[var(--brand-primary)] rounded-full"></div>
                                  <span className="text-xs">{t('home.demoOatFlour')}</span>
                                </div>
                                <button className="text-xs text-gray-400 px-2 py-1 rounded-full border border-gray-300">
                                  {t('home.demoSubstitute')}
                                </button>
                              </div>

                              <motion.div
                                animate={{
                                  scale: substituteStep >= 1 ? 1.08 : 1,
                                  borderColor: substituteStep === 2 ? ['#26847F', '#10b981', '#26847F'] : (substituteStep >= 1 ? '#26847F' : '#e5e7eb')
                                }}
                                transition={{
                                  scale: { duration: 0.5 },
                                  borderColor: { duration: 0.3 }
                                }}
                                className={`flex justify-between items-center p-2 rounded-lg border-2 relative ${
                                  substituteStep >= 1 ? 'bg-blue-50' : 'bg-gray-50'
                                }`}
                                style={{
                                  zIndex: substituteStep >= 1 ? 1000 : 1,
                                  position: 'relative'
                                }}
                              >
                                {substituteStep < 3 ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-[var(--brand-primary)] rounded-full"></div>
                                      <span className={`text-xs ${substituteStep >= 1 ? 'font-semibold text-[var(--brand-primary)]' : ''}`}>{t('home.demoAvocadoItem')}</span>
                                    </div>
                                    <motion.button
                                      animate={substituteStep === 2 ? { scale: [1, 0.85, 1] } : {}}
                                      transition={{ duration: 0.3 }}
                                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                        substituteStep >= 1
                                          ? 'bg-[var(--brand-primary)] text-white'
                                          : 'text-gray-400 border border-gray-300'
                                      }`}
                                    >
                                      {t('home.demoSubstitute')}
                                    </motion.button>
                                  </>
                                ) : (
                                  <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-between items-center w-full"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                                      <span className="text-xs font-semibold text-green-700">{t('home.demoBananaItem')}</span>
                                    </div>
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                    >
                                      <Check className="w-4 h-4 text-green-600" />
                                    </motion.div>
                                  </motion.div>
                                )}
                              </motion.div>

                              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-[var(--brand-primary)] rounded-full"></div>
                                  <span className="text-xs">{t('home.demoProteinPowderItem')}</span>
                                </div>
                                <button className="text-xs text-gray-400 px-2 py-1 rounded-full border border-gray-300">
                                  {t('home.demoSubstitute')}
                                </button>
                              </div>

                              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-[var(--brand-primary)] rounded-full"></div>
                                  <span className="text-xs">{t('home.demoBlueberriesItem')}</span>
                                </div>
                                <button className="text-xs text-gray-400 px-2 py-1 rounded-full border border-gray-300">
                                  {t('home.demoSubstitute')}
                                </button>
                              </div>
                            </div>
                          </div>

                          {substituteStep >= 3 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-green-50 border border-green-200 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-semibold text-green-700">{t('home.demoIngredientSubstituted')}</span>
                              </div>
                            </motion.div>
                          )}

                          <div>
                            <div className="text-sm font-bold text-gray-900 mb-1">{t('home.demoPreparation')}</div>
                            <div className="space-y-1">
                              {[t('home.demoHeatMilk'), t('home.demoAddOatsProtein'), t('home.demoCook5to7'), t('home.demoGarnishBanana')].map((step, i) => (
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
                  key="lista-spesa"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className={`absolute inset-0 bg-gray-50 ${!isDesktop ? 'pt-20' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                  style={{ height: isDesktop ? '490px' : '800px', minHeight: isDesktop ? '490px' : '800px', maxHeight: isDesktop ? '490px' : '800px' }}
                >
                  <h3 className="text-base font-bold mb-3">{t('home.demoShoppingList')}</h3>
                  <div className="space-y-1.5">
                    {[`${t('home.demoOatmeal')} - 200g`, `${t('home.demoBlueberries')} - 350g`, `${t('home.demoBanana')} - 7x`, `${t('home.demoProteinPowder')} - 200g`].map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm ${
                          (shoppingListStep === 1 && i === 0) ||
                          (shoppingListStep === 2 && (i === 0 || i === 1)) ||
                          (shoppingListStep >= 3 && i === 2)
                            ? 'border-2 border-[var(--brand-primary)]'
                            : ''
                        }`}
                      >
                        <motion.div
                          animate={
                            (shoppingListStep >= 1 && i === 0) ||
                            (shoppingListStep >= 2 && i === 1)
                              ? { scale: [1, 1.2, 1] }
                              : {}
                          }
                          transition={{ duration: 0.3 }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            (shoppingListStep >= 1 && i === 0) ||
                            (shoppingListStep >= 2 && i === 1)
                              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]'
                              : 'border-gray-300'
                          }`}
                        >
                          {((shoppingListStep >= 1 && i === 0) ||
                            (shoppingListStep >= 2 && i === 1)) &&
                            <Check className="w-3 h-3 text-white" />
                          }
                        </motion.div>
                        <span className={`flex-1 text-xs ${
                          (shoppingListStep >= 1 && i === 0) ||
                          (shoppingListStep >= 2 && i === 1)
                            ? 'line-through text-gray-400'
                            : 'text-gray-700'
                        }`}>
                          {item}
                        </span>

                        {shoppingListStep >= 3 && i === 2 && (
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: shoppingListStep === 4 ? [1, 0.9, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                            className="text-xs bg-[var(--brand-primary)] text-white px-3 py-1 rounded-full font-semibold flex items-center gap-1"
                          >
                            <Camera className="w-3 h-3" />
                            {t('home.demoScan')}
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {shoppingListStep >= 4 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-white flex flex-col items-center justify-center"
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/4eccf5fb3_IMG_8711.jpg"
                          alt="Bananas"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="relative w-48 h-48 border-4 border-[var(--brand-primary)] rounded-2xl z-10 bg-white/50 backdrop-blur-sm overflow-hidden"
                      >
                        <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/4eccf5fb3_IMG_8711.jpg"
                          alt="Bananas"
                          className="w-full h-full object-cover"
                        />
                        <Camera className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
                        <motion.div
                          animate={{ y: [0, 192] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute top-0 left-0 right-0 h-1 bg-[var(--brand-primary)] shadow-[0_0_15px_rgba(38,132,127,0.8)]"
                        />
                      </motion.div>
                      <p className="text-gray-900 mt-6 text-sm font-semibold z-10">{t('home.demoScanningBanana')}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 8 && (
                <motion.div
                  key="health-score-banana"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-yellow-50 to-amber-50 flex flex-col justify-center ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <div className="bg-white rounded-2xl p-6 shadow-2xl text-center max-w-sm mx-auto">
                    <div className="text-6xl mb-3">🍌</div>
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
                          animate={{ strokeDashoffset: 251.2 * (1 - 0.85) }}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-black text-green-600">8.5</span>
                      </div>
                    </div>
                    <h4 className="text-base font-bold mb-2 text-green-700">{t('home.demoGreatChoice')}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {t('home.demoBananaDesc')}
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 9 && (
                <motion.div
                  key="aggiungi-banana"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-white ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                  style={{ height: isDesktop ? '490px' : '800px', minHeight: isDesktop ? '490px' : '800px', maxHeight: isDesktop ? '490px' : '800px' }}
                >
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 mb-3 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-4xl">🍌</div>
                      <div>
                        <h4 className="font-bold text-sm">{t('home.demoBananaMature')}</h4>
                        <p className="text-xs text-gray-600">{t('home.demoReplaces')}: {t('home.demoAvocado')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-gray-500 text-xs">{t('home.demoCalories')}</div>
                        <div className="font-bold">105 kcal</div>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-gray-500 text-xs">{t('home.demoCarbs')}</div>
                        <div className="font-bold">27g</div>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg"
                  >
                    {t('home.demoAddAndReplaceMacro')}
                  </motion.button>
                </motion.div>
              )}

              {step === 10 && (
                <motion.div
                  key="piano-updated"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 ${!isDesktop ? 'pt-16' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                  style={{ height: isDesktop ? '490px' : '800px', minHeight: isDesktop ? '490px' : '800px', maxHeight: isDesktop ? '490px' : '800px' }}
                >
                  {mealCheckStep === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 absolute inset-0 flex flex-col justify-center px-4"
                    >
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="bg-white rounded-2xl p-6 shadow-2xl max-w-md mx-auto w-full"
                      >
                        <div className="flex items-center justify-center mb-3">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: 2 }}
                            className="text-4xl"
                          >
                            ✅
                          </motion.div>
                        </div>

                        <h3 className="text-xl font-black text-center text-gray-900 mb-2">{t('home.demoMealUpdated')}</h3>
                        <p className="text-sm text-center text-gray-600 mb-4">{t('home.demoProteicPorridgeBanana')}</p>

                        <motion.div
                          animate={{ borderColor: ['#10b981', '#26847F', '#10b981'] }}
                          transition={{ duration: 1.5, repeat: 2 }}
                          className="border-4 rounded-xl p-4 mb-4"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 text-center">
                              <div className="text-xs text-gray-600 mb-1">{t('home.demoCalories')}</div>
                              <motion.div
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-3xl font-black text-orange-700"
                              >
                                445
                              </motion.div>
                              <div className="text-xs text-gray-500 mt-0.5">kcal</div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                              <div className="text-xs text-gray-600 mb-1">{t('home.demoProteins')}</div>
                              <motion.div
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl font-black text-blue-700"
                              >
                                28
                              </motion.div>
                              <div className="text-xs text-gray-500 mt-0.5">g</div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 text-center">
                              <div className="text-xs text-gray-600 mb-1">{t('home.demoCarbohydrates')}</div>
                              <motion.div
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl font-black text-amber-700"
                              >
                                35
                              </motion.div>
                              <div className="text-xs text-gray-500 mt-0.5">g</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center">
                              <div className="text-xs text-gray-600 mb-1">{t('home.demoFats')}</div>
                              <motion.div
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl font-black text-red-700"
                              >
                                11
                              </motion.div>
                              <div className="text-xs text-gray-500 mt-0.5">g</div>
                            </div>
                          </div>
                        </motion.div>

                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 flex items-center justify-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">{t('home.demoSubstitutionComplete')}</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {mealCheckStep >= 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-50 h-full"
                    >
                      <div className="mb-3">
                        <h3 className="text-base font-bold mb-2">{t('home.demoWeeklyPlan')}</h3>
                        <div className="flex gap-1 overflow-x-auto pb-2">
                          {[t('home.demoMon'), t('home.demoTue'), t('home.demoWed'), t('home.demoThu'), t('home.demoFri'), t('home.demoSat'), t('home.demoSun')].map((day, i) => (
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
                          animate={{
                            borderColor: mealCheckStep >= 2 ? '#10b981' : '#26847F',
                            scale: mealCheckStep === 2 ? [1, 1.05, 1] : 1
                          }}
                          transition={{ duration: 0.4 }}
                          className="bg-white rounded-lg p-3 shadow-md border-2"
                        >
                          <div className="flex items-center gap-2">
                            {mealCheckStep >= 2 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                            <img
                              src="https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=200&h=200&fit=crop"
                              alt="Porridge"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <div className="font-bold text-sm">{t('home.demoBreakfast')}</div>
                              <div className="text-xs text-gray-500">{t('home.demoProteicPorridge')} • 445 kcal</div>
                            </div>
                          </div>
                        </motion.div>

                        {lunchScanStep >= 1 && (
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-lg p-3 shadow-md border-2 border-[var(--brand-primary)]"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"
                                alt="Insalata"
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <div className="font-bold text-sm">{t('home.demoLunch')}</div>
                                <div className="text-xs text-gray-500">{t('home.demoCaesarSalad')} • 650 kcal</div>
                              </div>
                              <motion.button
                                animate={{ scale: lunchScanStep === 1 ? [1, 0.9, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                                className="w-9 h-9 bg-[var(--brand-primary)] rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
                              >
                                <Camera className="w-5 h-5 text-white" />
                              </motion.button>
                            </div>
                          </motion.div>
                        )}

                        {lunchScanStep < 1 && (
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-lg p-3 shadow-sm border-2 border-gray-200"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"
                                alt="Insalata"
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <div className="font-bold text-sm text-gray-900">{t('home.demoLunch')}</div>
                                <div className="text-xs text-gray-500">{t('home.demoCaesarSalad')} • 650 kcal</div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white rounded-lg p-3 shadow-sm border-2 border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop"
                              alt="Salmone"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <div className="font-bold text-sm text-gray-900">{t('home.demoDinner')}</div>
                              <div className="text-xs text-gray-500">{t('home.demoBakedSalmon')} • 700 kcal</div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 11 && (
                <motion.div
                  key="scan-pranzo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white flex flex-col items-center justify-center"
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <img
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop"
                      alt="Insalata Caesar"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="relative w-56 h-56 border-4 border-[var(--brand-primary)] rounded-2xl z-10 bg-white/50 backdrop-blur-sm overflow-hidden"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop"
                      alt="Insalata Caesar"
                      className="w-full h-full object-cover"
                    />
                    <Camera className="w-12 h-12 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
                    <motion.div
                      animate={{ y: [0, 224] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 right-0 h-1 bg-[var(--brand-primary)] shadow-[0_0_15px_rgba(38,132,127,0.8)]"
                    />
                  </motion.div>
                  <p className="text-gray-900 mt-6 text-sm font-semibold z-10">{t('home.demoScan')} {t('home.demoLunch').toLowerCase()}...</p>
                </motion.div>
              )}

              {step === 12 && (
                <motion.div
                  key="scan-pranzo-comparison"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 ${!isDesktop ? 'pt-16' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                  style={{ height: isDesktop ? '490px' : '800px', minHeight: isDesktop ? '490px' : '800px', maxHeight: isDesktop ? '490px' : '800px' }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white h-full overflow-auto"
                  >
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-[var(--brand-primary)]" />
                        <h3 className="text-base font-bold">{language === 'es' ? 'Cálculo Calórico IA' : language === 'pt' ? 'Cálculo Calórico IA' : language === 'de' ? 'KI-Kalorienberechnung' : language === 'fr' ? 'Calcul Calorique IA' : language === 'en' ? 'AI Calorie Calculation' : 'Calcolo Calorico AI'}</h3>
                      </div>
                      <p className="text-xs text-gray-600">{language === 'es' ? 'Comparación automática planificado vs real' : language === 'pt' ? 'Comparação automática planejado vs real' : language === 'de' ? 'Automatischer Vergleich geplant vs tatsächlich' : language === 'fr' ? 'Comparaison automatique planifié vs réel' : language === 'en' ? 'Automatic comparison planned vs actual' : 'Confronto automatico pianificato vs reale'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                        <div className="text-xs font-bold text-blue-700 mb-3 text-center">{language === 'es' ? 'Planificado' : language === 'pt' ? 'Planejado' : language === 'de' ? 'Geplant' : language === 'fr' ? 'Planifié' : language === 'en' ? 'Planned' : 'Pianificato'}</div>
                        <div className="space-y-2 text-[10px]">
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-gray-500 text-center mb-1">{t('home.demoCalories')}</div>
                            <div className="text-3xl font-black text-center">650</div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoProteins')}</span>
                            <span className="font-bold">35g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoCarbs')}</span>
                            <span className="font-bold">45g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoFats')}</span>
                            <span className="font-bold">32g</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3">
                        <div className="text-xs font-bold text-green-700 mb-3 text-center">{language === 'es' ? 'Real IA' : language === 'pt' ? 'Real IA' : language === 'de' ? 'Tatsächlich KI' : language === 'fr' ? 'Réel IA' : language === 'en' ? 'Actual AI' : 'Reale AI'}</div>
                        <div className="space-y-2 text-[10px]">
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-gray-500 text-center mb-1">{t('home.demoCalories')}</div>
                            <div className="text-3xl font-black text-center text-red-600">725</div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoProteins')}</span>
                            <span className="font-bold">38g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoCarbs')}</span>
                            <span className="font-bold">48g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoFats')}</span>
                            <span className="font-bold text-red-600">38g</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 mb-3">
                      <div className="text-xs font-bold text-orange-700 mb-2">{t('home.demoDetectedDifference')}</div>
                      <div className="text-xs text-gray-700">
                        {t('home.demoConsumedExtra')} <span className="font-bold text-red-600">+75 kcal</span> {t('home.demoVsPlan')}
                      </div>
                    </div>

                    {lunchScanStep >= 2 && (
                      <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: lunchScanStep === 2 ? [1, 1.1, 1.05, 1] : 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg"
                      >
                        {t('home.demoSaveAndRebalance')}
                      </motion.button>
                    )}
                  </motion.div>
                </motion.div>
              )}

              {step === 13 && (
                <motion.div
                  key="rebalance-success"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col justify-center ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <div className="bg-white rounded-2xl p-6 shadow-2xl text-center max-w-sm mx-auto">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.6, repeat: 2 }}
                      className="text-5xl mb-3"
                    >
                      ✅
                    </motion.div>
                    <h4 className="text-lg font-bold mb-2 text-green-700">{t('home.demoMealsRebalanced')}</h4>
                    <p className="text-sm text-gray-600">{t('home.demoDinnerSnackUpdated')}</p>
                  </div>
                </motion.div>
              )}

              {step === 14 && (
                <motion.div
                  key="workout-days"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <div className="text-center mb-4">
                    <div className="inline-block px-3 py-1 bg-purple-100 rounded-full mb-2">
                      <span className="text-xs font-semibold text-purple-700">Step 2/4</span>
                    </div>
                    <h3 className="text-base font-bold mb-3">{t('home.demoWhichDaysWorkout')}</h3>
                    <div className="grid grid-cols-1 gap-1.5 max-w-xs mx-auto">
                      {[t('home.demoMonday'), t('home.demoTuesday'), t('home.demoWednesday'), t('home.demoThursday'), t('home.demoFriday'), t('home.demoSaturday'), t('home.demoSunday')].map((day, idx) => {
                        const isSelected = (workoutDaySelection >= 1 && idx === 0) ||
                                          (workoutDaySelection >= 2 && idx === 2) ||
                                          (workoutDaySelection >= 3 && idx === 4);
                        return (
                          <motion.button
                            key={day}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              scale: (workoutDaySelection === 1 && idx === 0) ||
                                     (workoutDaySelection === 2 && idx === 2) ||
                                     (workoutDaySelection === 3 && idx === 4) ? [1, 1.05, 1] : 1
                            }}
                            transition={{
                              delay: idx * 0.05,
                              scale: { duration: 0.3 }
                            }}
                            className={`py-3 rounded-lg font-bold text-sm transition-all ${isSelected ? 'bg-[var(--brand-primary)] text-white' : 'bg-white text-gray-700'}`}
                          >
                            {isSelected && <Check className="w-4 h-4 inline mr-2" />}
                            {day}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 15 && (
                <motion.div
                  key="workout-location"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <div className="text-center mb-4">
                    <div className="inline-block px-3 py-1 bg-blue-100 rounded-full mb-2">
                      <span className="text-xs font-semibold text-blue-700">Step 3/4</span>
                    </div>
                    <h3 className="text-base font-bold mb-3">{t('home.demoWhereWorkout')}</h3>
                    <div className="space-y-2 max-w-xs mx-auto">
                      <motion.button
                        animate={{
                          backgroundColor: workoutLocationSelected ? '#26847F' : '#ffffff',
                          color: workoutLocationSelected ? '#ffffff' : '#374151',
                          scale: workoutLocationSelected ? [1, 1.05, 1] : 1
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md"
                      >
                        <HomeIcon className="w-5 h-5" />
                        {t('home.demoAtHome')}
                      </motion.button>
                      <button className="w-full py-4 rounded-xl font-bold text-base bg-white text-gray-700 flex items-center justify-center gap-2 shadow-md">
                        <Zap className="w-5 h-5" />
                        {t('home.demoAtGym')}
                      </button>
                      <button className="w-full py-4 rounded-xl font-bold text-base bg-white text-gray-700 flex items-center justify-center gap-2 shadow-md">
                        <Trees className="w-5 h-5" />
                        {t('home.demoOutdoor')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 16 && (
                <motion.div
                  key="workout-plan-zoom"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gray-50 ${!isDesktop ? 'pt-20' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                  style={{ height: '100vh', minHeight: '100vh', maxHeight: '100vh', width: '100vw', left: 0, top: 0 }}
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold">{t('home.demoMondayWorkout')}</h3>
                      <motion.button
                        animate={{
                          scale: modifyWorkoutButtonZoom ? 1.3 : (modifyWorkoutStep >= 1 ? [1, 1.2, 1.1] : 1)
                        }}
                        transition={{ duration: modifyWorkoutButtonZoom ? 0.5 : 0.8 }}
                        className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                      >
                        {t('home.demoModifySession')}
                      </motion.button>
                    </div>
                  </div>

                  <motion.div
                    className="space-y-2"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border-2 border-blue-200">
                      <div className="text-xs font-bold text-blue-700 mb-1">🔥 {t('home.demoWarmup')} (5 min)</div>
                      <div className="text-xs text-gray-700">Jumping Jacks, Arm Circles</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-md border-2 border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          1
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{t('home.demoPushups')}</div>
                          <div className="text-xs text-gray-600">3x12 • {t('home.demoChest')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-md border-2 border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          2
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{t('home.demoSquat')}</div>
                          <div className="text-xs text-gray-600">4x15 • {t('home.demoLegs')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-md border-2 border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          3
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{t('home.demoPlank')}</div>
                          <div className="text-xs text-gray-600">3x45s • {t('home.demoCore')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border-2 border-green-200">
                      <div className="text-xs font-bold text-green-700 mb-1">🧘 {t('home.demoStretching')} (5 min)</div>
                      <div className="text-xs text-gray-700">Quad Stretch, Child's Pose</div>
                    </div>
                  </motion.div>

                  {modifyWorkoutStep >= 1 && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute inset-0 bg-black/80 flex items-center justify-center px-4"
                    >
                      <div className="bg-white rounded-xl p-4 w-full max-w-sm">
                        <h4 className="font-bold text-sm mb-3">{t('home.demoWorkoutIssues')}</h4>
                        <div className="bg-gray-100 rounded-lg p-3 mb-3 min-h-[60px] flex items-center">
                          <p className="text-sm text-gray-700">
                            {language === 'es' ? 'Me duele el hombro' : language === 'pt' ? 'Meu ombro dói' : language === 'de' ? 'Meine Schulter tut weh' : language === 'fr' ? 'Mon épaule me fait mal' : language === 'en' ? 'My shoulder hurts' : 'Mi fa male la spalla'}{modifyWorkoutStep === 1 && typingText.length < (language === 'es' ? 18 : language === 'pt' ? 15 : language === 'de' ? 23 : language === 'fr' ? 24 : language === 'en' ? 19 : 20) && <span className="animate-pulse">|</span>}
                          </p>
                        </div>
                        {modifyWorkoutStep >= 2 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3"
                          >
                            <div className="flex items-start gap-1.5">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-green-800 text-xs mb-0.5">{t('home.demoWorkoutModified')}</div>
                                <p className="text-xs text-green-700">{t('home.demoReplacedShoulderEx')}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 17 && (
                <motion.div
                  key="new-exercise"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className={`absolute inset-0 bg-white ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                  style={{ height: isDesktop ? '490px' : '800px', minHeight: isDesktop ? '490px' : '800px', maxHeight: isDesktop ? '490px' : '800px' }}
                >
                  <h3 className="text-base font-bold mb-3">{t('home.demoRowElastic')}</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 mb-3">
                    <div className="text-xs text-gray-600 mb-1">{t('home.demoTargetMuscle')}</div>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1.2 }}
                      className="text-2xl font-black text-blue-600"
                    >
                      💪 {t('home.demoBack')}
                    </motion.div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-semibold mb-1">{t('home.demoExecution')}:</div>
                    <p className="text-xs text-gray-600">{t('home.demoRowDesc')}</p>
                  </div>
                </motion.div>
              )}

              {step === 18 && (
                <motion.div
                  key="body-analysis"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 ${!isDesktop ? 'pt-16' : 'p-3'} ${isDesktop ? '' : 'p-3'}`}
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <motion.div
                    ref={analysisRef}
                    animate={{
                      scale: photoAnalysisZoom ? 0.85 : 1,
                      opacity: photoAnalysisZoom ? 0.3 : 1,
                      filter: photoAnalysisZoom ? 'blur(4px)' : 'blur(0px)'
                    }}
                    transition={{ duration: 0.5 }}
                    className="space-y-3 overflow-y-auto h-full"
                  >
                    <h3 className="text-sm font-bold text-center mb-2">{t('home.demoProgressAnalysisAI')}</h3>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-xl p-2 shadow-md border border-red-200">
                        <div className="text-[9px] text-gray-500 mb-1 text-center font-semibold">{t('home.demoBefore')} - 12 {t('home.demoWeeksAgo')}</div>
                        <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/8eb701ee9_ModelPre.png"
                          alt="Before"
                          className="w-full aspect-square object-cover rounded-lg mb-2"
                          loading="eager"
                          fetchpriority="high"
                        />
                        <div className="space-y-1 text-[9px]">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoDefinition')}</span>
                            <span className="font-bold text-red-600">4.5/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoFat')}</span>
                            <span className="font-bold text-red-600">28.5%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-2 shadow-md border-2 border-green-500">
                        <div className="text-[9px] text-gray-500 mb-1 text-center font-semibold">{t('home.demoAfter')} - {t('home.demoToday')}</div>
                        <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/3fb8677cc_ModelPost.png"
                          alt="After"
                          className="w-full aspect-square object-cover rounded-lg mb-2"
                          loading="eager"
                          fetchpriority="high"
                        />
                        <div className="space-y-1 text-[9px]">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoDefinition')}</span>
                            <span className="font-bold text-green-600">6.8/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('home.demoFat')}</span>
                            <span className="font-bold text-green-600">22.1%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-3 shadow-md border border-gray-200">
                      <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        {t('home.demoDetectedProgress')}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                          <div className="text-xs font-bold text-green-700">+51%</div>
                          <div className="text-[9px] text-gray-600">{t('home.demoDefinition')}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                          <div className="text-xs font-bold text-green-700">-22%</div>
                          <div className="text-[9px] text-gray-600">{t('home.demoFat')}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                          <div className="text-xs font-bold text-green-700">-6cm</div>
                          <div className="text-[9px] text-gray-600">{t('home.demoWaist')}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                          <div className="text-xs font-bold text-green-700">+25%</div>
                          <div className="text-[9px] text-gray-600">{t('home.demoPosture')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200">
                      <h4 className="text-xs font-bold text-gray-900 mb-2">💡 {t('home.demoPersonalTrainerTips')}</h4>

                      <div className="mb-2">
                        <div className="text-[9px] font-bold text-amber-700 mb-1">🍽️ {t('home.demoNutrition')}</div>
                        <div className="space-y-1">
                          <div className="bg-white/80 rounded-md p-1.5 text-[8px] text-gray-700">
                            • {t('home.demoMaintainDeficit')}
                          </div>
                          <div className="bg-white/80 rounded-md p-1.5 text-[8px] text-gray-700">
                            • {t('home.demoIncreaseProtein')}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-bold text-purple-700 mb-1">💪 {t('home.demoWorkoutLabel')}</div>
                        <div className="space-y-1">
                          <div className="bg-white/80 rounded-md p-1.5 text-[8px] text-gray-700">
                            • {t('home.demoIncreaseCoreFreq')}
                          </div>
                          <div className="bg-white/80 rounded-md p-1.5 text-[8px] text-gray-700">
                            • {t('home.demoAdd3HIIT')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      animate={{
                        scale: photoAnalysisZoom ? 1.3 : 1,
                        y: photoAnalysisZoom ? -20 : 0
                      }}
                      transition={{ duration: 0.5 }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg relative z-10"
                    >
                      {t('home.demoAcceptSuggestions')}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {step === 19 && (
                <motion.div
                  key="weight-chart"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                  style={{ height: isDesktop ? '490px' : '700px', minHeight: isDesktop ? '490px' : '700px', maxHeight: isDesktop ? '490px' : '700px' }}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t('home.demoWeightTrajectory')}</h3>
                    <p className="text-xs text-gray-600">{t('home.demo12WeeksProgress')}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-xl">
                    <div className="relative h-48 mb-4">
                      <svg viewBox="0 0 100 80" className="w-full h-full">
                        <line x1="10" y1="15" x2="95" y2="15" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="10" y1="30" x2="95" y2="30" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="10" y1="45" x2="95" y2="45" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="10" y1="60" x2="95" y2="60" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />

                        <motion.path
                          d="M 10,20 L 20,25 L 30,32 L 40,38 L 50,42 L 60,48 L 70,52 L 80,56 L 90,60"
                          fill="none"
                          stroke="#26847F"
                          strokeWidth="3"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, ease: "easeOut" }}
                        />
                        <circle cx="10" cy="20" r="2.5" fill="#26847F" />
                        <circle cx="20" cy="25" r="2.5" fill="#26847F" />
                        <circle cx="30" cy="32" r="2.5" fill="#26847F" />
                        <circle cx="40" cy="38" r="2.5" fill="#26847F" />
                        <circle cx="50" cy="42" r="2.5" fill="#26847F" />
                        <circle cx="60" cy="48" r="2.5" fill="#26847F" />
                        <circle cx="70" cy="52" r="2.5" fill="#26847F" />
                        <circle cx="80" cy="56" r="2.5" fill="#26847F" />
                        <motion.circle
                          cx="90" cy="60" r="3.5" fill="#10b981"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />

                        <line x1="10" y1="65" x2="95" y2="65" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />

                        <text x="5" y="23" fontSize="5" fill="#26847F" fontWeight="bold">70kg</text>
                        <text x="85" y="67" fontSize="5" fill="#10b981" fontWeight="bold">65kg</text>
                      </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-xs text-gray-600">{t('home.demoInitialWeightLabel')}</div>
                        <div className="text-xl font-black text-gray-900">70kg</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-xs text-gray-600">{t('home.demoCurrentWeightLabel')}</div>
                        <div className="text-xl font-black text-green-600">65kg</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2">
                        <div className="text-xs text-gray-600">{t('home.demoLost')}</div>
                        <div className="text-xl font-black text-orange-600">-5kg</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 20 && (
                <motion.div
                  key="goal-reached"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 ${!isDesktop ? 'pt-20' : 'p-4'} ${isDesktop ? '' : 'p-4'}`}
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-2xl font-black text-white text-center mb-1">{t('home.demoGoalReached')}</h2>
                  <p className="text-white text-center text-sm">65kg • -5kg {t('home.demoWeeksResult')}</p>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mt-6 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
                  >
                    <span className="text-white text-sm font-bold">MyWellness AI ✨</span>
                  </motion.div>
                </motion.div>
              )}

              {step === 21 && (
                <motion.div
                  key="logo-finale"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-white"
                  style={{ height: isDesktop ? '490px' : '720px', minHeight: isDesktop ? '490px' : '720px', maxHeight: isDesktop ? '490px' : '720px' }}
                >
                  <motion.img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
                    alt="MyWellness"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1.05, opacity: 1 }}
                    transition={{ duration: 2.5, ease: "easeOut" }}
                    className="w-48 h-auto"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isDesktop && (
            <svg
              viewBox="0 0 820 615"
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ left: '-3px', zIndex: 2 }}
            >
          ...
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}