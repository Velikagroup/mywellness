import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Clock, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MealHistoryDetailModal from './MealHistoryDetailModal';

export default function RecentMealsHistory({ userId, onMealSelect }) {
  const [mealLogs, setMealLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState(null);

  useEffect(() => {
    loadMealLogs();
  }, [userId]);

  const loadMealLogs = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const logs = await base44.entities.MealLog.filter({
        user_id: userId
      }, '-created_date', 50);
      
      setMealLogs(logs);
    } catch (error) {
      console.error('Error loading meal logs:', error);
    }
    setIsLoading(false);
  };

  const getMealTypeLabel = (type) => {
    const labels = {
      breakfast: '🥐 Colazione',
      snack1: '🥜 Snack 1',
      lunch: '🍽️ Pranzo',
      snack2: '🍌 Snack 2',
      dinner: '🍴 Cena'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  if (mealLogs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nessun pasto scannerizzato ancora</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence>
          {mealLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedMeal(log)}
              className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-[#26847F] hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <div className="flex gap-4">
                {/* Foto */}
                {log.photo_url && (
                  <img
                    src={log.photo_url}
                    alt={log.meal_type}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                {/* Dettagli */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="font-bold text-gray-900 text-sm line-clamp-2">
                      {getMealTypeLabel(log.meal_type)}
                    </p>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {format(new Date(log.created_date), 'HH:mm')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-gray-900 text-sm">
                        {log.actual_calories} kcal
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(log.created_date), 'd MMM')}
                    </span>
                  </div>

                  {/* Macronutrienti */}
                  <div className="flex gap-3 text-xs">
                    <span className="text-red-600 font-semibold">
                      P: {log.actual_protein || 0}g
                    </span>
                    <span className="text-amber-600 font-semibold">
                      C: {log.actual_carbs || 0}g
                    </span>
                    <span className="text-blue-600 font-semibold">
                      G: {log.actual_fat || 0}g
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selectedMeal && (
        <MealHistoryDetailModal
          mealLog={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onReload={loadMealLogs}
        />
      )}
    </>
  );
}