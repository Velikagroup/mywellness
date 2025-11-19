import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

// Configurazione domande per ogni sport
const SPORT_QUESTIONS = {
  // 🏋️ FORZA & IPERTROFIA
  bodybuilding: {
    title: 'Bodybuilding',
    questions: [
      { id: 'weak_points', type: 'multiselect', label: 'Punti carenti da enfatizzare', options: ['Petto', 'Dorso', 'Spalle', 'Braccia', 'Gambe', 'Polpacci', 'Addominali'] },
      { id: 'body_fat', type: 'number', label: 'Percentuale massa grassa stimata (%)', placeholder: '15' },
      { id: 'training_split', type: 'select', label: 'Split preferita', options: ['Push/Pull/Legs', 'Upper/Lower', 'Bro Split (1 muscolo/giorno)', 'Full Body'] }
    ]
  },
  powerlifting: {
    title: 'Powerlifting',
    questions: [
      { id: 'squat_max', type: 'number', label: 'Massimale Squat (kg)', placeholder: '120' },
      { id: 'squat_weak_phase', type: 'select', label: 'Punto debole Squat', options: ['Uscita dalla buca (concentrica)', 'Discesa controllata (eccentrica)', 'Posizione in buca (isometrica)', 'Lockout finale', 'Stabilità generale', 'Nessun punto debole'] },
      { id: 'bench_max', type: 'number', label: 'Massimale Panca Piana (kg)', placeholder: '100' },
      { id: 'bench_weak_phase', type: 'select', label: 'Punto debole Panca', options: ['Partenza dal petto', 'Sticking point (metà movimento)', 'Lockout finale', 'Discesa controllata', 'Stabilità scapole', 'Nessun punto debole'] },
      { id: 'deadlift_max', type: 'number', label: 'Massimale Stacco (kg)', placeholder: '150' },
      { id: 'deadlift_weak_phase', type: 'select', label: 'Punto debole Stacco', options: ['Partenza da terra', 'Passaggio ginocchia', 'Lockout finale', 'Posizione lombare', 'Presa (grip)', 'Velocità concentrica', 'Nessun punto debole'] },
      { id: 'weak_lift', type: 'select', label: 'Alzata più debole complessiva', options: ['Squat', 'Panca', 'Stacco'] }
    ]
  },
  weightlifting: {
    title: 'Weightlifting Olimpico',
    questions: [
      { id: 'snatch_max', type: 'number', label: 'Massimale Strappo (kg)', placeholder: '80' },
      { id: 'snatch_weak_phase', type: 'select', label: 'Punto debole Strappo', options: ['Prima tirata (da terra a ginocchia)', 'Seconda tirata (esplosione)', 'Incastro (catch)', 'Overhead squat', 'Transizione sotto il bilanciere', 'Mobilità spalle', 'Nessun punto debole'] },
      { id: 'clean_jerk_max', type: 'number', label: 'Massimale Slancio (kg)', placeholder: '100' },
      { id: 'clean_weak_phase', type: 'select', label: 'Punto debole Girata', options: ['Prima tirata', 'Seconda tirata esplosiva', 'Incastro rack position', 'Front squat', 'Mobilità polsi', 'Velocità sotto bilanciere', 'Nessun punto debole'] },
      { id: 'jerk_weak_phase', type: 'select', label: 'Punto debole Jerk', options: ['Dip iniziale', 'Spinta esplosiva (drive)', 'Split (affondo)', 'Stabilità overhead', 'Recupero posizione', 'Nessun punto debole'] },
      { id: 'squat_max', type: 'number', label: 'Massimale Squat (kg)', placeholder: '140' },
      { id: 'weak_lift', type: 'select', label: 'Alzata da migliorare complessiva', options: ['Strappo', 'Slancio', 'Girata', 'Jerk', 'Squat'] }
    ]
  },
  streetlifting: {
    title: 'Streetlifting',
    questions: [
      { id: 'pullup_max', type: 'number', label: 'Massimo Pull-up consecutivi', placeholder: '15' },
      { id: 'pullup_weak_phase', type: 'select', label: 'Punto debole Pull-up', options: ['Partenza (dead hang)', 'Fase intermedia (metà movimento)', 'Passaggio mento sopra sbarra', 'Discesa controllata (eccentrica)', 'Endurance (ultime reps)', 'Nessun punto debole'] },
      { id: 'dip_max', type: 'number', label: 'Massimo Dip consecutivi', placeholder: '20' },
      { id: 'dip_weak_phase', type: 'select', label: 'Punto debole Dip', options: ['Discesa profonda', 'Uscita dalla buca (concentrica)', 'Lockout completo', 'Stabilità spalle', 'Endurance', 'Nessun punto debole'] },
      { id: 'muscle_up', type: 'boolean', label: 'Sai fare il Muscle-Up?' },
      { id: 'muscle_up_weak_phase', type: 'select', label: 'Punto debole Muscle-up (se lo fai)', options: ['Non lo faccio ancora', 'Fase pull-up esplosiva', 'Transizione (kipping/passaggio)', 'Fase push (sopra la sbarra)', 'Coordinazione generale'] },
      { id: 'weak_points', type: 'multiselect', label: 'Skills da migliorare', options: ['Pull-up', 'Dip', 'Muscle-up', 'Front Lever', 'Planche', 'Human Flag'] }
    ]
  },
  calisthenics: {
    title: 'Calisthenics',
    questions: [
      { id: 'skill_level', type: 'select', label: 'Livello skills', options: ['Beginner (push-up, squat)', 'Intermediate (pull-up, dip)', 'Advanced (muscle-up, front lever)', 'Elite (planche, human flag)'] },
      { id: 'target_skill', type: 'select', label: 'Skill obiettivo', options: ['Muscle-up', 'Front Lever', 'Back Lever', 'Planche', 'Human Flag', 'Handstand Push-up'] },
      { id: 'pullup_max', type: 'number', label: 'Pull-up max', placeholder: '12' }
    ]
  },
  functional_training: {
    title: 'Functional Training',
    questions: [
      { id: 'focus_area', type: 'select', label: 'Focus principale', options: ['Forza funzionale', 'Mobilità', 'Core stability', 'Movimenti multi-planari', 'Sport-specific'] },
      { id: 'sport_background', type: 'text', label: 'Sport praticato (se applicabile)', placeholder: 'es: calcio, tennis...' }
    ]
  },
  trx: {
    title: 'TRX / Sospensione',
    questions: [
      { id: 'experience_level', type: 'select', label: 'Esperienza TRX', options: ['Principiante', 'Intermedio', 'Avanzato'] },
      { id: 'focus_area', type: 'select', label: 'Focus', options: ['Core', 'Upper body', 'Lower body', 'Total body', 'Stabilità'] }
    ]
  },

  // 🔥 ALTA INTENSITÀ
  hiit: {
    title: 'HIIT',
    questions: [
      { id: 'intensity_preference', type: 'select', label: 'Intensità preferita', options: ['Moderata (30s:30s)', 'Alta (40s:20s)', 'Estrema (50s:10s)'] },
      { id: 'cardio_base', type: 'select', label: 'Base cardio', options: ['Corsa', 'Bike', 'Rower', 'Burpees', 'Mix'] }
    ]
  },
  crossfit: {
    title: 'CrossFit',
    questions: [
      { id: 'experience', type: 'select', label: 'Esperienza CrossFit', options: ['Beginner (< 6 mesi)', 'Intermediate (6-18 mesi)', 'Advanced (> 18 mesi)', 'Competitor'] },
      { id: 'squat_max', type: 'number', label: 'Back Squat max (kg)', placeholder: '100' },
      { id: 'deadlift_max', type: 'number', label: 'Deadlift max (kg)', placeholder: '130' },
      { id: 'weak_area', type: 'select', label: 'Area da migliorare', options: ['Olympic lifts', 'Gymnastics', 'Cardio/endurance', 'Forza pura'] }
    ]
  },
  tabata: {
    title: 'Tabata',
    questions: [
      { id: 'rounds_preference', type: 'select', label: 'Numero rounds', options: ['4 rounds (4 min)', '6 rounds (6 min)', '8 rounds (8 min)'] },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Upper body', 'Lower body', 'Core', 'Total body', 'Cardio puro'] }
    ]
  },
  bootcamp: {
    title: 'Bootcamp',
    questions: [
      { id: 'intensity', type: 'select', label: 'Intensità', options: ['Moderata', 'Alta', 'Militare'] },
      { id: 'group_size', type: 'select', label: 'Formato', options: ['Solo', 'Small group', 'Large group'] }
    ]
  },
  circuit_training: {
    title: 'Circuit Training',
    questions: [
      { id: 'stations_pref', type: 'select', label: 'Numero stazioni preferite', options: ['6 stazioni', '8 stazioni', '10 stazioni', '12 stazioni'] },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Forza', 'Cardio', 'Mix 50/50', 'Endurance muscolare'] }
    ]
  },

  // 🏃 CONDIZIONAMENTO
  athletic_training: {
    title: 'Athletic Training',
    questions: [
      { id: 'sport', type: 'text', label: 'Sport principale', placeholder: 'es: calcio, basket, tennis' },
      { id: 'position', type: 'text', label: 'Ruolo/Posizione', placeholder: 'es: attaccante, difensore' },
      { id: 'season_phase', type: 'select', label: 'Fase stagione', options: ['Off-season', 'Pre-season', 'In-season', 'Post-season'] }
    ]
  },
  plyometrics: {
    title: 'Plyometrics',
    questions: [
      { id: 'vertical_jump', type: 'number', label: 'Salto verticale (cm)', placeholder: '60' },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Salto verticale', 'Sprint', 'Agilità', 'Potenza esplosiva generale'] }
    ]
  },
  sprint_training: {
    title: 'Sprint Training',
    questions: [
      { id: 'time_100m', type: 'text', label: 'Tempo 100m (secondi)', placeholder: '12.5' },
      { id: 'time_200m', type: 'text', label: 'Tempo 200m (secondi)', placeholder: '26.0' },
      { id: 'preferred_distance', type: 'select', label: 'Distanza preferita', options: ['60m', '100m', '200m', '400m'] },
      { id: 'weak_phase', type: 'select', label: 'Fase da migliorare', options: ['Partenza', 'Accelerazione', 'Velocità massima', 'Resistenza velocità'] }
    ]
  },
  endurance_training: {
    title: 'Endurance Training',
    questions: [
      { id: 'target_distance', type: 'select', label: 'Distanza obiettivo', options: ['5K', '10K', 'Mezza maratona', 'Maratona', 'Ultra'] },
      { id: 'current_weekly_km', type: 'number', label: 'Km settimanali attuali', placeholder: '30' },
      { id: 'best_5k_time', type: 'text', label: 'Miglior tempo 5K (min:sec)', placeholder: '22:30' }
    ]
  },
  metcon: {
    title: 'MetCon',
    questions: [
      { id: 'format_pref', type: 'select', label: 'Formato preferito', options: ['AMRAP', 'EMOM', 'For Time', 'Chipper', 'Death by'] },
      { id: 'duration_pref', type: 'select', label: 'Durata preferita', options: ['10-15 min', '20-25 min', '30+ min'] }
    ]
  },

  // 🤸 MOBILITÀ & CORPO LIBERO
  ginnastica: {
    title: 'Ginnastica Artistica',
    questions: [
      { id: 'skill_level', type: 'select', label: 'Livello', options: ['Principiante', 'Intermedio', 'Avanzato', 'Competitivo'] },
      { id: 'apparatus_focus', type: 'multiselect', label: 'Attrezzi focus', options: ['Corpo libero', 'Parallele', 'Sbarra', 'Anelli', 'Volteggio'] }
    ]
  },
  animal_flow: {
    title: 'Animal Flow',
    questions: [
      { id: 'experience', type: 'select', label: 'Esperienza', options: ['Nuovo', 'Praticante', 'Avanzato'] },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Mobilità', 'Forza', 'Flow', 'Equilibrio'] }
    ]
  },
  movnat: {
    title: 'MovNat',
    questions: [
      { id: 'skill_focus', type: 'multiselect', label: 'Skills da sviluppare', options: ['Camminare/Correre', 'Saltare', 'Arrampicare', 'Bilanciare', 'Sollevare/Trasportare', 'Lanciare/Afferrare'] }
    ]
  },
  yoga_strength: {
    title: 'Yoga Strength',
    questions: [
      { id: 'style', type: 'select', label: 'Stile preferito', options: ['Power Yoga', 'Vinyasa Flow', 'Ashtanga', 'Rocket Yoga'] },
      { id: 'arm_balance_level', type: 'select', label: 'Livello arm balances', options: ['Principiante', 'Intermedio', 'Avanzato'] }
    ]
  },
  pilates: {
    title: 'Pilates',
    questions: [
      { id: 'equipment', type: 'select', label: 'Attrezzatura', options: ['Matwork', 'Reformer', 'Cadillac', 'Chair', 'Mix'] },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Core', 'Postura', 'Flessibilità', 'Forza', 'Riabilitazione'] }
    ]
  },

  // 💃 COREOGRAFATI
  zumba: {
    title: 'Zumba',
    questions: [
      { id: 'intensity', type: 'select', label: 'Intensità', options: ['Standard', 'Toning', 'Step', 'Strong'] },
      { id: 'dance_background', type: 'select', label: 'Esperienza ballo', options: ['Nessuna', 'Base', 'Intermedia', 'Avanzata'] }
    ]
  },
  dance_fitness: {
    title: 'Dance Fitness',
    questions: [
      { id: 'style_pref', type: 'multiselect', label: 'Stili preferiti', options: ['Hip Hop', 'Latin', 'Pop', 'Reggaeton', 'Afrobeat', 'Mix'] }
    ]
  },
  step: {
    title: 'Step',
    questions: [
      { id: 'level', type: 'select', label: 'Livello coreografia', options: ['Basic', 'Intermediate', 'Advanced', 'Athletic'] },
      { id: 'step_height', type: 'select', label: 'Altezza step', options: ['10cm', '15cm', '20cm', '25cm'] }
    ]
  },
  bodyjam: {
    title: 'BodyJam',
    questions: [
      { id: 'experience', type: 'select', label: 'Esperienza Les Mills', options: ['Nuovo', '< 6 mesi', '6-12 mesi', '> 1 anno'] }
    ]
  },
  shbam: {
    title: "Sh'Bam",
    questions: [
      { id: 'intensity_pref', type: 'select', label: 'Intensità preferita', options: ['Easy', 'Moderate', 'High'] }
    ]
  },
  pound: {
    title: 'Pound Workout',
    questions: [
      { id: 'drumming_experience', type: 'select', label: 'Esperienza drumming', options: ['Nessuna', 'Base', 'Musicista'] }
    ]
  },

  // 🧘 MIND & BODY
  yoga: {
    title: 'Yoga',
    questions: [
      { id: 'style', type: 'select', label: 'Stile principale', options: ['Hatha', 'Vinyasa', 'Ashtanga', 'Yin', 'Restorative', 'Kundalini', 'Iyengar'] },
      { id: 'inversion_comfort', type: 'select', label: 'Comfort inversioni', options: ['No inversioni', 'Solo delicate', 'Headstand ok', 'Tutti i tipi'] },
      { id: 'flexibility_level', type: 'select', label: 'Flessibilità', options: ['Rigido', 'Media', 'Buona', 'Avanzata'] }
    ]
  },
  pilates_mindful: {
    title: 'Pilates Mindful',
    questions: [
      { id: 'approach', type: 'select', label: 'Approccio', options: ['Classico', 'Contemporaneo', 'Clinico', 'Sportivo'] },
      { id: 'breathing_focus', type: 'boolean', label: 'Enfasi respirazione?' }
    ]
  },
  stretching: {
    title: 'Stretching',
    questions: [
      { id: 'type', type: 'select', label: 'Tipo stretching', options: ['Statico', 'Dinamico', 'PNF', 'Mobility flow', 'Mix'] },
      { id: 'tight_areas', type: 'multiselect', label: 'Zone rigide', options: ['Collo/Spalle', 'Schiena', 'Anche/Ischiocrurali', 'Quadricipiti', 'Polpacci', 'Petto'] }
    ]
  },
  tai_chi: {
    title: 'Tai Chi',
    questions: [
      { id: 'style', type: 'select', label: 'Stile', options: ['Yang', 'Chen', 'Wu', 'Sun', 'Mix'] },
      { id: 'experience', type: 'select', label: 'Esperienza', options: ['Principiante', 'Intermedio', 'Avanzato'] }
    ]
  },
  mindfulness: {
    title: 'Mindfulness Movement',
    questions: [
      { id: 'practice_type', type: 'multiselect', label: 'Pratiche interesse', options: ['Movimento meditativo', 'Qi Gong', 'Tai Chi flow', 'Walking meditation', 'Feldenkrais'] }
    ]
  },

  // 🥊 COMBATTIMENTO
  kickboxing: {
    title: 'Kickboxing Fitness',
    questions: [
      { id: 'experience', type: 'select', label: 'Esperienza', options: ['Principiante', 'Intermedio', 'Avanzato', 'Fighter'] },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Tecnica', 'Cardio', 'Potenza', 'Mix'] },
      { id: 'bag_access', type: 'boolean', label: 'Accesso a sacco?' }
    ]
  },
  boxing: {
    title: 'Boxe',
    questions: [
      { id: 'stance', type: 'select', label: 'Guardia', options: ['Ortodossa', 'Mancina', 'Entrambe'] },
      { id: 'experience', type: 'select', label: 'Esperienza', options: ['Principiante', 'Intermedio', 'Avanzato', 'Competitivo'] },
      { id: 'weak_punch', type: 'select', label: 'Colpo da migliorare', options: ['Jab', 'Diretto', 'Gancio', 'Montante', 'Velocità', 'Potenza'] }
    ]
  },
  mma: {
    title: 'MMA Conditioning',
    questions: [
      { id: 'fight_experience', type: 'select', label: 'Esperienza combat', options: ['Nessuna', 'Amatoriale', 'Semi-pro', 'Pro'] },
      { id: 'weak_area', type: 'select', label: 'Area da migliorare', options: ['Striking', 'Grappling', 'Wrestling', 'Cardio', 'Forza'] },
      { id: 'weight_class', type: 'select', label: 'Categoria peso', options: ['Mosca', 'Gallo', 'Piuma', 'Leggeri', 'Welter', 'Medi', 'Medio-massimi', 'Massimi'] }
    ]
  },
  fit_kombat: {
    title: 'Fit Kombat',
    questions: [
      { id: 'intensity', type: 'select', label: 'Intensità', options: ['Moderata', 'Alta', 'Massima'] }
    ]
  },
  krav_maga: {
    title: 'Krav Maga Fitness',
    questions: [
      { id: 'level', type: 'select', label: 'Livello', options: ['Principiante', 'Intermedio', 'Avanzato'] },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Self-defense', 'Fitness', 'Combattimento', 'Mix'] }
    ]
  },

  // 🚴 ATTREZZI SPECIFICI
  spinning: {
    title: 'Spinning',
    questions: [
      { id: 'ftp', type: 'number', label: 'FTP (Functional Threshold Power) in Watt', placeholder: '200' },
      { id: 'ride_style', type: 'select', label: 'Stile ride preferito', options: ['Endurance', 'Intervals', 'Hills/Climbs', 'Race simulation', 'Mix'] },
      { id: 'weekly_rides', type: 'select', label: 'Sessioni settimanali', options: ['2-3', '4-5', '6+'] }
    ]
  },
  ellittica: {
    title: 'Ellittica',
    questions: [
      { id: 'resistance_level', type: 'select', label: 'Resistenza abituale', options: ['Bassa (1-5)', 'Media (6-10)', 'Alta (11-15)', 'Molto alta (16-20)'] },
      { id: 'goal', type: 'select', label: 'Obiettivo', options: ['Cardio recovery', 'Fat burn', 'Endurance', 'HIIT'] }
    ]
  },
  rowing: {
    title: 'Rowing',
    questions: [
      { id: 'time_500m', type: 'text', label: 'Tempo 500m (min:sec)', placeholder: '1:45' },
      { id: 'time_2000m', type: 'text', label: 'Tempo 2000m (min:sec)', placeholder: '7:30' },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Tecnica', 'Potenza', 'Endurance', 'Sprint', 'Mix'] }
    ]
  },
  kettlebell: {
    title: 'Kettlebell',
    questions: [
      { id: 'max_weight', type: 'number', label: 'Peso massimo gestito (kg)', placeholder: '24' },
      { id: 'skill_level', type: 'select', label: 'Livello tecnica', options: ['Principiante', 'Intermedio', 'Avanzato', 'Certificato'] },
      { id: 'focus_lifts', type: 'multiselect', label: 'Alzate preferite', options: ['Swing', 'Snatch', 'Clean & Press', 'Turkish Get-up', 'Goblet Squat', 'Windmill'] }
    ]
  },
  sandbag: {
    title: 'Sandbag',
    questions: [
      { id: 'bag_weight', type: 'number', label: 'Peso sandbag (kg)', placeholder: '20' },
      { id: 'experience', type: 'select', label: 'Esperienza', options: ['Principiante', 'Intermedio', 'Avanzato'] }
    ]
  },
  battle_ropes: {
    title: 'Battle Ropes',
    questions: [
      { id: 'rope_length', type: 'select', label: 'Lunghezza corda', options: ['9m', '12m', '15m'] },
      { id: 'rope_diameter', type: 'select', label: 'Diametro', options: ['38mm', '50mm'] },
      { id: 'max_duration', type: 'number', label: 'Durata massima continua (secondi)', placeholder: '30' }
    ]
  },

  // 🌪️ BRANDIZZATI
  bodypump: {
    title: 'BodyPump',
    questions: [
      { id: 'track_weights', type: 'object', label: 'Pesi per track', fields: [
        { id: 'squat', label: 'Squat (kg)', placeholder: '20' },
        { id: 'chest', label: 'Petto (kg)', placeholder: '15' },
        { id: 'back', label: 'Dorso (kg)', placeholder: '12' },
        { id: 'triceps', label: 'Tricipiti (kg)', placeholder: '8' },
        { id: 'biceps', label: 'Bicipiti (kg)', placeholder: '10' },
        { id: 'lunges', label: 'Affondi (kg)', placeholder: '15' }
      ] }
    ]
  },
  bodycombat: {
    title: 'BodyCombat',
    questions: [
      { id: 'intensity', type: 'select', label: 'Intensità preferita', options: ['Standard', 'Athletic', 'Warrior'] },
      { id: 'martial_arts_background', type: 'select', label: 'Background arti marziali', options: ['Nessuno', 'Base', 'Praticante'] }
    ]
  },
  bodybalance: {
    title: 'BodyBalance',
    questions: [
      { id: 'flexibility', type: 'select', label: 'Flessibilità', options: ['Bassa', 'Media', 'Alta'] },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Rilassamento', 'Forza core', 'Flessibilità', 'Equilibrio'] }
    ]
  },
  bodyattack: {
    title: 'BodyAttack',
    questions: [
      { id: 'cardio_level', type: 'select', label: 'Livello cardio', options: ['Beginner', 'Intermediate', 'Advanced', 'Athlete'] },
      { id: 'impact_pref', type: 'select', label: 'Preferenza impatto', options: ['High impact', 'Mixed', 'Low impact options'] }
    ]
  },
  grit: {
    title: 'GRIT',
    questions: [
      { id: 'series', type: 'select', label: 'Serie preferita', options: ['GRIT Strength', 'GRIT Cardio', 'GRIT Athletic'] },
      { id: 'experience', type: 'select', label: 'Esperienza GRIT', options: ['Nuovo', '< 3 mesi', '3-6 mesi', '> 6 mesi'] }
    ]
  },
  cxworx: {
    title: 'CXWorx',
    questions: [
      { id: 'core_strength', type: 'select', label: 'Forza core attuale', options: ['Principiante', 'Intermedio', 'Avanzato'] },
      { id: 'plank_time', type: 'number', label: 'Tempo plank max (secondi)', placeholder: '60' }
    ]
  },
  booty_barre: {
    title: 'Booty Barre',
    questions: [
      { id: 'ballet_background', type: 'select', label: 'Background danza', options: ['Nessuno', 'Scolastico', 'Amatoriale', 'Professionale'] },
      { id: 'focus', type: 'select', label: 'Focus', options: ['Glutei', 'Gambe', 'Core', 'Total body', 'Flessibilità'] }
    ]
  }
};

