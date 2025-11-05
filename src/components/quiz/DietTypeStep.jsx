
import React from 'react';

const DIET_TYPES = [
  { id: 'low_carb', label: 'Low Carb', description: 'Reduced carbohydrates', icon: '🥩' },
  { id: 'soft_low_carb', label: 'Soft Low Carb', description: 'Moderate carb reduction', icon: '🥗' },
  { id: 'paleo', label: 'Paleo', description: 'Whole foods, no processed', icon: '🦴' },
  { id: 'keto', label: 'Ketogenic', description: 'Very low carb, high fat', icon: '🧈' },
  { id: 'carnivore', label: 'Carnivore', description: 'Only animal products', icon: '🥓' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat, includes dairy', icon: '🥕' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products', icon: '🌱' }
];

export default function DietTypeStep({ data, onDataChange, nextStep }) {
  const handleSelection = (dietType) => {
    onDataChange({ diet_type: dietType });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🍽️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your preferred diet type?</h2>
        <p className="text-gray-600">Choose the eating style that best fits your lifestyle</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {DIET_TYPES.map((diet) => (
          <button
            key={diet.id}
            onClick={() => handleSelection(diet.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              data.diet_type === diet.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="text-3xl mb-3">{diet.icon}</div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{diet.label}</h3>
            <p className="text-xs text-gray-600">{diet.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
