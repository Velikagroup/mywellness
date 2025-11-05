
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Repeat, Shield, Timer } from 'lucide-react';

export default function ExerciseCard({ exercise }) {
  return (
    <Card className="flex flex-col h-full bg-white/90 border border-gray-200/80 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-base font-semibold text-gray-900 mb-3">{exercise.name}</CardTitle>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="font-medium">{exercise.sets} set × {exercise.reps} reps</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="font-medium">{exercise.rest} rest</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-gray-50/80 border-t border-gray-200/60">
        <div className="flex flex-wrap gap-1.5 w-full">
            {exercise.muscle_groups?.map((group, idx) => (
                <Badge key={idx} variant="secondary" className="capitalize bg-[var(--brand-primary-light)] text-[var(--brand-primary-dark-text)] border-transparent text-xs font-normal">
                {group}
                </Badge>
            ))}
            {exercise.equipment && exercise.equipment.toLowerCase() !== 'bodyweight' && exercise.equipment.toLowerCase() !== 'none' && (
                <Badge variant="outline" className="flex items-center gap-1 capitalize ml-auto text-xs font-normal">
                    <Dumbbell className="w-3 h-3" />
                    {exercise.equipment}
                </Badge>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