export default function SportSpecificQuestionsStep({ data, onDataChange, nextStep }) {
  const workoutStyle = data?.workout_style;
  const sportConfig = SPORT_QUESTIONS[workoutStyle];
  
  const [answers, setAnswers] = useState(data?.sport_specific_data || {});

  if (!sportConfig) {
    // Se non ci sono domande specifiche, salta questo step
    React.useEffect(() => {
      nextStep();
    }, []);
    return null;
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelectToggle = (questionId, option) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      const newValue = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: newValue };
    });
  };

  const handleSubmit = () => {
    onDataChange({ sport_specific_data: answers });
    nextStep();
  };

  const isFormComplete = () => {
    return sportConfig.questions.every(q => {
      const answer = answers[q.id];
      if (q.type === 'multiselect') return answer && answer.length > 0;
      if (q.type === 'object') return q.fields.some(f => answers[q.id]?.[f.id]);
      if (q.type === 'boolean') return answer !== undefined;
      return answer && answer.toString().trim().length > 0;
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {sportConfig.title}
        </h3>
        <p className="text-gray-600">
          Dati specifici per creare il tuo piano perfetto
        </p>
      </div>

      <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-2">
        {sportConfig.questions.map((question) => (
          <Card key={question.id} className="p-4 bg-white/80">
            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
              {question.label}
            </Label>
            
            {question.type === 'number' && (
              <Input
                type="number"
                placeholder={question.placeholder}
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full"
              />
            )}

            {question.type === 'text' && (
              <Input
                type="text"
                placeholder={question.placeholder}
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full"
              />
            )}

            {question.type === 'select' && (
              <select
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#26847F] focus:outline-none"
              >
                <option value="">Seleziona...</option>
                {question.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {question.type === 'boolean' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={answers[question.id] || false}
                  onCheckedChange={(checked) => handleAnswerChange(question.id, checked)}
                />
                <span className="text-sm text-gray-700">Sì</span>
              </div>
            )}

            {question.type === 'multiselect' && (
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleMultiSelectToggle(question.id, opt)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                      (answers[question.id] || []).includes(opt)
                        ? 'border-[#26847F] bg-[#E0F2F1] text-[#26847F] font-medium'
                        : 'border-gray-200 hover:border-[#26847F]/50 text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'object' && (
              <div className="grid grid-cols-2 gap-3">
                {question.fields.map((field) => (
                  <div key={field.id}>
                    <Label className="text-xs text-gray-600 mb-1 block">{field.label}</Label>
                    <Input
                      type="number"
                      placeholder={field.placeholder}
                      value={answers[question.id]?.[field.id] || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setAnswers(prev => ({
                          ...prev,
                          [question.id]: {
                            ...(prev[question.id] || {}),
                            [field.id]: newValue
                          }
                        }));
                      }}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isFormComplete()}
        className="w-full bg-gradient-to-r from-[#26847F] to-teal-500 hover:from-[#1f6b66] hover:to-teal-600 text-white py-6 text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continua
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}