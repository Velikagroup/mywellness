import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, EyeOff, CheckCircle2, Loader2, ArrowLeft, LogIn } from "lucide-react";

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
  const isRecalibrateFlow = urlParams.get('from') === 'dashboard';


  const [currentStep, setCurrentStep] = useState(urlStep);
  const [quizData, setQuizData] = useState(() => {
    const saved = localStorage.getItem(`quizData_${language}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showBodyFatReveal, setShowBodyFatReveal] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [quizActivityTracked, setQuizActivityTracked] = useState(false);

  useEffect(() => {
    const completeSetupAfterLogin = async () => {
      console.log('🔄 Check post-login setup...');
      const quizDataToSave = localStorage.getItem(`quizDataToSave_${language}`);
      const needsTrialSetup = localStorage.getItem('needsTrialSetup');
      
      console.log('📦 quizDataToSave:', !!quizDataToSave, 'needsTrialSetup:', !!needsTrialSetup);
      
      if (quizDataToSave && needsTrialSetup) {
        setIsLoadingUser(true);
        
        try {
          const isAuthenticated = await base44.auth.isAuthenticated();
          console.log('✅ Authenticated:', isAuthenticated);
          
          if (!isAuthenticated) {
            console.log('❌ Not authenticated, waiting...');
            setIsLoadingUser(false);
            return;
          }
          
          const currentUser = await base44.auth.me();
          console.log('👤 User:', currentUser?.email);
          
          if (currentUser) {
            const dataToSave = JSON.parse(quizDataToSave);
            console.log('💾 Saving quiz data to user...');
            await base44.auth.updateMe(dataToSave);

            const today = new Date().toISOString().split('T')[0];
            try {
              await base44.entities.WeightHistory.create({
                user_id: currentUser.id,
                weight: dataToSave.current_weight,
                date: today
              });
            } catch (weightError) {
              console.warn('⚠️ Weight already exists:', weightError);
            }

            localStorage.removeItem(`quizDataToSave_${language}`);
            localStorage.removeItem('needsTrialSetup');
            localStorage.removeItem(`quizData_${language}`);

            console.log('✅ Setup complete, redirecting to PostQuizSubscription...');
            const langPageMap = {
              it: 'itpostquizsubscription',
              en: 'enpostquizsubscription',
              es: 'espostquizsubscription',
              pt: 'ptpostquizsubscription',
              de: 'depostquizsubscription',
              fr: 'frpostquizsubscription'
            };
            const targetPage = langPageMap[language] || 'itpostquizsubscription';
            navigate(createPageUrl(targetPage), { replace: true });
            return;
          }
        } catch (error) {
          console.error('❌ Error in post-login setup:', error);
          localStorage.removeItem(`quizDataToSave_${language}`);
          localStorage.removeItem('needsTrialSetup');
        }
        
        setIsLoadingUser(false);
      }
    };
    
    const timer = setTimeout(() => completeSetupAfterLogin(), 500);
    return () => clearTimeout(timer);
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
        
        // Se ha completato il quiz e ha subscription attiva/trial → Dashboard
        if (currentUser && currentUser.quiz_completed) {
          const hasActiveSubscription = currentUser.subscription_status === 'active' || 
                                        currentUser.subscription_status === 'trial';
          
          if (hasActiveSubscription) {
            navigate(createPageUrl('Dashboard'), { replace: true });
            return;
          } else {
            // Se ha completato quiz ma NO subscription → vai a PostQuizSubscription localizzata
            const userLanguage = currentUser.preferred_language || language;
            const langPageMap = {
              it: 'itpostquizsubscription',
              en: 'enpostquizsubscription',
              es: 'espostquizsubscription',
              pt: 'ptpostquizsubscription',
              de: 'depostquizsubscription',
              fr: 'frpostquizsubscription'
            };
            const targetPage = langPageMap[userLanguage] || 'itpostquizsubscription';
            navigate(createPageUrl(targetPage), { replace: true });
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
  }, [navigate, isRecalibrateFlow, language]);

  const handleRestore = async () => {
    const langQuizMap = {
      it: 'itquiz',
      en: 'enquiz',
      es: 'esquiz',
      pt: 'ptquiz',
      de: 'dequiz',
      fr: 'frquiz'
    };
    const quizPage = langQuizMap[language] || 'itquiz';
    const nextUrl = window.location.origin + createPageUrl(quizPage);
    await base44.auth.redirectToLogin(nextUrl);
  };

  useEffect(() => {
    if (!isLoadingUser && !quizActivityTracked) {
      const trackQuizStarted = async () => {
        try {
          const userIdentifier = user?.email || quizData.email || 'anonymous';
          await base44.entities.UserActivity.create({
            user_id: userIdentifier,
            event_type: 'quiz_started',
            event_data: { step: currentStep, language: language }
          });
          setQuizActivityTracked(true);
        } catch (error) {
          console.error('Error tracking quiz start:', error);
        }
      };
      
      trackQuizStarted();
    }
  }, [isLoadingUser, quizActivityTracked, language]);

  // dynamicSteps calcolato in modo derivato — nessuno stato separato
  const dynamicSteps = React.useMemo(
    () => buildDynamicSteps(translations, quizData),
    [quizData, translations]
  );

  useEffect(() => {
    localStorage.setItem(`quizData_${language}`, JSON.stringify(quizData));
  }, [quizData, language]);

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


        } catch (error) {
          console.error('Error tracking quiz completion:', error);
        }
      };
      
      trackQuizCompleted();
      setIsCalculating(true);

      setTimeout(() => {
        if (isRecalibrateFlow) {
          // In recalibrate flow: prima nascondi il calculating, poi chiama handleRevealBodyFat
          setIsCalculating(false);
          // Usiamo un piccolo delay per permettere il re-render prima di navigare
          setTimeout(() => handleRevealBodyFat(), 50);
        } else {
          // Prima imposta showBodyFatReveal, POI nascondi isCalculating
          // così il componente non passa mai per uno stato con currentStep out-of-bounds
          setShowBodyFatReveal(true);
          setIsCalculating(false);
        }
      }, 5500);
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

        // Add influencer referral data if present
        const influencerCode = localStorage.getItem('influencerReferralCode');
        const influencerId = localStorage.getItem('influencerId');
        if (influencerCode && influencerId) {
          userDataToSave.influencer_referral_code = influencerCode;
          userDataToSave.influencer_id = influencerId;
        }

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
      
      // Redirect to login con pagina quiz localizzata corretta
      const langQuizMap = {
        it: 'itquiz',
        en: 'enquiz',
        es: 'esquiz',
        pt: 'ptquiz',
        de: 'dequiz',
        fr: 'frquiz'
      };
      const quizPage = langQuizMap[language] || 'itquiz';
      const nextUrl = window.location.origin + createPageUrl(quizPage);
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

      // Get influencer data from localStorage before creating userDataToSave
      const savedInfluencerCode = localStorage.getItem('influencerReferralCode');
      const savedInfluencerId = localStorage.getItem('influencerId');

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

      // Add influencer referral data if present
      if (savedInfluencerCode && savedInfluencerId) {
        userDataToSave.influencer_referral_code = savedInfluencerCode;
        userDataToSave.influencer_id = savedInfluencerId;
      }

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

      // 📬 Sync utente con Resend Audience
      try {
        console.log('📬 Syncing user to Resend audience...');
        await base44.functions.invoke('syncUserToResend', {
          user_email: user.email,
          full_name: user.full_name || 'User'
        });
        console.log(`✅ User ${user.email} synced to Resend`);
      } catch (resendError) {
        console.error('⚠️ Resend sync failed:', resendError.message);
      }

      // Traccia affiliate se presente
      const affiliateCode = localStorage.getItem('affiliateCode');
      if (affiliateCode) {
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

            await base44.auth.updateMe({
              referred_by_affiliate_code: affiliateCode
            });
          }
        } catch (affError) {
          console.warn('⚠️ Affiliate tracking error:', affError);
        }

        localStorage.removeItem('affiliateCode');
      }

      // Traccia influencer referral se presente
      const influencerCode = localStorage.getItem('influencerReferralCode');
      const influencerId = localStorage.getItem('influencerId');
      console.log('🔍 ACCESSI CHECK - influencerCode:', influencerCode, 'influencerId:', influencerId);
      
      if (influencerCode && influencerId) {
        try {
          console.log('📝 Updating user with influencer data...');
          await base44.auth.updateMe({
            influencer_referral_code: influencerCode,
            influencer_id: influencerId
          });
          console.log('✅ User updated with influencer data');

          // Track: Step 2 - Email registrata con codice referral
          try {
            console.log('🎯 Calling trackInfluencerEvent for email_registered...');
            const result = await base44.functions.invoke('trackInfluencerEvent', {
              influencerId: influencerId,
              eventType: 'email_registered'
            });
            console.log(`✅ Email registered tracked for influencer: ${influencerId}`, result);
          } catch (trackError) {
            console.error('❌ Error tracking email registration:', trackError);
            alert(`DEBUG: Email registration tracking failed - ${trackError.message}`);
          }
        } catch (infError) {
          console.warn('⚠️ Influencer tracking error:', infError);
          alert(`DEBUG: Influencer update failed - ${infError.message}`);
        }

        localStorage.removeItem('influencerReferralCode');
        localStorage.removeItem('influencerId');
      } else {
        console.log('⚠️ No influencer code/id found - skipping email_registered tracking');
      }
      
      localStorage.removeItem(`quizData_${language}`);
      localStorage.removeItem(`quizDataToSave_${language}`);
      localStorage.removeItem('needsTrialSetup');

      // Vai alla pagina di subscription localizzata
      const langPageMap = {
        it: 'itpostquizsubscription',
        en: 'enpostquizsubscription',
        es: 'espostquizsubscription',
        pt: 'ptpostquizsubscription',
        de: 'depostquizsubscription',
        fr: 'frpostquizsubscription'
      };
      const targetPage = langPageMap[language] || 'itpostquizsubscription';
      navigate(createPageUrl(targetPage), { replace: true });
      
    } catch (error) {
      console.error("Error saving quiz data:", error);
      alert(t?.quizSaveError || "Error saving data. Please try again.");
      setIsSaving(false);
    }
  };

  // ✅ Check stati speciali PRIMA di qualsiasi accesso a dynamicSteps[currentStep]
  if (isCalculating) {
    return <CalculatingStep translations={translations} />;
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-[var(--brand-primary)] animate-bounce" />
        <p className="ml-4 text-lg text-gray-700">{t?.loading || 'Loading...'}</p>
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

  const CurrentStepComponent = dynamicSteps[currentStep]?.component || null;

  if (!CurrentStepComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-[var(--brand-primary)] animate-bounce" />
      </div>
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

      {!isRecalibrateFlow && (
        <button
          onClick={handleRestore}
          className="fixed top-10 right-6 z-50 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Restore
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
        {CurrentStepComponent && (
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
        )}
      </QuizStepWrapper>
    </div>
  );
}