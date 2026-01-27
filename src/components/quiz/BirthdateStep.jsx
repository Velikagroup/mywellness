import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

export default function BirthdateStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
    const t = translations?.quiz || {};
    const [selectedMonth, setSelectedMonth] = useState(data.birthdate ? new Date(data.birthdate).getMonth() : 8);
    const [selectedDay, setSelectedDay] = useState(data.birthdate ? new Date(data.birthdate).getDate() : 1);
    const [selectedYear, setSelectedYear] = useState(data.birthdate ? new Date(data.birthdate).getFullYear() : new Date().getFullYear() - 25);

  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
  const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i);

  const updateDate = (month = selectedMonth, day = selectedDay, year = selectedYear) => {
    const age = calculateAgeForDate(year, month, day);
    const birthdateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDataChange({ birthdate: birthdateStr, age });
  };

  const calculateAgeForDate = (year, month, day) => {
    const today = new Date();
    const birth = new Date(year, month, day);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSelectMonth = (monthIndex) => {
    setSelectedMonth(monthIndex);
    updateDate(monthIndex, selectedDay, selectedYear);
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    updateDate(selectedMonth, day, selectedYear);
  };

  const handleSelectYear = (year) => {
    setSelectedYear(year);
    updateDate(selectedMonth, selectedDay, year);
  };

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

  const PickerColumn = ({ items, selectedIndex, onSelect, isMonth = false, isDay = false, isYear = false }) => (
    <div className="flex-1 flex flex-col items-center relative h-80">
      <div className="w-full h-full overflow-hidden relative flex flex-col">
        <div className="h-40" />
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(isMonth ? idx : isDay ? item : item)}
            className={`h-10 flex items-center justify-center flex-shrink-0 px-2 cursor-pointer transition-all font-semibold ${
              idx === selectedIndex || (isDay && item === selectedIndex) || (isYear && item === selectedIndex)
                ? 'text-gray-900 text-base'
                : 'text-gray-400 text-sm'
            }`}
          >
            {item}
          </button>
        ))}
        <div className="h-40" />
      </div>

      {/* Overlay bianco sopra */}
      <div className="absolute top-0 left-0 right-0 bg-white pointer-events-none" style={{ height: '140px' }} />

      {/* Gradiente fade in basso */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '140px', background: 'linear-gradient(to bottom, transparent, #ffffff)' }} />

      {/* Pillolina highlight - riga centrale */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-10 border-2 border-gray-300 rounded-2xl pointer-events-none" />
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pt-20">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />

      <QuizQuestionHeader 
        title={t.quizBirthdateTitle || "¿Cuándo naciste?"}
        subtitle={t.quizBirthdateSubtitle || "Esto se usará para calibrar tu plan personalizado."}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="flex gap-2 w-full max-w-[416px] justify-center h-80 mx-auto mt-8">
            <PickerColumn 
              items={MONTHS} 
              selectedIndex={selectedMonth}
              onSelect={handleSelectMonth}
              isMonth={true}
            />
            <PickerColumn 
              items={DAYS} 
              selectedIndex={selectedDay}
              onSelect={handleSelectDay}
              isDay={true}
            />
            <PickerColumn 
              items={YEARS} 
              selectedIndex={selectedYear}
              onSelect={handleSelectYear}
              isYear={true}
            />
          </div>

        {calculateAge() >= 18 && (
          <p className="text-sm text-gray-600 text-center mt-6">
            {calculateAge()} {t.years || 'anni'}
          </p>
        )}
      </div>

      <div>
        <Button
          onClick={handleNext}
          className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
        >
          {t.quizContinue || 'Continuar'}
        </Button>
      </div>
    </div>
  );
}