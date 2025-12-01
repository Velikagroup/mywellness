import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useLanguage } from '../i18n/LanguageContext';

// Traduzioni statiche per tutte le domande sport-specifiche
const SPORT_TRANSLATIONS = {
  it: {
    // Labels comuni
    weak_points: 'Punti carenti da enfatizzare',
    body_fat: 'Percentuale massa grassa stimata (%)',
    training_split: 'Split preferita',
    squat_max: 'Massimale Squat (kg)',
    squat_weak_phase: 'Punto debole Squat',
    bench_max: 'Massimale Panca Piana (kg)',
    bench_weak_phase: 'Punto debole Panca',
    deadlift_max: 'Massimale Stacco (kg)',
    deadlift_weak_phase: 'Punto debole Stacco',
    weak_lift: 'Alzata più debole complessiva',
    snatch_max: 'Massimale Strappo (kg)',
    snatch_weak_phase: 'Punto debole Strappo',
    clean_jerk_max: 'Massimale Slancio (kg)',
    clean_weak_phase: 'Punto debole Girata',
    jerk_weak_phase: 'Punto debole Jerk',
    pullup_max: 'Massimale Pull-up/Chin-up (kg)',
    pullup_weak_phase: 'Punto debole Pull-up',
    dip_max: 'Massimale Dip (kg)',
    dip_weak_phase: 'Punto debole Dip',
    muscle_up: 'Sai fare il Muscle-Up?',
    muscle_up_weak_phase: 'Punto debole Muscle-up',
    skill_level: 'Livello skills',
    target_skill: 'Skill obiettivo',
    focus_area: 'Focus principale',
    sport_background: 'Sport praticato',
    experience_level: 'Livello esperienza',
    experience: 'Esperienza',
    intensity_preference: 'Intensità preferita',
    cardio_base: 'Base cardio',
    weak_area: 'Area da migliorare',
    rounds_preference: 'Numero rounds',
    focus: 'Focus',
    intensity: 'Intensità',
    group_size: 'Formato',
    stations_pref: 'Numero stazioni preferite',
    sport: 'Sport principale',
    position: 'Ruolo/Posizione',
    season_phase: 'Fase stagione',
    vertical_jump: 'Salto verticale (cm)',
    time_100m: 'Tempo 100m (secondi)',
    time_200m: 'Tempo 200m (secondi)',
    preferred_distance: 'Distanza preferita',
    weak_phase: 'Fase da migliorare',
    target_distance: 'Distanza obiettivo',
    current_weekly_km: 'Km settimanali attuali',
    best_5k_time: 'Miglior tempo 5K',
    format_pref: 'Formato preferito',
    duration_pref: 'Durata preferita',
    apparatus_focus: 'Attrezzi focus',
    skill_focus: 'Skills da sviluppare',
    style: 'Stile',
    arm_balance_level: 'Livello arm balances',
    equipment: 'Attrezzatura',
    inversion_comfort: 'Comfort inversioni',
    flexibility_level: 'Flessibilità',
    approach: 'Approccio',
    breathing_focus: 'Enfasi respirazione?',
    type: 'Tipo',
    tight_areas: 'Zone rigide',
    practice_type: 'Pratiche interesse',
    bag_access: 'Accesso a sacco?',
    stance: 'Guardia',
    weak_punch: 'Colpo da migliorare',
    fight_experience: 'Esperienza combat',
    weight_class: 'Categoria peso',
    level: 'Livello',
    ftp: 'FTP (Watt)',
    ride_style: 'Stile ride preferito',
    weekly_rides: 'Sessioni settimanali',
    resistance_level: 'Resistenza abituale',
    goal: 'Obiettivo',
    time_500m: 'Tempo 500m',
    time_2000m: 'Tempo 2000m',
    max_weight: 'Peso massimo gestito (kg)',
    focus_lifts: 'Alzate preferite',
    bag_weight: 'Peso sandbag (kg)',
    rope_length: 'Lunghezza corda',
    rope_diameter: 'Diametro',
    max_duration: 'Durata massima continua (sec)',
    track_weights: 'Pesi per track',
    martial_arts_background: 'Background arti marziali',
    flexibility: 'Flessibilità',
    cardio_level: 'Livello cardio',
    impact_pref: 'Preferenza impatto',
    series: 'Serie preferita',
    core_strength: 'Forza core attuale',
    plank_time: 'Tempo plank max (sec)',
    ballet_background: 'Background danza',
    dance_background: 'Esperienza ballo',
    style_pref: 'Stili preferiti',
    step_height: 'Altezza step',
    intensity_pref: 'Intensità preferita',
    drumming_experience: 'Esperienza drumming',
    // Options comuni
    opt_chest: 'Petto', opt_back: 'Dorso', opt_shoulders: 'Spalle', opt_arms: 'Braccia',
    opt_legs: 'Gambe', opt_calves: 'Polpacci', opt_glutes: 'Glutei', opt_abs: 'Addominali',
    opt_beginner: 'Principiante', opt_intermediate: 'Intermedio', opt_advanced: 'Avanzato',
    opt_none: 'Nessuno', opt_low: 'Bassa', opt_medium: 'Media', opt_high: 'Alta',
    // Placeholders
    ph_percentage: '15', ph_weight: '100', ph_time: '12.5'
  },
  en: {
    weak_points: 'Weak points to emphasize',
    body_fat: 'Estimated body fat percentage (%)',
    training_split: 'Preferred split',
    squat_max: 'Squat max (kg)',
    squat_weak_phase: 'Squat weak point',
    bench_max: 'Bench Press max (kg)',
    bench_weak_phase: 'Bench weak point',
    deadlift_max: 'Deadlift max (kg)',
    deadlift_weak_phase: 'Deadlift weak point',
    weak_lift: 'Weakest lift overall',
    snatch_max: 'Snatch max (kg)',
    snatch_weak_phase: 'Snatch weak point',
    clean_jerk_max: 'Clean & Jerk max (kg)',
    clean_weak_phase: 'Clean weak point',
    jerk_weak_phase: 'Jerk weak point',
    pullup_max: 'Pull-up/Chin-up max (kg)',
    pullup_weak_phase: 'Pull-up weak point',
    dip_max: 'Dip max (kg)',
    dip_weak_phase: 'Dip weak point',
    muscle_up: 'Can you do a Muscle-Up?',
    muscle_up_weak_phase: 'Muscle-up weak point',
    skill_level: 'Skill level',
    target_skill: 'Target skill',
    focus_area: 'Main focus',
    sport_background: 'Sport practiced',
    experience_level: 'Experience level',
    experience: 'Experience',
    intensity_preference: 'Preferred intensity',
    cardio_base: 'Cardio base',
    weak_area: 'Area to improve',
    rounds_preference: 'Number of rounds',
    focus: 'Focus',
    intensity: 'Intensity',
    group_size: 'Format',
    stations_pref: 'Preferred number of stations',
    sport: 'Main sport',
    position: 'Role/Position',
    season_phase: 'Season phase',
    vertical_jump: 'Vertical jump (cm)',
    time_100m: '100m time (seconds)',
    time_200m: '200m time (seconds)',
    preferred_distance: 'Preferred distance',
    weak_phase: 'Phase to improve',
    target_distance: 'Target distance',
    current_weekly_km: 'Current weekly km',
    best_5k_time: 'Best 5K time',
    format_pref: 'Preferred format',
    duration_pref: 'Preferred duration',
    apparatus_focus: 'Apparatus focus',
    skill_focus: 'Skills to develop',
    style: 'Style',
    arm_balance_level: 'Arm balance level',
    equipment: 'Equipment',
    inversion_comfort: 'Inversion comfort',
    flexibility_level: 'Flexibility',
    approach: 'Approach',
    breathing_focus: 'Breathing emphasis?',
    type: 'Type',
    tight_areas: 'Tight areas',
    practice_type: 'Practices of interest',
    bag_access: 'Bag access?',
    stance: 'Stance',
    weak_punch: 'Punch to improve',
    fight_experience: 'Combat experience',
    weight_class: 'Weight class',
    level: 'Level',
    ftp: 'FTP (Watts)',
    ride_style: 'Preferred ride style',
    weekly_rides: 'Weekly sessions',
    resistance_level: 'Usual resistance',
    goal: 'Goal',
    time_500m: '500m time',
    time_2000m: '2000m time',
    max_weight: 'Max weight handled (kg)',
    focus_lifts: 'Preferred lifts',
    bag_weight: 'Sandbag weight (kg)',
    rope_length: 'Rope length',
    rope_diameter: 'Diameter',
    max_duration: 'Max continuous duration (sec)',
    track_weights: 'Weights per track',
    martial_arts_background: 'Martial arts background',
    flexibility: 'Flexibility',
    cardio_level: 'Cardio level',
    impact_pref: 'Impact preference',
    series: 'Preferred series',
    core_strength: 'Current core strength',
    plank_time: 'Max plank time (sec)',
    ballet_background: 'Dance background',
    dance_background: 'Dance experience',
    style_pref: 'Preferred styles',
    step_height: 'Step height',
    intensity_pref: 'Preferred intensity',
    drumming_experience: 'Drumming experience',
    opt_chest: 'Chest', opt_back: 'Back', opt_shoulders: 'Shoulders', opt_arms: 'Arms',
    opt_legs: 'Legs', opt_calves: 'Calves', opt_glutes: 'Glutes', opt_abs: 'Abs',
    opt_beginner: 'Beginner', opt_intermediate: 'Intermediate', opt_advanced: 'Advanced',
    opt_none: 'None', opt_low: 'Low', opt_medium: 'Medium', opt_high: 'High',
    ph_percentage: '15', ph_weight: '100', ph_time: '12.5'
  },
  es: {
    weak_points: 'Puntos débiles a enfatizar',
    body_fat: 'Porcentaje de grasa corporal estimado (%)',
    training_split: 'Split preferida',
    squat_max: 'Máximo Sentadilla (kg)',
    squat_weak_phase: 'Punto débil Sentadilla',
    bench_max: 'Máximo Press Banca (kg)',
    bench_weak_phase: 'Punto débil Press Banca',
    deadlift_max: 'Máximo Peso Muerto (kg)',
    deadlift_weak_phase: 'Punto débil Peso Muerto',
    weak_lift: 'Levantamiento más débil',
    snatch_max: 'Máximo Arrancada (kg)',
    snatch_weak_phase: 'Punto débil Arrancada',
    clean_jerk_max: 'Máximo Dos Tiempos (kg)',
    clean_weak_phase: 'Punto débil Cargada',
    jerk_weak_phase: 'Punto débil Jerk',
    pullup_max: 'Máximo Dominadas (kg)',
    pullup_weak_phase: 'Punto débil Dominadas',
    dip_max: 'Máximo Fondos (kg)',
    dip_weak_phase: 'Punto débil Fondos',
    muscle_up: '¿Sabes hacer Muscle-Up?',
    muscle_up_weak_phase: 'Punto débil Muscle-up',
    skill_level: 'Nivel de habilidades',
    target_skill: 'Habilidad objetivo',
    focus_area: 'Enfoque principal',
    sport_background: 'Deporte practicado',
    experience_level: 'Nivel de experiencia',
    experience: 'Experiencia',
    intensity_preference: 'Intensidad preferida',
    cardio_base: 'Base cardio',
    weak_area: 'Área a mejorar',
    rounds_preference: 'Número de rondas',
    focus: 'Enfoque',
    intensity: 'Intensidad',
    group_size: 'Formato',
    stations_pref: 'Número de estaciones preferidas',
    sport: 'Deporte principal',
    position: 'Rol/Posición',
    season_phase: 'Fase de temporada',
    vertical_jump: 'Salto vertical (cm)',
    time_100m: 'Tiempo 100m (segundos)',
    time_200m: 'Tiempo 200m (segundos)',
    preferred_distance: 'Distancia preferida',
    weak_phase: 'Fase a mejorar',
    target_distance: 'Distancia objetivo',
    current_weekly_km: 'Km semanales actuales',
    best_5k_time: 'Mejor tiempo 5K',
    format_pref: 'Formato preferido',
    duration_pref: 'Duración preferida',
    apparatus_focus: 'Aparatos enfoque',
    skill_focus: 'Habilidades a desarrollar',
    style: 'Estilo',
    arm_balance_level: 'Nivel equilibrios brazos',
    equipment: 'Equipamiento',
    inversion_comfort: 'Comodidad inversiones',
    flexibility_level: 'Flexibilidad',
    approach: 'Enfoque',
    breathing_focus: '¿Énfasis respiración?',
    type: 'Tipo',
    tight_areas: 'Zonas rígidas',
    practice_type: 'Prácticas de interés',
    bag_access: '¿Acceso a saco?',
    stance: 'Guardia',
    weak_punch: 'Golpe a mejorar',
    fight_experience: 'Experiencia combate',
    weight_class: 'Categoría de peso',
    level: 'Nivel',
    ftp: 'FTP (Vatios)',
    ride_style: 'Estilo de rodaje preferido',
    weekly_rides: 'Sesiones semanales',
    resistance_level: 'Resistencia habitual',
    goal: 'Objetivo',
    time_500m: 'Tiempo 500m',
    time_2000m: 'Tiempo 2000m',
    max_weight: 'Peso máximo manejado (kg)',
    focus_lifts: 'Levantamientos preferidos',
    bag_weight: 'Peso sandbag (kg)',
    rope_length: 'Longitud cuerda',
    rope_diameter: 'Diámetro',
    max_duration: 'Duración máxima continua (seg)',
    track_weights: 'Pesos por track',
    martial_arts_background: 'Experiencia artes marciales',
    flexibility: 'Flexibilidad',
    cardio_level: 'Nivel cardio',
    impact_pref: 'Preferencia impacto',
    series: 'Serie preferida',
    core_strength: 'Fuerza core actual',
    plank_time: 'Tiempo plancha máx (seg)',
    ballet_background: 'Experiencia danza',
    dance_background: 'Experiencia baile',
    style_pref: 'Estilos preferidos',
    step_height: 'Altura step',
    intensity_pref: 'Intensidad preferida',
    drumming_experience: 'Experiencia percusión',
    opt_chest: 'Pecho', opt_back: 'Espalda', opt_shoulders: 'Hombros', opt_arms: 'Brazos',
    opt_legs: 'Piernas', opt_calves: 'Pantorrillas', opt_glutes: 'Glúteos', opt_abs: 'Abdominales',
    opt_beginner: 'Principiante', opt_intermediate: 'Intermedio', opt_advanced: 'Avanzado',
    opt_none: 'Ninguno', opt_low: 'Baja', opt_medium: 'Media', opt_high: 'Alta',
    ph_percentage: '15', ph_weight: '100', ph_time: '12.5'
  },
  pt: {
    weak_points: 'Pontos fracos a enfatizar',
    body_fat: 'Percentual de gordura corporal estimado (%)',
    training_split: 'Split preferido',
    squat_max: 'Máximo Agachamento (kg)',
    squat_weak_phase: 'Ponto fraco Agachamento',
    bench_max: 'Máximo Supino (kg)',
    bench_weak_phase: 'Ponto fraco Supino',
    deadlift_max: 'Máximo Levantamento Terra (kg)',
    deadlift_weak_phase: 'Ponto fraco Levantamento Terra',
    weak_lift: 'Levantamento mais fraco',
    snatch_max: 'Máximo Arranco (kg)',
    snatch_weak_phase: 'Ponto fraco Arranco',
    clean_jerk_max: 'Máximo Arremesso (kg)',
    clean_weak_phase: 'Ponto fraco Clean',
    jerk_weak_phase: 'Ponto fraco Jerk',
    pullup_max: 'Máximo Barra fixa (kg)',
    pullup_weak_phase: 'Ponto fraco Barra fixa',
    dip_max: 'Máximo Paralelas (kg)',
    dip_weak_phase: 'Ponto fraco Paralelas',
    muscle_up: 'Sabe fazer Muscle-Up?',
    muscle_up_weak_phase: 'Ponto fraco Muscle-up',
    skill_level: 'Nível de habilidades',
    target_skill: 'Habilidade objetivo',
    focus_area: 'Foco principal',
    sport_background: 'Esporte praticado',
    experience_level: 'Nível de experiência',
    experience: 'Experiência',
    intensity_preference: 'Intensidade preferida',
    cardio_base: 'Base cardio',
    weak_area: 'Área a melhorar',
    rounds_preference: 'Número de rounds',
    focus: 'Foco',
    intensity: 'Intensidade',
    group_size: 'Formato',
    stations_pref: 'Número de estações preferidas',
    sport: 'Esporte principal',
    position: 'Função/Posição',
    season_phase: 'Fase da temporada',
    vertical_jump: 'Salto vertical (cm)',
    time_100m: 'Tempo 100m (segundos)',
    time_200m: 'Tempo 200m (segundos)',
    preferred_distance: 'Distância preferida',
    weak_phase: 'Fase a melhorar',
    target_distance: 'Distância objetivo',
    current_weekly_km: 'Km semanais atuais',
    best_5k_time: 'Melhor tempo 5K',
    format_pref: 'Formato preferido',
    duration_pref: 'Duração preferida',
    apparatus_focus: 'Aparelhos foco',
    skill_focus: 'Habilidades a desenvolver',
    style: 'Estilo',
    arm_balance_level: 'Nível equilíbrios braços',
    equipment: 'Equipamento',
    inversion_comfort: 'Conforto inversões',
    flexibility_level: 'Flexibilidade',
    approach: 'Abordagem',
    breathing_focus: 'Ênfase respiração?',
    type: 'Tipo',
    tight_areas: 'Áreas rígidas',
    practice_type: 'Práticas de interesse',
    bag_access: 'Acesso a saco?',
    stance: 'Guarda',
    weak_punch: 'Golpe a melhorar',
    fight_experience: 'Experiência combate',
    weight_class: 'Categoria de peso',
    level: 'Nível',
    ftp: 'FTP (Watts)',
    ride_style: 'Estilo de pedalada preferido',
    weekly_rides: 'Sessões semanais',
    resistance_level: 'Resistência habitual',
    goal: 'Objetivo',
    time_500m: 'Tempo 500m',
    time_2000m: 'Tempo 2000m',
    max_weight: 'Peso máximo manuseado (kg)',
    focus_lifts: 'Levantamentos preferidos',
    bag_weight: 'Peso sandbag (kg)',
    rope_length: 'Comprimento corda',
    rope_diameter: 'Diâmetro',
    max_duration: 'Duração máxima contínua (seg)',
    track_weights: 'Pesos por track',
    martial_arts_background: 'Experiência artes marciais',
    flexibility: 'Flexibilidade',
    cardio_level: 'Nível cardio',
    impact_pref: 'Preferência impacto',
    series: 'Série preferida',
    core_strength: 'Força core atual',
    plank_time: 'Tempo prancha máx (seg)',
    ballet_background: 'Experiência dança',
    dance_background: 'Experiência dança',
    style_pref: 'Estilos preferidos',
    step_height: 'Altura step',
    intensity_pref: 'Intensidade preferida',
    drumming_experience: 'Experiência percussão',
    opt_chest: 'Peito', opt_back: 'Costas', opt_shoulders: 'Ombros', opt_arms: 'Braços',
    opt_legs: 'Pernas', opt_calves: 'Panturrilhas', opt_glutes: 'Glúteos', opt_abs: 'Abdominais',
    opt_beginner: 'Iniciante', opt_intermediate: 'Intermediário', opt_advanced: 'Avançado',
    opt_none: 'Nenhum', opt_low: 'Baixa', opt_medium: 'Média', opt_high: 'Alta',
    ph_percentage: '15', ph_weight: '100', ph_time: '12.5'
  },
  de: {
    weak_points: 'Schwachpunkte zu betonen',
    body_fat: 'Geschätzter Körperfettanteil (%)',
    training_split: 'Bevorzugter Split',
    squat_max: 'Maximales Kniebeuge (kg)',
    squat_weak_phase: 'Schwachpunkt Kniebeuge',
    bench_max: 'Maximales Bankdrücken (kg)',
    bench_weak_phase: 'Schwachpunkt Bankdrücken',
    deadlift_max: 'Maximales Kreuzheben (kg)',
    deadlift_weak_phase: 'Schwachpunkt Kreuzheben',
    weak_lift: 'Schwächste Übung insgesamt',
    snatch_max: 'Maximales Reißen (kg)',
    snatch_weak_phase: 'Schwachpunkt Reißen',
    clean_jerk_max: 'Maximales Stoßen (kg)',
    clean_weak_phase: 'Schwachpunkt Umsetzen',
    jerk_weak_phase: 'Schwachpunkt Ausstoßen',
    pullup_max: 'Maximale Klimmzüge (kg)',
    pullup_weak_phase: 'Schwachpunkt Klimmzüge',
    dip_max: 'Maximale Dips (kg)',
    dip_weak_phase: 'Schwachpunkt Dips',
    muscle_up: 'Können Sie Muscle-Up?',
    muscle_up_weak_phase: 'Schwachpunkt Muscle-up',
    skill_level: 'Fähigkeitsniveau',
    target_skill: 'Zielfähigkeit',
    focus_area: 'Hauptfokus',
    sport_background: 'Praktizierter Sport',
    experience_level: 'Erfahrungsniveau',
    experience: 'Erfahrung',
    intensity_preference: 'Bevorzugte Intensität',
    cardio_base: 'Cardio-Basis',
    weak_area: 'Zu verbessernder Bereich',
    rounds_preference: 'Anzahl Runden',
    focus: 'Fokus',
    intensity: 'Intensität',
    group_size: 'Format',
    stations_pref: 'Bevorzugte Stationsanzahl',
    sport: 'Hauptsport',
    position: 'Rolle/Position',
    season_phase: 'Saisonphase',
    vertical_jump: 'Vertikalsprung (cm)',
    time_100m: '100m Zeit (Sekunden)',
    time_200m: '200m Zeit (Sekunden)',
    preferred_distance: 'Bevorzugte Distanz',
    weak_phase: 'Zu verbessernde Phase',
    target_distance: 'Zieldistanz',
    current_weekly_km: 'Aktuelle Wochen-km',
    best_5k_time: 'Beste 5K Zeit',
    format_pref: 'Bevorzugtes Format',
    duration_pref: 'Bevorzugte Dauer',
    apparatus_focus: 'Gerätefokus',
    skill_focus: 'Zu entwickelnde Fähigkeiten',
    style: 'Stil',
    arm_balance_level: 'Armbalance-Niveau',
    equipment: 'Ausrüstung',
    inversion_comfort: 'Inversionskomfort',
    flexibility_level: 'Flexibilität',
    approach: 'Ansatz',
    breathing_focus: 'Atembetonung?',
    type: 'Typ',
    tight_areas: 'Verspannte Bereiche',
    practice_type: 'Interessante Praktiken',
    bag_access: 'Sandsackzugang?',
    stance: 'Stellung',
    weak_punch: 'Zu verbessernder Schlag',
    fight_experience: 'Kampferfahrung',
    weight_class: 'Gewichtsklasse',
    level: 'Niveau',
    ftp: 'FTP (Watt)',
    ride_style: 'Bevorzugter Fahrstil',
    weekly_rides: 'Wöchentliche Einheiten',
    resistance_level: 'Üblicher Widerstand',
    goal: 'Ziel',
    time_500m: '500m Zeit',
    time_2000m: '2000m Zeit',
    max_weight: 'Max. gehandhabtes Gewicht (kg)',
    focus_lifts: 'Bevorzugte Übungen',
    bag_weight: 'Sandsack-Gewicht (kg)',
    rope_length: 'Seillänge',
    rope_diameter: 'Durchmesser',
    max_duration: 'Max. kontinuierliche Dauer (Sek)',
    track_weights: 'Gewichte pro Track',
    martial_arts_background: 'Kampfsport-Hintergrund',
    flexibility: 'Flexibilität',
    cardio_level: 'Cardio-Niveau',
    impact_pref: 'Impact-Präferenz',
    series: 'Bevorzugte Serie',
    core_strength: 'Aktuelle Core-Stärke',
    plank_time: 'Max. Plank-Zeit (Sek)',
    ballet_background: 'Tanz-Hintergrund',
    dance_background: 'Tanzerfahrung',
    style_pref: 'Bevorzugte Stile',
    step_height: 'Step-Höhe',
    intensity_pref: 'Bevorzugte Intensität',
    drumming_experience: 'Schlagzeug-Erfahrung',
    opt_chest: 'Brust', opt_back: 'Rücken', opt_shoulders: 'Schultern', opt_arms: 'Arme',
    opt_legs: 'Beine', opt_calves: 'Waden', opt_glutes: 'Gesäß', opt_abs: 'Bauchmuskeln',
    opt_beginner: 'Anfänger', opt_intermediate: 'Fortgeschritten', opt_advanced: 'Profi',
    opt_none: 'Keine', opt_low: 'Niedrig', opt_medium: 'Mittel', opt_high: 'Hoch',
    ph_percentage: '15', ph_weight: '100', ph_time: '12.5'
  },
  fr: {
    weak_points: 'Points faibles à accentuer',
    body_fat: 'Pourcentage de graisse corporelle estimé (%)',
    training_split: 'Split préféré',
    squat_max: 'Maximum Squat (kg)',
    squat_weak_phase: 'Point faible Squat',
    bench_max: 'Maximum Développé couché (kg)',
    bench_weak_phase: 'Point faible Développé couché',
    deadlift_max: 'Maximum Soulevé de terre (kg)',
    deadlift_weak_phase: 'Point faible Soulevé de terre',
    weak_lift: 'Mouvement le plus faible',
    snatch_max: 'Maximum Arraché (kg)',
    snatch_weak_phase: 'Point faible Arraché',
    clean_jerk_max: 'Maximum Épaulé-jeté (kg)',
    clean_weak_phase: 'Point faible Épaulé',
    jerk_weak_phase: 'Point faible Jeté',
    pullup_max: 'Maximum Tractions (kg)',
    pullup_weak_phase: 'Point faible Tractions',
    dip_max: 'Maximum Dips (kg)',
    dip_weak_phase: 'Point faible Dips',
    muscle_up: 'Savez-vous faire un Muscle-Up?',
    muscle_up_weak_phase: 'Point faible Muscle-up',
    skill_level: 'Niveau de compétences',
    target_skill: 'Compétence cible',
    focus_area: 'Focus principal',
    sport_background: 'Sport pratiqué',
    experience_level: "Niveau d'expérience",
    experience: 'Expérience',
    intensity_preference: 'Intensité préférée',
    cardio_base: 'Base cardio',
    weak_area: 'Zone à améliorer',
    rounds_preference: 'Nombre de rounds',
    focus: 'Focus',
    intensity: 'Intensité',
    group_size: 'Format',
    stations_pref: 'Nombre de stations préféré',
    sport: 'Sport principal',
    position: 'Rôle/Position',
    season_phase: 'Phase de saison',
    vertical_jump: 'Saut vertical (cm)',
    time_100m: 'Temps 100m (secondes)',
    time_200m: 'Temps 200m (secondes)',
    preferred_distance: 'Distance préférée',
    weak_phase: 'Phase à améliorer',
    target_distance: 'Distance cible',
    current_weekly_km: 'Km hebdomadaires actuels',
    best_5k_time: 'Meilleur temps 5K',
    format_pref: 'Format préféré',
    duration_pref: 'Durée préférée',
    apparatus_focus: 'Appareils focus',
    skill_focus: 'Compétences à développer',
    style: 'Style',
    arm_balance_level: 'Niveau équilibres bras',
    equipment: 'Équipement',
    inversion_comfort: 'Confort inversions',
    flexibility_level: 'Flexibilité',
    approach: 'Approche',
    breathing_focus: 'Accent respiration?',
    type: 'Type',
    tight_areas: 'Zones raides',
    practice_type: "Pratiques d'intérêt",
    bag_access: 'Accès au sac?',
    stance: 'Garde',
    weak_punch: 'Coup à améliorer',
    fight_experience: 'Expérience combat',
    weight_class: 'Catégorie de poids',
    level: 'Niveau',
    ftp: 'FTP (Watts)',
    ride_style: 'Style de ride préféré',
    weekly_rides: 'Sessions hebdomadaires',
    resistance_level: 'Résistance habituelle',
    goal: 'Objectif',
    time_500m: 'Temps 500m',
    time_2000m: 'Temps 2000m',
    max_weight: 'Poids max manipulé (kg)',
    focus_lifts: 'Mouvements préférés',
    bag_weight: 'Poids sandbag (kg)',
    rope_length: 'Longueur corde',
    rope_diameter: 'Diamètre',
    max_duration: 'Durée max continue (sec)',
    track_weights: 'Poids par track',
    martial_arts_background: 'Expérience arts martiaux',
    flexibility: 'Flexibilité',
    cardio_level: 'Niveau cardio',
    impact_pref: "Préférence d'impact",
    series: 'Série préférée',
    core_strength: 'Force core actuelle',
    plank_time: 'Temps planche max (sec)',
    ballet_background: 'Expérience danse',
    dance_background: 'Expérience danse',
    style_pref: 'Styles préférés',
    step_height: 'Hauteur step',
    intensity_pref: 'Intensité préférée',
    drumming_experience: 'Expérience percussions',
    opt_chest: 'Pectoraux', opt_back: 'Dos', opt_shoulders: 'Épaules', opt_arms: 'Bras',
    opt_legs: 'Jambes', opt_calves: 'Mollets', opt_glutes: 'Fessiers', opt_abs: 'Abdominaux',
    opt_beginner: 'Débutant', opt_intermediate: 'Intermédiaire', opt_advanced: 'Avancé',
    opt_none: 'Aucun', opt_low: 'Basse', opt_medium: 'Moyenne', opt_high: 'Haute',
    ph_percentage: '15', ph_weight: '100', ph_time: '12.5'
  }
};

