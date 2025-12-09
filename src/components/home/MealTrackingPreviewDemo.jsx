import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Check, Camera, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function MealTrackingPreviewDemo() {
  const { t } = useLanguage();
  const [meals, setMeals] = useState([
    { id: 1, name: 'Colazione', time: '08:00', checked: true, hasPhoto: true },
    { id: 2, name: 'Spuntino Mattina', time: '11:00', checked: true, hasPhoto: false },
    { id: 3, name: 'Pranzo', time: '13:30', checked: false, hasPhoto: false },
    { id: 4, name: 'Snack Pomeridiano', time: '17:00', checked: false, hasPhoto: false },
    { id: 5, name: 'Cena', time: '20:00', checked: false, hasPhoto: false }
  ]);

  return (
    <>
      <style>{`
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        @keyframes check-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        
        .check-bounce {
          animation: check-bounce 0.3s ease-out;
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto water-glass-effect border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-50 to-green-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tracking Pasti</h2>
              <p className="text-xs text-gray-600">Segna cosa hai mangiato oggi</p>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-full border border-teal-200">
              <span className="text-xs font-semibold text-teal-700">Lunedì</span>
            </div>
          </div>
          
          <div className="bg-white/80 rounded-lg p-3 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Pasti Completati</span>
              <span className="text-lg font-black text-teal-600">2/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full transition-all" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>

        {/* Meals List */}
        <div className="px-4 py-5 space-y-3">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className={`relative rounded-xl p-4 border-2 transition-all ${
                meal.checked
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                  : 'bg-white border-gray-200 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    meal.checked
                      ? 'bg-teal-500 border-teal-500 check-bounce'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {meal.checked && <Check className="w-4 h-4 text-white" />}
                </div>

                {/* Meal Info */}
                <div className="flex-1">
                  <p className={`font-semibold transition-all ${
                    meal.checked ? 'text-gray-700' : 'text-gray-900'
                  }`}>
                    {meal.name}
                  </p>
                  <p className="text-xs text-gray-500">{meal.time}</p>
                </div>

                {/* Photo Badge */}
                {meal.hasPhoto && (
                  <div className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center gap-1">
                    <Camera className="w-3 h-3 text-white" />
                    <span className="text-xs font-bold text-white">Foto</span>
                  </div>
                )}
              </div>

              {/* Photo Suggestion */}
              {meal.checked && !meal.hasPhoto && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-teal-300 rounded-lg text-sm font-medium text-teal-700 opacity-60 cursor-not-allowed"
                  >
                    <Camera className="w-4 h-4" />
                    Aggiungi Foto per Precisione
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mx-4 mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 mb-1">Doppio Livello di Precisione</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Spunta i pasti per un tracking base. Aggiungi foto per quantità esatte e precisione massima sui macro.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic text-center">
            Anteprima interfaccia • Funzionalità disponibili dopo il signup
          </p>
        </div>
      </Card>
    </>
  );
}