import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function IngredientSelector({ isOpen, onClose, onSelectIngredient }) {
  const [ingredients, setIngredients] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadIngredients();
    }
  }, [isOpen]);

  const loadIngredients = async () => {
    try {
      setIsLoading(true);
      const data = await base44.entities.Ingredient.list('-updated_date', 500);
      setIngredients(data || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      setIngredients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchWithAI = async (query) => {
    if (!query || query.length < 2) {
      setAiSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggerisci 5 ingredienti alimentari simili a "${query}" con le informazioni nutrizionali per 100g. Ritorna in JSON con questo formato:
        [
          {
            "name": "nome ingrediente",
            "calories_per_100g": numero,
            "protein_per_100g": numero,
            "carbs_per_100g": numero,
            "fat_per_100g": numero,
            "default_unit": "g"
          }
        ]`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  calories_per_100g: { type: "number" },
                  protein_per_100g: { type: "number" },
                  carbs_per_100g: { type: "number" },
                  fat_per_100g: { type: "number" },
                  default_unit: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiSuggestions(result.suggestions || []);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      setAiSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      searchWithAI(value);
    } else {
      setAiSuggestions([]);
    }
  };

  const filteredIngredients = ingredients.filter(ing =>
    ing.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectIngredient = (ingredient) => {
    onSelectIngredient(ingredient);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0 gap-0 z-[200]" aria-describedby="ingredient-selector-description">
        <p id="ingredient-selector-description" className="sr-only">Seleziona un ingrediente dalla lista o cercane uno nuovo</p>
        <DialogHeader className="border-b border-gray-200 pb-4 px-6 pt-4 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 p-2 -ml-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <DialogTitle className="text-xl font-bold text-gray-900">Registrar comida</DialogTitle>
            <div className="w-10" />
          </div>
        </DialogHeader>

        <div className="px-6 pt-4 pb-4 sticky top-16 bg-white z-10 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar un ingrediente"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 py-3 text-base h-12"
              autoFocus
            />
          </div>
          {isSearching && (
            <p className="text-xs text-gray-500 mt-2">Buscando con IA...</p>
          )}
        </div>

        <div className="px-6 pb-4 space-y-6">
          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm">✨ Sugerencias IA</h3>
              <div className="space-y-3">
                {aiSuggestions.map((ingredient, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ingredient.name}</p>
                      <p className="text-xs text-gray-600">
                        💪 {Math.round(ingredient.calories_per_100g)} cal · 100{ingredient.default_unit || 'g'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectIngredient({
                        id: `ai-${idx}`,
                        name: ingredient.name,
                        calories_per_100g: ingredient.calories_per_100g,
                        protein_per_100g: ingredient.protein_per_100g,
                        carbs_per_100g: ingredient.carbs_per_100g,
                        fat_per_100g: ingredient.fat_per_100g,
                        default_unit: ingredient.default_unit || 'g'
                      })}
                      className="ml-4 flex-shrink-0 bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition-colors"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Database Ingredients */}
          {filteredIngredients.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Todos</h3>
              <div className="space-y-3">
                {filteredIngredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ingredient.name}</p>
                      {ingredient.calories_per_100g && (
                        <p className="text-xs text-gray-500">
                          💪 {Math.round(ingredient.calories_per_100g)} cal · 100{ingredient.default_unit || 'g'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSelectIngredient(ingredient)}
                      className="ml-4 flex-shrink-0 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                    >
                      <Plus className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredIngredients.length === 0 && aiSuggestions.length === 0 && searchQuery.length > 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500">No se encontraron ingredientes</p>
            </div>
          )}

          {/* Initial State */}
          {!searchQuery && filteredIngredients.length === 0 && isLoading && (
            <div className="py-8 text-center text-gray-500">
              Cargando ingredientes...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}