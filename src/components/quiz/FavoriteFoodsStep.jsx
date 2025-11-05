import React from 'react';

const FAVORITE_INGREDIENTS = [
  'Chicken', 'Salmon', 'Beef', 'Turkey', 'Eggs', 'Avocado',
  'Broccoli', 'Spinach', 'Sweet Potato', 'Quinoa', 'Rice', 'Oats',
  'Almonds', 'Greek Yogurt', 'Olive Oil', 'Berries', 'Bananas', 'Garlic'
];

export default function FavoriteFoodsStep({ data, onDataChange }) {
  const currentFavorites = data.favorite_foods || [];

  const toggleFood = (food) => {
    if (currentFavorites.length >= 10 && !currentFavorites.includes(food)) {
      return; // Max 10 favorites
    }
    const newFavorites = currentFavorites.includes(food)
      ? currentFavorites.filter(f => f !== food)
      : [...currentFavorites, food];
    onDataChange({ favorite_foods: newFavorites });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">❤️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your favorite ingredients?</h2>
        <p className="text-gray-600">Choose up to 10 ingredients you love to eat</p>
        <p className="text-sm text-green-600 font-medium">
          {currentFavorites.length}/10 selected
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {FAVORITE_INGREDIENTS.map((food) => (
            <button
              key={food}
              onClick={() => toggleFood(food)}
              disabled={currentFavorites.length >= 10 && !currentFavorites.includes(food)}
              className={`p-3 rounded-lg border-2 transition-all hover:shadow-sm text-sm ${
                currentFavorites.includes(food)
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : currentFavorites.length >= 10
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 text-gray-700 hover:border-green-300'
              }`}
            >
              {food}
            </button>
          ))}
        </div>

        {currentFavorites.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 font-medium">Your favorite ingredients:</p>
            <p className="text-green-600 text-sm">{currentFavorites.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}