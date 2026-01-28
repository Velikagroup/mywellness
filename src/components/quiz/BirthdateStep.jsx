import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus } from 'lucide-react';
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

  // Setup iniziale dello scroll per posizionare i valori al centro
  useEffect(() => {
    setTimeout(() => {
      const itemHeight = 40;
      const topPadding = 160;
      const containerHeight = 320;

      if (monthsRef.current) {
        const scroll = topPadding + selectedMonth * itemHeight - containerHeight / 2;
        monthsRef.current.scrollTop = scroll;
      }
      if (daysRef.current) {
        const scroll = topPadding + (selectedDay - 1) * itemHeight - containerHeight / 2;
        daysRef.current.scrollTop = scroll;
      }
      if (yearsRef.current) {
        const yearIndex = YEARS.indexOf(selectedYear);
        const scroll = topPadding + yearIndex * itemHeight - containerHeight / 2;
        yearsRef.current.scrollTop = scroll;
      }
    }, 0);
  }, []);

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

  const updateMonth = (delta) => {
    const newMonth = Math.max(0, Math.min(selectedMonth + delta, MONTHS.length - 1));
    setSelectedMonth(newMonth);
    const age = calculateAgeForDate(selectedYear, newMonth, selectedDay);
    const birthdateStr = `${selectedYear}-${String(newMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onDataChange({ birthdate: birthdateStr, age });
    scrollToMonth(newMonth);
  };

  const updateDay = (delta) => {
    const newDay = Math.max(1, Math.min(selectedDay + delta, 31));
    setSelectedDay(newDay);
    const age = calculateAgeForDate(selectedYear, selectedMonth, newDay);
    const birthdateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    onDataChange({ birthdate: birthdateStr, age });
    scrollToDay(newDay);
  };

  const updateYear = (delta) => {
    const newYear = Math.max(Math.min(...YEARS), Math.min(selectedYear + delta, Math.max(...YEARS)));
    setSelectedYear(newYear);
    const age = calculateAgeForDate(newYear, selectedMonth, selectedDay);
    const birthdateStr = `${newYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onDataChange({ birthdate: birthdateStr, age });
    scrollToYear(newYear);
  };

  const scrollToMonth = (month) => {
    if (monthsRef.current) {
      const itemHeight = 40;
      const topPadding = 160;
      const containerHeight = 320;
      const scroll = topPadding + month * itemHeight - containerHeight / 2;
      monthsRef.current.scrollTop = scroll;
    }
  };

  const scrollToDay = (day) => {
    if (daysRef.current) {
      const itemHeight = 40;
      const topPadding = 160;
      const containerHeight = 320;
      const scroll = topPadding + (day - 1) * itemHeight - containerHeight / 2;
      daysRef.current.scrollTop = scroll;
    }
  };

  const scrollToYear = (year) => {
    if (yearsRef.current) {
      const itemHeight = 40;
      const topPadding = 160;
      const containerHeight = 320;
      const yearIndex = YEARS.indexOf(year);
      const scroll = topPadding + yearIndex * itemHeight - containerHeight / 2;
      yearsRef.current.scrollTop = scroll;
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
         <div className="flex gap-2 w-full max-w-[416px] justify-center mx-auto mt-8">
           {/* Mese */}
           <div className="flex-1 flex flex-col items-center gap-2">
             <button onClick={() => updateMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg">
               <Plus className="w-5 h-5 text-gray-600" />
             </button>
             <div className="h-80 relative">
               <PickerColumn 
                 items={MONTHS} 
                 selectedIndex={selectedMonth}
                 onScroll={() => {}}
                 ref={monthsRef}
               />
             </div>
             <button onClick={() => updateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
               <Minus className="w-5 h-5 text-gray-600" />
             </button>
           </div>

           {/* Giorno */}
           <div className="flex-1 flex flex-col items-center gap-2">
             <button onClick={() => updateDay(1)} className="p-2 hover:bg-gray-100 rounded-lg">
               <Plus className="w-5 h-5 text-gray-600" />
             </button>
             <div className="h-80 relative">
               <PickerColumn 
                 items={DAYS} 
                 selectedIndex={selectedDay - 1}
                 onScroll={() => {}}
                 ref={daysRef}
               />
             </div>
             <button onClick={() => updateDay(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
               <Minus className="w-5 h-5 text-gray-600" />
             </button>
           </div>

           {/* Anno */}
           <div className="flex-1 flex flex-col items-center gap-2">
             <button onClick={() => updateYear(1)} className="p-2 hover:bg-gray-100 rounded-lg">
               <Plus className="w-5 h-5 text-gray-600" />
             </button>
             <div className="h-80 relative">
               <PickerColumn 
                 items={YEARS} 
                 selectedIndex={YEARS.indexOf(selectedYear)}
                 onScroll={() => {}}
                 ref={yearsRef}
               />
             </div>
             <button onClick={() => updateYear(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
               <Minus className="w-5 h-5 text-gray-600" />
             </button>
           </div>
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