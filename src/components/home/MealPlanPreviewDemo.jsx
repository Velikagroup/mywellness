import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

export default function MealPlanPreviewDemo() {
  const [selectedDay, setSelectedDay] = useState('Lun');

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
      title: 'Filetto di Manzo con Burro e Sale',
      calories: 317,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'
    },
    {
      name: 'Spuntino Mattina',
      title: 'Spuntino di Fragole e Burro',
      calories: 159,
      image: 'https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=400&h=400&fit=crop'
    },
    {
      name: 'Pranzo',
      title: 'Pane/Fette di Manzo con Burro',
      calories: 397,
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop'
    },
    {
      name: 'Snack Pomeridiano',
      title: 'Uova e Burro con Peperoni',
      calories: 160,
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop'
    },
    {
      name: 'Cena',
      title: 'Bistecca di Manzo con Burro Aromatizzato',
      calories: 395,
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop'
    },
    {
      name: 'Spuntino Serale',
      title: 'Uova Rosolante di Burro con Fagiolini di Manzo',
      calories: 158,
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=400&fit=crop'
    }
  ];

  return (
    <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-50 to-white px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Programmazione Settimanale</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-700">MyWellness</span>
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
          </div>
        </div>

        {/* Days selector */}
        <div className="flex gap-2">
          {daysOfWeek.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                selectedDay === day.id
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Protocol Card */}
      <div className="px-6 py-4 bg-gradient-to-br from-teal-50/50 to-blue-50/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900">Protocollo di Lunedì</h3>
          <button className="px-3 py-1 text-xs font-semibold text-teal-700 bg-white rounded-full border border-teal-200 hover:bg-teal-50 transition-colors">
            + Aggiungi una terza forma
          </button>
        </div>

        {/* Macros Grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white rounded-xl px-3 py-2 text-center border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-500 mb-0.5">Calorie Totali</div>
            <div className="text-lg font-black text-gray-900">1586</div>
            <div className="text-xs text-gray-400">kcal</div>
          </div>
          <div className="bg-white rounded-xl px-3 py-2 text-center border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-500 mb-0.5">Proteine</div>
            <div className="text-lg font-black text-red-600">124.5</div>
            <div className="text-xs text-gray-400">g</div>
          </div>
          <div className="bg-white rounded-xl px-3 py-2 text-center border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-500 mb-0.5">Carboidrati</div>
            <div className="text-lg font-black text-blue-600">1.2</div>
            <div className="text-xs text-gray-400">g</div>
          </div>
          <div className="bg-white rounded-xl px-3 py-2 text-center border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-500 mb-0.5">Grassi</div>
            <div className="text-lg font-black text-amber-600">122.8</div>
            <div className="text-xs text-gray-400">g</div>
          </div>
        </div>

        {/* Target giornaliero */}
        <div className="text-xs text-gray-600 text-center">
          <span className="font-medium">Target giornaliero: 1696 kcal</span>
          <span className="ml-2 text-gray-400">(9 kcal)</span>
        </div>
      </div>

      {/* Meals List */}
      <div className="px-4 py-4 space-y-2 max-h-[400px] overflow-y-auto">
        {mondayMeals.map((meal, index) => (
          <div
            key={index}
            className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-pointer shadow-sm"
          >
            <img
              src={meal.image}
              alt={meal.title}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-medium mb-0.5">{meal.name}</div>
              <div className="text-sm font-semibold text-gray-900 truncate">{meal.title}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">{meal.calories}</div>
              <div className="text-xs text-gray-400">kcal</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation (Demo) */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <span className="text-xs">Dashboard</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-teal-600">
            <div className="w-5 h-5 bg-teal-500 rounded"></div>
            <span className="text-xs font-semibold">Nutrizione</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <span className="text-xs">Impostazioni</span>
          </button>
        </div>
      </div>

      {/* DEMO Badge */}
      <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
        DEMO
      </div>
    </Card>
  );
}