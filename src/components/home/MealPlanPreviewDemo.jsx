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
    },
    {
      name: 'Spuntino Serale',
      title: 'Uova Rosolante di Burro con Fagiolini di Manzo',
      calories: 158,
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=400&fit=crop',
      ingredients: [
        { name: 'Uova', quantity: 2, unit: 'unità', calories: 140, protein: 12, carbs: 1, fat: 10 },
        { name: 'Fagiolini', quantity: 80, unit: 'g', calories: 18, protein: 1, carbs: 3, fat: 0.1 }
      ],
      instructions: [
        'Cuoci i fagiolini al vapore',
        'Prepara uova strapazzate',
        'Mescola insieme'
      ],
      total_protein: 13,
      total_carbs: 4,
      total_fat: 10,
      prep_time: 12,
      difficulty: 'facile'
    }
  ];

  return (
    <>
      <style>{`
        @keyframes bounce-arrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        
        @keyframes pulse-ring {
          0% { 
            transform: scale(0.8);
            opacity: 1;
          }
          100% { 
            transform: scale(1.4);
            opacity: 0;
          }
        }
        
        .click-indicator-ring {
          animation: pulse-ring 1.5s ease-out infinite;
        }
        
        .arrow-bounce {
          animation: bounce-arrow 1.5s ease-in-out infinite;
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Programmazione Settimanale</h2>
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm flex-shrink-0">
              <span className="text-xs font-semibold text-gray-700">MyWellness</span>
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            </div>
          </div>

          {/* Days selector */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {daysOfWeek.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`flex-shrink-0 py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold transition-all ${
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
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-br from-teal-50/50 to-blue-50/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Protocollo di Lunedì</h3>
            <button className="px-2 sm:px-3 py-1 text-xs font-semibold text-teal-700 bg-white rounded-full border border-teal-200 hover:bg-teal-50 transition-colors whitespace-nowrap">
              + Aggiungi una terza forma
            </button>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3">
            <div className="bg-white rounded-xl px-2 sm:px-3 py-2 text-center border border-gray-100 shadow-sm min-w-0">
              <div className="text-xs text-gray-500 mb-0.5 truncate">Calorie</div>
              <div className="text-base sm:text-lg font-black text-gray-900">1611</div>
              <div className="text-xs text-gray-400">kcal</div>
            </div>
            <div className="bg-white rounded-xl px-2 sm:px-3 py-2 text-center border border-gray-100 shadow-sm min-w-0">
              <div className="text-xs text-gray-500 mb-0.5 truncate">Proteine</div>
              <div className="text-base sm:text-lg font-black text-red-600">147</div>
              <div className="text-xs text-gray-400">g</div>
            </div>
            <div className="bg-white rounded-xl px-2 sm:px-3 py-2 text-center border border-gray-100 shadow-sm min-w-0">
              <div className="text-xs text-gray-500 mb-0.5 truncate">Carbo.</div>
              <div className="text-base sm:text-lg font-black text-blue-600">53</div>
              <div className="text-xs text-gray-400">g</div>
            </div>
            <div className="bg-white rounded-xl px-2 sm:px-3 py-2 text-center border border-gray-100 shadow-sm min-w-0">
              <div className="text-xs text-gray-500 mb-0.5 truncate">Grassi</div>
              <div className="text-base sm:text-lg font-black text-amber-600">91</div>
              <div className="text-xs text-gray-400">g</div>
            </div>
          </div>

          {/* Target giornaliero */}
          <div className="text-xs text-gray-600 text-center">
            <span className="font-medium">Target: 1696 kcal</span>
            <span className="ml-2 text-gray-400">(-85 kcal)</span>
          </div>
        </div>

        {/* Meals List */}
        <div className="px-4 py-4 space-y-2 max-h-[400px] overflow-y-auto relative">
          {mondayMeals.map((meal, index) => (
            <div
              key={index}
              onClick={() => setSelectedMeal(meal)}
              className="relative flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer shadow-sm hover:shadow-md min-w-0"
            >
              {/* Click Indicator on first meal image - centered */}
              {index === 0 && (
                <div className="absolute left-[34px] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  {/* Animated Circle Ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-teal-500 rounded-full click-indicator-ring"></div>
                  </div>
                  
                  {/* Static Circle Background */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-teal-500/20 rounded-full"></div>
                  </div>
                  
                  {/* Icons */}
                  <div className="relative flex items-center justify-center gap-1">
                    <MousePointerClick className="w-8 h-8 text-teal-600 drop-shadow-lg" />
                    <ChevronRight className="w-7 h-7 text-teal-600 arrow-bounce drop-shadow-lg" />
                  </div>
                </div>
              )}

              <img
                src={meal.image}
                alt={meal.title}
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 relative z-0 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 font-medium mb-0.5">{meal.name}</div>
                <div className="text-sm font-semibold text-gray-900 truncate">{meal.title}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-gray-900">{meal.calories}</div>
                <div className="text-xs text-gray-400">kcal</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation (Demo) */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50/50 border-t border-gray-100">
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
        <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg z-20">
          DEMO
        </div>
      </Card>

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">{selectedMeal.title}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2">
              <div className="space-y-6">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                  <img src={selectedMeal.image} alt={selectedMeal.title} className="w-full h-full object-cover" />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-teal-600" /> Riepilogo Nutrizionale
                  </h3>
                  <div className="flex justify-around items-center text-center">
                    <div className="flex flex-col items-center">
                      <p className="text-3xl font-bold text-teal-600">{selectedMeal.calories}</p>
                      <p className="text-sm font-medium text-gray-600">Kcal</p>
                    </div>
                    <MacroCircle label="Proteine" value={selectedMeal.total_protein} unit="g" color="border-red-400" />
                    <MacroCircle label="Carboidrati" value={selectedMeal.total_carbs} unit="g" color="border-blue-400" />
                    <MacroCircle label="Grassi" value={selectedMeal.total_fat} unit="g" color="border-yellow-400" />
                  </div>
                </div>
                
                <div className="flex items-center justify-around text-sm text-gray-600 bg-gray-50 rounded-lg border p-3">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Prep: {selectedMeal.prep_time} min</div>
                  <div className="flex items-center gap-2 capitalize"><ChefHat className="w-4 h-4" /> Difficoltà: {selectedMeal.difficulty}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-green-600"/> Ingredienti
                  </h3>
                  <div className="space-y-2">
                    {selectedMeal.ingredients.map((ing, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded-md border text-sm hover:bg-gray-50">
                        <div className="flex-grow">
                          <span className="font-medium text-gray-800">{ing.name}</span>
                          <span className="text-gray-500 ml-2">{ing.quantity}{ing.unit}</span>
                        </div>
                        <div className="text-xs text-right text-gray-500">
                          {ing.calories} kcal
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Preparazione</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    {selectedMeal.instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}