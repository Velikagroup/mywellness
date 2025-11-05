import React from 'react';

const COMMON_ALLERGIES = [
  'Gluten', 'Lactose', 'Nuts', 'Shellfish', 'Eggs', 'Soy', 
  'Fish', 'Sesame', 'Corn', 'Tomatoes', 'Legumes', 'Dairy'
];

export default function AllergiesStep({ data, onDataChange }) {
  const currentAllergies = data.allergies || [];

  const toggleAllergy = (allergy) => {
    const newAllergies = currentAllergies.includes(allergy)
      ? currentAllergies.filter(a => a !== allergy)
      : [...currentAllergies, allergy];
    onDataChange({ allergies: newAllergies });
  };

  const handleNone = () => {
    onDataChange({ allergies: [] });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Do you have any food allergies or intolerances?</h2>
        <p className="text-gray-600">Select all that apply to ensure your meal plan is safe</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {COMMON_ALLERGIES.map((allergy) => (
            <button
              key={allergy}
              onClick={() => toggleAllergy(allergy)}
              className={`p-3 rounded-lg border-2 transition-all hover:shadow-sm text-sm ${
                currentAllergies.includes(allergy)
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-700 hover:border-green-300'
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleNone}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${
              currentAllergies.length === 0
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-700 hover:border-green-300'
            }`}
          >
            None of the above
          </button>
        </div>

        {currentAllergies.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-700 font-medium">Selected allergies/intolerances:</p>
            <p className="text-red-600 text-sm">{currentAllergies.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}