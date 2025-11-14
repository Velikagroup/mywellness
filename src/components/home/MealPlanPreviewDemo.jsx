import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MousePointerClick, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MealPlanPreviewDemo() {
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  // Ricetta demo per il modal
  const demoMeal = {
    name: "Salmone al Forno con Verdure",
    image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
    total_calories: 447,
    total_protein: 38.5,
    total_carbs: 22.3,
    total_fat: 24.1,
    prep_time: 30,
    difficulty: "medium",
    ingredients: [
      { name: "Filetto di salmone", quantity: 180, unit: "g", calories: 324, protein: 36.0, carbs: 0, fat: 20.5 },
      { name: "Zucchine", quantity: 150, unit: "g", calories: 25, protein: 1.8, carbs: 3.8, fat: 0.5 },
      { name: "Pomodorini", quantity: 100, unit: "g", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { name: "Olio d'oliva", quantity: 10, unit: "ml", calories: 88, protein: 0, carbs: 0, fat: 10.0 },
      { name: "Limone", quantity: 1, unit: "unità", calories: 12, protein: 0.4, carbs: 3.8, fat: 0.1 }
    ],
    instructions: [
      "Preriscalda il forno a 180°C",
      "Condisci il salmone con sale, pepe e succo di limone",
      "Taglia le zucchine a rondelle e i pomodorini a metà",
      "Disponi il salmone su una teglia foderata con carta da forno",
      "Aggiungi le verdure intorno al pesce",
      "Irrora con olio d'oliva",
      "Cuoci in forno per 20-25 minuti",
      "Servi caldo con una spruzzata di limone fresco"
    ]
  };

  const MacroCircle = ({ label, value, unit, color }) => (
    <div className="flex flex-col items-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color} mb-2`}>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600">{unit}</div>
        </div>
      </div>
      <span className="text-xs text-gray-600 font-medium">{label}</span>
    </div>
  );

  return (
    <>
      <div 
        className="relative group cursor-pointer"
        onClick={() => setShowRecipeModal(true)}
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/4fc10cf6e_image.png"
            alt="Piano Nutrizionale MyWellness"
            className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Overlay scuro al hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
          
          {/* Icona Click centrale */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 shadow-2xl group-hover:scale-110 transition-all duration-300 border-2 border-[var(--brand-primary)]">
              <MousePointerClick className="w-8 h-8 text-[var(--brand-primary)] animate-pulse" />
            </div>
          </div>
          
          {/* Badge "Clicca per vedere una ricetta" */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-[var(--brand-primary)] text-white px-6 py-3 rounded-full font-semibold text-sm shadow-xl flex items-center gap-2">
              <span>Clicca per vedere una ricetta</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dettaglio Ricetta */}
      <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{demoMeal.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Immagine Ricetta */}
            <div className="relative h-64 rounded-xl overflow-hidden">
              <img 
                src={demoMeal.image_url}
                alt={demoMeal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700">
                  ⏱️ {demoMeal.prep_time} min
                </span>
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 capitalize">
                  {demoMeal.difficulty === 'easy' ? '😊 Facile' : demoMeal.difficulty === 'medium' ? '👨‍🍳 Medio' : '👨‍🍳 Difficile'}
                </span>
              </div>
            </div>

            {/* Macro Nutrizionali */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
              <MacroCircle 
                label="Calorie" 
                value={demoMeal.total_calories} 
                unit="kcal" 
                color="bg-blue-100"
              />
              <MacroCircle 
                label="Proteine" 
                value={demoMeal.total_protein} 
                unit="g" 
                color="bg-red-100"
              />
              <MacroCircle 
                label="Carbs" 
                value={demoMeal.total_carbs} 
                unit="g" 
                color="bg-yellow-100"
              />
              <MacroCircle 
                label="Grassi" 
                value={demoMeal.total_fat} 
                unit="g" 
                color="bg-green-100"
              />
            </div>

            {/* Ingredienti */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                🛒 Ingredienti
              </h3>
              <div className="space-y-2">
                {demoMeal.ingredients.map((ingredient, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-[var(--brand-primary)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--brand-primary-light)] flex items-center justify-center">
                        <span className="text-xs font-bold text-[var(--brand-primary)]">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{ingredient.name}</p>
                        <p className="text-sm text-gray-500">
                          {ingredient.quantity} {ingredient.unit} • {ingredient.calories} kcal
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <div>P: {ingredient.protein}g</div>
                      <div>C: {ingredient.carbs}g</div>
                      <div>G: {ingredient.fat}g</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Istruzioni */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                👨‍🍳 Preparazione
              </h3>
              <div className="space-y-3">
                {demoMeal.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 pt-0.5">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Badge Demo */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-700">
                ✨ <span className="font-semibold">Questa è una ricetta demo.</span> Con MyWellness ottieni piani completi personalizzati con ricette dettagliate come questa!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}