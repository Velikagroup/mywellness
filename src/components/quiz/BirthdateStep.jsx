import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

export default function BirthdateStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};
  const [selectedMonth, setSelectedMonth] = useState(data.birthdate ? new Date(data.birthdate).getMonth() : 8);
  const [selectedDay, setSelectedDay] = useState(data.birthdate ? new Date(data.birthdate).getDate() : 1);
  const [selectedYear, setSelectedYear] = useState(data.birthdate ? new Date(data.birthdate).getFullYear() : new Date().getFullYear() - 25);

  const monthsRef = useRef(null);
  const daysRef = useRef(null);
  const yearsRef = useRef(null);

  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
  const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i);

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

  const updateData = (month = selectedMonth, day = selectedDay, year = selectedYear) => {
    const age = calculateAgeForDate(year, month, day);
    const birthdateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDataChange({ birthdate: birthdateStr, age });
  };

  const handleMonthScroll = (e) => {
    const container = e.target;
    const itemHeight = 40;
    const topPadding = 160;
    const scrollTop = container.scrollTop;
    const centerPosition = scrollTop + topPadding;
    const index = Math.round(centerPosition / itemHeight);
    const newMonth = Math.max(0, Math.min(index, MONTHS.length - 1));
    
    if (newMonth !== selectedMonth) {
      setSelectedMonth(newMonth);
      updateData(newMonth, selectedDay, selectedYear);
    }
  };

  const handleDayScroll = (e) => {
    const container = e.target;
    const itemHeight = 40;
    const topPadding = 160;
    const scrollTop = container.scrollTop;
    const centerPosition = scrollTop + topPadding;
    const index = Math.round(centerPosition / itemHeight);
    const newDay = Math.max(1, Math.min(index + 1, 31));
    
    if (newDay !== selectedDay) {
      setSelectedDay(newDay);
      updateData(selectedMonth, newDay, selectedYear);
    }
  };

  const handleYearScroll = (e) => {
    const container = e.target;
    const itemHeight = 40;
    const topPadding = 160;
    const scrollTop = container.scrollTop;
    const centerPosition = scrollTop + topPadding;
    const index = Math.round(centerPosition / itemHeight);
    const newYear = YEARS[Math.max(0, Math.min(index, YEARS.length - 1))];
    
    if (newYear !== selectedYear) {
      setSelectedYear(newYear);
      updateData(selectedMonth, selectedDay, newYear);
    }
  };

  // Scroll al valore iniziale
  useEffect(() => {
    const scrollToCenter = (ref, index) => {
      if (ref.current) {
        const itemHeight = 40;
        const topPadding = 160;
        ref.current.scrollTop = index * itemHeight - topPadding;
      }
    };

    scrollToCenter(monthsRef, selectedMonth);
    scrollToCenter(daysRef, selectedDay - 1);
    scrollToCenter(yearsRef, YEARS.indexOf(selectedYear));
  }, []);

  const PickerColumn = ({ items, selectedIndex, onScroll, ref }) => (
    <div className="flex-1 relative">
      <div
        ref={ref}
        onScroll={onScroll}
        className="w-full h-80 overflow-y-scroll scrollbar-hide"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory'
        }}
      >
        <div className="h-40" />
        {items.map((item, idx) => (
          <div
            key={idx}
            className="h-10 flex items-center justify-center flex-shrink-0 px-2 scroll-snap-align-center"
            style={{ scrollSnapAlign: 'center' }}
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

      {/* Overlay bianco sopra */}
      <div className="absolute top-0 left-0 right-0 bg-white pointer-events-none" style={{ height: '160px' }} />

      {/* Gradiente fade in basso */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '160px', background: 'linear-gradient(to bottom, transparent, #ffffff)' }} />

      {/* Pillolina highlight - riga centrale */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-10 border-2 border-gray-300 rounded-2xl pointer-events-none" />
    </div>
  );

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
        <div className="flex gap-2 w-full max-w-[416px] justify-center mx-auto mt-8">
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