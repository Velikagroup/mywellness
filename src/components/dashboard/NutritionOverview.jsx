import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Utensils, ArrowRight, Calculator, ImageIcon, Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from '../i18n/LanguageContext';

export default function NutritionOverview({ meals, mealLogs = [], onMealSelect, onPhotoAnalyze, userPlan, onUpgradeClick, onMealComplete }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [savingMealId, setSavingMealId] = React.useState(null);

  const getMealLog = (mealId) => {
    return mealLogs.find(log => log.original_meal_id === mealId);
  };

  const getMealTypeLabel = (type) => {
    return t(`meals.${type}`) || type;
  };

  const handleCheckMeal = async (meal, checked) => {
    if (!checked) return; // Solo per marcare come consumato
    
    setSavingMealId(meal.id);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const user = await base44.auth.me();
      
      // Aggiorna il pasto come completato
      await base44.entities.MealPlan.update(meal.id, {
        is_completed: true
      });
      
      await base44.entities.MealLog.create({
        user_id: user.id,
        original_meal_id: meal.id,
        date: todayDate,
        meal_type: meal.meal_type,
        actual_calories: meal.total_calories,
        actual_protein: meal.total_protein,
        actual_carbs: meal.total_carbs,
        actual_fat: meal.total_fat,
        planned_calories: meal.total_calories,
        delta_calories: 0,
        rebalanced: false
      });
      
      // Trigger il callback per aggiornare il grafico
      if (onMealComplete) {
        onMealComplete();
      }
      
      window.location.reload();
    } catch (error) {
      console.error('Error logging meal:', error);
      alert(t('nutrition.errorSavingMeal'));
    }
    setSavingMealId(null);
  };

  const uniqueMeals = meals.reduce((acc, meal) => {
    const existing = acc.find(m => m.meal_type === meal.meal_type);
    if (!existing || new Date(meal.created_date) > new Date(existing.created_date)) {
      return [...acc.filter(m => m.meal_type !== meal.meal_type), meal];
    }
    return acc;
  }, []);

  const mealOrder = { breakfast: 1, snack1: 2, lunch: 3, snack2: 4, dinner: 5 };
  const sortedMeals = uniqueMeals.sort((a, b) => (mealOrder[a.meal_type] || 999) - (mealOrder[b.meal_type] || 999));

  const dailyTotals = sortedMeals.reduce((totals, meal) => {
    const mealLog = getMealLog(meal.id);
    const calories = mealLog ? mealLog.actual_calories : meal.total_calories;
    const protein = mealLog ? mealLog.actual_protein : meal.total_protein;
    const carbs = mealLog ? mealLog.actual_carbs : meal.total_carbs;
    const fat = mealLog ? mealLog.actual_fat : meal.total_fat;
    
    return {
      calories: totals.calories + (calories || 0),
      protein: totals.protein + (protein || 0),
      carbs: totals.carbs + (carbs || 0),
      fat: totals.fat + (fat || 0)
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shadow-sm">
              <Utensils className="w-6 h-6 text-orange-600" />
            </div>
            {t('nutrition.title')}
          </CardTitle>
          {hasFeatureAccess(userPlan, 'meal_plan') ? (
            <Link to={createPageUrl("Meals")}>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-200/50 hover:text-gray-900">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
              onClick={onUpgradeClick}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {sortedMeals.length > 0 && (
          <div className="bg-gradient-to-r from-[#e9f6f5] to-blue-50 rounded-xl p-3 border-2 border-[#26847F]/30 mb-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-0.5">{t('nutrition.kcal')}</p>
                <p className="text-lg font-bold text-[#26847F]">{Math.round(dailyTotals.calories)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-0.5">{t('nutrition.prot')}</p>
                <p className="text-lg font-bold text-red-600">{(Math.round(dailyTotals.protein * 10) / 10).toFixed(1)}g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-0.5">{t('nutrition.carb')}</p>
                <p className="text-lg font-bold text-blue-600">{(Math.round(dailyTotals.carbs * 10) / 10).toFixed(1)}g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-0.5">{t('nutrition.fats')}</p>
                <p className="text-lg font-bold text-yellow-600">{(Math.round(dailyTotals.fat * 10) / 10).toFixed(1)}g</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!hasFeatureAccess(userPlan, 'meal_plan') ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('nutrition.unlockTitle')}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {t('nutrition.unlockDesc')}
              </p>
              <Button 
                onClick={() => {
                  const checkoutPages = {
                    'it': 'itcheckout',
                    'en': 'encheckout',
                    'es': 'escheckout',
                    'pt': 'ptcheckout',
                    'de': 'decheckout',
                    'fr': 'frcheckout'
                  };
                  navigate(createPageUrl(checkoutPages[language] || 'itcheckout') + '?plan=base&billing=monthly');
                }}
                className="bg-[#26847F] hover:bg-[#1f6b66] text-white px-6 py-3 rounded-lg font-semibold"
              >
                {t('nutrition.upgradeToBase')}
              </Button>
            </div>
          ) : sortedMeals.length > 0 ? sortedMeals.map((meal) => {
            const mealLog = getMealLog(meal.id);
            const isLogged = !!mealLog;
            const displayCalories = isLogged ? mealLog.actual_calories : meal.total_calories;
            
            return (
              <div key={meal.id} className="w-full bg-gray-50/80 rounded-lg p-3 border border-gray-200/60 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => onMealSelect(meal)} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center border overflow-hidden relative flex-shrink-0">
                      {meal.image_url ? (
                          <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover"/>
                      ) : (
                          <ImageIcon className="w-5 h-5 text-gray-400 animate-pulse"/>
                      )}
                      {isLogged && (
                        <div className="absolute top-0 right-0 bg-green-500 rounded-bl-lg p-0.5">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-semibold text-gray-800">{getMealTypeLabel(meal.meal_type)}</p>
                      <p className="text-sm text-gray-600 truncate">{meal.name}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className={`font-bold ${isLogged ? 'text-green-600' : 'text-gray-800'}`}>
                        {displayCalories}
                      </p>
                      <p className="text-xs text-gray-500">kcal</p>
                    </div>
                    {!isLogged && (
                      <>
                        <Checkbox
                          checked={false}
                          onCheckedChange={(checked) => handleCheckMeal(meal, checked)}
                          disabled={savingMealId === meal.id}
                          className="w-5 h-5 border-2 border-[#26847F] data-[state=checked]:bg-[#26847F]"
                          title={t('nutrition.markAsConsumed')}
                        />
                        {hasFeatureAccess(userPlan, 'meal_photo_analysis') && (
                          <Button
                            onClick={() => onPhotoAnalyze(meal)}
                            variant="ghost"
                            size="icon"
                            className="text-[#26847F] hover:bg-[#e9f6f5] flex-shrink-0"
                            title={t('nutrition.analyzeWithPhoto')}
                          >
                            <Camera className="w-5 h-5" />
                          </Button>
                        )}
                        {!hasFeatureAccess(userPlan, 'meal_photo_analysis') && (
                          <div className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0" title={t('nutrition.analyzeWithPhoto') + ' (Pro)'}>
                            <Camera className="w-4 h-4" />
                            <span>Pro</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
             <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                <Calculator className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">{t('nutrition.noPlanToday')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('nutrition.generatePlan')}</p>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}