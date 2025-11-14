import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MousePointerClick, Clock, ChefHat, X } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MealPlanPreviewDemo() {
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);

  const daysOfWeek = [
    { id: 'lun', label: 'Lun' },
    { id: 'mar', label: 'Mar' },
    { id: 'mer', label: 'Mer' },
    { id: 'gio', label: 'Gio' },
    { id: 'ven', label: 'Ven' },
    { id: 'sab', label: 'Sab' },
    { id: 'dom', label: 'Dom' }
  ];

  const mondayMeals = [
    {
      id: 1,
      name: "Colazione",
      description: "Frittata di Quinoa e Verdure",
      calories: 373,
      image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80",
      total_protein: 10.2,
      total_carbs: 41.1,
      total_fat: 16.5,
      prep_time: 15,
      difficulty: "Facile",
      ingredients: [
        { name: "Quinoa (cotta)", quantity: 80.06, unit: "g", calories: 154 },
        { name: "Pomodori (ciliegini)", quantity: 98.88, unit: "g", calories: 17 },
        { name: "Cetriolo", quantity: 98.85, unit: "g", calories: 16 },
        { name: "Peperoni rossi", quantity: 98.06, unit: "g", calories: 30 },
        { name: "Tofu (affumicato)", quantity: 48.44, unit: "g", calories: 69 },
        { name: "Olio d'oliva", quantity: 9.85, unit: "g", calories: 87 },
        { name: "Nutritional yeast", quantity: 9.88, unit: "g", calories: 39 }
      ],
      instructions: [
        "Cuocere la quinoa seguendo le istruzioni sulla confezione.",
        "Tagliare a cubetti i pomodorini, il cetriolo e i peperoni.",
        "In una ciotola, unire la quinoa cotta con le verdure tagliate.",
        "Aggiungere il tofu affumicato sbriciolato e mescolare bene.",
        "Condire con olio d'oliva e cospargere con nutritional yeast.",
        "Mescolare il tutto e servire fresca."
      ]
    },
    {
      id: 2,
      name: "Spuntino Mattina",
      description: "Ricotta di Quinoa e Verdure",
      calories: 162,
      image: "https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=400&q=80"
    },
    {
      id: 3,
      name: "Pranzo",
      description: "Bowl di Quinoa con Verdure e Tofu",
      calories: 447,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
    },
    {
      id: 4,
      name: "Snack Pomeridiano",
      description: "Insalata di Quinoa con Verdure Grigliate",
      calories: 149,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80"
    },
    {
      id: 5,
      name: "Cena",
      description: "Bowl di Quinoa e Verdure Grigliate con Tofu",
      calories: 372,
      image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"
    }
  ];

  const totalDailyStats = {
    calories: 1493,
    protein: 70.2,
    carbs: 136.3,
    fat: 79.5
  };

  const handleMealClick = (meal) => {
    if (meal.ingredients) {
      setSelectedMeal(meal);
      setShowRecipeModal(true);
    }
  };

  return (
    <>
      <div className="relative group cursor-pointer">
        {/* Protocollo Nutrizionale Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Protocollo Nutrizionale</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="px-3 py-1 bg-gray-100 rounded-full font-medium">MyWellness 💚</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Pianificazione e utilizzo dei pasti con AI</p>
          </div>

          {/* Tabs Giorni */}
          <div className="px-6 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Programmazione Settimanale</h3>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {daysOfWeek.map((day, index) => (
                <button
                  key={day.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                    index === 0
                      ? 'bg-[#26847F] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Protocollo di Lunedì */}
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">Protocollo di Lunedì</h4>
                <button className="text-sm text-[#26847F] font-medium hover:underline">
                  ⚡ Aggiungi
                </button>
              </div>

              {/* Daily Totals */}
              <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-gradient-to-br from-[#e9f6f5] to-white rounded-lg border border-[#26847F]/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalDailyStats.calories}</div>
                  <div className="text-xs text-gray-600 font-medium">kcal</div>
                  <div className="text-xs text-gray-500 mt-0.5">Calorie Totali</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{totalDailyStats.protein}</div>
                  <div className="text-xs text-gray-600 font-medium">g</div>
                  <div className="text-xs text-gray-500 mt-0.5">Proteine</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{totalDailyStats.carbs}</div>
                  <div className="text-xs text-gray-600 font-medium">g</div>
                  <div className="text-xs text-gray-500 mt-0.5">Carboidrati</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalDailyStats.fat}</div>
                  <div className="text-xs text-gray-600 font-medium">g</div>
                  <div className="text-xs text-gray-500 mt-0.5">Grassi</div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4 italic">*Piani giornalieri: 1493 kcal</p>

              {/* Meals List */}
              <div className="space-y-2">
                {mondayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    onClick={() => handleMealClick(meal)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      meal.ingredients
                        ? 'bg-white border-gray-200 hover:border-[#26847F] hover:shadow-md cursor-pointer'
                        : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-75'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                      <img
                        src={meal.image}
                        alt={meal.description}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900 text-sm">{meal.name}</h5>
                      <p className="text-xs text-gray-600 truncate">{meal.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-gray-900">{meal.calories}</div>
                      <div className="text-xs text-gray-500">kcal</div>
                    </div>
                    {meal.ingredients && (
                      <div className="flex-shrink-0">
                        <MousePointerClick className="w-4 h-4 text-[#26847F] animate-pulse" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 text-right mt-3">+2 pasti</p>
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 pointer-events-none rounded-2xl"></div>
        </div>

        {/* Badge Informativo */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="bg-[#26847F] text-white px-4 py-2 rounded-full font-semibold text-xs shadow-xl whitespace-nowrap">
            ✨ Clicca su "Colazione" per vedere i dettagli
          </div>
        </div>
      </div>

      {/* Modal Ricetta */}
      <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          {selectedMeal && (
            <div className="flex flex-col h-full">
              {/* Header con X */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">{selectedMeal.description}</h2>
                <button
                  onClick={() => setShowRecipeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6 p-6">
                  {/* Left: Image */}
                  <div>
                    <div className="rounded-xl overflow-hidden mb-4">
                      <img
                        src={selectedMeal.image}
                        alt={selectedMeal.description}
                        className="w-full h-64 object-cover"
                      />
                    </div>

                    {/* Riepilogo Nutrizionale */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-[#26847F] rounded-full"></div>
                        <h3 className="text-sm font-bold text-gray-900">Riepilogo Nutrizionale</h3>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-1">
                            <div>
                              <div className="text-lg font-bold text-gray-900">{selectedMeal.calories}</div>
                              <div className="text-xs text-gray-600">kcal</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-1">
                            <div>
                              <div className="text-lg font-bold text-red-600">{selectedMeal.total_protein}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Proteine (g)</div>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-1">
                            <div>
                              <div className="text-lg font-bold text-yellow-600">{selectedMeal.total_carbs}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Carboidrati (g)</div>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-1">
                            <div>
                              <div className="text-lg font-bold text-green-600">{selectedMeal.total_fat}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Grassi (g)</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Prep: {selectedMeal.prep_time} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ChefHat className="w-4 h-4" />
                          <span>Difficoltà: {selectedMeal.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Tabs */}
                  <div>
                    <Tabs defaultValue="ingredients" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="ingredients">🛒 Ingredienti</TabsTrigger>
                        <TabsTrigger value="preparation">👨‍🍳 Preparazione</TabsTrigger>
                      </TabsList>

                      <TabsContent value="ingredients" className="space-y-2 mt-0">
                        {selectedMeal.ingredients.map((ingredient, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-[#26847F] transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">{ingredient.name}</p>
                              <p className="text-xs text-gray-500">
                                {ingredient.quantity}{ingredient.unit}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-900">{ingredient.calories} kcal</div>
                              <button className="text-xs text-gray-400 hover:text-[#26847F] transition-colors">
                                ⊖
                              </button>
                            </div>
                          </div>
                        ))}
                      </TabsContent>

                      <TabsContent value="preparation" className="space-y-3 mt-0">
                        {selectedMeal.instructions.map((instruction, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#26847F] text-white flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <p className="text-sm text-gray-700 pt-0.5">{instruction}</p>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}