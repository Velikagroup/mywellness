import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';

const DAYS = [
  { id: 'monday', label: 'Lun' },
  { id: 'tuesday', label: 'Mar' },
  { id: 'wednesday', label: 'Mer' },
  { id: 'thursday', label: 'Gio' },
  { id: 'friday', label: 'Ven' },
  { id: 'saturday', label: 'Sab' },
  { id: 'sunday', label: 'Dom' }
];

export default function WorkoutDaysStep({ data, onDataChange, nextStep }) {
  const [selectedCount, setSelectedCount] = useState(data.workout_days || null);
  const [selectedDays, setSelectedDays] = useState(data.workout_days_selected || []);

  useEffect(() => {
    if (data.workout_days) {
      setSelectedCount(data.workout_days);
    }
    if (data.workout_days_selected) {
      setSelectedDays(data.workout_days_selected);
    }
  }, [data.workout_days, data.workout_days_selected]);

  const handleCountSelection = (count) => {
    setSelectedCount(count);
    setSelectedDays([]);
    onDataChange({ workout_days: count, workout_days_selected: [] });
  };

  const handleDayToggle = (dayId) => {
    let newSelectedDays;
    if (selectedDays.includes(dayId)) {
      newSelectedDays = selectedDays.filter(d => d !== dayId);
    } else {
      if (selectedDays.length < selectedCount) {
        newSelectedDays = [...selectedDays, dayId];
      } else {
        return; // Don't allow more than selected count
      }
    }
    setSelectedDays(newSelectedDays);
    onDataChange({ workout_days: selectedCount, workout_days_selected: newSelectedDays });
  };

  const canProceed = selectedCount && selectedDays.length === selectedCount;

  return (
    <div className="space-y-8">
      {/* Step 1: Select number of days */}
      <div>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quanti giorni a settimana vuoi allenarti?</h2>
          <p className="text-gray-600">Scegli un impegno realistico e sostenibile</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-7 gap-3 max-w-3xl mx-auto">
          {[1,2,3,4,5,6,7].map(days => (
            <button
              key={days}
              onClick={() => handleCountSelection(days)}
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-md text-center ${
                selectedCount === days
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                  : 'border-gray-200 hover:border-[var(--brand-primary)]'
              }`}
            >
              <div className="text-3xl font-bold text-gray-900 mb-1">{days}</div>
              <p className="text-xs text-gray-600">{days === 1 ? 'giorno' : 'giorni'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select specific days */}
      {selectedCount && (
        <div className="border-t pt-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quali giorni preferisci?</h3>
            <p className="text-gray-600">Seleziona {selectedCount} {selectedCount === 1 ? 'giorno' : 'giorni'} specifici della settimana</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 max-w-4xl mx-auto">
            {DAYS.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              const isDisabled = !isSelected && selectedDays.length >= selectedCount;
              
              return (
                <button
                  key={day.id}
                  onClick={() => handleDayToggle(day.id)}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    isSelected
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-md'
                      : isDisabled
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-[var(--brand-primary)] hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {isSelected && <CheckCircle className="w-5 h-5 text-[var(--brand-primary)]" />}
                    <span className="font-semibold text-sm">{day.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Status message */}
          <div className="mt-6 text-center">
            {selectedDays.length < selectedCount ? (
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">
                  Seleziona altri {selectedCount - selectedDays.length} {selectedCount - selectedDays.length === 1 ? 'giorno' : 'giorni'}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-medium">Perfetto! Hai selezionato tutti i giorni</p>
              </div>
            )}
          </div>

          {/* Manual advance button */}
          {canProceed && (
            <div className="mt-8 text-center">
              <Button 
                onClick={nextStep}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-8"
              >
                Continua
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}