import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Repeat, Timer, ChevronDown, ChevronUp, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExerciseCard({ exercise }) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Leggi i dettagli direttamente dall'oggetto exercise (dal database)
  const hasDetails = exercise.detailed_description && exercise.form_tips && exercise.target_muscles;

  return (
    <Card className="flex flex-col h-full bg-white/90 border border-gray-200/80 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 flex-1">{exercise.name}</h3>
          {hasDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="ml-2 p-1 h-auto text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
            >
              {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          )}
        </div>

        <div className="space-y-2 text-sm text-gray-700 mb-3">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="font-medium">{exercise.sets} set × {exercise.reps}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="font-medium">Riposo: {exercise.rest}</span>
          </div>
        </div>

        {/* Dettagli espandibili - Letti dal database */}
        {showDetails && hasDetails && (
          <div className="mt-4 space-y-4 border-t pt-4 animate-in slide-in-from-top-2 duration-300">
            {/* Descrizione */}
            <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-200/40">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-sm text-blue-900">Descrizione</h4>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{exercise.detailed_description}</p>
            </div>

            {/* Consigli sulla forma */}
            <div className="bg-green-50/50 rounded-lg p-3 border border-green-200/40">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-sm text-green-900">Consigli sulla Forma</h4>
              </div>
              <ul className="space-y-2">
                {exercise.form_tips?.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span className="flex-1">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Muscoli coinvolti - SENZA IMMAGINE */}
            <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-200/40">
              <h4 className="font-semibold text-sm text-purple-900 mb-3">💪 Muscoli Coinvolti</h4>
              <div className="flex flex-wrap gap-1.5">
                {exercise.target_muscles?.map((muscle, idx) => (
                  <Badge key={idx} className="text-xs bg-purple-100 text-purple-800 border-purple-300 capitalize">
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
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