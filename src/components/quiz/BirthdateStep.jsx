import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

export default function BirthdateStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};
  const [selectedMonth, setSelectedMonth] = useState(8);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 25);

  const monthsRef = useRef(null);
  const daysRef = useRef(null);
  const yearsRef = useRef(null);

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

  const handleMonthScroll = () => {
    if (monthsRef.current) {
      const scrollTop = monthsRef.current.scrollTop;
      const itemHeight = 40;
      const topPadding = 160; // h-40
      const index = Math.round((scrollTop - topPadding) / itemHeight);
      setSelectedMonth(Math.max(0, Math.min(index, MONTHS.length - 1)));
      
      // Snap to center
      const targetScroll = topPadding + index * itemHeight;
      monthsRef.current.scrollTop = targetScroll;
    }
  };

  const handleDayScroll = () => {
    if (daysRef.current) {
      const scrollTop = daysRef.current.scrollTop;
      const itemHeight = 40;
      const topPadding = 160; // h-40
      const index = Math.round((scrollTop - topPadding) / itemHeight);
      setSelectedDay(Math.max(1, Math.min(index + 1, 31)));
      
      // Snap to center
      const targetScroll = topPadding + index * itemHeight;
      daysRef.current.scrollTop = targetScroll;
    }
  };

  const handleYearScroll = () => {
    if (yearsRef.current) {
      const scrollTop = yearsRef.current.scrollTop;
      const itemHeight = 40;
      const topPadding = 160; // h-40
      const index = Math.round((scrollTop - topPadding) / itemHeight);
      setSelectedYear(YEARS[Math.max(0, Math.min(index, YEARS.length - 1))]);
      
      // Snap to center
      const targetScroll = topPadding + index * itemHeight;
      yearsRef.current.scrollTop = targetScroll;
    }
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

  const PickerColumn = ({ items, selectedIndex, onScroll, ref }) => (
    <div className="flex-1 flex flex-col items-center relative h-80 -mt-12 md:-mt-32">
      <div 
        ref={ref}
        onScroll={onScroll}
        className="w-full h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="h-40" />
        {items.map((item, idx) => (
          <div
            key={idx}
            className="h-10 flex items-center justify-center flex-shrink-0 px-2 snap-center"
          >
            <span className={`text-center whitespace-nowrap transition-all font-semibold ${
              idx === selectedIndex
                ? 'text-gray-900 text-base'
                : 'text-gray-400 text-sm'
            }`}>
              {item}
            </span>
          </div>
        ))}
        <div className="h-40" />
      </div>
      
      {/* Overlay bianco sopra - blocca il testo che scorre */}
      <div className="absolute top-0 left-0 right-0 bg-white pointer-events-none" style={{ height: '140px' }} />
      
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
            onScroll={handleMonthScroll}
            ref={monthsRef}
          />
          <PickerColumn 
            items={DAYS} 
            selectedIndex={selectedDay - 1}
            onScroll={handleDayScroll}
            ref={daysRef}
          />
          <PickerColumn 
            items={YEARS} 
            selectedIndex={YEARS.indexOf(selectedYear)}
            onScroll={handleYearScroll}
            ref={yearsRef}
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