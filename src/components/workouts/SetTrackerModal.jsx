import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SetTrackerModal({ isOpen, onClose, exercise, onComplete }) {
  const [completedSets, setCompletedSets] = useState([]);
  
  const totalSets = exercise?.sets || 0;
  const sets = Array.from({ length: totalSets }, (_, i) => i + 1);
  
  const toggleSet = (setNumber) => {
    setCompletedSets(prev => {
      if (prev.includes(setNumber)) {
        return prev.filter(s => s !== setNumber);
      } else {
        const newCompleted = [...prev, setNumber];
        // Controlla se tutti i set sono completati
        if (newCompleted.length === totalSets) {
          setTimeout(() => {
            onComplete();
            onClose();
          }, 300);
        }
        return newCompleted;
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">{exercise?.name}</DialogTitle>
          <p className="text-sm text-gray-600">{exercise?.reps} • {exercise?.rest} riposo</p>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">Progressi:</span>
            <span className="text-lg font-bold text-[#26847F]">
              {completedSets.length}/{totalSets} set
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {sets.map((setNum) => {
              const isCompleted = completedSets.includes(setNum);
              return (
                <motion.button
                  key={setNum}
                  onClick={() => toggleSet(setNum)}
                  animate={{
                    scale: isCompleted ? [1, 1.1, 1] : 1,
                    backgroundColor: isCompleted ? '#26847F' : '#ffffff',
                    borderColor: isCompleted ? '#1f6b66' : '#e5e7eb'
                  }}
                  transition={{ duration: 0.3 }}
                  className={`relative p-6 rounded-xl border-2 shadow-md transition-all ${
                    isCompleted 
                      ? 'text-white' 
                      : 'text-gray-700 hover:border-[#26847F] hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-black mb-1">Set {setNum}</div>
                    <div className="text-xs opacity-80">{exercise?.reps}</div>
                  </div>
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {completedSets.length === totalSets && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border-2 border-green-500 rounded-xl p-4 text-center"
            >
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-bold text-green-700">Esercizio completato!</p>
            </motion.div>
          )}
        </div>

        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
        >
          Chiudi
        </Button>
      </DialogContent>
    </Dialog>
  );
}