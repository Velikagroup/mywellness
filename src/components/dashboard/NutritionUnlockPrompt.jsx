import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Clock, ChefHat, Utensils, Apple } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const getFakeMealPlan = (t) => [
  {
    id: 1,
    day: t('upgradeModal.monday'),
    meals: [
      { type: t('upgradeModal.breakfast'), name: 'Pancakes Proteici', calories: 420, time: '08:00', image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&q=80' },
      { type: t('upgradeModal.lunch'), name: 'Salmone al Forno', calories: 580, time: '13:00', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80' },
      { type: t('upgradeModal.dinner'), name: 'Pollo alla Griglia', calories: 520, time: '20:00', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&q=80' }
    ]
  },
  {
    id: 2,
    day: t('upgradeModal.tuesday'),
    meals: [
      { type: t('upgradeModal.breakfast'), name: 'Yogurt Greco', calories: 380, time: '08:00', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80' },
      { type: t('upgradeModal.lunch'), name: 'Pasta Integrale', calories: 620, time: '13:00', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80' },
      { type: t('upgradeModal.dinner'), name: 'Burger di Lenticchie', calories: 480, time: '20:00', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' }
    ]
  },
  {
    id: 3,
    day: t('upgradeModal.wednesday'),
    meals: [
      { type: t('upgradeModal.breakfast'), name: 'Avocado Toast', calories: 440, time: '08:00', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80' },
      { type: t('upgradeModal.lunch'), name: 'Insalata Caesar', calories: 560, time: '13:00', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
      { type: t('upgradeModal.dinner'), name: 'Tonno alla Piastra', calories: 500, time: '20:00', image: 'https://images.unsplash.com/photo-1580959474423-ef287d46f28e?w=400&q=80' }
    ]
  }
];

const getDetailedMeal = (t) => ({
  name: t('upgradeModal.demoMealName'),
  image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  calories: 580,
  protein: 45,
  carbs: 38,
  fat: 22,
  prepTime: 25,
  difficulty: t('upgradeModal.easy'),
  ingredients: [
    { name: t('upgradeModal.demoIngredient1'), qty: t('upgradeModal.demoQty1'), calories: 280 },
    { name: t('upgradeModal.demoIngredient2'), qty: t('upgradeModal.demoQty2'), calories: 50 },
    { name: t('upgradeModal.demoIngredient3'), qty: t('upgradeModal.demoQty3'), calories: 110 },
    { name: t('upgradeModal.demoIngredient4'), qty: t('upgradeModal.demoQty4'), calories: 90 },
    { name: t('upgradeModal.demoIngredient5'), qty: t('upgradeModal.demoQty5'), calories: 15 },
    { name: t('upgradeModal.demoIngredient6'), qty: t('upgradeModal.demoQty6'), calories: 10 },
    { name: t('upgradeModal.demoIngredient7'), qty: t('upgradeModal.demoQty7'), calories: 5 },
    { name: t('upgradeModal.demoIngredient8'), qty: t('upgradeModal.demoQty8'), calories: 0 }
  ],
  instructions: [
    t('upgradeModal.demoStep1'),
    t('upgradeModal.demoStep2'),
    t('upgradeModal.demoStep3'),
    t('upgradeModal.demoStep4'),
    t('upgradeModal.demoStep5'),
    t('upgradeModal.demoStep6'),
    t('upgradeModal.demoStep7'),
    t('upgradeModal.demoStep8')
  ]
});

export default function NutritionUnlockPrompt({ isOpen, onClose, onUpgrade }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Reset completo quando il modal si chiude
    if (!isOpen) {
      setShowMealDetail(false);
      setScrollProgress(0);
      setIsAnimating(false);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Delay iniziale prima di partire con l'animazione per evitare scatti
    const startDelay = setTimeout(() => {
      setIsAnimating(true);
    }, 300);

    // Sequenza animazione: mostra piano → apri dettaglio pasto → scrolla → chiudi dettaglio → ripeti
    const sequence = async () => {
      // Reset stato iniziale
      setShowMealDetail(false);
      setScrollProgress(0);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }

      // Mostra piano per 3 secondi
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Apri dettaglio pasto
      setShowMealDetail(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Scrolla gradualmente verso il basso
      const scrollDuration = 6000;
      const startTime = Date.now();
      
      const scrollInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / scrollDuration, 1);
        setScrollProgress(progress);

        if (contentRef.current) {
          const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
          contentRef.current.scrollTop = maxScroll * progress;
        }

        if (progress >= 1) {
          clearInterval(scrollInterval);
        }
      }, 50);

      await new Promise(resolve => setTimeout(resolve, scrollDuration + 1000));
      clearInterval(scrollInterval);

      // Chiudi dettaglio e reset
      setShowMealDetail(false);
      setScrollProgress(0);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }

      // Pausa prima di ripartire
      await new Promise(resolve => setTimeout(resolve, 2000));
    };

    // Loop infinito
    let running = true;
    const loopAnimation = async () => {
      while (running && isOpen) {
        await sequence();
      }
    };

    const startAnimation = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (running && isOpen) {
        loopAnimation();
      }
    };

    startAnimation();

    return () => {
      running = false;
      clearTimeout(startDelay);
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[700px] md:max-w-[750px] max-h-[85vh] p-0 overflow-hidden w-[95vw] z-[100]"
        overlayClassName="z-[99]"
      >
        <div className="relative">
          {/* Header fisso */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-white via-white to-transparent px-3 sm:px-6 pt-4 sm:pt-6 pb-6 sm:pb-8">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors z-30"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <Apple className="w-5 h-5 sm:w-7 sm:h-7 text-[#26847F] transform scale-x-[-1]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-gray-900 leading-tight">
                  {t('upgradeModal.nutritionReady')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {t('upgradeModal.unlockIn30Seconds')}
                </p>
              </div>
            </div>
          </div>

          {/* Contenuto scrollabile */}
          <div 
            ref={contentRef}
            className="overflow-y-auto pt-24 sm:pt-32 pb-4 sm:pb-6 px-3 sm:px-6"
            style={{ 
              maxHeight: '60vh', 
              WebkitOverflowScrolling: 'touch',
              opacity: isAnimating ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            <AnimatePresence mode="wait">
              {!showMealDetail ? (
                <motion.div
                  key="plan-overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2 sm:space-y-4"
                >
                  {getFakeMealPlan(t).map((day) => (
                    <div
                      key={day.id}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-gray-200 sm:border-2"
                    >
                      <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#26847F]"></span>
                        {day.day}
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2">
                        {day.meals.map((meal, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <img 
                                src={meal.image} 
                                alt={meal.name}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-md sm:rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{meal.name}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">{meal.type} • {meal.time}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="text-xs sm:text-sm font-bold text-[#26847F]">{meal.calories}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500">kcal</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="meal-detail"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-2 sm:space-y-4"
                >
                  {(() => {
                    const detailedMeal = getDetailedMeal(t);
                    return (
                      <>
                        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
                          <img
                            src={detailedMeal.image}
                            alt={detailedMeal.name}
                            className="w-full h-32 sm:h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                            <h3 className="text-base sm:text-2xl font-black text-white mb-1 sm:mb-2">{detailedMeal.name}</h3>
                            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/90">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                {detailedMeal.prepTime} {t('upgradeModal.min')}
                              </span>
                              <span className="flex items-center gap-1">
                                <ChefHat className="w-3 h-3 sm:w-4 sm:h-4" />
                                {detailedMeal.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                          <div className="bg-gradient-to-br from-[#E0F2F1] to-teal-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">{t('upgradeModal.calories')}</p>
                            <p className="text-sm sm:text-lg font-black text-[#26847F]">{detailedMeal.calories}</p>
                          </div>
                          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">{t('upgradeModal.protein')}</p>
                            <p className="text-sm sm:text-lg font-black text-red-600">{detailedMeal.protein}g</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">{t('upgradeModal.carbs')}</p>
                            <p className="text-sm sm:text-lg font-black text-blue-600">{detailedMeal.carbs}g</p>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">{t('upgradeModal.fats')}</p>
                            <p className="text-sm sm:text-lg font-black text-yellow-600">{detailedMeal.fat}g</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">{t('upgradeModal.ingredients')}</h4>
                          <div className="space-y-1.5 sm:space-y-2">
                            {detailedMeal.ingredients.map((ing, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-gray-700 truncate mr-2">{ing.name}</span>
                                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                  <span className="text-gray-500 font-medium text-xs sm:text-sm">{ing.qty}</span>
                                  <span className="text-[#26847F] font-bold text-[10px] sm:text-xs">{ing.calories} kcal</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">{t('upgradeModal.preparation')}</h4>
                          <ol className="space-y-1.5 sm:space-y-2">
                            {detailedMeal.instructions.map((step, idx) => (
                              <li key={idx} className="flex gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-[#26847F] text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA fisso in basso */}
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-3 sm:px-6 py-3 sm:py-4">
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
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm sm:text-lg font-black rounded-xl sm:rounded-2xl shadow-2xl"
            >
              {t('upgradeModal.unlockPlan')}
            </Button>
            <p className="text-[10px] sm:text-xs text-center text-gray-500 mt-1.5 sm:mt-2">
              {t('upgradeModal.fullPlanAwaits')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}