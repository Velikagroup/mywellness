import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function IngredientSelector({ isOpen, onClose, onSelectIngredient }) {
  const [ingredients, setIngredients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  const filteredIngredients = ingredients.filter(ing =>
    ing.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectIngredient = (ingredient) => {
    onSelectIngredient(ingredient);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0 gap-0">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 text-base h-12"
              autoFocus
            />
          </div>
        </div>

        <div className="px-6 pb-4">
          {/* Suggested */}
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Sugerencias</h3>
          
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">
              Cargando ingredientes...
            </div>
          ) : filteredIngredients.length > 0 ? (
            <div className="space-y-3">
              {filteredIngredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{ingredient.name}</p>
                    {ingredient.default_unit && ingredient.calories_per_unit && (
                      <p className="text-xs text-gray-500">
                        💪 {ingredient.calories_per_unit} cal · {ingredient.default_unit}
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
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">No se encontraron ingredientes</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}