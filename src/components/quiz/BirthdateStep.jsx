import React from 'react';
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

export default function BirthdateStep({ data, onDataChange, translations }) {
  const t = translations?.quiz || {};
  const handleChange = (e) => {
    const birthdate = e.target.value;
    
    // Calcola l'età dalla data di nascita
    if (birthdate) {
      const today = new Date();
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      onDataChange({ birthdate, age });
    } else {
      onDataChange({ birthdate: '', age: null });
    }
  };

  // Calcola data minima (18 anni fa) e massima (100 anni fa)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.quizBirthdateTitle || "Qual è la tua data di nascita?"}</h2>
        <p className="text-gray-600">{t.quizBirthdateSubtitle || "Ci aiuta a calcolare il tuo metabolismo con precisione e a celebrare i tuoi traguardi"}</p>
      </div>

      <div className="max-w-md mx-auto">
        <Input
          type="date"
          value={data.birthdate || ''}
          onChange={handleChange}
          className="text-center text-lg h-16 border-2 border-gray-200 focus:border-[var(--brand-primary)]"
          min={minDate}
          max={maxDate}
        />
        <p className="text-sm text-gray-500 mt-2 text-center">
          {data.age ? `${data.age} ${t.years || 'anni'}` : (t.quizBirthdateMinAge || 'Devi avere almeno 18 anni')}
        </p>
      </div>
    </div>
  );
}