import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Utensils, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TodayMeals({ meals }) {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
  const totalCalories = meals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6" />
            Today's Meals
          </h3>
          <p className="text-white/70">
            {totalCalories} total calories planned
          </p>
        </div>
        <Link to={createPageUrl("Meals")}>
          <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {mealTypes.map((mealType) => {
          const meal = meals.find(m => m.meal_type === mealType);
          
          return (
            <div key={mealType} className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400/50 to-teal-400/50 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {mealType.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">
                      {mealType.replace(/\d+/, '')}
                    </p>
                    {meal ? (
                      <p className="text-white/70 text-sm">{meal.name}</p>
                    ) : (
                      <p className="text-white/50 text-sm">Not planned yet</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {meal ? (
                    <>
                      <p className="text-white font-bold">{meal.total_calories}</p>
                      <p className="text-white/70 text-xs">kcal</p>
                    </>
                  ) : (
                    <Plus className="w-5 h-5 text-white/40" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {meals.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/70 mb-4">No meal plan generated yet</p>
          <Link to={createPageUrl("Meals")}>
            <Button className="bg-gradient-to-r from-purple-500 to-teal-500 text-white rounded-2xl">
              Generate Meal Plan
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}