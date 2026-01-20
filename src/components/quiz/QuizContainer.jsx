import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, EyeOff, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

import IntroStep from './IntroStep';
import BirthdateStep from './BirthdateStep';
import HeightStep from './HeightStep';
import CurrentWeightStep from './CurrentWeightStep';
import TargetWeightStep from './TargetWeightStep';
import NeckCircumferenceStep from './NeckCircumferenceStep';
import WaistCircumferenceStep from './WaistCircumferenceStep';
import HipCircumferenceStep from './HipCircumferenceStep';
import CurrentBodyTypeStep from './CurrentBodyTypeStep';
import TargetZoneStep from './TargetZoneStep';
import WeightLossSpeedStep from './WeightLossSpeedStep';
import TargetBodyTypeStep from './TargetBodyTypeStep';
import QuizStepWrapper from './QuizStepWrapper';

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
  if (!height || !waist || !neck || waist <= neck) return null;

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

function buildDynamicSteps(translations) {
  return [
    { component: IntroStep, label: translations?.quiz?.quizIntroTitle || "Welcome" },
    { component: BirthdateStep, label: translations?.quiz?.quizBirthdateTitle || "Birthdate" },
    { component: HeightStep, label: translations?.quiz?.quizHeightTitle || "Height" },
    { component: CurrentWeightStep, label: translations?.quiz?.quizCurrentWeightTitle || "Current Weight" },
    { component: TargetWeightStep, label: translations?.quiz?.quizTargetWeightTitle || "Target Weight" },
    { component: NeckCircumferenceStep, label: translations?.quiz?.quizNeckTitle || "Neck Circumference" },
    { component: WaistCircumferenceStep, label: translations?.quiz?.quizWaistTitle || "Waist Circumference" },
    { component: HipCircumferenceStep, label: translations?.quiz?.quizHipTitle || "Hip Circumference" },
    { component: CurrentBodyTypeStep, label: translations?.quiz?.quizCurrentBodyTypeTitle || "Current Body Type" },
    { component: TargetZoneStep, label: translations?.quiz?.quizTargetZoneTitle || "Target Zone" },
    { component: WeightLossSpeedStep, label: translations?.quiz?.quizWeightLossSpeedTitle || "Weight Loss Speed" },
    { component: TargetBodyTypeStep, label: translations?.quiz?.quizTargetBodyTypeTitle || "Target Body Type" }
  ];
}

