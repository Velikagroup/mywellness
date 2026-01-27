import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuizHeader({ currentStep, totalSteps, showBackButton = false, onBackClick = null }) {
  const navigate = useNavigate();

  if (!showBackButton) return null;

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(createPageUrl('Home'));
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white pt-6 pb-4">
      <div className="w-full max-w-[416px] mx-auto px-4 flex items-center gap-1.5">
        <button
          onClick={handleBack}
          className="flex-shrink-0 w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {typeof currentStep === 'number' && totalSteps && (
          <div className="flex-grow h-0.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-800 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}