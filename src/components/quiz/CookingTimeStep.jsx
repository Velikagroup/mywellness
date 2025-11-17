import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Coffee, ChefHat } from 'lucide-react';

export default function CookingTimeStep({ value, onChange }) {
  const options = [
    { 
      id: 'quick', 
      label: 'Veloce', 
      icon: Zap,
      description: 'Ricette rapide (10-20 min)',
      color: 'from-yellow-400 to-orange-500'
    },
    { 
      id: 'moderate', 
      label: 'Moderato', 
      icon: Coffee,
      description: 'Preparazioni medie (20-30 min)',
      color: 'from-blue-400 to-purple-500'
    },
    { 
      id: 'relaxed', 
      label: 'Tranquillo', 
      icon: ChefHat,
      description: 'Ricette elaborate (30+ min)',
      color: 'from-green-400 to-teal-500'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-4">
          <Clock className="w-5 h-5 text-purple-700" />
          <span className="text-sm font-semibold text-purple-700">Preferenze Cucina</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Quanto tempo vuoi dedicare<br/>alla cucina?
        </h2>
        <p className="text-gray-600">
          Selezioneremo ricette adatte al tuo tempo disponibile
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option, idx) => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onChange(option.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all group overflow-hidden ${
                isSelected
                  ? 'border-[#26847F] bg-white shadow-xl scale-105'
                  : 'border-gray-200 bg-white hover:border-[#26847F]/50 hover:shadow-lg'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              
              <div className="relative z-10">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg ${
                  isSelected ? 'scale-110' : ''
                } transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-[#26847F]' : 'text-gray-900'}`}>
                  {option.label}
                </h3>
                
                <p className="text-sm text-gray-600">
                  {option.description}
                </p>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 bg-[#26847F] rounded-full flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <motion.path
                          d="M5 13l4 4L19 7"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      </svg>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}