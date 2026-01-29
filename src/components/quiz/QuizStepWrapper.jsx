import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";

export default function QuizStepWrapper({ 
  children, 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrev,
  isValid,
  nextButtonText = "Avanti",
  backButtonText = "Indietro",
  showBackButton = true,
  showNextButton = true,
  translations
}) {
  // Calcola progresso con peso decrescente per step
  const calculateWeightedProgress = () => {
    // Crea pesi decrescenti: prime domande pesano di più, ultime di meno
    const weights = Array.from({ length: totalSteps }, (_, i) => {
      // Formula esponenziale decrescente
      const normalizedPos = i / (totalSteps - 1);
      return Math.pow(1 - normalizedPos, 0.5) * 2 + 0.5;
    });
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const currentWeight = weights.slice(0, currentStep).reduce((sum, w) => sum + w, 0);
    
    return Math.round((currentWeight / totalWeight) * 100);
  };
  
  const progressValue = calculateWeightedProgress();
  
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', sans-serif;
        }

        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5753;
        }

        .quiz-button-fixed {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 384px;
          border-radius: 50px;
          margin: 0 !important;
          padding: 16px 24px !important;
          height: auto !important;
          min-height: 56px;
          z-index: 50;
        }

        @media (min-width: 768px) {
          .quiz-button-fixed {
            bottom: 200px;
            width: 416px;
            padding: 16px 24px !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white">
        <div className="flex flex-col items-center pt-4 pb-24 px-4">
          <div className="max-w-[416px] w-full mt-0">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}