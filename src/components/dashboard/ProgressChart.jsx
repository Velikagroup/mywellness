import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Target } from "lucide-react";

export default function ProgressChart({ user }) {
  const weightToLose = user.current_weight - user.target_weight;
  const progressPercentage = Math.max(0, Math.min(100, 25)); // Mock progress

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Weight Loss Progress</h3>
          <p className="text-white/70">Track your journey to your goal</p>
        </div>
        <div className="flex items-center gap-2 text-white">
          <TrendingDown className="w-5 h-5" />
          <span className="text-2xl font-bold">{weightToLose.toFixed(1)} kg</span>
          <span className="text-white/70">to go</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-teal-500 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-3 text-sm">
          <span className="text-white/70">Start: {user.current_weight} kg</span>
          <span className="text-white font-medium">{progressPercentage}% Complete</span>
          <span className="text-white/70">Goal: {user.target_weight} kg</span>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">2.5</p>
          <p className="text-white/70 text-sm">kg lost</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">15</p>
          <p className="text-white/70 text-sm">days active</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">85%</p>
          <p className="text-white/70 text-sm">compliance</p>
        </div>
      </div>
    </div>
  );
}