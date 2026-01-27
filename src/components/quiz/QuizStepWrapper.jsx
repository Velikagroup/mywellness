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
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 416px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 0;
          margin: 0;
        }
      `}</style>

      <div className="min-h-screen bg-white">
        <div className="flex flex-col items-center pt-4 pb-8 px-4">
          <div className="max-w-[416px] w-full mt-0">
            {children}

            {showBackButton && currentStep > 0 && (
              <div className="mt-6">
                <Button
                  variant="ghost"
                  onClick={onPrev}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {backButtonText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}