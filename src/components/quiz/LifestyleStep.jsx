import React from 'react';
import { Label } from "@/components/ui/label";
import { Activity, Clock, Zap } from "lucide-react";

const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    label: 'Sedentary',
    description: 'Desk job, little to no exercise',
    multiplier: '1.2x',
    icon: '🪑'
  },
  {
    id: 'lightly_active',
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    multiplier: '1.375x',
    icon: '🚶'
  },
  {
    id: 'moderately_active',
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    multiplier: '1.55x',
    icon: '🏃'
  },
  {
    id: 'very_active',
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    multiplier: '1.725x',
    icon: '💪'
  },
  {
    id: 'professional_athlete',
    label: 'Professional Athlete',
    description: 'Very hard exercise, training 2x/day',
    multiplier: '1.9x',
    icon: '🏆'
  }
];

export default function LifestyleStep({ data, onDataChange }) {
  const handleInputChange = (field, value) => {
    onDataChange({ [field]: value });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Lifestyle</h2>
        <p className="text-white/70">Help us understand your daily activity level</p>
      </div>

      {/* Activity Level */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold">Daily Activity Level</Label>
        <p className="text-white/60 text-sm">This helps us calculate your daily calorie needs</p>
        
        <div className="space-y-3">
          {ACTIVITY_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => handleInputChange('activity_level', level.id)}
              className={`w-full p-4 rounded-2xl border transition-all duration-200 ${
                data.activity_level === level.id
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{level.icon}</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{level.label}</p>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white">
                      {level.multiplier}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">{level.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Intermittent Fasting */}
      <div className="space-y-4 pt-6 border-t border-white/20">
        <Label className="text-white text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Intermittent Fasting
        </Label>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white/80 text-sm mb-4">
            Intermittent fasting involves cycling between periods of eating and fasting. 
            Popular methods include 16:8 (16 hours fasting, 8 hours eating) or 5:2 (eating normally 5 days, restricting calories 2 days).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleInputChange('intermittent_fasting', true)}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                data.intermittent_fasting === true
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <Zap className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">Yes, I'm interested</p>
                <p className="text-xs opacity-80">Include IF in my plan</p>
              </div>
            </button>
            <button
              onClick={() => handleInputChange('intermittent_fasting', false)}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                data.intermittent_fasting === false
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">No, regular meals</p>
                <p className="text-xs opacity-80">Traditional meal timing</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}