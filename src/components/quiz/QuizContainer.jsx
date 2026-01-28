import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, EyeOff, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

import IntroStep from './IntroStep';
import BirthdateStep from './BirthdateStep';
import HeightWeightStep from './HeightWeightStep';
import TargetWeightStep from './TargetWeightStep';
import WeightDifferenceStep from './WeightDifferenceStep';
import WeightLossSpeedStep from './WeightLossSpeedStep';

import CurrentBodyTypeStep from './CurrentBodyTypeStep';
import TargetZoneStep from './TargetZoneStep';
import TargetBodyTypeStep from './TargetBodyTypeStep';
import AIComparisonStep from './AIComparisonStep';
import ObstaclesStep from './ObstaclesStep';
import DietSpecificStep from './DietSpecificStep';
import GoalsStep from './GoalsStep';
import WeightPotentialStep from './WeightPotentialStep';
import TrustStep from './TrustStep';
import ReferralCodeStep from './ReferralCodeStep';
import ReadyToGenerateStep from './ReadyToGenerateStep';
import CalculatingStep from './CalculatingStep';
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

function buildDynamicSteps(translations, quizData) {
        const steps = [
          { component: IntroStep, label: translations?.quiz?.quizIntroTitle || "Welcome" },
          { component: BirthdateStep, label: translations?.quiz?.quizBirthdateTitle || "Birthdate" },
          { component: HeightWeightStep, label: translations?.quiz?.quizHeightWeightTitle || "Height & Weight" },
          { component: TargetWeightStep, label: translations?.quiz?.quizTargetWeightTitle || "Target Weight" },
          { component: WeightDifferenceStep, label: translations?.quiz?.quizWeightDifferenceTitle || "Weight Difference" }
        ];

        // Add WeightLossSpeedStep only if losing weight (target < current)
        const isLosingWeight = (quizData.target_weight || 0) < (quizData.current_weight || 0);
        if (isLosingWeight) {
          steps.push({ component: WeightLossSpeedStep, label: translations?.quiz?.quizWeightLossSpeedTitle || "Weight Loss Speed" });
          steps.push({ component: AIComparisonStep, label: translations?.quiz?.aiComparisonTitle || "AI Comparison" });
        }

        steps.push(
                  { component: CurrentBodyTypeStep, label: translations?.quiz?.quizCurrentBodyTypeTitle || "Current Body Type" },
                  { component: TargetZoneStep, label: translations?.quiz?.quizTargetZoneTitle || "Target Zone" },
                  { component: TargetBodyTypeStep, label: translations?.quiz?.quizTargetBodyTypeTitle || "Target Body Type" },
                  { component: ObstaclesStep, label: translations?.quiz?.quizObstaclesTitle || "Obstacles" },
                  { component: DietSpecificStep, label: translations?.quiz?.quizDietSpecificTitle || "Diet" },
                  { component: GoalsStep, label: translations?.quiz?.quizGoalsTitle || "Goals" },
                  { component: WeightPotentialStep, label: translations?.quiz?.quizWeightPotentialTitle || "Weight Potential" },
                  { component: TrustStep, label: translations?.quiz?.quizTrustTitle || "Trust" },
                  { component: ReferralCodeStep, label: translations?.quiz?.quizReferralTitle || "Referral Code" },
                  { component: ReadyToGenerateStep, label: translations?.quiz?.quizReadyTitle || "Ready" }
                );

                return steps;
}

