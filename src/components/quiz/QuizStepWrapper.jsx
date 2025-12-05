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
  showNextButton = true
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

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
          33% {
            background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%;
          }
          66% {
            background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%;
          }
          100% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
        }
        
        .animated-gradient-bg {
          background: #f9fafb;
          background-image: 
            radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
            radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, #f3e8ff 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
            radial-gradient(circle at 90% 85%, #faf5ff 0%, transparent 50%);
          background-size: 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%;
          animation: gradientShift 45s ease-in-out infinite;
          background-attachment: fixed;
        }

        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <div className="min-h-screen animated-gradient-bg">
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="water-glass-effect rounded-full px-6 py-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
              alt="MyWellness"
              className="h-6"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-20 px-4">
          <div className="max-w-2xl w-full">
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 pt-6 border-b border-gray-100">
                <div className="mb-4">
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 rounded-full transition-all duration-500 ease-out shadow-md"
                      style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent">
                        {currentStep + 1}
                      </span>
                      <span className="text-gray-400 font-medium">/</span>
                      <span className="text-lg font-bold text-gray-600">
                        {totalSteps}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 font-medium ml-2">
                      {currentStep === 0 ? 'domande completate' : 'questions completed'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-6">
                {children}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center mt-6">
              {showBackButton && currentStep > 0 ? (
                <Button
                  variant="ghost"
                  onClick={onPrev}
                  className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {backButtonText}
                </Button>
              ) : (
                <div></div>
              )}
              
              {showNextButton && (
                <Button
                  onClick={onNext}
                  disabled={!isValid}
                  className={`bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed ${currentStep === 0 ? 'ml-auto' : ''}`}
                >
                  {nextButtonText}
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}