import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, MapPin, Timer, Target, AlertTriangle } from "lucide-react";

const JOINT_PAIN_AREAS = [
  'Shoulders', 'Knees', 'Lower Back', 'Upper Back', 'Neck', 
  'Wrists', 'Ankles', 'Hips', 'Elbows'
];

const FITNESS_EXPERIENCE = [
  { id: 'never', label: 'Never', description: 'I rarely or never exercise' },
  { id: 'occasionally', label: 'Occasionally', description: 'I exercise sometimes, not regularly' },
  { id: 'regularly_1_2', label: '1-2 times/week', description: 'I exercise 1-2 times per week' },
  { id: 'regularly_3_plus', label: '3+ times/week', description: 'I exercise 3 or more times per week' }
];

const WORKOUT_LOCATIONS = [
  { id: 'gym', label: 'Gym', icon: '🏋️', description: 'Full equipment access' },
  { id: 'home', label: 'Home', icon: '🏠', description: 'Limited equipment' },
  { id: 'outdoors', label: 'Outdoors', icon: '🌳', description: 'Parks, running trails' }
];

const EQUIPMENT_OPTIONS = [
  'None', 'Resistance Bands', 'Dumbbells', 'Barbell', 'Kettlebells',
  'Exercise Bike', 'Treadmill', 'Pull-up Bar', 'Yoga Mat', 'Bench'
];

const FITNESS_GOALS = [
  { id: 'tone', label: 'Tone & Define', icon: '💪', description: 'Build lean muscle' },
  { id: 'lose_weight', label: 'Lose Weight', icon: '📉', description: 'Burn fat efficiently' },
  { id: 'gain_muscle', label: 'Gain Muscle', icon: '🔥', description: 'Build mass & strength' },
  { id: 'mobility', label: 'Improve Mobility', icon: '🧘', description: 'Flexibility & movement' },
  { id: 'other', label: 'General Health', icon: '❤️', description: 'Overall wellness' }
];

const SESSION_DURATIONS = [
  { id: 'under_20', label: 'Under 20 min', description: 'Quick workouts' },
  { id: '30_min', label: '30 minutes', description: 'Standard sessions' },
  { id: '45_min', label: '45 minutes', description: 'Extended workouts' },
  { id: 'over_60', label: '60+ minutes', description: 'Long sessions' }
];

export default function FitnessStep({ data, onDataChange }) {
  const handleInputChange = (field, value) => {
    onDataChange({ [field]: value });
  };

  const toggleJointPain = (area) => {
    const currentPain = data.joint_pain || [];
    const newPain = currentPain.includes(area)
      ? currentPain.filter(p => p !== area)
      : [...currentPain, area];
    handleInputChange('joint_pain', newPain);
  };

  const toggleEquipment = (equipment) => {
    const currentEquipment = data.equipment || [];
    const newEquipment = currentEquipment.includes(equipment)
      ? currentEquipment.filter(e => e !== equipment)
      : [...currentEquipment, equipment];
    handleInputChange('equipment', newEquipment);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Fitness Goals</h2>
        <p className="text-white/70">Let's create the perfect workout plan for you</p>
      </div>

      {/* Joint Pain */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Any Joint Pain or Limitations?
        </Label>
        <p className="text-white/60 text-sm">We'll modify exercises to accommodate these areas</p>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {JOINT_PAIN_AREAS.map((area) => (
            <button
              key={area}
              onClick={() => toggleJointPain(area)}
              className={`p-3 rounded-2xl border transition-all duration-200 text-sm ${
                (data.joint_pain || []).includes(area)
                  ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Fitness Experience */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold">Current Fitness Level</Label>
        <div className="grid md:grid-cols-2 gap-3">
          {FITNESS_EXPERIENCE.map((level) => (
            <button
              key={level.id}
              onClick={() => handleInputChange('fitness_experience', level.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                data.fitness_experience === level.id
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-left">
                <p className="font-semibold">{level.label}</p>
                <p className="text-sm opacity-80">{level.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Workout Location */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Where do you prefer to workout?
        </Label>
        <div className="grid md:grid-cols-3 gap-3">
          {WORKOUT_LOCATIONS.map((location) => (
            <button
              key={location.id}
              onClick={() => handleInputChange('workout_location', location.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                data.workout_location === location.id
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{location.icon}</div>
                <p className="font-semibold">{location.label}</p>
                <p className="text-xs opacity-80">{location.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold">Available Equipment</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {EQUIPMENT_OPTIONS.map((equipment) => (
            <button
              key={equipment}
              onClick={() => toggleEquipment(equipment)}
              className={`p-3 rounded-2xl border transition-all duration-200 text-sm ${
                (data.equipment || []).includes(equipment)
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              {equipment}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Days & Duration */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label className="text-white text-lg font-semibold">Days per week</Label>
          <Select 
            value={data.workout_days?.toString() || ''} 
            onValueChange={(value) => handleInputChange('workout_days', parseInt(value))}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select days" />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7].map(day => (
                <SelectItem key={day} value={day.toString()}>
                  {day} {day === 1 ? 'day' : 'days'} per week
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label className="text-white text-lg font-semibold flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Session Duration
          </Label>
          <div className="space-y-2">
            {SESSION_DURATIONS.map((duration) => (
              <button
                key={duration.id}
                onClick={() => handleInputChange('session_duration', duration.id)}
                className={`w-full p-3 rounded-2xl border transition-all duration-200 ${
                  data.session_duration === duration.id
                    ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                    : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                }`}
              >
                <div className="text-left">
                  <p className="font-semibold">{duration.label}</p>
                  <p className="text-xs opacity-80">{duration.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fitness Goals */}
      <div className="space-y-4">
        <Label className="text-white text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" />
          Primary Fitness Goal
        </Label>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FITNESS_GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleInputChange('fitness_goal', goal.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                data.fitness_goal === goal.id
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{goal.icon}</div>
                <p className="font-semibold">{goal.label}</p>
                <p className="text-xs opacity-80">{goal.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}