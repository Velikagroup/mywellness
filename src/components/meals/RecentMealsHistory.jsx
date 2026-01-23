import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Clock, Flame, Zap, Wheat, Droplet, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import MealHistoryDetailModal from './MealHistoryDetailModal';

const ITEMS_PER_PAGE = 5;

export default function RecentMealsHistory({ userId, onMealSelect }) {
  const [mealLogs, setMealLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);

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

  const getMealName = (log) => {
    if (log.detected_items && Array.isArray(log.detected_items) && log.detected_items.length > 0) {
      return log.detected_items.map(item => typeof item === 'string' ? item : item.name).join(', ');
    }
    return 'Pasto';
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

  const displayedMeals = mealLogs.slice(0, displayedCount);
  const hasMore = displayedCount < mealLogs.length;

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence>
          {displayedMeals.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedMeal(log)}
              className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer active:scale-95"
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
                  <div className="flex justify-between items-start gap-2 mb-3">
                     <p className="text-gray-900 line-clamp-2">
                       {getMealName(log)}
                     </p>
                     <span className="text-xs text-gray-500 flex-shrink-0">
                       {format(new Date(log.created_date), 'HH:mm')}
                     </span>
                   </div>

                   <div className="flex items-center gap-1 mb-3">
                     <Flame className="w-5 h-5 text-orange-500" />
                     <span className="font-bold text-gray-900 text-2xl">
                       {log.actual_calories}
                     </span>
                     <span className="text-xs text-gray-500">kcal</span>
                   </div>

                   {/* Macronutrienti */}
                   <div className="flex gap-4 text-xs">
                     <div className="flex items-center gap-1">
                       <Zap className="w-4 h-4 text-red-600" />
                       <span className="text-red-600 font-semibold">{log.actual_protein || 0}g</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Wheat className="w-4 h-4 text-amber-600" />
                       <span className="text-amber-600 font-semibold">{log.actual_carbs || 0}g</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Droplet className="w-4 h-4 text-blue-600" />
                       <span className="text-blue-600 font-semibold">{log.actual_fat || 0}g</span>
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => setDisplayedCount(prev => prev + ITEMS_PER_PAGE)}
            className="bg-black hover:bg-gray-900 text-white rounded-full px-6 py-3 font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Carica altri 5
          </Button>
        </div>
      )}

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