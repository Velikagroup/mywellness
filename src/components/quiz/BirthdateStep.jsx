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
    const itemHeight = 48;
    const visibleItems = 5;
    const totalHeight = itemHeight * visibleItems;
    
    return (
      <div className="flex-1 flex flex-col items-center">
        <div 
          className="relative overflow-hidden"
          style={{ height: `${totalHeight}px` }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-3 py-2 bg-gray-200 rounded-full text-gray-900 font-semibold text-base">
              {items[selectedIndex]}
            </div>
          </div>
          
          <div className="space-y-0 pointer-events-auto">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                className="w-full transition-all"
                style={{
                  height: `${itemHeight}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: idx === selectedIndex ? 1 : 0.3,
                  fontSize: idx === selectedIndex ? '18px' : '14px',
                  fontWeight: idx === selectedIndex ? '600' : '400',
                  color: idx === selectedIndex ? '#111827' : '#d1d5db'
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-md mx-auto px-4 min-h-screen flex flex-col">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t.quizBirthdateTitle || "¿Cuándo naciste?"}
        </h2>
        <p className="text-gray-500 text-sm">
          {t.quizBirthdateSubtitle || "Esto se usará para calibrar tu plan personalizado."}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex gap-3 w-full justify-center">
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

      <div className="pt-8">
        <Button
          onClick={handleNext}
          className="w-full bg-gray-900 hover:bg-gray-950 text-white py-4 rounded-full text-base font-semibold"
        >
          {t.quizContinue || 'Continuar'}
        </Button>
      </div>
    </div>
  );
}