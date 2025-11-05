import React from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dumbbell, Timer, Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TodayWorkout({ workout }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-6 h-6" />
            Today's Workout
          </h3>
          <p className="text-white/70">
            {workout ? `${workout.exercises?.length || 0} exercises planned` : 'No workout scheduled'}
          </p>
        </div>
        <Link to={createPageUrl("Workouts")}>
          <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {workout ? (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <h4 className="text-white font-bold text-lg mb-2">{workout.plan_name}</h4>
            <p className="text-white/70 mb-4 capitalize">{workout.workout_type} • {workout.difficulty_level}</p>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-white/60" />
                <span className="text-white">{workout.total_duration} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white/60" />
                <span className="text-white">{workout.calories_burned} cal</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-white/80 font-medium">Exercises Preview:</h5>
            {workout.exercises?.slice(0, 3).map((exercise, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm">{exercise.name}</span>
                  <span className="text-white/60 text-xs">{exercise.sets} sets</span>
                </div>
              </div>
            ))}
            {(workout.exercises?.length || 0) > 3 && (
              <p className="text-white/50 text-sm text-center">
                +{(workout.exercises?.length || 0) - 3} more exercises
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-white/40" />
          </div>
          <p className="text-white/70 mb-4">No workout plan generated yet</p>
          <Link to={createPageUrl("Workouts")}>
            <Button className="bg-gradient-to-r from-purple-500 to-teal-500 text-white rounded-2xl">
              Generate Workout Plan
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}