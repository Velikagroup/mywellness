import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';
import { motion } from 'framer-motion';

export default function WeightPotentialStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};
  const [animateChart, setAnimateChart] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimateChart(true), 300);
  }, []);

  return (
    <div className="space-y-6 pt-20 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-between pb-28">
      <div>
        <QuizHeader 
          currentStep={currentStep} 
          totalSteps={totalSteps}
          showBackButton={true}
          onBackClick={onPrev}
        />
        <QuizQuestionHeader
          title={t.quizWeightPotentialTitle || "Hai un grande potenziale per raggiungere il tuo obiettivo"}
          subtitle=""
        />

        <div className="mt-12 bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <h3 className="text-center text-gray-700 font-semibold mb-8">
            {t.quizWeightTransition || "Transizione del tuo peso"}
          </h3>

          {/* Chart */}
          <div className="relative h-48 mb-6">
            <svg viewBox="0 0 400 150" className="w-full h-full">
              {/* Grid lines */}
              <line x1="70" y1="20" x2="70" y2="120" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="70" y1="120" x2="380" y2="120" stroke="#e5e7eb" strokeWidth="2" />
              
              {/* Dotted line at middle */}
              <line x1="70" y1="70" x2="380" y2="70" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4,4" />

              {/* Chart line with animation */}
              <motion.path
                d="M 70 110 L 150 100 L 230 75 L 350 30"
                fill="none"
                stroke="#26847F"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animateChart ? 1 : 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />

              {/* Area under curve */}
              <motion.path
                d="M 70 110 L 150 100 L 230 75 L 350 30 L 350 120 L 70 120 Z"
                fill="url(#gradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: animateChart ? 0.3 : 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#26847F" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#26847F" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Points */}
              <motion.circle
                cx="70" cy="110" r="5" fill="white" stroke="#26847F" strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: animateChart ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              />
              <motion.circle
                cx="150" cy="100" r="5" fill="white" stroke="#26847F" strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: animateChart ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 1 }}
              />
              <motion.circle
                cx="230" cy="75" r="5" fill="white" stroke="#26847F" strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: animateChart ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 1.5 }}
              />
              <motion.circle
                cx="350" cy="30" r="8" fill="#26847F"
                initial={{ scale: 0 }}
                animate={{ scale: animateChart ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 2 }}
              >
                <animate attributeName="r" values="8;10;8" dur="1.5s" repeatCount="indefinite" begin="2s" />
              </motion.circle>

              {/* Heart icon at final point */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: animateChart ? 1 : 0, opacity: animateChart ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 2.2 }}
              >
                <circle cx="350" cy="30" r="14" fill="white" />
                <path
                  d="M 350 24 C 346 20 340 20 338 24 C 336 20 330 20 326 24 C 322 28 322 34 326 38 L 338 50 L 350 38 C 354 34 354 28 350 24 Z"
                  fill="#26847F"
                  transform="translate(12, -20)"
                />
              </motion.g>

              {/* X-axis labels */}
              <text x="70" y="140" textAnchor="middle" fontSize="12" fill="#6b7280">
                {t.quiz3Days || "3 giorni"}
              </text>
              <text x="190" y="140" textAnchor="middle" fontSize="12" fill="#6b7280">
                {t.quiz7Days || "7 giorni"}
              </text>
              <text x="350" y="140" textAnchor="middle" fontSize="12" fill="#6b7280">
                {t.quiz30Days || "30 giorni"}
              </text>
            </svg>
          </div>

          <p className="text-sm text-gray-600 text-center leading-relaxed px-2">
            {t.quizWeightPotentialDescription || 
              "Secondo i dati storici di MyWellness, la perdita di peso può essere lenta all'inizio, ma dopo pochi giorni potrai vedere risultati sorprendenti!"}
          </p>
        </div>
      </div>

      <Button
        onClick={onNext}
        className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
      >
        {t.quizContinue || 'Continua'}
      </Button>
    </div>
  );
}