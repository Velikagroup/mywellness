import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';
import { AlertCircle } from 'lucide-react';

// Helper functions
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

export default function WeightLossSpeedStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};
  
  // Speed ranges: slow (0.3), moderate (0.75), recommended (1.0), fast (1.3)
  const [sliderValue, setSliderValue] = useState(75); // 0-100 scale, starts at recommended
  const [selectedSpeed, setSelectedSpeed] = useState('moderate');

  useEffect(() => {
    if (data.weight_loss_speed) {
      const speedMap = { slow: 25, lightly_active: 50, moderate: 75, very_active: 90 };
      setSliderValue(speedMap[data.weight_loss_speed] || 75);
      setSelectedSpeed(data.weight_loss_speed);
    }
  }, []);

  // Calculate weekly weight loss based on slider
  const calculateWeeklyLoss = (value) => {
    // 0-25: Slow (0.25-0.5 kg/week)
    // 25-75: Moderate (0.5-1.0 kg/week)
    // 75-100: Fast (1.0-1.5 kg/week)
    
    if (value <= 25) {
      return 0.25 + (value / 25) * 0.25; // 0.25-0.5
    } else if (value <= 75) {
      return 0.5 + ((value - 25) / 50) * 0.5; // 0.5-1.0
    } else {
      return 1.0 + ((value - 75) / 25) * 0.5; // 1.0-1.5
    }
  };

  // Determine speed category for styling
  const getSpeedCategory = (value) => {
    if (value < 40) return 'slow';
    if (value < 65) return 'moderate';
    return 'fast';
  };

  const weeklyLoss = calculateWeeklyLoss(sliderValue);
  const speedCategory = getSpeedCategory(sliderValue);
  
  // Calculate months to goal
  const weightDiff = Math.abs((data.current_weight || 81) - (data.target_weight || 70));
  const monthsToGoal = Math.ceil((weightDiff / weeklyLoss) / 4.33);

  // Calculate daily calories based on user data
  const age = data.age || calculateAge(data.birthdate) || 30;
  const bmr = calculateBMR(data.current_weight || 81, data.height || 174, age, data.gender || 'male');
  const activityMultiplier = 1.5; // Lightly active
  const tdee = bmr * activityMultiplier;
  
  // Calcola calorie basandosi sulla velocità
  let dailyCalories;
  if (speedCategory === 'slow') {
    // Lento: 2000-2200 kcal (deficit minimo 10-15%)
    dailyCalories = Math.round(tdee * 0.85);
  } else if (speedCategory === 'fast') {
    // Veloce: 1400-1600 kcal (deficit ~25-30%)
    dailyCalories = Math.round(tdee * 0.70);
  } else {
    // Moderato: ~1700-1900 kcal (deficit ~20%)
    dailyCalories = Math.round(tdee * 0.80);
  }

  // Get messages and icons based on speed
  const getSpeedInfo = () => {
    if (speedCategory === 'slow') {
      return {
        icon: '🐢',
        label: t.slow || 'Lento',
        color: 'text-gray-700',
        description: t.slowDesc || 'Going slow means a gentler and more sustainable daily calorie goal.',
        warningText: ''
      };
    } else if (speedCategory === 'fast') {
      return {
        icon: '🏃',
        label: t.fast || 'Rápido',
        color: 'text-orange-600',
        description: t.fastDesc || 'This pace moves quickly, staying consistent will be key.',
        warningText: t.fastWarning || 'Fast loss can cause fatigue or loose skin.'
      };
    } else {
      return {
        icon: '🐇',
        label: t.recommended || 'Recomendado',
        color: 'text-gray-900',
        description: t.moderateDesc || 'This is the most balanced pace, motivating and ideal for most users.',
        warningText: ''
      };
    }
  };

  const speedInfo = getSpeedInfo();

  const handleSliderChange = (value) => {
    const newValue = value[0];
    setSliderValue(newValue);
    
    // Determine speed level for storage
    let speedLevel;
    if (newValue < 40) {
      speedLevel = 'slow';
    } else if (newValue < 65) {
      speedLevel = 'moderate';
    } else {
      speedLevel = 'fast';
    }
    setSelectedSpeed(speedLevel);
  };

  const handleNext = () => {
    onDataChange({
      weight_loss_speed: selectedSpeed,
      weekly_weight_loss: parseFloat(weeklyLoss.toFixed(2)),
      months_to_goal: monthsToGoal,
      target_daily_calories: dailyCalories
    });

    if (onNext) onNext();
  };

  return (
    <div className="space-y-6 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pt-20">
      <QuizHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />

      <QuizQuestionHeader
        title={t.quizWeightLossSpeedTitle || "¿Qué tan rápido quieres alcanzar tu objetivo?"}
        subtitle={t.quizWeightLossSpeedSubtitle || ""}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 space-y-8">
        
        {/* Weekly Loss Display */}
        <div className="text-center space-y-2">
          <p className="text-gray-600 text-sm">{t.weeklyLossRate || 'Velocidad de pérdida de peso por semana'}</p>
          <p className="text-5xl font-bold text-gray-900">{weeklyLoss.toFixed(1)} <span className="text-2xl">kg</span></p>
        </div>

        {/* Icon Row */}
        <div className="flex items-end justify-between w-full gap-4 mt-8">
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">🐢</div>
            <p className="text-xs font-medium text-gray-700">{t.slow || 'Lento'}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">{speedCategory === 'moderate' ? '🐇' : '⚫'}</div>
            <p className="text-xs font-medium text-gray-900">{t.recommended || 'Recomendado'}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2" style={{ opacity: speedCategory === 'fast' ? 1 : 0.4 }}>🏃</div>
            <p className="text-xs font-medium" style={{ color: speedCategory === 'fast' ? '#ea580c' : '#9ca3af' }}>{t.fast || 'Rápido'}</p>
          </div>
        </div>

        {/* Slider */}
        <div className="w-full px-2">
          <Slider
            value={[sliderValue]}
            onValueChange={handleSliderChange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Info Box */}
        <div className="w-full space-y-3 mt-8">
          <div className="text-center">
            <p className="text-sm text-gray-700">
              {t.youWillReachGoal || 'Alcanzarás tu objetivo en'} <span className="font-bold text-[#26847F]">{monthsToGoal} {monthsToGoal === 1 ? t.month || 'month' : t.months || 'months'}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">{speedInfo.description}</p>
          </div>

          {/* Daily Calories */}
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <p className="text-xs text-gray-600 mb-1">{t.dailyCalorieGoal || 'Objetivo calórico diario'}</p>
            <p className="text-2xl font-bold text-gray-900">{dailyCalories} <span className="text-sm">kcal</span></p>
          </div>

          {/* Warning */}
          {speedInfo.warningText && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mt-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{speedInfo.warningText}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <Button
          onClick={handleNext}
          className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
        >
          {t.quizContinue || 'Continuar'}
        </Button>
      </div>
    </div>
  );
}