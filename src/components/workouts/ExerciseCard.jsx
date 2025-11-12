import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Repeat, Timer, ChevronDown, ChevronUp, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mappa muscoli coinvolti per esercizio (esempio per Squat con Bilanciere)
const EXERCISE_DETAILS = {
  'squat con bilanciere': {
    description: 'Lo squat con bilanciere è uno degli esercizi fondamentali per lo sviluppo della forza e della massa muscolare delle gambe. Coinvolge praticamente tutti i gruppi muscolari della parte inferiore del corpo e richiede stabilità del core.',
    form_tips: [
      'Posiziona il bilanciere sulla parte superiore dei trapezi (high bar) o sulla parte posteriore delle spalle (low bar)',
      'Piedi larghezza spalle, punte leggermente rivolte verso l\'esterno (10-15°)',
      'Mantieni il petto in fuori e la schiena neutra durante tutto il movimento',
      'Inspira profondamente prima di scendere, trattieni il respiro durante la discesa',
      'Scendi fino a quando le cosce sono parallele al pavimento (o più in basso se la mobilità lo permette)',
      'Spingi attraverso i talloni per risalire, mantenendo le ginocchia allineate con le punte dei piedi',
      'Espira potentemente durante la fase di risalita',
      'Evita di portare le ginocchia in avanti oltre le punte dei piedi eccessivamente'
    ],
    muscles: ['quadricipiti', 'glutei', 'femorali', 'core', 'lombari'],
    muscle_image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/squat_muscles.png'
  },
  // Altri esercizi possono essere aggiunti qui
};

const getMuscleHighlightImage = (exerciseName) => {
  const normalizedName = exerciseName.toLowerCase();
  const details = EXERCISE_DETAILS[normalizedName];
  
  if (details?.muscle_image_url) {
    return details.muscle_image_url;
  }
  
  // Immagine placeholder generica del corpo umano
  return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/body_muscles_generic.png';
};

export default function ExerciseCard({ exercise }) {
  const [showDetails, setShowDetails] = useState(false);
  const normalizedName = exercise.name.toLowerCase();
  const details = EXERCISE_DETAILS[normalizedName];

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

            {/* Immagine muscoli coinvolti */}
            <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-200/40">
              <h4 className="font-semibold text-sm text-purple-900 mb-2">Muscoli Coinvolti</h4>
              <div className="flex items-center justify-center bg-white rounded-lg p-2 mb-2">
                <img 
                  src={exercise.muscle_image_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/body_muscles_generic.png'} 
                  alt={`Muscoli coinvolti - ${exercise.name}`}
                  className="max-h-48 w-auto object-contain"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x300/E9F6F5/26847F?text=Muscoli';
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-1">
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