export default function QuizContainer({ translations, language = 'it' }) {
  const navigate = useNavigate();
  const t = translations;
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlStep = parseInt(urlParams.get('step')) || 0;
  const isRecapMode = urlParams.get('mode') === 'recap';
  const isRecalibrateFlow = urlParams.get('from') === 'dashboard';

  const [currentStep, setCurrentStep] = useState(urlStep);
  const [quizData, setQuizData] = useState(() => {
    const saved = localStorage.getItem(`quizData_${language}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicSteps, setDynamicSteps] = useState(() => buildDynamicSteps(translations));
  const [isCalculating, setIsCalculating] = useState(false);
  const [showBodyFatReveal, setShowBodyFatReveal] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [quizActivityTracked, setQuizActivityTracked] = useState(false);

  useEffect(() => {
    const completeSetupAfterLogin = async () => {
      const quizDataToSave = localStorage.getItem(`quizDataToSave_${language}`);
      const needsTrialSetup = localStorage.getItem('needsTrialSetup');
      
      if (quizDataToSave && needsTrialSetup) {
        setIsLoadingUser(true);
        
        try {
          const isAuthenticated = await base44.auth.isAuthenticated();
          
          if (!isAuthenticated) {
            setIsLoadingUser(false);
            return;
          }
          
          const currentUser = await base44.auth.me();
          
          if (currentUser) {
            const dataToSave = JSON.parse(quizDataToSave);
            await base44.auth.updateMe(dataToSave);
            
            const today = new Date().toISOString().split('T')[0];
            try {
              await base44.entities.WeightHistory.create({
                user_id: currentUser.id,
                weight: dataToSave.current_weight,
                date: today
              });
            } catch (weightError) {
              console.warn('⚠️ Weight already exists or error:', weightError);
            }
            
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 7);
            
            const affiliateCode = localStorage.getItem('affiliateCode');
            
            const updateData = {
              subscription_status: 'trial',
              subscription_plan: 'trial',
              trial_ends_at: trialEndsAt.toISOString()
            };
            
            if (affiliateCode) {
              updateData.referred_by_affiliate_code = affiliateCode;
              
              try {
                const affiliateLinks = await base44.entities.AffiliateLink.filter({ 
                  affiliate_code: affiliateCode.toUpperCase() 
                });
                
                if (affiliateLinks.length > 0) {
                  const affiliateLink = affiliateLinks[0];
                  
                  await base44.entities.AffiliateCredit.create({
                    affiliate_link_id: affiliateLink.id,
                    referrer_user_id: affiliateLink.user_id,
                    referred_user_id: currentUser.id,
                    referred_user_email: currentUser.email,
                    credit_type: 'signup',
                    credit_amount: 0,
                    status: 'pending'
                  });
                  
                  await base44.entities.AffiliateLink.update(affiliateLink.id, {
                    total_referrals: (affiliateLink.total_referrals || 0) + 1
                  });
                }
              } catch (affError) {
                console.warn('⚠️ Affiliate tracking error:', affError);
              }
            }
            
            await base44.auth.updateMe(updateData);

            try {
              await base44.functions.invoke('sendStandardFreeWelcome', {
                userId: currentUser.id,
                userEmail: currentUser.email,
                userName: currentUser.full_name || 'User'
              });
            } catch (emailError) {
              console.error('⚠️ Email error:', emailError);
            }

            localStorage.removeItem(`quizDataToSave_${language}`);
            localStorage.removeItem('needsTrialSetup');
            localStorage.removeItem(`quizData_${language}`);
            localStorage.removeItem('affiliateCode');

            navigate(createPageUrl('Dashboard'), { replace: true });
            return;
          }
        } catch (error) {
          console.error('Error completing post-login setup:', error);
          if (error?.response?.status === 401 || error?.message?.includes('401')) {
            setIsLoadingUser(false);
            return;
          }
          localStorage.removeItem(`quizDataToSave_${language}`);
          localStorage.removeItem('needsTrialSetup');
        }
        
        setIsLoadingUser(false);
      }
    };
    
    completeSetupAfterLogin();
  }, [navigate, language]);

  useEffect(() => {
    const loadUserData = async () => {
      const quizDataToSave = localStorage.getItem(`quizDataToSave_${language}`);
      const needsTrialSetup = localStorage.getItem('needsTrialSetup');
      
      if (quizDataToSave && needsTrialSetup) {
        return;
      }
      
      setIsLoadingUser(true);
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if ((isRecapMode || isRecalibrateFlow) && currentUser) {
          // ✅ Modalità ricalibrazione: pulisci localStorage e parti da zero
          localStorage.removeItem(`quizData_${language}`);
          setQuizData({ gender: currentUser.gender || '' });
          setCurrentStep(0);
        } else if (currentUser && currentUser.quiz_completed && !isRecapMode && !isRecalibrateFlow) {
          const hasActiveSubscription = currentUser.subscription_status === 'active' || 
                                        currentUser.subscription_status === 'trial';
          
          if (hasActiveSubscription) {
            navigate(createPageUrl('Dashboard'), { replace: true });
            return;
          } else {
            navigate(createPageUrl('pricing'), { replace: true });
            return;
          }
        }
        
      } catch (error) {
        if (error?.response?.status === 401 || error?.message?.includes('401')) {
          setUser(null);
          // ✅ Se non autenticato da app iOS, apri browser esterno per login
          const isCapacitor = window.location.protocol === 'capacitor:' || window.Capacitor !== undefined;
          if (isCapacitor) {
            console.log('📱 App iOS - apertura browser per login');
            const quizUrl = 'https://projectmywellness.com' + createPageUrl('Quiz');
            window.open(quizUrl, '_system');
          }
        } else {
          console.error('Error loading user:', error);
          setUser(null);
        }
      }
      setIsLoadingUser(false);
    };

    loadUserData();
  }, [navigate, isRecapMode, isRecalibrateFlow, language]);

  useEffect(() => {
    if (!isLoadingUser && !quizActivityTracked && currentStep === 1) {
      const trackQuizStarted = async () => {
        try {
          const userIdentifier = user?.email || quizData.email || 'anonymous';
          await base44.entities.UserActivity.create({
            user_id: userIdentifier,
            event_type: 'quiz_started',
            event_data: { step: currentStep }
          });
          setQuizActivityTracked(true);
        } catch (error) {
          console.error('Error tracking quiz start:', error);
        }
      };
      
      trackQuizStarted();
    }
  }, [currentStep, isLoadingUser, quizActivityTracked, user, quizData.email]);

  useEffect(() => {
    localStorage.setItem(`quizData_${language}`, JSON.stringify(quizData));
    setDynamicSteps(buildDynamicSteps(translations));
  }, [quizData, language, translations]);

  const isCurrentStepValid = () => {
    const stepComponent = dynamicSteps[currentStep]?.component;

    if (stepComponent === IntroStep) return !!quizData.gender;
    if (stepComponent === BirthdateStep) return !!quizData.birthdate;
    if (stepComponent === HeightStep) return !!quizData.height && quizData.height > 0;
    if (stepComponent === CurrentWeightStep) return !!quizData.current_weight && quizData.current_weight > 0;
    if (stepComponent === TargetWeightStep) return !!quizData.target_weight && quizData.target_weight > 0;
    if (stepComponent === NeckCircumferenceStep) return true;
    if (stepComponent === WaistCircumferenceStep) return true;
    if (stepComponent === HipCircumferenceStep) return true;
    if (stepComponent === CurrentBodyTypeStep) return !!quizData.current_body_fat_visual;
    if (stepComponent === TargetBodyTypeStep) return !!quizData.target_body_fat_visual;
    if (stepComponent === TargetZoneStep) return !!quizData.target_zones && quizData.target_zones.length > 0;
    if (stepComponent === WeightLossSpeedStep) return !!quizData.weight_loss_speed;

    return true;
  };

  const handleStepData = (data) => {
    setQuizData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < dynamicSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      window.history.pushState({}, '', `?step=${newStep}`);
    } else {
      const trackQuizCompleted = async () => {
        try {
          const userIdentifier = user?.email || quizData.email || 'anonymous';
          await base44.entities.UserActivity.create({
            user_id: userIdentifier,
            event_type: 'quiz_completed',
            event_data: { total_steps: dynamicSteps.length }
          });

          // 📊 TikTok Event: CompleteRegistration
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const ttclid = urlParams.get('ttclid');
            const ttp = urlParams.get('ttp');

            await base44.functions.invoke('sendTikTokEvent', {
              event: 'CompleteRegistration',
              email: user?.email,
              phone: user?.phone_number,
              external_id: user?.id,
              user_agent: navigator.userAgent,
              content_id: 'quiz',
              content_type: 'registration',
              content_name: 'Quiz Completed',
              url: window.location.href,
              ttclid: ttclid,
              ttp: ttp
            });
            console.log('✅ TikTok CompleteRegistration tracked');
          } catch (e) {
            console.warn('⚠️ TikTok tracking error:', e);
          }
        } catch (error) {
          console.error('Error tracking quiz completion:', error);
        }
      };
      
      trackQuizCompleted();
      setIsCalculating(true);
      
      setTimeout(async () => {
        if (isRecalibrateFlow) {
          await handleRevealBodyFat();
        } else {
          setIsCalculating(false);
          setShowBodyFatReveal(true);
        }
      }, 5000);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      window.history.pushState({}, '', `?step=${newStep}`);
    }
  };

  const handleRevealBodyFat = async () => {
    // ✅ Se è in modalità ricalibrazione da dashboard, salva i dati e torna alla dashboard
    if (isRecalibrateFlow && user && user.id) {
      setIsSaving(true);
      
      try {
        const age = quizData.age || calculateAge(quizData.birthdate);
        const bmr = calculateBMR(quizData.current_weight, quizData.height, age, quizData.gender);
        const activityMultiplier = getActivityMultiplier(quizData.activity_level || 'sedentary');
        let dailyCalories = bmr * activityMultiplier;

        if (quizData.weight_loss_speed === 'very_fast') dailyCalories *= 0.75;
        else if (quizData.weight_loss_speed === 'moderate') dailyCalories *= 0.8;
        else if (quizData.weight_loss_speed === 'slow') dailyCalories *= 0.9;

        const bodyFat = calculateBodyFat(
          quizData.gender, quizData.height, quizData.waist_circumference,
          quizData.neck_circumference, quizData.hip_circumference
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
          daily_calories: Math.round(dailyCalories)
        };

        await base44.auth.updateMe(userDataToSave);
        
        const today = new Date().toISOString().split('T')[0];
        try {
          await base44.entities.WeightHistory.create({
            user_id: user.id,
            weight: quizData.current_weight,
            date: today
          });
        } catch (weightError) {
          console.warn('⚠️ Weight error:', weightError);
        }
        
        localStorage.removeItem(`quizData_${language}`);
        
        navigate(createPageUrl('Dashboard'), { replace: true });
        return;
      } catch (error) {
        console.error("Error saving quiz data:", error);
        alert(t?.quizSaveError || "Error saving data. Please try again.");
        setIsSaving(false);
        return;
      }
    }
    
    if (!user || !user.id) {
      const age = quizData.age || calculateAge(quizData.birthdate);
      const bmr = calculateBMR(quizData.current_weight, quizData.height, age, quizData.gender);
      const activityMultiplier = getActivityMultiplier(quizData.activity_level || 'sedentary');
      let dailyCalories = bmr * activityMultiplier;

      if (quizData.weight_loss_speed === 'very_fast') dailyCalories *= 0.75;
      else if (quizData.weight_loss_speed === 'moderate') dailyCalories *= 0.8;
      else if (quizData.weight_loss_speed === 'slow') dailyCalories *= 0.9;

      const bodyFat = calculateBodyFat(
        quizData.gender, quizData.height, quizData.waist_circumference,
        quizData.neck_circumference, quizData.hip_circumference
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
        preferred_language: language
      };
      
      localStorage.setItem(`quizDataToSave_${language}`, JSON.stringify(userDataToSave));
      localStorage.setItem('needsTrialSetup', 'true');
      localStorage.setItem('preferred_language', language);
      
      // Redirect to login
      const nextUrl = window.location.origin + createPageUrl('Quiz');
      base44.auth.redirectToLogin(nextUrl);
      return;
    }
    
    setIsSaving(true);
    
    try {
      const age = quizData.age || calculateAge(quizData.birthdate);
      const bmr = calculateBMR(quizData.current_weight, quizData.height, age, quizData.gender);
      const activityMultiplier = getActivityMultiplier(quizData.activity_level || 'sedentary');
      let dailyCalories = bmr * activityMultiplier;

      if (quizData.weight_loss_speed === 'very_fast') dailyCalories *= 0.75;
      else if (quizData.weight_loss_speed === 'moderate') dailyCalories *= 0.8;
      else if (quizData.weight_loss_speed === 'slow') dailyCalories *= 0.9;

      const bodyFat = calculateBodyFat(
        quizData.gender, quizData.height, quizData.waist_circumference,
        quizData.neck_circumference, quizData.hip_circumference
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
        preferred_language: language
      };

      await base44.auth.updateMe(userDataToSave);
      
      const today = new Date().toISOString().split('T')[0];
      try {
        await base44.entities.WeightHistory.create({
          user_id: user.id,
          weight: quizData.current_weight,
          date: today
        });
      } catch (weightError) {
        console.warn('⚠️ Weight error:', weightError);
      }
      
      if (!isRecapMode) {
        try {
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 7);
          
          const affiliateCode = localStorage.getItem('affiliateCode');
          
          const updateData = {
            subscription_status: 'trial',
            subscription_plan: 'trial',
            trial_ends_at: trialEndsAt.toISOString()
          };
          
          if (affiliateCode) {
            updateData.referred_by_affiliate_code = affiliateCode;
            
            try {
              const affiliateLinks = await base44.entities.AffiliateLink.filter({ 
                affiliate_code: affiliateCode.toUpperCase() 
              });
              
              if (affiliateLinks.length > 0) {
                const affiliateLink = affiliateLinks[0];
                
                await base44.entities.AffiliateCredit.create({
                  affiliate_link_id: affiliateLink.id,
                  referrer_user_id: affiliateLink.user_id,
                  referred_user_id: user.id,
                  referred_user_email: user.email,
                  credit_type: 'signup',
                  credit_amount: 0,
                  status: 'pending'
                });
                
                await base44.entities.AffiliateLink.update(affiliateLink.id, {
                  total_referrals: (affiliateLink.total_referrals || 0) + 1
                });
              }
            } catch (affError) {
              console.warn('⚠️ Affiliate tracking error:', affError);
            }
            
            localStorage.removeItem('affiliateCode');
          }
          
          await base44.auth.updateMe(updateData);
          
          try {
            await base44.functions.invoke('sendStandardFreeWelcome', {
              userId: user.id,
              userEmail: user.email,
              userName: user.full_name || 'User'
            });
          } catch (emailError) {
            console.error('⚠️ Email error:', emailError);
          }
        } catch (error) {
          console.error('Error setting trial:', error);
        }
      }
      
      localStorage.removeItem(`quizData_${language}`);
      localStorage.removeItem(`quizDataToSave_${language}`);
      localStorage.removeItem('needsTrialSetup');
      
      navigate(createPageUrl('Dashboard'), { replace: true });
      
    } catch (error) {
      console.error("Error saving quiz data:", error);
      alert(t?.quizSaveError || "Error saving data. Please try again.");
      setIsSaving(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-[var(--brand-primary)] animate-bounce" />
        <p className="ml-4 text-lg text-gray-700">{t?.loading || 'Loading...'}</p>
      </div>
    );
  }

  const CurrentStepComponent = dynamicSteps[currentStep]?.component;

  if (!CurrentStepComponent && !isCalculating && !showBodyFatReveal) {
    return null;
  }

  if (showBodyFatReveal) {
    const bodyFat = calculateBodyFat(
      quizData.gender, quizData.height, quizData.waist_circumference,
      quizData.neck_circumference, quizData.hip_circumference
    );

    return (
      <>
        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%; }
            33% { background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%; }
            66% { background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%; }
            100% { background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%; }
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
            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 w-full">
              <div className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-400 w-full rounded-r-full" />
            </div>
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #26847F 0%, #14b8a6 100%)' }}>
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black mb-3">
                  <span className="text-transparent bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text">
                    {t?.quiz?.quizBodyFatTitle || 'Your Body Fat'}
                  </span>
                </h1>
                
                <p className="text-base text-gray-700 font-medium max-w-lg mx-auto leading-relaxed">
                  {t?.quiz?.quizBodyFatSubtitle || 'Calculated with scientific US Navy formula'}
                </p>
              </div>

              <div className="relative py-12 mb-8">
                <div className="text-center space-y-6">
                  <p className="text-2xl font-bold text-gray-900">
                    {t?.quiz?.quizBodyFatText || 'Your body fat is:'}
                  </p>
                  
                  <div className="relative inline-block">
                    <div className="text-7xl font-black text-gray-400 blur-xl select-none px-8">
                      {bodyFat !== null ? `${bodyFat.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <EyeOff className="w-5 h-5" />
                    <p className="text-sm">{t?.quiz?.quizUnlockText || 'Log in to see your result'}</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 md:p-6 rounded-2xl border-2 border-blue-200/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-blue-900 text-sm md:text-base">{t?.quiz?.quizAnalysisComplete || 'Analysis Complete'}</h4>
                  </div>
                  <p className="text-xs md:text-sm text-blue-800">
                    {t?.quiz?.quizAnalysisCompleteDesc || 'We analyzed your physical data with scientific precision'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-6 rounded-2xl border-2 border-green-200/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-green-900 text-sm md:text-base">{t?.quiz?.quizPlanReady || 'Personalized Plan'}</h4>
                  </div>
                  <p className="text-xs md:text-sm text-green-800">
                    {t?.quiz?.quizPlanReadyDesc || 'We will create a custom path for you based on this data'}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleRevealBodyFat}
                disabled={isSaving}
                style={{ backgroundColor: '#26847F', borderColor: '#26847F' }}
                className="w-full h-16 text-xl font-bold text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 border-0 hover:opacity-90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    {t?.quiz?.quizSaving || 'Saving...'}
                  </>
                ) : (
                  <>
                    {t?.quiz?.quizRevealButton || 'Discover Your Body Fat'}
                    <Sparkles className="w-5 h-5 ml-3" />
                  </>
                )}
              </Button>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 px-6 py-3 rounded-full border border-[var(--brand-primary)]/20">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <p className="text-xs text-gray-700 font-medium">
                    {t?.quiz?.quizScientificMethod || 'Scientifically validated US Navy method'}
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
      <>
        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%; }
            33% { background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%; }
            66% { background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%; }
            100% { background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%; }
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
          
          @keyframes progressFill {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          
          .progress-bar-animated {
            animation: progressFill 5s ease-out forwards;
          }
        `}</style>
        <div className="min-h-screen flex items-center justify-center p-4 animated-gradient-bg">
          <Card className="max-w-2xl w-full bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 w-full">
              <div className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-400 progress-bar-animated rounded-r-full" />
            </div>
            <CardHeader className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-[var(--brand-primary)] animate-spin" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {t?.quiz?.quizProcessing || 'Processing...'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-[var(--brand-primary)] rounded-full animate-bounce"></div>
                  <p className="text-lg font-medium">{t?.quiz?.quizCalcBodyFat || 'Calculating body fat'}</p>
                </div>
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <p className="text-lg font-medium">{t?.quiz?.quizCalcMetabolism || 'Analyzing basal metabolism'}</p>
                </div>
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-[var(--brand-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <p className="text-lg font-medium">{t?.quiz?.quizPreparingPlan || 'Preparing personalized nutrition plan'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      {isRecalibrateFlow && (
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur-sm hover:bg-white border-2 border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-[var(--brand-primary)] font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">{t?.common?.back || 'Back'}</span>
        </button>
      )}
      
      <QuizStepWrapper
        currentStep={currentStep}
        totalSteps={dynamicSteps.length}
        onNext={nextStep}
        onPrev={prevStep}
        isValid={isCurrentStepValid()}
        nextButtonText={t?.common?.next || 'Next'}
        backButtonText={t?.common?.back || 'Back'}
        showBackButton={currentStep > 0}
        showNextButton={true}
        translations={translations}
      >
        <CurrentStepComponent
          data={quizData}
          onDataChange={handleStepData}
          onNext={nextStep}
          translations={translations}
        />
      </QuizStepWrapper>
    </div>
  );
}