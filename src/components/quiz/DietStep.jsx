import React from 'react';
import { Label } from "@/components/ui/label";
import { Utensils, ShieldAlert, Heart } from "lucide-react";

const DIET_TYPES = [
  { id: 'low_carb', label: 'Low Carb', description: 'Reduced carbohydrates', icon: '🥩' },
  { id: 'soft_low_carb', label: 'Soft Low Carb', description: 'Moderate carb reduction', icon: '🥗' },
  { id: 'paleo', label: 'Paleo', description: 'Whole foods, no processed', icon: '🦴' },
  { id: 'keto', label: 'Ketogenic', description: 'Very low carb, high fat', icon: '🧈' },
  { id: 'carnivore', label: 'Carnivore', description: 'Only animal products', icon: '🥓' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat, includes dairy', icon: '🥕' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products', icon: '🌱' }
];

const COMMON_ALLERGIES = [
  'Gluten', 'Lactose', 'Nuts', 'Shellfish', 'Eggs', 'Soy', 
  'Fish', 'Sesame', 'Corn', 'Tomatoes', 'Legumes', 'Dairy'
];

const FAVORITE_INGREDIENTS = [
  'Chicken', 'Salmon', 'Beef', 'Turkey', 'Eggs', 'Avocado',
  'Broccoli', 'Spinach', 'Sweet Potato', 'Quinoa', 'Rice', 'Oats',
  'Almonds', 'Greek Yogurt', 'Olive Oil', 'Berries', 'Bananas', 'Garlic'
];

export default function DietStep({ data, onDataChange }) {
  const handleInputChange = (field, value) => {
    onDataChange({ [field]: value });
  };

  const toggleAllergy = (allergy) => {
    const currentAllergies = data.allergies || [];
    const newAllergies = currentAllergies.includes(allergy)
      ? currentAllergies.filter(a => a !== allergy)
      : [...currentAllergies, allergy];
    handleInputChange('allergies', newAllergies);
  };

  const toggleFavoriteFood = (food) => {
    const currentFavorites = data.favorite_foods || [];
    if (currentFavorites.length >= 10 && !currentFavorites.includes(food)) {
      return; // Max 10 favorites
    }
    const newFavorites = currentFavorites.includes(food)
      ? currentFavorites.filter(f => f !== food)
      : [...currentFavorites, food];
    handleInputChange('favorite_foods', newFavorites);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Utensils className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Diet Preferences</h2>
        <p className="text-white/70">Tell us about your dietary needs and preferences</p>
      </div>

      {/* Diet Type */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold">Preferred Diet Type</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DIET_TYPES.map((diet) => (
            <button
              key={diet.id}
              onClick={() => handleInputChange('diet_type', diet.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                data.diet_type === diet.id
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{diet.icon}</div>
                <p className="font-semibold text-sm">{diet.label}</p>
                <p className="text-xs opacity-80">{diet.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Allergies & Intolerances
        </Label>
        <p className="text-white/60 text-sm">Select all that apply to you</p>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {COMMON_ALLERGIES.map((allergy) => (
            <button
              key={allergy}
              onClick={() => toggleAllergy(allergy)}
              className={`p-3 rounded-2xl border transition-all duration-200 text-sm ${
                (data.allergies || []).includes(allergy)
                  ? 'bg-red-500/20 border-red-400/50 text-red-200'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>
      </div>

      {/* Favorite Foods */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Favorite Ingredients
          <span className="text-sm font-normal text-white/60">
            ({(data.favorite_foods || []).length}/10 selected)
          </span>
        </Label>
        <p className="text-white/60 text-sm">Choose up to 10 ingredients you love</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {FAVORITE_INGREDIENTS.map((food) => (
            <button
              key={food}
              onClick={() => toggleFavoriteFood(food)}
              disabled={(data.favorite_foods || []).length >= 10 && !(data.favorite_foods || []).includes(food)}
              className={`p-3 rounded-2xl border transition-all duration-200 text-sm ${
                (data.favorite_foods || []).includes(food)
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : (data.favorite_foods || []).length >= 10
                  ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              {food}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}