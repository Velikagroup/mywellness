import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';
import { motion } from 'framer-motion';

export default function AIComparisonStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};
  const [animateChart, setAnimateChart] = useState(false);

  useEffect(() => {
    // Trigger animation when component mounts
    const timer = setTimeout(() => setAnimateChart(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pt-20">
      <QuizHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />

      <QuizQuestionHeader
        title={t.aiComparisonTitle || "Perderai il doppio di peso con MyWellness che per conto tuo"}
        subtitle=""
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 space-y-8">
        
        {/* Comparison Chart */}
        <div className="w-full bg-gray-50 rounded-3xl p-8 space-y-6">
          {/* Two bars comparison */}
          <div className="flex gap-6 items-flex-end justify-center h-48">
            {/* Left bar - Sin MyWellness */}
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-gray-700 mb-4">Sin MyWellness</p>
              <div className="w-20 bg-gray-200 rounded-lg overflow-hidden h-32 relative">
                <motion.div
                  className="w-full bg-gray-400 rounded-lg"
                  initial={{ height: 0 }}
                  animate={animateChart ? { height: '32%' } : { height: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-2xl font-bold text-gray-600 mt-4">20%</p>
            </div>

            {/* Right bar - Con MyWellness */}
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-gray-700 mb-4">Con MyWellness</p>
              <div className="w-20 bg-gray-200 rounded-lg overflow-hidden h-32 relative">
                <motion.div
                  className="w-full bg-gray-900 rounded-lg"
                  initial={{ height: 0 }}
                  animate={animateChart ? { height: '100%' } : { height: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-4">2X</p>
            </div>
          </div>

          {/* Subtitle text */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t.aiComparisonSubtitle || "MyWellness lo hace fácil y te acompaña te hace responsable."}
            </p>
          </div>
        </div>
      </div>

      <div>
        <Button
          onClick={onNext}
          className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
        >
          {t.quizContinue || 'Continuar'}
        </Button>
      </div>
    </div>
  );
}