export default function QuizContainer({ translations, language = 'it' }) {
  const navigate = useNavigate();
  const t = translations;
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlStep = parseInt(urlParams.get('step')) || 0;
  const isRecapMode = urlParams.get('mode') === 'recap';
  const isRecalibrateFlow = urlParams.get('from') === 'dashboard';
  
  console.log('🔍 Quiz URL Params:', {
    from: urlParams.get('from'),
    mode: urlParams.get('mode'),
    isRecalibrateFlow,
    isRecapMode,
    fullURL: window.location.search
  });

  const [currentStep, setCurrentStep] = useState(urlStep);
  const [quizData, setQuizData] = useState(() => {
    const saved = localStorage.getItem(`quizData_${language}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicSteps, setDynamicSteps] = useState(() => buildDynamicSteps(translations, {}));
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
    setDynamicSteps(buildDynamicSteps(translations, quizData));
  }, [quizData, language, translations]);

  const isCurrentStepValid = () => {
    const stepComponent = dynamicSteps[currentStep]?.component;

    if (stepComponent === IntroStep) return !!quizData.gender;
    if (stepComponent === BirthdateStep) return !!quizData.birthdate;
    if (stepComponent === HeightWeightStep) return !!quizData.height && quizData.height > 0 && !!quizData.current_weight && quizData.current_weight > 0;
    if (stepComponent === TargetWeightStep) return !!quizData.target_weight && quizData.target_weight > 0;
    if (stepComponent === WeightDifferenceStep) return true;
    if (stepComponent === CurrentBodyTypeStep) return !!quizData.current_body_fat_visual;
    if (stepComponent === TargetBodyTypeStep) return !!quizData.target_body_fat_visual;
    if (stepComponent === TargetZoneStep) return !!quizData.target_zones && quizData.target_zones.length > 0;
    if (stepComponent === WeightLossSpeedStep) return true; // Always valid - has default
    if (stepComponent === AIComparisonStep) return true;
    if (stepComponent === TrustStep) return true;
    if (stepComponent === ReferralCodeStep) return true;
    if (stepComponent === ReadyToGenerateStep) return true;

    return true;
  };

  const handleStepData = (data) => {
    setQuizData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < dynamicSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Preserva il parametro from=dashboard se presente
      const searchParams = new URLSearchParams();
      searchParams.set('step', newStep);
      if (isRecalibrateFlow) {
        searchParams.set('from', 'dashboard');
      }
      window.history.pushState({}, '', `?${searchParams.toString()}`);
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
      
      // Preserva il parametro from=dashboard se presente
      const searchParams = new URLSearchParams();
      searchParams.set('step', newStep);
      if (isRecalibrateFlow) {
        searchParams.set('from', 'dashboard');
      }
      window.history.pushState({}, '', `?${searchParams.toString()}`);
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

  console.log('🔍 Quiz Render:', { 
    currentStep, 
    hasComponent: !!CurrentStepComponent, 
    isCalculating, 
    showBodyFatReveal,
    totalSteps: dynamicSteps.length 
  });

  if (!CurrentStepComponent && !isCalculating && !showBodyFatReveal) {
    console.warn('⚠️ No component to render - returning to step 0');
    setCurrentStep(0);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-[var(--brand-primary)] animate-bounce" />
      </div>
    );
  }

  if (showBodyFatReveal) {
    const isLosingWeight = (quizData.target_weight || 0) < (quizData.current_weight || 0);
    const weightDifference = Math.abs((quizData.current_weight || 0) - (quizData.target_weight || 0));

    // Calculate target date if losing weight
    let targetDate = null;
    if (isLosingWeight && quizData.weight_loss_speed) {
      const weeksToGoal = weightDifference / (quizData.weight_loss_speed === 'very_fast' ? 1 : 
                                               quizData.weight_loss_speed === 'moderate' ? 0.75 : 0.5);
      const daysToGoal = Math.round(weeksToGoal * 7);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysToGoal);
      targetDate = futureDate;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white pb-32">
        <div className="max-w-md w-full space-y-6 py-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {t?.quiz?.quizPlanReadyTitle || '¡Enhorabuena tu plan personalizado está listo!'}
            </h1>
          </div>

          {/* Weight Goal */}
          <div className="text-center space-y-2 py-4">
            <p className="text-lg font-bold text-gray-900">
              {isLosingWeight 
                ? (t?.quiz?.quizShouldLose || 'Deberías perder:')
                : (t?.quiz?.quizShouldGain || 'Deberías ganar:')}
            </p>
            <p className="text-base font-medium text-gray-700">
              {isLosingWeight && targetDate
                ? `${t?.quiz?.quizLose || 'Pierde'} ${weightDifference.toFixed(0)} kg ${t?.quiz?.quizFor || 'para'} ${targetDate.toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}`
                : `${weightDifference.toFixed(0)} kg`}
            </p>
          </div>

          {/* Body Fat Box */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 relative overflow-hidden text-center">
            <div className="relative z-10">
              <p className="text-lg font-bold text-gray-900 mb-2">
                {t?.quiz?.quizDiscoverBodyFat || 'Scopri la tua massa grassa'}
              </p>
              <div className="text-4xl font-black text-gray-400 blur-xl">
                24.5%
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                <EyeOff className="w-6 h-6 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">{t?.quiz?.quizLoginToDiscover || 'Accedi per scoprire'}</p>
              </div>
            </div>
          </div>

          {/* Personalized Type Section */}
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {t?.quiz?.quizPersonalizedType || 'Tipo personalizado'}
              </h2>
              <p className="text-sm text-gray-500">
                {t?.quiz?.quizCanEditAnytime || 'Puedes editar esto en cualquier momento'}
              </p>
            </div>

            {/* Blurred Macros Grid */}
            <div className="grid grid-cols-2 gap-4 justify-items-center">
              {/* Calories */}
              <div className="relative flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔥</span>
                  <span className="text-sm font-semibold text-gray-900">{t?.quiz?.quizCalories || 'Calorías'}</span>
                </div>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-8 border-gray-200 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-400 blur-sm">1526</span>
                  </div>
                  <EyeOff className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                </div>
              </div>

              {/* Carbs */}
              <div className="relative flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🌾</span>
                  <span className="text-sm font-semibold text-gray-900">{t?.quiz?.quizCarbs || 'Hidratos'}</span>
                </div>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-8 border-orange-200 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-400 blur-sm">142g</span>
                  </div>
                  <EyeOff className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                </div>
              </div>

              {/* Protein */}
              <div className="relative flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🥩</span>
                  <span className="text-sm font-semibold text-gray-900">{t?.quiz?.quizProtein || 'Proteína'}</span>
                </div>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-8 border-red-200 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-400 blur-sm">144g</span>
                  </div>
                  <EyeOff className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                </div>
              </div>

              {/* Fats */}
              <div className="relative flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🥑</span>
                  <span className="text-sm font-semibold text-gray-900">{t?.quiz?.quizFats || 'Grasas'}</span>
                </div>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-8 border-blue-200 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-400 blur-sm">42g</span>
                  </div>
                  <EyeOff className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed CTA Button - Mobile: 20px, Desktop: 200px */}
        <div className="fixed bottom-5 md:bottom-[200px] left-1/2 transform -translate-x-1/2 px-4 z-50 w-full max-w-md">
          <Button
            onClick={handleRevealBodyFat}
            disabled={isSaving}
            className="w-full h-14 bg-gray-900 hover:bg-gray-950 text-white text-base font-bold rounded-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t?.quiz?.quizSaving || 'Guardando...'}
              </>
            ) : (
              t?.quiz?.quizDiscoverNow || 'Scoprilo subito'
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (isCalculating) {
    return (
      <CalculatingStep translations={translations} />
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
          onPrev={prevStep}
          currentStep={currentStep}
          totalSteps={dynamicSteps.length}
          translations={translations}
          t={t}
        />
      </QuizStepWrapper>
    </div>
  );
}