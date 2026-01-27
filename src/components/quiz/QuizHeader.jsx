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
    <>
      <style>{`
        .quiz-button-back-fixed {
          position: fixed;
          bottom: 20px;
          left: 4px;
          right: 4px;
          width: calc(100% - 32px);
          max-width: 384px;
          border-radius: 50px;
          padding: 16px 24px !important;
          height: auto !important;
          min-height: 56px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin: 0;
          z-index: 40;
        }

        .quiz-button-back-fixed:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        @media (min-width: 768px) {
          .quiz-button-back-fixed {
            position: fixed;
            width: 416px;
            bottom: 260px;
            left: 50%;
            transform: translateX(-50%);
            right: auto;
          }
        }
      `}</style>
      <button
        onClick={handleBack}
        className="quiz-button-back-fixed"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück
      </button>
    </>
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