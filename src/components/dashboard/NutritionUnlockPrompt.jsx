import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Clock, ChefHat, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAKE_MEAL_PLAN = [
  {
    id: 1,
    day: 'Lunedì',
    meals: [
      { type: 'Colazione', name: 'Pancakes Proteici', calories: 420, time: '08:00' },
      { type: 'Pranzo', name: 'Salmone al Forno', calories: 580, time: '13:00' },
      { type: 'Cena', name: 'Pollo alla Griglia', calories: 520, time: '20:00' }
    ]
  },
  {
    id: 2,
    day: 'Martedì',
    meals: [
      { type: 'Colazione', name: 'Yogurt Greco', calories: 380, time: '08:00' },
      { type: 'Pranzo', name: 'Pasta Integrale', calories: 620, time: '13:00' },
      { type: 'Cena', name: 'Burger di Lenticchie', calories: 480, time: '20:00' }
    ]
  },
  {
    id: 3,
    day: 'Mercoledì',
    meals: [
      { type: 'Colazione', name: 'Avocado Toast', calories: 440, time: '08:00' },
      { type: 'Pranzo', name: 'Insalata Caesar', calories: 560, time: '13:00' },
      { type: 'Cena', name: 'Tonno alla Piastra', calories: 500, time: '20:00' }
    ]
  }
];

const DETAILED_MEAL = {
  name: 'Salmone al Forno con Verdure',
  image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  calories: 580,
  protein: 45,
  carbs: 38,
  fat: 22,
  prepTime: 25,
  difficulty: 'Facile',
  ingredients: [
    { name: 'Filetto di salmone', qty: '200g', calories: 280 },
    { name: 'Broccoli', qty: '150g', calories: 50 },
    { name: 'Patate dolci', qty: '120g', calories: 110 },
    { name: 'Olio extravergine', qty: '1 cucchiaio', calories: 90 },
    { name: 'Limone', qty: '1/2', calories: 15 },
    { name: 'Aglio', qty: '2 spicchi', calories: 10 },
    { name: 'Rosmarino', qty: 'q.b.', calories: 5 },
    { name: 'Sale e pepe', qty: 'q.b.', calories: 0 }
  ],
  instructions: [
    'Preriscalda il forno a 200°C.',
    'Taglia le patate dolci a cubetti e i broccoli in cimette.',
    'Disponi le verdure su una teglia con carta forno, condisci con metà olio, sale e pepe.',
    'Inforna le verdure per 15 minuti.',
    'Nel frattempo, condisci il salmone con succo di limone, aglio tritato, rosmarino e l\'olio rimanente.',
    'Dopo 15 minuti, aggiungi il salmone sulla teglia con le verdure.',
    'Cuoci per altri 10-12 minuti fino a doratura del salmone.',
    'Servi caldo con una spruzzata di limone fresco.'
  ]
};

export default function NutritionUnlockPrompt({ isOpen, onClose, onUpgrade }) {
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setShowMealDetail(false);
      setScrollProgress(0);
      return;
    }

    // Sequenza animazione: mostra piano → apri dettaglio pasto → scrolla → chiudi dettaglio → ripeti
    const sequence = async () => {
      // Mostra piano per 3 secondi
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Apri dettaglio pasto
      setShowMealDetail(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Scrolla gradualmente verso il basso
      const scrollDuration = 6000; // 6 secondi di scroll
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
    const loopAnimation = async () => {
      while (isOpen) {
        await sequence();
      }
    };

    loopAnimation();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <div className="relative">
          {/* Header fisso */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-white via-white to-transparent px-6 pt-6 pb-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-30"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  Il Tuo Piano è Pronto! 🎉
                </h2>
                <p className="text-sm text-gray-600">
                  Sblocca l'accesso completo in 30 secondi
                </p>
              </div>
            </div>
          </div>

          {/* Contenuto scrollabile */}
          <div 
            ref={contentRef}
            className="overflow-y-auto pt-32 pb-6 px-6"
            style={{ maxHeight: '70vh' }}
          >
            <AnimatePresence mode="wait">
              {!showMealDetail ? (
                <motion.div
                  key="plan-overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {FAKE_MEAL_PLAN.map((day) => (
                    <div
                      key={day.id}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border-2 border-gray-200"
                    >
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#26847F]"></span>
                        {day.day}
                      </h3>
                      <div className="space-y-2">
                        {day.meals.map((meal, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-xl p-3 flex items-center justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#26847F] to-teal-400 rounded-lg flex items-center justify-center">
                                <Utensils className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{meal.name}</p>
                                <p className="text-xs text-gray-500">{meal.type} • {meal.time}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#26847F]">{meal.calories}</p>
                              <p className="text-xs text-gray-500">kcal</p>
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
                  className="space-y-4"
                >
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={DETAILED_MEAL.image}
                      alt={DETAILED_MEAL.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-black text-white mb-2">{DETAILED_MEAL.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-white/90">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {DETAILED_MEAL.prepTime} min
                        </span>
                        <span className="flex items-center gap-1">
                          <ChefHat className="w-4 h-4" />
                          {DETAILED_MEAL.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gradient-to-br from-[#E0F2F1] to-teal-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">Calorie</p>
                      <p className="text-lg font-black text-[#26847F]">{DETAILED_MEAL.calories}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">Proteine</p>
                      <p className="text-lg font-black text-red-600">{DETAILED_MEAL.protein}g</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">Carbo</p>
                      <p className="text-lg font-black text-blue-600">{DETAILED_MEAL.carbs}g</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">Grassi</p>
                      <p className="text-lg font-black text-yellow-600">{DETAILED_MEAL.fat}g</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">📦 Ingredienti</h4>
                    <div className="space-y-2">
                      {DETAILED_MEAL.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{ing.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-medium">{ing.qty}</span>
                            <span className="text-[#26847F] font-bold text-xs">{ing.calories} kcal</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">👨‍🍳 Preparazione</h4>
                    <ol className="space-y-2">
                      {DETAILED_MEAL.instructions.map((step, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-6 h-6 bg-[#26847F] text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA fisso in basso */}
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-6 py-4">
            <Button
              onClick={onUpgrade}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-black rounded-2xl shadow-2xl"
            >
              🎯 Sblocca Piano Nutrizionale • Da €19/mese
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Il tuo piano completo ti aspetta • Inizia subito
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}