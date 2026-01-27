import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';

export default function BirthdateStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};
  const [selectedMonth, setSelectedMonth] = useState(8); // Settembre (0-indexed)
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 25);

  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
  const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i);

  useEffect(() => {
    // Carica i dati salvati
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

  const PickerColumn = ({ items, selectedIndex, onSelect, isMonths = false }) => {
    return (
      <div className="flex-1 h-64 relative overflow-y-scroll scrollbar-hide">
        <div className="h-24 pointer-events-none" />
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`w-full py-3 text-center transition-all ${
              idx === selectedIndex
                ? 'text-gray-900 font-semibold text-base'
                : 'text-gray-400 text-sm'
            }`}
          >
            {item}
          </button>
        ))}
        <div className="h-24 pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="space-y-6 min-h-screen flex flex-col">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />
      
      <div className="text-left px-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {t.quizBirthdateTitle || "¿Cuándo naciste?"}
        </h2>
        <p className="text-gray-500 text-sm">
          {t.quizBirthdateSubtitle || "Esto se usará para calibrar tu plan personalizado."}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="flex gap-2 mb-8 w-full max-w-md justify-center">
          <PickerColumn 
            items={MONTHS} 
            selectedIndex={selectedMonth} 
            onSelect={setSelectedMonth}
            isMonths={true}
          />
          <PickerColumn 
            items={DAYS} 
            selectedIndex={selectedDay - 1} 
            onSelect={(idx) => setSelectedDay(idx + 1)}
          />
          <PickerColumn 
            items={YEARS} 
            selectedIndex={YEARS.indexOf(selectedYear)} 
            onSelect={(idx) => setSelectedYear(YEARS[idx])}
          />
        </div>

        {calculateAge() >= 18 && (
          <p className="text-sm text-gray-600 text-center mb-8">
            {calculateAge()} {t.years || 'anni'}
          </p>
        )}
      </div>

      <div className="px-4 pb-8">
        <Button
          onClick={handleNext}
          className="w-full bg-gray-900 hover:bg-gray-950 text-white py-6 rounded-full text-base font-semibold"
        >
          {t.quizContinue || 'Continuar'}
        </Button>
      </div>
    </div>
  );
}