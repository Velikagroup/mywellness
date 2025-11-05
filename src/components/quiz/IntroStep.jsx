import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";

export default function IntroStep({ data, onDataChange, onNext }) {
  const handleSelection = (gender) => {
    onDataChange({ gender });
    setTimeout(() => {
      onNext();
    }, 300);
  };

  return (
    <motion.div 
      className="text-center py-8 md:py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <style>{`
        @keyframes textGradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animated-text-gradient {
          background: linear-gradient(90deg, var(--brand-primary), #14b8a6, #10b981, #14b8a6, var(--brand-primary));
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textGradientFlow 4s ease-in-out infinite;
        }
      `}</style>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
        className="w-20 h-20 bg-gradient-to-br from-[var(--brand-primary)] via-teal-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
      >
        <Sparkles className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h1 
        className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Scopri la tua <span className="animated-text-gradient">massa grassa</span>
      </motion.h1>

      <motion.p 
        className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        e costruisci il <strong>piano nutrizionale</strong> fatto su misura per te
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-10"
      >
        <p className="text-lg font-semibold text-gray-900 mb-6">Seleziona il tuo sesso:</p>
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
          <button
            onClick={() => handleSelection('male')}
            className={`p-8 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
              data.gender === 'male' 
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-md' 
                : 'border-gray-200 hover:border-[var(--brand-primary)]'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👨</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Uomo</h3>
            </div>
          </button>

          <button
            onClick={() => handleSelection('female')}
            className={`p-8 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
              data.gender === 'female' 
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-md' 
                : 'border-gray-200 hover:border-[var(--brand-primary)]'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👩</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Donna</h3>
            </div>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 max-w-xl mx-auto border border-gray-100 shadow-inner"
      >
        <p className="text-gray-700 leading-relaxed text-sm">
          ⏱️ <strong>Richiede solo 3 minuti</strong><br/>
          🎯 Calcoli scientifici precisi<br/>
          🔒 I tuoi dati sono privati e sicuri
        </p>
      </motion.div>
    </motion.div>
  );
}