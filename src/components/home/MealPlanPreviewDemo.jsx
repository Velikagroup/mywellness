import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChefHat, Clock, BarChart2, Sprout, ChevronRight, MousePointerClick } from 'lucide-react';

const MacroCircle = ({ label, value, unit, color }) => (
  <div className="flex flex-col items-center">
    <div className={`w-16 h-16 rounded-full border-4 ${color} flex items-center justify-center`}>
      <span className="text-lg font-bold text-gray-800">{value}</span>
    </div>
    <p className="mt-2 text-sm font-medium text-gray-600">{label} ({unit})</p>
  </div>
);

export default function MealPlanPreviewDemo() {
  const [selectedDay, setSelectedDay] = useState('Lun');
  const [selectedMeal, setSelectedMeal] = useState(null);

  const daysOfWeek = [
    { id: 'Lun', label: 'Lun' },
    { id: 'Mar', label: 'Mar' },
    { id: 'Mer', label: 'Mer' },
    { id: 'Gio', label: 'Gio' },
    { id: 'Ven', label: 'Ven' },
    { id: 'Sab', label: 'Sab' },
    { id: 'Dom', label: 'Dom' }
  ];

  const mondayMeals = [
    {
      name: 'Colazione',
      title: 'Yogurt Greco con Miele e Noci',
      calories: 342,
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Yogurt greco', quantity: 200, unit: 'g', calories: 130, protein: 20, carbs: 8, fat: 4 },
        { name: 'Miele', quantity: 20, unit: 'g', calories: 64, protein: 0.1, carbs: 17, fat: 0 },
        { name: 'Noci', quantity: 30, unit: 'g', calories: 196, protein: 4.5, carbs: 4, fat: 19 },
        { name: 'Mirtilli freschi', quantity: 50, unit: 'g', calories: 29, protein: 0.4, carbs: 7, fat: 0.2 }
      ],
      instructions: [
        'Versa lo yogurt greco in una ciotola',
        'Aggiungi il miele sopra lo yogurt',
        'Trita grossolanamente le noci',
        'Guarnisci con noci e mirtilli freschi'
      ],
      total_protein: 25,
      total_carbs: 36,
      total_fat: 23,
      prep_time: 5,
      difficulty: 'facile'
    },
    {
      name: 'Spuntino Mattina',
      title: 'Spuntino di Fragole e Burro',
      calories: 159,
      image: 'https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Fragole fresche', quantity: 100, unit: 'g', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
        { name: 'Burro', quantity: 15, unit: 'g', calories: 112, protein: 0.1, carbs: 0, fat: 12.8 }
      ],
      instructions: [
        'Lava le fragole',
        'Taglia a metà',
        'Servi con burro a fette'
      ],
      total_protein: 1,
      total_carbs: 8,
      total_fat: 13,
      prep_time: 5,
      difficulty: 'facile'
    },
    {
      name: 'Pranzo',
      title: 'Pane/Fette di Manzo con Burro',
      calories: 397,
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Manzo magro', quantity: 180, unit: 'g', calories: 250, protein: 45, carbs: 0, fat: 7 },
        { name: 'Burro', quantity: 20, unit: 'g', calories: 149, protein: 0.2, carbs: 0, fat: 16.5 }
      ],
      instructions: [
        'Cuoci il manzo alla griglia',
        'Aggiungi burro fuso',
        'Servi caldo'
      ],
      total_protein: 45,
      total_carbs: 0,
      total_fat: 24,
      prep_time: 20,
      difficulty: 'media'
    },
    {
      name: 'Snack Pomeridiano',
      title: 'Uova e Burro con Peperoni',
      calories: 160,
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Uova', quantity: 2, unit: 'unità', calories: 140, protein: 12, carbs: 1, fat: 10 },
        { name: 'Peperoni', quantity: 50, unit: 'g', calories: 20, protein: 0.5, carbs: 4, fat: 0.2 }
      ],
      instructions: [
        'Sbatti le uova',
        'Cuoci in padella',
        'Aggiungi peperoni tagliati'
      ],
      total_protein: 13,
      total_carbs: 5,
      total_fat: 10,
      prep_time: 10,
      difficulty: 'facile'
    },
    {
      name: 'Cena',
      title: 'Bistecca di Manzo con Burro Aromatizzato',
      calories: 395,
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Bistecca di manzo', quantity: 200, unit: 'g', calories: 280, protein: 50, carbs: 0, fat: 8 },
        { name: 'Burro aromatizzato', quantity: 15, unit: 'g', calories: 112, protein: 0.1, carbs: 0, fat: 12.8 }
      ],
      instructions: [
        'Griglia la bistecca',
        'Aggiungi burro aromatizzato',
        'Lascia riposare 5 minuti'
      ],
      total_protein: 50,
      total_carbs: 0,
      total_fat: 21,
      prep_time: 25,
      difficulty: 'media'
    }
  ];

  return (
    <>
      <style>{`
        @keyframes check-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        
        .check-bounce {
          animation: check-bounce 0.3s ease-out;
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
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
          <div className="text-center">
            <p className="text-xs text-gray-400 italic">
              Anteprima interfaccia • Funzionalità disponibili dopo il signup
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}