// Funzione per tradurre le opzioni comuni
const translateOption = (option, lang) => {
  const trans = SPORT_TRANSLATIONS[lang] || SPORT_TRANSLATIONS.it;
  
  // Mappa opzioni italiane -> chiavi traduzione
  const optionMap = {
    'Petto': 'opt_chest', 'Dorso': 'opt_back', 'Spalle': 'opt_shoulders', 'Braccia': 'opt_arms',
    'Gambe': 'opt_legs', 'Polpacci': 'opt_calves', 'Glutei': 'opt_glutes', 'Addominali': 'opt_abs',
    'Principiante': 'opt_beginner', 'Intermedio': 'opt_intermediate', 'Avanzato': 'opt_advanced',
    'Nessuna': 'opt_none', 'Nessuno': 'opt_none', 'Bassa': 'opt_low', 'Media': 'opt_medium', 'Alta': 'opt_high'
  };
  
  const key = optionMap[option];
  return key ? (trans[key] || option) : option;
};

// Funzione per tradurre le label
const translateLabel = (labelId, lang) => {
  const trans = SPORT_TRANSLATIONS[lang] || SPORT_TRANSLATIONS.it;
  return trans[labelId] || SPORT_TRANSLATIONS.it[labelId] || labelId;
};

// Configurazione domande per ogni sport
const SPORT_QUESTIONS = {
  // 🏋️ FORZA & IPERTROFIA
  bodybuilding: {
    title: 'Bodybuilding',
    questions: [
      { id: 'weak_points', type: 'multiselect', label: 'Punti carenti da enfatizzare', options: ['Petto', 'Dorso', 'Spalle', 'Braccia', 'Gambe', 'Polpacci', 'Glutei', 'Addominali'] },
      { id: 'body_fat', type: 'number', label: 'Percentuale massa grassa stimata (%)', placeholder: '15' },
      { id: 'training_split', type: 'select', label: 'Split preferita', options: ['Push/Pull/Legs', 'Upper/Lower', 'Bro Split (1 muscolo/giorno)', 'Full Body'] }
    ]
  },
  powerlifting: {
    title: 'Powerlifting',
    questions: [
      { id: 'squat_max', type: 'number', label: 'Massimale Squat (kg)', placeholder: '120' },
      { id: 'squat_weak_phase', type: 'select', label: 'Punto debole Squat', options: ['Uscita dalla buca (concentrica)', 'Discesa controllata (eccentrica)', 'Posizione in buca (isometrica)', 'Lockout finale', 'Traiettoria', 'Stabilità generale', 'Nessun punto debole'] },
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
      { id: 'pullup_max', type: 'number', label: 'Massimale Pull-up/Chin-up (kg alzati)', placeholder: '90' },
      { id: 'pullup_weak_phase', type: 'select', label: 'Punto debole Pull-up', options: ['Partenza (dead hang)', 'Fase intermedia (metà movimento)', 'Passaggio mento sopra sbarra', 'Discesa controllata (eccentrica)', 'Endurance (ultime reps)', 'Nessun punto debole'] },
      { id: 'dip_max', type: 'number', label: 'Massimale Dip (kg alzati)', placeholder: '110' },
      { id: 'dip_weak_phase', type: 'select', label: 'Punto debole Dip', options: ['Discesa profonda', 'Uscita dalla buca (concentrica)', 'Lockout completo', 'Stabilità spalle', 'Endurance', 'Nessun punto debole'] },
      { id: 'squat_max', type: 'number', label: 'Massimale Squat (kg alzati)', placeholder: '120' },
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
  const { t, language } = useLanguage();
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
  
  // Usa lingua corrente per tradurre label e opzioni
  const currentLang = language || 'it';

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
          {t('workouts.sportSpecificSubtitle')}
        </p>
      </div>

      <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-2">
        {sportConfig.questions.map((question) => (
          <Card key={question.id} className="p-4 bg-white/80">
            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
              {translateLabel(question.id, currentLang)}
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
                <option value="">{t('workouts.selectOption')}</option>
                {question.options.map((opt, optIdx) => (
                  <option key={optIdx} value={opt}>{translateOption(opt, currentLang)}</option>
                ))}
              </select>
            )}

            {question.type === 'boolean' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={answers[question.id] || false}
                  onCheckedChange={(checked) => handleAnswerChange(question.id, checked)}
                />
                <span className="text-sm text-gray-700">{t('common.yes')}</span>
              </div>
            )}

            {question.type === 'multiselect' && (
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleMultiSelectToggle(question.id, opt)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                      (answers[question.id] || []).includes(opt)
                        ? 'border-[#26847F] bg-[#E0F2F1] text-[#26847F] font-medium'
                        : 'border-gray-200 hover:border-[#26847F]/50 text-gray-700'
                    }`}
                  >
                    {translateOption(opt, currentLang)}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'object' && (
              <div className="grid grid-cols-2 gap-3">
                {question.fields.map((field) => (
                  <div key={field.id}>
                    <Label className="text-xs text-gray-600 mb-1 block">
                      {translateLabel(field.id, currentLang) || field.label}
                    </Label>
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
        {t('workouts.continue')}
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}