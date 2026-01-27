import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';

export default function BirthdateStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};
  const [selectedMonth, setSelectedMonth] = useState(8);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 25);

  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
  const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i);

  useEffect(() => {
    if (data.birthdate) {
      const date = new Date(data.birthdate);
      setSelectedMonth(date.getMonth());
      setSelectedDay(date.getDate());
      setSelectedYear(date.getFullYear());
    }
  }, []);

  const calculateAge = () => {
    const today = new Date();
    const birth = new Date(selectedYear, selectedMonth, selectedDay);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleNext = () => {
    const age = calculateAge();
    if (age < 18) {
      alert(t.quizBirthdateMinAge || 'Devi avere almeno 18 anni');
      return;
    }
    const birthdateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onDataChange({ birthdate: birthdateStr, age });
    if (onNext) onNext();
  };

  const WheelPicker = ({ items, selectedIndex, onSelect }) => {
    return (
      <div className="flex-1 perspective">
        <style>{`
          @keyframes wheelRotate {
            0% { transform: rotateX(0deg); }
            100% { transform: rotateX(360deg); }
          }
          .wheel-item {
            transform-style: preserve-3d;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}</style>
        <div className="h-56 flex items-center justify-center relative" style={{ perspective: '1000px' }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {items.map((item, idx) => {
                const angle = ((idx - selectedIndex) * 30) * (Math.PI / 180);
                const isSelected = idx === selectedIndex;
                const distance = 80;
                const yOffset = Math.sin(angle) * distance;
                const zOffset = Math.cos(angle) * distance - distance;
                const rotateAngle = (idx - selectedIndex) * 30;
                
                return (
                  <button
                    key={idx}
                    onClick={() => onSelect(idx)}
                    className="wheel-item absolute transition-all duration-300"
                    style={{
                      transform: `translateY(${yOffset}px) translateZ(${zOffset}px) rotateZ(${-rotateAngle}deg)`,
                      opacity: isSelected ? 1 : 0.4,
                      fontSize: isSelected ? '18px' : '14px',
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? '#111827' : '#d1d5db',
                      pointerEvents: 'auto'
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="absolute top-1/2 left-0 right-0 h-12 border-t-2 border-b-2 border-gray-300 pointer-events-none transform -translate-y-1/2" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 min-h-screen flex flex-col px-4">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t.quizBirthdateTitle || "¿Cuándo naciste?"}
        </h2>
        <p className="text-gray-500 text-sm">
          {t.quizBirthdateSubtitle || "Esto se usará para calibrar tu plan personalizado."}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="flex gap-1 w-full justify-center">
          <WheelPicker 
            items={MONTHS} 
            selectedIndex={selectedMonth} 
            onSelect={setSelectedMonth}
          />
          <WheelPicker 
            items={DAYS} 
            selectedIndex={selectedDay - 1} 
            onSelect={(idx) => setSelectedDay(idx + 1)}
          />
          <WheelPicker 
            items={YEARS} 
            selectedIndex={YEARS.indexOf(selectedYear)} 
            onSelect={(idx) => setSelectedYear(YEARS[idx])}
          />
        </div>

        {calculateAge() >= 18 && (
          <p className="text-sm text-gray-600 text-center mt-8">
            {calculateAge()} {t.years || 'anni'}
          </p>
        )}
      </div>

      <div className="pb-8 max-w-md mx-auto w-full">
        <Button
          onClick={handleNext}
          className="w-full bg-gray-900 hover:bg-gray-950 text-white py-3 rounded-full text-base font-semibold"
        >
          {t.quizContinue || 'Continuar'}
        </Button>
      </div>
    </div>
  );
}