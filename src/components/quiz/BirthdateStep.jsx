import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus } from 'lucide-react';
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

export default function BirthdateStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};
  const [selectedMonth, setSelectedMonth] = useState(8);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 25);

  const MONTHS = [
    t.monthJan || 'January',
    t.monthFeb || 'February',
    t.monthMar || 'March',
    t.monthApr || 'April',
    t.monthMay || 'May',
    t.monthJun || 'June',
    t.monthJul || 'July',
    t.monthAug || 'August',
    t.monthSep || 'September',
    t.monthOct || 'October',
    t.monthNov || 'November',
    t.monthDec || 'December'
  ];

  useEffect(() => {
    if (data.birthdate) {
      const date = new Date(data.birthdate);
      setSelectedMonth(date.getMonth());
      setSelectedDay(date.getDate());
      setSelectedYear(date.getFullYear());
    }
  }, []);

  const updateMonth = (delta) => {
    const newMonth = Math.max(0, Math.min(selectedMonth + delta, MONTHS.length - 1));
    setSelectedMonth(newMonth);
    const age = calculateAgeForDate(selectedYear, newMonth, selectedDay);
    const birthdateStr = `${selectedYear}-${String(newMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onDataChange({ birthdate: birthdateStr, age });
  };

  const updateDay = (delta) => {
    const newDay = Math.max(1, Math.min(selectedDay + delta, 31));
    setSelectedDay(newDay);
    const age = calculateAgeForDate(selectedYear, selectedMonth, newDay);
    const birthdateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    onDataChange({ birthdate: birthdateStr, age });
  };

  const updateYear = (delta) => {
    const minYear = new Date().getFullYear() - 100;
    const maxYear = new Date().getFullYear() - 18;
    const newYear = Math.max(minYear, Math.min(selectedYear + delta, maxYear));
    setSelectedYear(newYear);
    const age = calculateAgeForDate(newYear, selectedMonth, selectedDay);
    const birthdateStr = `${newYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
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

  const Stepper = ({ label, value, onIncrement, onDecrement, isMonth = false }) => (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
      <button
        onClick={onIncrement}
        className="p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Plus className="w-5 h-5 text-gray-600" />
      </button>
      <div className="px-6 py-3 bg-gray-50 rounded-full border-2 border-gray-300 min-w-[100px] text-center">
        <span className="text-lg font-semibold text-gray-900">
          {isMonth ? MONTHS[value] : value}
        </span>
      </div>
      <button
        onClick={onDecrement}
        className="p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Minus className="w-5 h-5 text-gray-600" />
      </button>
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
         <div className="flex gap-6 w-full max-w-[416px] justify-center mx-auto mt-12">
           <Stepper
             label={t.month || 'Mes'}
             value={selectedMonth}
             onIncrement={() => updateMonth(1)}
             onDecrement={() => updateMonth(-1)}
             isMonth={true}
           />
           <Stepper
             label={t.day || 'Día'}
             value={selectedDay}
             onIncrement={() => updateDay(1)}
             onDecrement={() => updateDay(-1)}
           />
           <Stepper
             label={t.year || 'Año'}
             value={selectedYear}
             onIncrement={() => updateYear(1)}
             onDecrement={() => updateYear(-1)}
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