import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Sparkles, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";

import IntroStep from '../components/quiz/IntroStep';
import BirthdateStep from '../components/quiz/BirthdateStep';
import HeightStep from '../components/quiz/HeightStep';
import CurrentWeightStep from '../components/quiz/CurrentWeightStep';
import TargetWeightStep from '../components/quiz/TargetWeightStep';
import NeckCircumferenceStep from '../components/quiz/NeckCircumferenceStep';
import WaistCircumferenceStep from '../components/quiz/WaistCircumferenceStep';
import HipCircumferenceStep from '../components/quiz/HipCircumferenceStep';
import CurrentBodyTypeStep from '../components/quiz/CurrentBodyTypeStep';
import TargetBodyTypeStep from '../components/quiz/TargetBodyTypeStep';
import TargetZoneStep from '../components/quiz/TargetZoneStep';
import WeightLossSpeedStep from '../components/quiz/WeightLossSpeedStep';

function calculateAge(birthdate) {
  if (!birthdate) return null;
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function calculateBMR(weight, height, age, gender) {
  if (!weight || !height || !age || !gender) return 0;
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

function getActivityMultiplier(activityLevel) {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };
  return multipliers[activityLevel] || 1.2;
}

function calculateBodyFat(gender, height, waist, neck, hip) {
  if (!height || !waist || !neck || waist <= neck) {
    return null;
  }

  if (gender === 'male') {
    const bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    return Math.round(bodyFat * 10) / 10;
  } else if (gender === 'female') {
    if (!hip || waist + hip - neck <= 0) return null;
    const bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    return Math.round(bodyFat * 10) / 10;
  }
  return null;
}

function buildDynamicSteps(data) {
  const baseSteps = [
    { component: IntroStep, label: "Benvenuto" },
    { component: BirthdateStep, label: "Data di Nascita" },
    { component: HeightStep, label: "Altezza" },
    { component: CurrentWeightStep, label: "Peso Attuale" },
    { component: TargetWeightStep, label: "Peso Obiettivo" },
    { component: NeckCircumferenceStep, label: "Circonferenza Collo" },
    { component: WaistCircumferenceStep, label: "Circonferenza Vita" },
    { component: HipCircumferenceStep, label: "Circonferenza Fianchi" },
    { component: CurrentBodyTypeStep, label: "Aspetto Fisico Attuale" },
    { component: TargetZoneStep, label: "Zona Obiettivo" },
    { component: WeightLossSpeedStep, label: "Ritmo di Perdita Peso" },
    { component: TargetBodyTypeStep, label: "Aspetto Fisico Obiettivo" }
  ];

  return baseSteps;
}

export default function Quiz() {
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlStep = parseInt(urlParams.get('step')) || 0;
  const isRecapMode = urlParams.get('mode') === 'recap';

  const [currentStep, setCurrentStep] = useState(urlStep);
  const [quizData, setQuizData] = useState(() => {
    const saved = localStorage.getItem('quizData');
    return saved ? JSON.parse(saved) : {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicSteps, setDynamicSteps] = useState(() => buildDynamicSteps(quizData));
  const [isCalculating, setIsCalculating] = useState(false);
  const [showBodyFatReveal, setShowBodyFatReveal] = useState(false);
  const [bodyFatRevealed, setBodyFatRevealed] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [quizActivityTracked, setQuizActivityTracked] = useState(false);

  // ✅ PRIORITÀ: Controlla subito se deve completare il setup dopo login
  useEffect(() => {
    const completeSetupAfterLogin = async () => {
      const quizDataToSave = localStorage.getItem('quizDataToSave');
      const needsTrialSetup = localStorage.getItem('needsTrialSetup');
      
      if (quizDataToSave && needsTrialSetup) {
        console.log('🔄 Detected post-login setup needed, processing...');
        setIsLoadingUser(true);
        
        try {
          const currentUser = await base44.auth.me();
          
          if (currentUser) {
            console.log('✅ User authenticated, completing setup...');
            const dataToSave = JSON.parse(quizDataToSave);
            
            // Salva tutti i dati utente
            await base44.auth.updateMe(dataToSave);
            
            // Registra peso iniziale
            const today = new Date().toISOString().split('T')[0];
            await base44.entities.WeightHistory.create({
              user_id: currentUser.id,
              weight: dataToSave.current_weight,
              date: today
            });
            
            // Imposta trial status (7 giorni, solo dashboard)
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 7);
            
            await base44.auth.updateMe({
              subscription_status: 'trial',
              subscription_plan: 'trial',
              trial_ends_at: trialEndsAt.toISOString()
            });
            
            console.log('✅ Setup completed, redirecting to Dashboard...');
            
            // Pulisci localStorage
            localStorage.removeItem('quizDataToSave');
            localStorage.removeItem('needsTrialSetup');
            localStorage.removeItem('quizData');
            
            // Vai direttamente alla Dashboard
            navigate(createPageUrl('Dashboard'), { replace: true });
            return;
          }
        } catch (error) {
          console.error('Error completing post-login setup:', error);
          localStorage.removeItem('quizDataToSave');
          localStorage.removeItem('needsTrialSetup');
        }
        
        setIsLoadingUser(false);
      }
    };
    
    completeSetupAfterLogin();
  }, [navigate]);

  useEffect(() => {
    const loadUserData = async () => {
      // ✅ PRIORITÀ ASSOLUTA: Se c'è un setup da completare post-login, NON fare nient'altro
      const quizDataToSave = localStorage.getItem('quizDataToSave');
      const needsTrialSetup = localStorage.getItem('needsTrialSetup');
      
      if (quizDataToSave && needsTrialSetup) {
        console.log('🛑 Setup post-login in corso, skip loadUserData normale');
        return; // Il primo useEffect gestirà tutto
      }
      
      setIsLoadingUser(true);
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        console.log('🔍 Quiz Mode Check:', { isRecapMode, quiz_completed: currentUser?.quiz_completed });
        
        // ✅ FIX RECAP MODE: Se è recap mode, resetta SEMPRE
        if (isRecapMode && currentUser) {
          console.log('🔄 RECAP MODE ATTIVO - Reset quiz data...');
          localStorage.removeItem('quizData');
          setQuizData({
            gender: currentUser.gender || '',
          });
          setCurrentStep(0);
          window.history.replaceState({}, '', createPageUrl('Quiz') + '?mode=recap&step=0');
        } else if (currentUser && currentUser.quiz_completed && !isRecapMode) {
          // Se l'utente ha già completato il quiz e NON è in recap mode → vai alla Dashboard
          console.log('✅ Quiz già completato, redirect to Dashboard');
          navigate(createPageUrl('Dashboard'), { replace: true });
          return;
        }
        
      } catch (error) {
        if (error?.response?.status === 401 || 
            error?.message?.includes('401') || 
            error?.message?.includes('Authentication required')) {
          setUser(null);
        } else {
          console.error('Error loading user:', error);
          setUser(null);
        }
      }
      setIsLoadingUser(false);
    };

    loadUserData();
  }, [navigate, isRecapMode]);

  // 🛒 TRACKING: Quiz Started (solo una volta)
  useEffect(() => {
    // Only track if user data is loaded, quiz not yet tracked, and we are on the first actual step (step 1 after intro)
    if (!isLoadingUser && !quizActivityTracked && currentStep === 1) {
      const trackQuizStarted = async () => {
        try {
          // Determine a user identifier; email if available, otherwise 'anonymous'
          const userIdentifier = user?.email || quizData.email || 'anonymous';
          await base44.entities.UserActivity.create({
            user_id: userIdentifier,
            event_type: 'quiz_started',
            event_data: { step: currentStep }
          });
          console.log('📊 Quiz started tracked');
          setQuizActivityTracked(true); // Mark as tracked
        } catch (error) {
          console.error('Error tracking quiz start:', error);
        }
      };
      
      trackQuizStarted();
    }
  }, [currentStep, isLoadingUser, quizActivityTracked, user, quizData.email]); // Dependencies

  useEffect(() => {
    localStorage.setItem('quizData', JSON.stringify(quizData));
    setDynamicSteps(buildDynamicSteps(quizData));
  }, [quizData]);

  const isCurrentStepValid = () => {
    const stepComponent = dynamicSteps[currentStep]?.component;

    if (stepComponent === IntroStep) {
      return !!quizData.gender;
    }
    if (stepComponent === BirthdateStep) {
      return !!quizData.birthdate;
    }
    if (stepComponent === HeightStep) {
      return !!quizData.height && quizData.height > 0;
    }
    if (stepComponent === CurrentWeightStep) {
      return !!quizData.current_weight && quizData.current_weight > 0;
    }
    if (stepComponent === TargetWeightStep) {
      return !!quizData.target_weight && quizData.target_weight > 0;
    }
    if (stepComponent === NeckCircumferenceStep) {
      return !!quizData.neck_circumference && quizData.neck_circumference > 0;
    }
    if (stepComponent === WaistCircumferenceStep) {
      return !!quizData.waist_circumference && quizData.waist_circumference > 0;
    }
    if (stepComponent === HipCircumferenceStep) {
      return !!quizData.hip_circumference && quizData.hip_circumference > 0;
    }
    if (stepComponent === CurrentBodyTypeStep) {
      return !!quizData.current_body_fat_visual;
    }
    if (stepComponent === TargetBodyTypeStep) {
      return !!quizData.target_body_fat_visual;
    }
    if (stepComponent === TargetZoneStep) {
      return !!quizData.target_zones && quizData.target_zones.length > 0;
    }
    if (stepComponent === WeightLossSpeedStep) {
      return !!quizData.weight_loss_speed;
    }

    return true;
  };

  const handleStepData = (data) => {
    setQuizData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < dynamicSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      const url = isRecapMode 
        ? `${createPageUrl('Quiz')}?mode=recap&step=${newStep}`
        : `${createPageUrl('Quiz')}?step=${newStep}`;
      window.history.pushState({}, '', url);
    } else {
      // Ultimo step completato
      const trackQuizCompleted = async () => {
        try {
          const userIdentifier = user?.email || quizData.email || 'anonymous';
          await base44.entities.UserActivity.create({
            user_id: userIdentifier,
            event_type: 'quiz_completed',
            event_data: { total_steps: dynamicSteps.length }
          });
          console.log('📊 Quiz completed tracked');
        } catch (error) {
          console.error('Error tracking quiz completion:', error);
        }
      };
      
      trackQuizCompleted();
      
      setIsCalculating(true);
      
      if (isRecapMode) {
        // ✅ In recap mode, salta la schermata blur e salva direttamente
        setTimeout(async () => {
          await handleRevealBodyFat(); // Salva e reindirizza direttamente alla Dashboard
        }, 5000);
      } else {
        // Comportamento normale: mostra schermata blur
        setTimeout(() => {
          setIsCalculating(false);
          setShowBodyFatReveal(true);
        }, 5000);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      const url = isRecapMode 
        ? `${createPageUrl('Quiz')}?mode=recap&step=${newStep}`
        : `${createPageUrl('Quiz')}?step=${newStep}`;
      window.history.pushState({}, '', url);
    }
  };

  const handleRevealBodyFat = async () => {
    // Se l'utente NON è loggato, fai login prima
    if (!user || !user.id) {
      console.log('🔐 User not logged in, redirecting to login...');
      
      // Calcola i dati da salvare
      const age = quizData.age || calculateAge(quizData.birthdate);
      const bmr = calculateBMR(
        quizData.current_weight,
        quizData.height,
        age,
        quizData.gender
      );

      const activityMultiplier = getActivityMultiplier(quizData.activity_level || 'sedentary');
      let dailyCalories = bmr * activityMultiplier;

      if (quizData.weight_loss_speed === 'very_fast') {
        dailyCalories *= 0.75;
      } else if (quizData.weight_loss_speed === 'moderate') {
        dailyCalories *= 0.8;
      } else if (quizData.weight_loss_speed === 'slow') {
        dailyCalories *= 0.9;
      }

      const bodyFat = calculateBodyFat(
        quizData.gender,
        quizData.height,
        quizData.waist_circumference,
        quizData.neck_circumference,
        quizData.hip_circumference
      );

      const userDataToSave = {
        gender: quizData.gender,
        birthdate: quizData.birthdate,
        age: age,
        height: quizData.height,
        current_weight: quizData.current_weight,
        target_weight: quizData.target_weight,
        neck_circumference: quizData.neck_circumference,
        waist_circumference: quizData.waist_circumference,
        hip_circumference: quizData.hip_circumference,
        current_body_fat_visual: quizData.current_body_fat_visual,
        target_body_fat_visual: quizData.target_body_fat_visual,
        target_zone: quizData.target_zone,
        weight_loss_speed: quizData.weight_loss_speed,
        body_fat_percentage: bodyFat !== null ? parseFloat(bodyFat.toFixed(1)) : null,
        bmr: Math.round(bmr),
        daily_calories: Math.round(dailyCalories),
        quiz_completed: true,
      };
      
      // Salva nel localStorage
      localStorage.setItem('quizDataToSave', JSON.stringify(userDataToSave));
      localStorage.setItem('needsTrialSetup', 'true');
      
      // Redirect al login, poi tornerà al Quiz
      const quizUrl = window.location.origin + createPageUrl('Quiz');
      await base44.auth.redirectToLogin(quizUrl);
      return;
    }
    
    // Utente loggato - salva e procedi
    setIsSaving(true);
    
    try {
      const age = quizData.age || calculateAge(quizData.birthdate);
      const bmr = calculateBMR(
        quizData.current_weight,
        quizData.height,
        age,
        quizData.gender
      );

      const activityMultiplier = getActivityMultiplier(quizData.activity_level || 'sedentary');
      let dailyCalories = bmr * activityMultiplier;

      if (quizData.weight_loss_speed === 'very_fast') {
        dailyCalories *= 0.75;
      } else if (quizData.weight_loss_speed === 'moderate') {
        dailyCalories *= 0.8;
      } else if (quizData.weight_loss_speed === 'slow') {
        dailyCalories *= 0.9;
      }

      const bodyFat = calculateBodyFat(
        quizData.gender,
        quizData.height,
        quizData.waist_circumference,
        quizData.neck_circumference,
        quizData.hip_circumference
      );

      const userDataToSave = {
        gender: quizData.gender,
        birthdate: quizData.birthdate,
        age: age,
        height: quizData.height,
        current_weight: quizData.current_weight,
        target_weight: quizData.target_weight,
        neck_circumference: quizData.neck_circumference,
        waist_circumference: quizData.waist_circumference,
        hip_circumference: quizData.hip_circumference,
        current_body_fat_visual: quizData.current_body_fat_visual,
        target_body_fat_visual: quizData.target_body_fat_visual,
        target_zone: quizData.target_zone,
        weight_loss_speed: quizData.weight_loss_speed,
        body_fat_percentage: bodyFat !== null ? parseFloat(bodyFat.toFixed(1)) : null,
        bmr: Math.round(bmr),
        daily_calories: Math.round(dailyCalories),
        quiz_completed: true,
      };

      console.log('💾 Saving user data...', userDataToSave);
      await base44.auth.updateMe(userDataToSave);
      
      // Registra il peso iniziale nel grafico
      const today = new Date().toISOString().split('T')[0];
      try {
        await base44.entities.WeightHistory.create({
          user_id: user.id,
          weight: quizData.current_weight,
          date: today
        });
        console.log('✅ Peso iniziale registrato:', quizData.current_weight, 'kg');
      } catch (weightError) {
        console.warn('⚠️ Errore nel registrare peso iniziale (non critico):', weightError);
      }
      
      // Crea piano trial SENZA Stripe (solo dashboard)
      if (!isRecapMode) {
        try {
          console.log('🔄 Setting trial status...');
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 giorni di trial gratuito
          
          await base44.auth.updateMe({
            subscription_status: 'trial',
            subscription_plan: 'trial',
            trial_ends_at: trialEndsAt.toISOString()
          });
          
          console.log('✅ Trial status set (7 days, dashboard only)');
        } catch (error) {
          console.error('Error setting trial:', error);
        }
      }
      
      localStorage.removeItem('quizData');
      localStorage.removeItem('quizDataToSave');
      localStorage.removeItem('needsTrialSetup');
      console.log('✅ User data saved');
      
      // Vai alla Dashboard
      console.log('🔄 Redirecting to Dashboard...');
      navigate(createPageUrl('Dashboard'), { replace: true });
      
    } catch (error) {
      console.error("Error saving quiz data:", error);
      alert("Si è verificato un errore durante il salvataggio dei dati. Riprova.");
      setIsSaving(false);
    }
  };

  const handleProceedToDashboard = async () => {
    setShowBodyFatReveal(false);
    setIsSaving(true); // Indicate that final data saving is in progress
    
    try {
      const age = quizData.age || calculateAge(quizData.birthdate);

      // The quiz no longer includes gender selection. If the user is logged in,
      // `currentUser.gender` should be available. If not, `quizData.gender` might
      // be undefined, which calculateBMR handles by returning 0.
      // This implies gender should ideally be set prior to this point or be
      // a part of a previous step not covered by the current dynamic steps definition.
      // For now, assuming `quizData.gender` will eventually be populated, perhaps from user profile.
      // If quizData.gender is missing, BMR calculation will be 0, leading to 0 daily calories.
      // This needs a robust solution if gender is not captured anywhere.
      // For now, adhering strictly to the provided outline, which removed GenderStep.
      const bmr = calculateBMR(
        quizData.current_weight,
        quizData.height,
        age,
        quizData.gender // gender might be missing now if not pre-filled or user not logged in
      );

      // Activity level, daily calories, etc. are not part of the initial quiz anymore
      // Set default values or remove if not needed for initial completion
      const activityMultiplier = getActivityMultiplier(quizData.activity_level || 'sedentary'); // Default to sedentary
      let dailyCalories = bmr * activityMultiplier;

      // Assuming a default weight loss speed or handling based on whether it was asked
      // For now, let's keep the existing logic, but note it might be based on an unasked question
      if (quizData.weight_loss_speed === 'very_fast') {
        dailyCalories *= 0.75;
      } else if (quizData.weight_loss_speed === 'moderate') {
        dailyCalories *= 0.8;
      } else if (quizData.weight_loss_speed === 'slow') {
        dailyCalories *= 0.9;
      }

      // bodyFat also depends on `quizData.gender`
      const bodyFat = calculateBodyFat(
        quizData.gender, // gender might be missing
        quizData.height,
        quizData.waist_circumference,
        quizData.neck_circumference,
        quizData.hip_circumference
      );

      const finalDataToSubmit = {
        ...quizData,
        age: age,
        body_fat_percentage: bodyFat !== null ? parseFloat(bodyFat.toFixed(1)) : null,
        bmr: Math.round(bmr),
        daily_calories: Math.round(dailyCalories),
        quiz_completed: false, // Updated to false; quiz completion will be managed later for trial setup
      };

      await base44.auth.updateMe(finalDataToSubmit);
      
      localStorage.removeItem('quizData');
      
      // Reindirizza alla home page per login/registrazione, non più alla Dashboard direttamente
      navigate(createPageUrl('Home'), { replace: true });
      
    } catch (error) {
      console.error("Error saving quiz data:", error); // Updated error message
      alert("Si è verificato un errore durante il salvataggio dei dati. Riprova.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-[var(--brand-primary)] animate-bounce" />
        <p className="ml-4 text-lg text-gray-700">Caricamento...</p>
      </div>
    );
  }

  const CurrentStepComponent = dynamicSteps[currentStep]?.component;
  const currentStepLabel = dynamicSteps[currentStep]?.label;

  if (!CurrentStepComponent && !isCalculating && !showBodyFatReveal) {
    return null;
  }

  // Schermata Massa Grassa Blurrata - UI COMPLETAMENTE RIDISEGNATA
  if (showBodyFatReveal) {
    const bodyFat = calculateBodyFat(
      quizData.gender,
      quizData.height,
      quizData.waist_circumference,
      quizData.neck_circumference,
      quizData.hip_circumference
    );

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

          * {
            font-family: 'Inter', sans-serif;
          }

          :root {
            --brand-primary: #26847F;
            --brand-primary-hover: #1f6b66;
            --brand-primary-light: #e9f6f5;
            --brand-primary-dark-text: #1a5753;
          }

          @keyframes gradientShift {
            0% {
              background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
            }
            33% {
              background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%;
            }
            66% {
              background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%;
            }
            100% {
              background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
            }
          }
          
          .animated-gradient-bg {
            background: #f9fafb;
            background-image: 
              radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
              radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
              radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, #f3e8ff 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
              radial-gradient(circle at 90% 85%, #faf5ff 0%, transparent 50%);
            background-size: 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%;
            animation: gradientShift 45s ease-in-out infinite;
            background-attachment: fixed;
          }
        `}</style>
        
        <div className="min-h-screen flex items-center justify-center p-4 animated-gradient-bg">
          <Card className="max-w-2xl w-full bg-white/90 backdrop-blur-xl border-2 border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 md:p-12">
              {/* Icon + Title */}
              <div className="text-center mb-8">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #26847F 0%, #14b8a6 100%)' }}>
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black mb-3">
                  <span className="text-transparent bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    La Tua Massa Grassa
                  </span>
                </h1>
                
                <p className="text-base text-gray-700 font-medium max-w-lg mx-auto leading-relaxed">
                  Calcolata con <span className="font-bold text-[var(--brand-primary)]">formula scientifica US Navy</span>
                </p>
              </div>

              {/* Blurred Value with Text Above */}
              <div className="relative py-12 mb-8">
                <div className="text-center space-y-6">
                  <p className="text-2xl font-bold text-gray-900">
                    La tua massa grassa è di:
                  </p>
                  
                  <div className="relative inline-block">
                    <div className="text-7xl font-black text-gray-400 blur-xl select-none px-8">
                      {bodyFat !== null ? `${bodyFat.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <EyeOff className="w-5 h-5" />
                    <p className="text-sm">Accedi per scoprire il tuo risultato</p>
                  </div>
                </div>
              </div>

              {/* Info Boxes - più piccoli su mobile */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 md:p-6 rounded-2xl border-2 border-blue-200/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-blue-900 text-sm md:text-base">Analisi Completata</h4>
                  </div>
                  <p className="text-xs md:text-sm text-blue-800">
                    Abbiamo analizzato i tuoi dati fisici con precisione scientifica
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-6 rounded-2xl border-2 border-green-200/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-green-900 text-sm md:text-base">Piano Personalizzato</h4>
                  </div>
                  <p className="text-xs md:text-sm text-green-800">
                    Creeremo un percorso su misura per te basato su questi dati
                  </p>
                </div>
              </div>

              {/* CTA Button - icona solo a destra */}
              <Button
                onClick={handleRevealBodyFat}
                disabled={isSaving}
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Salvataggio in corso...
                  </>
                ) : (
                  <>
                    Scopri la tua Massa Grassa
                    <Sparkles className="w-5 h-5 ml-3" />
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 px-6 py-3 rounded-full border border-[var(--brand-primary)]/20">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <p className="text-xs text-gray-700 font-medium">
                    Metodo validato scientificamente dalla US Navy
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (isCalculating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: '#f9fafb',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
          radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
          radial-gradient(circle at 70% 60%, #f3e8ff 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
          radial-gradient(circle at 90% 85%, #faf5ff 0%, transparent 50%)
        `,
        backgroundAttachment: 'fixed'
      }}>
        <style>{`
          @keyframes progressAnimation {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
          
          .progress-bar-animated {
            animation: progressAnimation 5s ease-in-out forwards;
            width: 0%;
          }
        `}</style>
        
        <Card className="max-w-2xl w-full bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl text-center">
          <CardHeader>
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-[var(--brand-primary)] animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Elaborazione in corso...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-[var(--brand-primary)] rounded-full animate-bounce"></div>
                <p className="text-lg font-medium">Calcolo massa grassa in corso</p>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <p className="text-lg font-medium">Analisi metabolismo basale</p>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-[var(--brand-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <p className="text-lg font-medium">Preparazione piano nutrizionale personalizzato</p>
              </div>
            </div>
            
            <div className="mt-8 space-y-2">
              <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="progress-bar-animated h-full rounded-full"
                  style={{ 
                    background: 'linear-gradient(to right, #26847F, #14b8a6)',
                    boxShadow: '0 0 15px rgba(38, 132, 127, 0.8)'
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">Attendere qualche secondo...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', sans-serif;
        }

        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5753;
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
          33% {
            background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%;
          }
          66% {
            background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%;
          }
          100% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
        }
        
        .animated-gradient-bg {
          background: #f9fafb;
          background-image: 
            radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
            radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, #f3e8ff 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
            radial-gradient(circle at 90% 85%, #faf5ff 0%, transparent 50%);
          background-size: 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%;
          animation: gradientShift 45s ease-in-out infinite;
          background-attachment: fixed;
        }

        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="water-glass-effect rounded-full px-6 py-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-6"
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-20 px-4">
        <div className="max-w-2xl w-full">
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 border-b border-gray-100">
              {/* Progress Bar e Counter DENTRO il Card */}
              <div className="mb-4"> {/* Changed mb-6 to mb-4 */}
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 rounded-full transition-all duration-500 ease-out shadow-md"
                    style={{ width: `${((currentStep + 1) / dynamicSteps.length) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent">
                      {currentStep + 1}
                    </span>
                    <span className="text-gray-400 font-medium">/</span>
                    <span className="text-lg font-bold text-gray-600">
                      {dynamicSteps.length}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 font-medium ml-2">domande completate</span>
                </div>
              </div>
              {/* Removed CardTitle from here */}
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-6">
              <CurrentStepComponent
                data={quizData}
                onDataChange={handleStepData}
                onNext={nextStep}
              />
            </CardContent>
          </Card>

          {/* Bottoni di navigazione SOTTO il box */}
          <div className="flex justify-between items-center mt-6">
            {currentStep > 0 ? (
              <Button
                variant="ghost"
                onClick={prevStep}
                className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Indietro
              </Button>
            ) : (
              <div></div>
            )}
            
            {/* Bottone Avanti - disabilitato se step non valido */}
            {currentStep > 0 && (
              <Button
                onClick={nextStep}
                disabled={!isCurrentStepValid()}
                className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avanti
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            )}
            {/* Special case for IntroStep to allow advancing (kept for functionality) */}
            {currentStep === 0 && (
                <Button
                    onClick={nextStep}
                    disabled={!isCurrentStepValid()}
                    className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                    Avanti
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}