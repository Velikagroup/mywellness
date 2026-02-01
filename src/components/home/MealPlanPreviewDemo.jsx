import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChefHat, Clock, BarChart2, Sprout, ChevronRight, MousePointerClick } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const MacroCircle = ({ label, value, unit, color }) => (
  <div className="flex flex-col items-center">
    <div className={`w-16 h-16 rounded-full border-4 ${color} flex items-center justify-center`}>
      <span className="text-lg font-bold text-gray-800">{value}</span>
    </div>
    <p className="mt-2 text-sm font-medium text-gray-600">{label} ({unit})</p>
  </div>
);

export default function MealPlanPreviewDemo() {
  const { t, language } = useLanguage();
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedMeal, setSelectedMeal] = useState(null);

  const translations = React.useMemo(() => ({
    it: {
      weeklyPlanning: 'Pianificazione Settimanale',
      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Gio', friday: 'Ven', saturday: 'Sab', sunday: 'Dom',
      mondayProtocol: 'Protocollo di Lunedì',
      breakfast: 'Colazione', morningSnack: 'Spuntino Mattina', lunch: 'Pranzo', afternoonSnack: 'Snack Pomeridiano', dinner: 'Cena',
      target: 'Target', nutritionalSummary: 'Riepilogo Nutrizionale',
      proteins: 'Proteine', carbs: 'Carboidrati', fats: 'Grassi',
      prep: 'Prep', difficulty: 'Difficoltà', ingredients: 'Ingredienti', preparation: 'Preparazione',
      easy: 'facile', medium: 'media', hard: 'difficile',
      preview: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup'
    },
    en: {
      weeklyPlanning: 'Weekly Planning',
      monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
      mondayProtocol: 'Monday\'s Protocol',
      breakfast: 'Breakfast', morningSnack: 'Morning Snack', lunch: 'Lunch', afternoonSnack: 'Afternoon Snack', dinner: 'Dinner',
      target: 'Target', nutritionalSummary: 'Nutritional Summary',
      proteins: 'Proteins', carbs: 'Carbs', fats: 'Fats',
      prep: 'Prep', difficulty: 'Difficulty', ingredients: 'Ingredients', preparation: 'Preparation',
      easy: 'easy', medium: 'medium', hard: 'hard',
      preview: 'Interface preview • Features available after signup'
    },
    es: {
      weeklyPlanning: 'Planificación Semanal',
      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
      mondayProtocol: 'Protocolo del Lunes',
      breakfast: 'Desayuno', morningSnack: 'Snack Mañana', lunch: 'Almuerzo', afternoonSnack: 'Snack Tarde', dinner: 'Cena',
      target: 'Objetivo', nutritionalSummary: 'Resumen Nutricional',
      proteins: 'Proteínas', carbs: 'Carbohidratos', fats: 'Grasas',
      prep: 'Prep', difficulty: 'Dificultad', ingredients: 'Ingredientes', preparation: 'Preparación',
      easy: 'fácil', medium: 'media', hard: 'difícil',
      preview: 'Vista previa de interfaz • Funciones disponibles después del registro'
    },
    pt: {
      weeklyPlanning: 'Planejamento Semanal',
      monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sáb', sunday: 'Dom',
      mondayProtocol: 'Protocolo de Segunda',
      breakfast: 'Café da Manhã', morningSnack: 'Lanche Manhã', lunch: 'Almoço', afternoonSnack: 'Lanche Tarde', dinner: 'Jantar',
      target: 'Meta', nutritionalSummary: 'Resumo Nutricional',
      proteins: 'Proteínas', carbs: 'Carboidratos', fats: 'Gorduras',
      prep: 'Prep', difficulty: 'Dificuldade', ingredients: 'Ingredientes', preparation: 'Preparação',
      easy: 'fácil', medium: 'média', hard: 'difícil',
      preview: 'Prévia da interface • Funcionalidades disponíveis após o cadastro'
    },
    de: {
      weeklyPlanning: 'Wochenplanung',
      monday: 'Mo', tuesday: 'Di', wednesday: 'Mi', thursday: 'Do', friday: 'Fr', saturday: 'Sa', sunday: 'So',
      mondayProtocol: 'Montag-Protokoll',
      breakfast: 'Frühstück', morningSnack: 'Vormittagssnack', lunch: 'Mittagessen', afternoonSnack: 'Nachmittagssnack', dinner: 'Abendessen',
      target: 'Ziel', nutritionalSummary: 'Ernährungszusammenfassung',
      proteins: 'Proteine', carbs: 'Kohlenhydrate', fats: 'Fette',
      prep: 'Vorb', difficulty: 'Schwierigkeit', ingredients: 'Zutaten', preparation: 'Zubereitung',
      easy: 'einfach', medium: 'mittel', hard: 'schwer',
      preview: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar'
    },
    fr: {
      weeklyPlanning: 'Programmation Hebdomadaire',
      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu', friday: 'Ven', saturday: 'Sam', sunday: 'Dim',
      mondayProtocol: 'Protocole du Lundi',
      breakfast: 'Petit-déjeuner', morningSnack: 'Collation Matin', lunch: 'Déjeuner', afternoonSnack: 'Collation Après-midi', dinner: 'Dîner',
      target: 'Objectif', nutritionalSummary: 'Résumé Nutritionnel',
      proteins: 'Protéines', carbs: 'Glucides', fats: 'Lipides',
      prep: 'Prépa', difficulty: 'Difficulté', ingredients: 'Ingrédients', preparation: 'Préparation',
      easy: 'facile', medium: 'moyenne', hard: 'difficile',
      preview: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription'
    }
  }), []);

  const tr = translations[language] || translations.it;

  const daysOfWeek = [
    { id: 'Mon', label: tr.monday },
    { id: 'Tue', label: tr.tuesday },
    { id: 'Wed', label: tr.wednesday },
    { id: 'Thu', label: tr.thursday },
    { id: 'Fri', label: tr.friday },
    { id: 'Sat', label: tr.saturday },
    { id: 'Sun', label: tr.sunday }
  ];

  const mealTitles = {
    it: { greekYogurt: 'Yogurt Greco con Miele e Noci', nuts: 'Fragole e Burro', salmonQuinoa: 'Fette di Manzo con Burro', eggsPeppers: 'Uova e Burro con Peperoni', steakButter: 'Bistecca di Manzo con Burro Aromatizzato' },
    en: { greekYogurt: 'Greek Yogurt with Honey and Nuts', nuts: 'Strawberries and Butter', salmonQuinoa: 'Beef Slices with Butter', eggsPeppers: 'Eggs and Butter with Peppers', steakButter: 'Beef Steak with Flavored Butter' },
    es: { greekYogurt: 'Yogur Griego con Miel y Nueces', nuts: 'Fresas y Mantequilla', salmonQuinoa: 'Rebanadas de Res con Mantequilla', eggsPeppers: 'Huevos y Mantequilla con Pimientos', steakButter: 'Bistec de Res con Mantequilla Aromatizada' },
    pt: { greekYogurt: 'Iogurte Grego com Mel e Nozes', nuts: 'Morangos e Manteiga', salmonQuinoa: 'Fatias de Carne com Manteiga', eggsPeppers: 'Ovos e Manteiga com Pimentões', steakButter: 'Bife com Manteiga Aromatizada' },
    de: { greekYogurt: 'Griechischer Joghurt mit Honig und Nüssen', nuts: 'Erdbeeren und Butter', salmonQuinoa: 'Rindfleisch-Scheiben mit Butter', eggsPeppers: 'Eier und Butter mit Paprika', steakButter: 'Rindersteak mit Aromatisierter Butter' },
    fr: { greekYogurt: 'Yaourt Grec avec Miel et Noix', nuts: 'Fraises et Beurre', salmonQuinoa: 'Tranches de Bœuf avec Beurre', eggsPeppers: 'Œufs et Beurre avec Poivrons', steakButter: 'Steak de Bœuf avec Beurre Aromatisé' }
  };

  const ingredientNames = {
    it: { greekYogurt: 'Yogurt greco', honey: 'Miele', walnuts: 'Noci', blueberries: 'Mirtilli freschi', strawberries: 'Fragole fresche', butter: 'Burro', leanBeef: 'Manzo magro', eggs: 'Uova', bellPepper: 'Peperoni', beefSteak: 'Bistecca di manzo', flavoredButter: 'Burro aromatizzato' },
    en: { greekYogurt: 'Greek yogurt', honey: 'Honey', walnuts: 'Walnuts', blueberries: 'Fresh blueberries', strawberries: 'Fresh strawberries', butter: 'Butter', leanBeef: 'Lean beef', eggs: 'Eggs', bellPepper: 'Bell pepper', beefSteak: 'Beef steak', flavoredButter: 'Flavored butter' },
    es: { greekYogurt: 'Yogur griego', honey: 'Miel', walnuts: 'Nueces', blueberries: 'Arándanos frescos', strawberries: 'Fresas frescas', butter: 'Mantequilla', leanBeef: 'Res magra', eggs: 'Huevos', bellPepper: 'Pimiento', beefSteak: 'Bistec de res', flavoredButter: 'Mantequilla aromatizada' },
    pt: { greekYogurt: 'Iogurte grego', honey: 'Mel', walnuts: 'Nozes', blueberries: 'Mirtilos frescos', strawberries: 'Morangos frescos', butter: 'Manteiga', leanBeef: 'Carne magra', eggs: 'Ovos', bellPepper: 'Pimentão', beefSteak: 'Bife', flavoredButter: 'Manteiga aromatizada' },
    de: { greekYogurt: 'Griechischer Joghurt', honey: 'Honig', walnuts: 'Walnüsse', blueberries: 'Frische Heidelbeeren', strawberries: 'Frische Erdbeeren', butter: 'Butter', leanBeef: 'Mageres Rindfleisch', eggs: 'Eier', bellPepper: 'Paprika', beefSteak: 'Rindersteak', flavoredButter: 'Aromatisierte Butter' },
    fr: { greekYogurt: 'Yaourt grec', honey: 'Miel', walnuts: 'Noix', blueberries: 'Myrtilles fraîches', strawberries: 'Fraises fraîches', butter: 'Beurre', leanBeef: 'Bœuf maigre', eggs: 'Œufs', bellPepper: 'Poivron', beefSteak: 'Steak de bœuf', flavoredButter: 'Beurre aromatisé' }
  };

  const instructions = {
    it: { pourYogurt: 'Versa lo yogurt greco in una ciotola', addHoney: 'Aggiungi il miele sopra lo yogurt', chopNuts: 'Trita grossolanamente le noci', garnish: 'Guarnisci con noci e mirtilli freschi', washStrawberries: 'Lava le fragole', cutHalf: 'Taglia a metà', serveButterSlices: 'Servi con burro a fette', grillBeef: 'Cuoci il manzo alla griglia', addMeltedButter: 'Aggiungi burro fuso', serveHot: 'Servi caldo', beatEggs: 'Sbatti le uova', cookPan: 'Cuoci in padella', addPeppers: 'Aggiungi peperoni tagliati', grillSteak: 'Griglia la bistecca', addFlavoredButter: 'Aggiungi burro aromatizzato', rest5Min: 'Lascia riposare 5 minuti' },
    en: { pourYogurt: 'Pour Greek yogurt into a bowl', addHoney: 'Add honey on top of the yogurt', chopNuts: 'Coarsely chop the nuts', garnish: 'Garnish with nuts and fresh blueberries', washStrawberries: 'Wash the strawberries', cutHalf: 'Cut in half', serveButterSlices: 'Serve with sliced butter', grillBeef: 'Grill the beef', addMeltedButter: 'Add melted butter', serveHot: 'Serve hot', beatEggs: 'Beat the eggs', cookPan: 'Cook in a pan', addPeppers: 'Add chopped peppers', grillSteak: 'Grill the steak', addFlavoredButter: 'Add flavored butter', rest5Min: 'Let rest for 5 minutes' },
    es: { pourYogurt: 'Verter el yogur griego en un bol', addHoney: 'Añadir la miel encima del yogur', chopNuts: 'Picar groseramente las nueces', garnish: 'Decorar con nueces y arándanos frescos', washStrawberries: 'Lavar las fresas', cutHalf: 'Cortar por la mitad', serveButterSlices: 'Servir con mantequilla en rodajas', grillBeef: 'Cocinar la res a la parrilla', addMeltedButter: 'Añadir mantequilla derretida', serveHot: 'Servir caliente', beatEggs: 'Batir los huevos', cookPan: 'Cocinar en sartén', addPeppers: 'Añadir pimientos cortados', grillSteak: 'Asar el bistec', addFlavoredButter: 'Añadir mantequilla aromatizada', rest5Min: 'Dejar reposar 5 minutos' },
    pt: { pourYogurt: 'Verter o iogurte grego numa tigela', addHoney: 'Adicionar o mel em cima do iogurte', chopNuts: 'Picar grosseiramente as nozes', garnish: 'Decorar com nozes e mirtilos frescos', washStrawberries: 'Lavar os morangos', cutHalf: 'Cortar ao meio', serveButterSlices: 'Servir com manteiga em fatias', grillBeef: 'Grelhar a carne', addMeltedButter: 'Adicionar manteiga derretida', serveHot: 'Servir quente', beatEggs: 'Bater os ovos', cookPan: 'Cozinhar na frigideira', addPeppers: 'Adicionar pimentões cortados', grillSteak: 'Grelhar o bife', addFlavoredButter: 'Adicionar manteiga aromatizada', rest5Min: 'Deixar repousar 5 minutos' },
    de: { pourYogurt: 'Griechischen Joghurt in eine Schüssel geben', addHoney: 'Honig auf den Joghurt geben', chopNuts: 'Die Nüsse grob hacken', garnish: 'Mit Nüssen und frischen Heidelbeeren garnieren', washStrawberries: 'Die Erdbeeren waschen', cutHalf: 'Halbieren', serveButterSlices: 'Mit Butter-Scheiben servieren', grillBeef: 'Das Rindfleisch grillen', addMeltedButter: 'Geschmolzene Butter hinzufügen', serveHot: 'Heiß servieren', beatEggs: 'Die Eier schlagen', cookPan: 'In der Pfanne kochen', addPeppers: 'Geschnittene Paprika hinzufügen', grillSteak: 'Das Steak grillen', addFlavoredButter: 'Aromatisierte Butter hinzufügen', rest5Min: '5 Minuten ruhen lassen' },
    fr: { pourYogurt: 'Verser le yaourt grec dans un bol', addHoney: 'Ajouter le miel sur le yaourt', chopNuts: 'Hacher grossièrement les noix', garnish: 'Garnir avec noix et myrtilles fraîches', washStrawberries: 'Laver les fraises', cutHalf: 'Couper en deux', serveButterSlices: 'Servir avec tranches de beurre', grillBeef: 'Griller le bœuf', addMeltedButter: 'Ajouter du beurre fondu', serveHot: 'Servir chaud', beatEggs: 'Battre les œufs', cookPan: 'Cuire à la poêle', addPeppers: 'Ajouter poivrons coupés', grillSteak: 'Griller le steak', addFlavoredButter: 'Ajouter beurre aromatisé', rest5Min: 'Laisser reposer 5 minutes' }
  };

  const mt = mealTitles[language] || mealTitles.it;
  const ing = ingredientNames[language] || ingredientNames.it;
  const inst = instructions[language] || instructions.it;

  const mondayMeals = [
    {
      name: tr.breakfast,
      title: mt.greekYogurt,
      calories: 342,
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
      ingredients: [
        { name: ing.greekYogurt, quantity: 200, unit: 'g', calories: 130, protein: 20, carbs: 8, fat: 4 },
        { name: ing.honey, quantity: 20, unit: 'g', calories: 64, protein: 0.1, carbs: 17, fat: 0 },
        { name: ing.walnuts, quantity: 30, unit: 'g', calories: 196, protein: 4.5, carbs: 4, fat: 19 },
        { name: ing.blueberries, quantity: 50, unit: 'g', calories: 29, protein: 0.4, carbs: 7, fat: 0.2 }
      ],
      instructions: [
        inst.pourYogurt,
        inst.addHoney,
        inst.chopNuts,
        inst.garnish
      ],
      total_protein: 25,
      total_carbs: 36,
      total_fat: 23,
      prep_time: 5,
      difficulty: tr.easy
    },
    {
      name: tr.morningSnack,
      title: mt.nuts,
      calories: 159,
      image: 'https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=400&h=400&fit=crop',
      ingredients: [
        { name: ing.strawberries, quantity: 100, unit: 'g', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
        { name: ing.butter, quantity: 15, unit: 'g', calories: 112, protein: 0.1, carbs: 0, fat: 12.8 }
      ],
      instructions: [
        inst.washStrawberries,
        inst.cutHalf,
        inst.serveButterSlices
      ],
      total_protein: 1,
      total_carbs: 8,
      total_fat: 13,
      prep_time: 5,
      difficulty: tr.easy
    },
    {
      name: tr.lunch,
      title: mt.salmonQuinoa,
      calories: 397,
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
      ingredients: [
        { name: ing.leanBeef, quantity: 180, unit: 'g', calories: 250, protein: 45, carbs: 0, fat: 7 },
        { name: ing.butter, quantity: 20, unit: 'g', calories: 149, protein: 0.2, carbs: 0, fat: 16.5 }
      ],
      instructions: [
        inst.grillBeef,
        inst.addMeltedButter,
        inst.serveHot
      ],
      total_protein: 45,
      total_carbs: 0,
      total_fat: 24,
      prep_time: 20,
      difficulty: tr.medium
    },
    {
      name: tr.afternoonSnack,
      title: mt.eggsPeppers,
      calories: 160,
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop',
      ingredients: [
        { name: ing.eggs, quantity: 2, unit: 'unità', calories: 140, protein: 12, carbs: 1, fat: 10 },
        { name: ing.bellPepper, quantity: 50, unit: 'g', calories: 20, protein: 0.5, carbs: 4, fat: 0.2 }
      ],
      instructions: [
        inst.beatEggs,
        inst.cookPan,
        inst.addPeppers
      ],
      total_protein: 13,
      total_carbs: 5,
      total_fat: 10,
      prep_time: 10,
      difficulty: tr.easy
    },
    {
      name: tr.dinner,
      title: mt.steakButter,
      calories: 395,
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop',
      ingredients: [
        { name: ing.beefSteak, quantity: 200, unit: 'g', calories: 280, protein: 50, carbs: 0, fat: 8 },
        { name: ing.flavoredButter, quantity: 15, unit: 'g', calories: 112, protein: 0.1, carbs: 0, fat: 12.8 }
      ],
      instructions: [
        inst.grillSteak,
        inst.addFlavoredButter,
        inst.rest5Min
      ],
      total_protein: 50,
      total_carbs: 0,
      total_fat: 21,
      prep_time: 25,
      difficulty: tr.medium
    }
  ];

  return (
    <>
      <style>{`
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        @keyframes bounce-arrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        
        @keyframes pulse-ring {
          0% { 
            transform: scale(0.8);
            opacity: 1;
          }
          100% { 
            transform: scale(1.4);
            opacity: 0;
          }
        }
        
        .click-indicator-ring {
          animation: pulse-ring 1.5s ease-out infinite;
        }
        
        .arrow-bounce {
          animation: bounce-arrow 1.5s ease-in-out infinite;
        }

        @media (max-width: 768px) {
          [data-meal-popup] {
            width: 80% !important;
            max-width: 80% !important;
            height: 80vh !important;
            max-height: 80vh !important;
          }
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto water-glass-effect border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="px-4 sm:px-6 py-5 border-b border-gray-100 overflow-hidden" style={{
          backdropFilter: 'blur(12px) saturate(180%)',
          background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.4) 0%, rgba(243, 244, 246, 0.3) 50%, rgba(249, 250, 241, 0.4) 100%)'
        }}>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate flex-shrink min-w-0">{tr.weeklyPlanning}</h2>
          </div>

          {/* Days selector */}
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
            {daysOfWeek.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`flex-shrink-0 py-2 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all ${
                  selectedDay === day.id
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Protocol Card */}
        <div className="px-3 sm:px-6 py-4 bg-gradient-to-br from-teal-50/50 to-blue-50/30 overflow-hidden">
          <div className="mb-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">{tr.mondayProtocol}</h3>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3">
            <div className="bg-white rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-2 text-center border border-gray-100 shadow-sm">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 truncate">Kcal</div>
              <div className="text-sm sm:text-lg font-black text-gray-900">1453</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-2 text-center border border-gray-100 shadow-sm">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 truncate">Prot.</div>
              <div className="text-sm sm:text-lg font-black text-red-600">134</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-2 text-center border border-gray-100 shadow-sm">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 truncate">Carb.</div>
              <div className="text-sm sm:text-lg font-black text-blue-600">49</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-2 text-center border border-gray-100 shadow-sm">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 truncate">Gras.</div>
              <div className="text-sm sm:text-lg font-black text-amber-600">81</div>
            </div>
          </div>

          {/* Target giornaliero */}
          <div className="text-[10px] sm:text-xs text-gray-600 text-center">
            <span className="font-medium">{tr.target}: 1696 kcal</span>
            <span className="ml-1 sm:ml-2 text-gray-400">(-243)</span>
          </div>
        </div>

        {/* Meals List */}
        <div className="px-3 sm:px-4 py-4 space-y-2 max-h-[400px] overflow-y-auto relative">
          {mondayMeals.map((meal, index) => (
            <div
              key={index}
              onClick={() => setSelectedMeal(meal)}
              className="relative flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-2 sm:p-3 border border-gray-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              {/* Click Indicator on first meal image - centered */}
              {index === 0 && (
                <div className="absolute left-[30px] sm:left-[34px] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  {/* Animated Circle Ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 border-4 border-teal-500 rounded-full click-indicator-ring"></div>
                  </div>
                  
                  {/* Static Circle Background */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-teal-500/20 rounded-full"></div>
                  </div>
                  
                  {/* Icons */}
                  <div className="relative flex items-center justify-center gap-0.5 sm:gap-1">
                    <MousePointerClick className="w-6 sm:w-8 h-6 sm:h-8 text-teal-600 drop-shadow-lg" />
                    <ChevronRight className="w-5 sm:w-7 h-5 sm:h-7 text-teal-600 arrow-bounce drop-shadow-lg" />
                  </div>
                </div>
              )}

              <img
                src={meal.image}
                alt={meal.title}
                className="w-12 sm:w-14 h-12 sm:h-14 rounded-full object-cover border-2 border-gray-100 relative z-0 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium mb-0.5">{meal.name}</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{meal.title}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs sm:text-sm font-bold text-gray-900">{meal.calories}</div>
                <div className="text-[10px] sm:text-xs text-gray-400">kcal</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation (Demo) */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic text-center">
            {tr.preview}
          </p>
        </div>
      </Card>

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-meal-popup>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">{selectedMeal.title}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2">
              <div className="space-y-6">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                  <img src={selectedMeal.image} alt={selectedMeal.title} className="w-full h-full object-cover" />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-teal-600" /> {tr.nutritionalSummary}
                  </h3>
                  <div className="flex justify-around items-center text-center">
                    <div className="flex flex-col items-center">
                      <p className="text-3xl font-bold text-teal-600">{selectedMeal.calories}</p>
                      <p className="text-sm font-medium text-gray-600">Kcal</p>
                    </div>
                    <MacroCircle label={tr.proteins} value={selectedMeal.total_protein} unit="g" color="border-red-400" />
                    <MacroCircle label={tr.carbs} value={selectedMeal.total_carbs} unit="g" color="border-blue-400" />
                    <MacroCircle label={tr.fats} value={selectedMeal.total_fat} unit="g" color="border-yellow-400" />
                  </div>
                </div>
                
                <div className="flex items-center justify-around text-sm text-gray-600 bg-gray-50 rounded-lg border p-3">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {tr.prep}: {selectedMeal.prep_time} min</div>
                  <div className="flex items-center gap-2 capitalize"><ChefHat className="w-4 h-4" /> {tr.difficulty}: {selectedMeal.difficulty}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-green-600"/> {tr.ingredients}
                  </h3>
                  <div className="space-y-2">
                    {selectedMeal.ingredients.map((ing, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded-md border text-sm hover:bg-gray-50">
                        <div className="flex-grow">
                          <span className="font-medium text-gray-800">{ing.name}</span>
                          <span className="text-gray-500 ml-2">{ing.quantity}{ing.unit}</span>
                        </div>
                        <div className="text-xs text-right text-gray-500">
                          {ing.calories} kcal
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{tr.preparation}</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    {selectedMeal.instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}