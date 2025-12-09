import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChefHat, Clock, BarChart2, Sprout, ChevronRight, MousePointerClick } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const MacroCircle = ({ label, value, unit, color }) => (
  <div className="flex flex-col items-center">
    <div className={`w-16 h-16 rounded-full border-4 ${color} flex items-center justify-center`}>
      <span className="text-lg font-bold text-gray-800">{value}</span>
    </div>
    <p className="mt-2 text-sm font-medium text-gray-600">{label} ({unit})</p>
  </div>
);

export default function MealPlanPreviewDemo() {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedMeal, setSelectedMeal] = useState(null);

  const daysOfWeek = [
    { id: 'Mon', label: t('home.mealPlanMonday') },
    { id: 'Tue', label: t('home.mealPlanTuesday') },
    { id: 'Wed', label: t('home.mealPlanWednesday') },
    { id: 'Thu', label: t('home.mealPlanThursday') },
    { id: 'Fri', label: t('home.mealPlanFriday') },
    { id: 'Sat', label: t('home.mealPlanSaturday') },
    { id: 'Sun', label: t('home.mealPlanSunday') }
  ];

  const mondayMeals = [
    {
      name: t('home.mealPlanBreakfast'),
      title: t('home.mealGreekYogurt'),
      calories: 342,
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
      ingredients: [
        { name: t('home.ingredientGreekYogurt'), quantity: 200, unit: 'g', calories: 130, protein: 20, carbs: 8, fat: 4 },
        { name: t('home.ingredientHoney'), quantity: 20, unit: 'g', calories: 64, protein: 0.1, carbs: 17, fat: 0 },
        { name: t('home.ingredientWalnuts'), quantity: 30, unit: 'g', calories: 196, protein: 4.5, carbs: 4, fat: 19 },
        { name: t('home.ingredientFreshBlueberries'), quantity: 50, unit: 'g', calories: 29, protein: 0.4, carbs: 7, fat: 0.2 }
      ],
      instructions: [
        t('home.instructionPourYogurt'),
        t('home.instructionAddHoneyTop'),
        t('home.instructionChopNuts'),
        t('home.instructionGarnishNutsBerries')
      ],
      total_protein: 25,
      total_carbs: 36,
      total_fat: 23,
      prep_time: 5,
      difficulty: t('home.mealPlanEasy')
    },
    {
      name: t('home.mealPlanMorningSnack'),
      title: t('home.mealNuts'),
      calories: 159,
      image: 'https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=400&h=400&fit=crop',
      ingredients: [
        { name: t('home.ingredientStrawberries'), quantity: 100, unit: 'g', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
        { name: t('home.ingredientButter'), quantity: 15, unit: 'g', calories: 112, protein: 0.1, carbs: 0, fat: 12.8 }
      ],
      instructions: [
        t('home.instructionWashStrawberries'),
        t('home.instructionCutHalf'),
        t('home.instructionServeButterSlices')
      ],
      total_protein: 1,
      total_carbs: 8,
      total_fat: 13,
      prep_time: 5,
      difficulty: t('home.mealPlanEasy')
    },
    {
      name: t('home.mealPlanLunch'),
      title: t('home.mealSalmonQuinoa'),
      calories: 397,
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
      ingredients: [
        { name: t('home.ingredientLeanBeef'), quantity: 180, unit: 'g', calories: 250, protein: 45, carbs: 0, fat: 7 },
        { name: t('home.ingredientButter'), quantity: 20, unit: 'g', calories: 149, protein: 0.2, carbs: 0, fat: 16.5 }
      ],
      instructions: [
        t('home.instructionGrillBeef'),
        t('home.instructionAddMeltedButter'),
        t('home.instructionServeHot')
      ],
      total_protein: 45,
      total_carbs: 0,
      total_fat: 24,
      prep_time: 20,
      difficulty: t('home.mealPlanMedium')
    },
    {
      name: t('home.mealPlanAfternoonSnack'),
      title: t('home.mealEggsPeppers'),
      calories: 160,
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop',
      ingredients: [
        { name: t('home.ingredientEggs'), quantity: 2, unit: 'unità', calories: 140, protein: 12, carbs: 1, fat: 10 },
        { name: t('home.ingredientBellPepper'), quantity: 50, unit: 'g', calories: 20, protein: 0.5, carbs: 4, fat: 0.2 }
      ],
      instructions: [
        t('home.instructionBeatEggs'),
        t('home.instructionCookPan'),
        t('home.instructionAddChoppedPeppers')
      ],
      total_protein: 13,
      total_carbs: 5,
      total_fat: 10,
      prep_time: 10,
      difficulty: t('home.mealPlanEasy')
    },
    {
      name: t('home.mealPlanDinner'),
      title: t('home.mealSteakButter'),
      calories: 395,
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop',
      ingredients: [
        { name: t('home.ingredientBeefSteak'), quantity: 200, unit: 'g', calories: 280, protein: 50, carbs: 0, fat: 8 },
        { name: t('home.ingredientFlavoredButter'), quantity: 15, unit: 'g', calories: 112, protein: 0.1, carbs: 0, fat: 12.8 }
      ],
      instructions: [
        t('home.instructionGrillSteak'),
        t('home.instructionAddFlavoredButter'),
        t('home.instructionRest5Min')
      ],
      total_protein: 50,
      total_carbs: 0,
      total_fat: 21,
      prep_time: 25,
      difficulty: t('home.mealPlanMedium')
    }
  ];

  return (
    <>
      <style>{`
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

        @keyframes bounce-arrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        
        @keyframes pulse-ring {
          0% { 
            transform: scale(0.8);
            opacity: 1;
          }
          100% { 
            transform: scale(1.4);
            opacity: 0;
          }
        }
        
        .click-indicator-ring {
          animation: pulse-ring 1.5s ease-out infinite;
        }
        
        .arrow-bounce {
          animation: bounce-arrow 1.5s ease-in-out infinite;
        }

        @media (max-width: 768px) {
          [data-meal-popup] {
            width: 80% !important;
            max-width: 80% !important;
            height: 80vh !important;
            max-height: 80vh !important;
          }
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto water-glass-effect border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 py-5 border-b border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate flex-shrink min-w-0">{t('home.mealPlanWeeklyPlanning')}</h2>
          </div>

          {/* Days selector */}
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
            {daysOfWeek.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`flex-shrink-0 py-2 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all ${
                  selectedDay === day.id
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Protocol Card */}
        <div className="px-3 sm:px-6 py-4 bg-gradient-to-br from-teal-50/50 to-blue-50/30 overflow-hidden">
          <div className="mb-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">{t('home.mealPlanMondayProtocol')}</h3>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3">
            <div className="bg-white rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-2 text-center border border-gray-100 shadow-sm">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 truncate">Kcal</div>
              <div className="text-sm sm:text-lg font-black text-gray-900">1453</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-2 text-center border border-gray-100 shadow-sm">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 truncate">Prot.</div>
              <div className="text-sm sm:text-lg font-black text-red-600">134</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-2 text-center border border-gray-100 shadow-sm">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 truncate">Carb.</div>
              <div className="text-sm sm:text-lg font-black text-blue-600">49</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-2 text-center border border-gray-100 shadow-sm">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 truncate">Gras.</div>
              <div className="text-sm sm:text-lg font-black text-amber-600">81</div>
            </div>
          </div>

          {/* Target giornaliero */}
          <div className="text-[10px] sm:text-xs text-gray-600 text-center">
            <span className="font-medium">{t('home.mealPlanTarget')}: 1696 kcal</span>
            <span className="ml-1 sm:ml-2 text-gray-400">(-243)</span>
          </div>
        </div>

        {/* Meals List */}
        <div className="px-3 sm:px-4 py-4 space-y-2 max-h-[400px] overflow-y-auto relative">
          {mondayMeals.map((meal, index) => (
            <div
              key={index}
              onClick={() => setSelectedMeal(meal)}
              className="relative flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-2 sm:p-3 border border-gray-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              {/* Click Indicator on first meal image - centered */}
              {index === 0 && (
                <div className="absolute left-[30px] sm:left-[34px] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  {/* Animated Circle Ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 border-4 border-teal-500 rounded-full click-indicator-ring"></div>
                  </div>
                  
                  {/* Static Circle Background */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-teal-500/20 rounded-full"></div>
                  </div>
                  
                  {/* Icons */}
                  <div className="relative flex items-center justify-center gap-0.5 sm:gap-1">
                    <MousePointerClick className="w-6 sm:w-8 h-6 sm:h-8 text-teal-600 drop-shadow-lg" />
                    <ChevronRight className="w-5 sm:w-7 h-5 sm:h-7 text-teal-600 arrow-bounce drop-shadow-lg" />
                  </div>
                </div>
              )}

              <img
                src={meal.image}
                alt={meal.title}
                className="w-12 sm:w-14 h-12 sm:h-14 rounded-full object-cover border-2 border-gray-100 relative z-0 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium mb-0.5">{meal.name}</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{meal.title}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs sm:text-sm font-bold text-gray-900">{meal.calories}</div>
                <div className="text-[10px] sm:text-xs text-gray-400">kcal</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation (Demo) */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic text-center">
            {t('common.lang') === 'it' && 'Anteprima interfaccia • Funzionalità disponibili dopo il signup'}
            {t('common.lang') === 'en' && 'Interface preview • Features available after signup'}
            {t('common.lang') === 'es' && 'Vista previa de interfaz • Funciones disponibles después del registro'}
            {t('common.lang') === 'pt' && 'Prévia da interface • Funcionalidades disponíveis após o cadastro'}
            {t('common.lang') === 'de' && 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar'}
            {t('common.lang') === 'fr' && 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription'}
          </p>
        </div>
      </Card>

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-meal-popup>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">{selectedMeal.title}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2">
              <div className="space-y-6">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                  <img src={selectedMeal.image} alt={selectedMeal.title} className="w-full h-full object-cover" />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-teal-600" /> {t('home.mealPlanNutritionalSummary')}
                  </h3>
                  <div className="flex justify-around items-center text-center">
                    <div className="flex flex-col items-center">
                      <p className="text-3xl font-bold text-teal-600">{selectedMeal.calories}</p>
                      <p className="text-sm font-medium text-gray-600">Kcal</p>
                    </div>
                    <MacroCircle label={t('home.mealPlanProteins')} value={selectedMeal.total_protein} unit="g" color="border-red-400" />
                    <MacroCircle label={t('home.mealPlanCarbs')} value={selectedMeal.total_carbs} unit="g" color="border-blue-400" />
                    <MacroCircle label={t('home.mealPlanFats')} value={selectedMeal.total_fat} unit="g" color="border-yellow-400" />
                  </div>
                </div>
                
                <div className="flex items-center justify-around text-sm text-gray-600 bg-gray-50 rounded-lg border p-3">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {t('home.mealPlanPrep')}: {selectedMeal.prep_time} min</div>
                  <div className="flex items-center gap-2 capitalize"><ChefHat className="w-4 h-4" /> {t('home.mealPlanDifficulty')}: {selectedMeal.difficulty}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-green-600"/> {t('home.mealPlanIngredients')}
                  </h3>
                  <div className="space-y-2">
                    {selectedMeal.ingredients.map((ing, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded-md border text-sm hover:bg-gray-50">
                        <div className="flex-grow">
                          <span className="font-medium text-gray-800">{ing.name}</span>
                          <span className="text-gray-500 ml-2">{ing.quantity}{ing.unit}</span>
                        </div>
                        <div className="text-xs text-right text-gray-500">
                          {ing.calories} kcal
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('home.mealPlanPreparation')}</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    {selectedMeal.instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}