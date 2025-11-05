import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Focus, Zap } from "lucide-react";

const BODY_TYPES = [
  { id: 'type1', label: 'Very Slim', description: 'Low body fat, lean build' },
  { id: 'type2', label: 'Slim', description: 'Slightly lean, athletic build' },
  { id: 'type3', label: 'Lean', description: 'Healthy weight, toned' },
  { id: 'type4', label: 'Average', description: 'Normal build, some softness' },
  { id: 'type5', label: 'Soft', description: 'Slightly above average weight' },
  { id: 'type6', label: 'Curvy', description: 'Fuller figure, some extra weight' },
  { id: 'type7', label: 'Heavy', description: 'Overweight, needs toning' },
  { id: 'type8', label: 'Very Heavy', description: 'Significantly overweight' },
  { id: 'type9', label: 'Obese', description: 'Requires substantial weight loss' }
];

const TARGET_ZONES = [
  { id: 'arms', label: 'Arms', icon: '💪' },
  { id: 'belly', label: 'Belly', icon: '🤰' },
  { id: 'legs', label: 'Legs', icon: '🦵' },
  { id: 'glutes', label: 'Glutes', icon: '🍑' },
  { id: 'face_neck', label: 'Face & Neck', icon: '😊' }
];

const WEIGHT_LOSS_SPEEDS = [
  { id: 'very_fast', label: 'Very Fast', description: '25-30% calorie deficit', icon: '🚀' },
  { id: 'moderate', label: 'Moderate', description: '20% calorie deficit', icon: '⚡' },
  { id: 'slow', label: 'Slow & Steady', description: '10-15% calorie deficit', icon: '🐢' }
];

export default function BodyTypeStep({ data, onDataChange }) {
  const handleInputChange = (field, value) => {
    onDataChange({ [field]: value });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Body Goals</h2>
        <p className="text-white/70">Define your starting point and where you want to be</p>
      </div>

      {/* Current Body Type */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold">Current Body Type</Label>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {BODY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleInputChange('current_body_type', type.id)}
              className={`p-3 rounded-2xl border transition-all duration-200 ${
                data.current_body_type === type.id
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <div className="w-8 h-12 bg-white/20 rounded-lg mx-auto mb-2"></div>
                <p className="text-xs font-medium">{type.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Target Body Type */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold">Target Body Type</Label>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {BODY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleInputChange('target_body_type', type.id)}
              className={`p-3 rounded-2xl border transition-all duration-200 ${
                data.target_body_type === type.id
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <div className="w-8 h-12 bg-white/20 rounded-lg mx-auto mb-2"></div>
                <p className="text-xs font-medium">{type.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Target Zone */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold flex items-center gap-2">
          <Focus className="w-5 h-5" />
          Primary Focus Area
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {TARGET_ZONES.map((zone) => (
            <button
              key={zone.id}
              onClick={() => handleInputChange('target_zone', zone.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                data.target_zone === zone.id
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{zone.icon}</div>
                <p className="text-sm font-medium">{zone.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Weight Loss Speed */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Weight Loss Pace
        </Label>
        <div className="grid md:grid-cols-3 gap-4">
          {WEIGHT_LOSS_SPEEDS.map((speed) => (
            <button
              key={speed.id}
              onClick={() => handleInputChange('weight_loss_speed', speed.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                data.weight_loss_speed === speed.id
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{speed.icon}</div>
                <p className="font-semibold mb-1">{speed.label}</p>
                <p className="text-xs opacity-80">{speed.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}