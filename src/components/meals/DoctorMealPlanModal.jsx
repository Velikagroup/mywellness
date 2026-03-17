import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Plus, Trash2, ChevronLeft, ChevronRight, Check, Loader2, AlertCircle, Upload, Edit3, FileText, X } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';

const TRANSLATIONS = {
  it: {
    title: 'Carica il tuo Piano',
    subtitleInput: "Carica il file del medico/nutrizionista — l'AI lo struttura automaticamente",
    subtitleParsing: "L'AI sta analizzando il tuo piano...",
    subtitleReview: (n) => `Piano caricato: ${n} pasti inseriti — controlla e poi salva`,
    step1: 'Carica file',
    step2: 'Rivedi e salva',
    howItWorks: 'Come funziona',
    howItWorksDesc: "Carica il file PDF o Excel del tuo medico/nutrizionista. L'AI leggerà tutti i pasti, ingredienti e calorie e li pre-inserirà automaticamente nella programmazione settimanale. Potrai poi verificare e modificare tutto prima di salvare.",
    dropzone: 'Trascina il file qui o clicca per caricare',
    dropzoneFormats: 'PDF, Excel (.xlsx/.xls), CSV, TXT',
    fileReady: 'pronto per l\'analisi',
    removeFile: 'Rimuovi file',
    unsupportedFormat: 'Formato non supportato. Usa PDF, Excel (.xlsx/.xls), CSV o TXT.',
    uploadFirst: 'Carica un file prima di procedere.',
    analyzeBtn: 'Analizza con AI e pre-inserisci',
    analyzing: "L'AI sta analizzando il tuo piano...",
    aiDone: "Piano pre-inserito dall'AI ✓",
    aiDoneDesc: (n) => `${n} pasti strutturati su 7 giorni. Controlla ogni giorno, modifica se necessario, poi salva.`,
    restart: '← Ricomincia con un altro file',
    editFreely: 'Modifica liberamente',
    mealName: 'Nome del piatto',
    ingredients: 'Ingredienti',
    ingredient: 'Ingrediente',
    qty: 'Qtà',
    kcal: 'kcal',
    addIngredient: 'Aggiungi ingrediente',
    addMeal: 'Aggiungi pasto',
    prev: 'Precedente',
    next: 'Successivo',
    savePlan: 'Salva Piano Completo',
    confirmWarning: '⚠️ Questo sostituirà il piano alimentare attuale per tutta la settimana. Confermi?',
    confirmYes: 'Sì, salva',
    saving: 'Salvataggio...',
    cancel: 'Annulla',
    saveError: 'Errore durante il salvataggio: ',
    days: ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'],
    mealTypes: ['Colazione','Spuntino mattina','Pranzo','Merenda','Cena','Spuntino sera'],
    units: ['g','ml','pz','cucchiai','cucchiaini','tazze','fette','porzioni'],
  },
  en: {
    title: 'Upload Your Plan',
    subtitleInput: "Upload your doctor/nutritionist's file — AI structures it automatically",
    subtitleParsing: 'AI is analyzing your plan...',
    subtitleReview: (n) => `Plan loaded: ${n} meals inserted — review and save`,
    step1: 'Upload file',
    step2: 'Review & save',
    howItWorks: 'How it works',
    howItWorksDesc: "Upload the PDF or Excel file from your doctor or nutritionist. The AI will read all meals, ingredients and calories and automatically pre-fill your weekly schedule. You can then review and edit everything before saving.",
    dropzone: 'Drag file here or click to upload',
    dropzoneFormats: 'PDF, Excel (.xlsx/.xls), CSV, TXT',
    fileReady: 'ready for analysis',
    removeFile: 'Remove file',
    unsupportedFormat: 'Unsupported format. Use PDF, Excel (.xlsx/.xls), CSV or TXT.',
    uploadFirst: 'Please upload a file before proceeding.',
    analyzeBtn: 'Analyze with AI and pre-fill',
    analyzing: 'AI is analyzing your plan...',
    aiDone: 'Plan pre-filled by AI ✓',
    aiDoneDesc: (n) => `${n} meals structured over 7 days. Check each day, edit if needed, then save.`,
    restart: '← Start over with another file',
    editFreely: 'Edit freely',
    mealName: 'Dish name',
    ingredients: 'Ingredients',
    ingredient: 'Ingredient',
    qty: 'Qty',
    kcal: 'kcal',
    addIngredient: 'Add ingredient',
    addMeal: 'Add meal',
    prev: 'Previous',
    next: 'Next',
    savePlan: 'Save Full Plan',
    confirmWarning: '⚠️ This will replace the current meal plan for the entire week. Confirm?',
    confirmYes: 'Yes, save',
    saving: 'Saving...',
    cancel: 'Cancel',
    saveError: 'Error saving: ',
    days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    mealTypes: ['Breakfast','Morning snack','Lunch','Afternoon snack','Dinner','Evening snack'],
    units: ['g','ml','pcs','tbsp','tsp','cups','slices','servings'],
  },
  es: {
    title: 'Sube tu Plan',
    subtitleInput: 'Sube el archivo de tu médico/nutricionista — la IA lo estructura automáticamente',
    subtitleParsing: 'La IA está analizando tu plan...',
    subtitleReview: (n) => `Plan cargado: ${n} comidas insertadas — revisa y guarda`,
    step1: 'Subir archivo',
    step2: 'Revisar y guardar',
    howItWorks: 'Cómo funciona',
    howItWorksDesc: 'Sube el archivo PDF o Excel de tu médico o nutricionista. La IA leerá todas las comidas, ingredientes y calorías y las pre-insertará automáticamente en la programación semanal. Luego podrás revisar y modificar todo antes de guardar.',
    dropzone: 'Arrastra el archivo aquí o haz clic para subir',
    dropzoneFormats: 'PDF, Excel (.xlsx/.xls), CSV, TXT',
    fileReady: 'listo para análisis',
    removeFile: 'Eliminar archivo',
    unsupportedFormat: 'Formato no compatible. Usa PDF, Excel (.xlsx/.xls), CSV o TXT.',
    uploadFirst: 'Por favor sube un archivo antes de continuar.',
    analyzeBtn: 'Analizar con IA y pre-rellenar',
    analyzing: 'La IA está analizando tu plan...',
    aiDone: 'Plan pre-insertado por IA ✓',
    aiDoneDesc: (n) => `${n} comidas estructuradas en 7 días. Revisa cada día, edita si es necesario y guarda.`,
    restart: '← Empezar de nuevo con otro archivo',
    editFreely: 'Editar libremente',
    mealName: 'Nombre del plato',
    ingredients: 'Ingredientes',
    ingredient: 'Ingrediente',
    qty: 'Cant',
    kcal: 'kcal',
    addIngredient: 'Añadir ingrediente',
    addMeal: 'Añadir comida',
    prev: 'Anterior',
    next: 'Siguiente',
    savePlan: 'Guardar Plan Completo',
    confirmWarning: '⚠️ Esto reemplazará el plan alimenticio actual para toda la semana. ¿Confirmas?',
    confirmYes: 'Sí, guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    saveError: 'Error al guardar: ',
    days: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],
    mealTypes: ['Desayuno','Snack mañana','Almuerzo','Merienda','Cena','Snack noche'],
    units: ['g','ml','pzs','cucharadas','cucharaditas','tazas','rebanadas','porciones'],
  },
  pt: {
    title: 'Carregue o seu Plano',
    subtitleInput: 'Carregue o arquivo do seu médico/nutricionista — a IA estrutura automaticamente',
    subtitleParsing: 'A IA está a analisar o seu plano...',
    subtitleReview: (n) => `Plano carregado: ${n} refeições inseridas — reveja e guarde`,
    step1: 'Carregar arquivo',
    step2: 'Rever e guardar',
    howItWorks: 'Como funciona',
    howItWorksDesc: 'Carregue o ficheiro PDF ou Excel do seu médico ou nutricionista. A IA lerá todas as refeições, ingredientes e calorias e irá pré-inserir automaticamente no horário semanal. Poderá depois rever e editar tudo antes de guardar.',
    dropzone: 'Arraste o arquivo aqui ou clique para carregar',
    dropzoneFormats: 'PDF, Excel (.xlsx/.xls), CSV, TXT',
    fileReady: 'pronto para análise',
    removeFile: 'Remover arquivo',
    unsupportedFormat: 'Formato não suportado. Use PDF, Excel (.xlsx/.xls), CSV ou TXT.',
    uploadFirst: 'Por favor carregue um arquivo antes de continuar.',
    analyzeBtn: 'Analisar com IA e pré-preencher',
    analyzing: 'A IA está a analisar o seu plano...',
    aiDone: 'Plano pré-inserido pela IA ✓',
    aiDoneDesc: (n) => `${n} refeições estruturadas em 7 dias. Verifique cada dia, edite se necessário e guarde.`,
    restart: '← Recomeçar com outro arquivo',
    editFreely: 'Editar livremente',
    mealName: 'Nome do prato',
    ingredients: 'Ingredientes',
    ingredient: 'Ingrediente',
    qty: 'Qtd',
    kcal: 'kcal',
    addIngredient: 'Adicionar ingrediente',
    addMeal: 'Adicionar refeição',
    prev: 'Anterior',
    next: 'Seguinte',
    savePlan: 'Guardar Plano Completo',
    confirmWarning: '⚠️ Isto substituirá o plano alimentar atual para toda a semana. Confirma?',
    confirmYes: 'Sim, guardar',
    saving: 'A guardar...',
    cancel: 'Cancelar',
    saveError: 'Erro ao guardar: ',
    days: ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'],
    mealTypes: ['Pequeno-almoço','Lanche manhã','Almoço','Lanche tarde','Jantar','Lanche noite'],
    units: ['g','ml','un','colheres sopa','colheres chá','chávenas','fatias','porções'],
  },
  de: {
    title: 'Plan hochladen',
    subtitleInput: 'Lade die Datei deines Arztes/Ernährungsberaters hoch — KI strukturiert sie automatisch',
    subtitleParsing: 'KI analysiert deinen Plan...',
    subtitleReview: (n) => `Plan geladen: ${n} Mahlzeiten eingefügt — überprüfen und speichern`,
    step1: 'Datei hochladen',
    step2: 'Prüfen & speichern',
    howItWorks: 'So funktioniert es',
    howItWorksDesc: 'Lade die PDF- oder Excel-Datei deines Arztes oder Ernährungsberaters hoch. Die KI liest alle Mahlzeiten, Zutaten und Kalorien und fügt sie automatisch in deinen Wochenplan ein. Du kannst danach alles überprüfen und bearbeiten.',
    dropzone: 'Datei hierher ziehen oder klicken zum Hochladen',
    dropzoneFormats: 'PDF, Excel (.xlsx/.xls), CSV, TXT',
    fileReady: 'bereit zur Analyse',
    removeFile: 'Datei entfernen',
    unsupportedFormat: 'Format nicht unterstützt. Verwende PDF, Excel (.xlsx/.xls), CSV oder TXT.',
    uploadFirst: 'Bitte lade zuerst eine Datei hoch.',
    analyzeBtn: 'Mit KI analysieren und vorausfüllen',
    analyzing: 'KI analysiert deinen Plan...',
    aiDone: 'Plan von KI vorausgefüllt ✓',
    aiDoneDesc: (n) => `${n} Mahlzeiten auf 7 Tage strukturiert. Überprüfe jeden Tag, bearbeite bei Bedarf und speichere.`,
    restart: '← Mit einer anderen Datei neu starten',
    editFreely: 'Frei bearbeiten',
    mealName: 'Name des Gerichts',
    ingredients: 'Zutaten',
    ingredient: 'Zutat',
    qty: 'Menge',
    kcal: 'kcal',
    addIngredient: 'Zutat hinzufügen',
    addMeal: 'Mahlzeit hinzufügen',
    prev: 'Zurück',
    next: 'Weiter',
    savePlan: 'Gesamtplan speichern',
    confirmWarning: '⚠️ Dies ersetzt den aktuellen Ernährungsplan für die gesamte Woche. Bestätigen?',
    confirmYes: 'Ja, speichern',
    saving: 'Wird gespeichert...',
    cancel: 'Abbrechen',
    saveError: 'Fehler beim Speichern: ',
    days: ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'],
    mealTypes: ['Frühstück','Morgensnack','Mittagessen','Nachmittagssnack','Abendessen','Abendsnack'],
    units: ['g','ml','Stk','EL','TL','Tassen','Scheiben','Portionen'],
  },
  fr: {
    title: 'Charger votre Plan',
    subtitleInput: 'Chargez le fichier de votre médecin/nutritionniste — l\'IA le structure automatiquement',
    subtitleParsing: 'L\'IA analyse votre plan...',
    subtitleReview: (n) => `Plan chargé : ${n} repas insérés — vérifiez et enregistrez`,
    step1: 'Charger le fichier',
    step2: 'Vérifier et enregistrer',
    howItWorks: 'Comment ça fonctionne',
    howItWorksDesc: "Chargez le fichier PDF ou Excel de votre médecin ou nutritionniste. L'IA lira tous les repas, ingrédients et calories et les pré-remplira automatiquement dans votre planning hebdomadaire. Vous pourrez ensuite tout vérifier et modifier avant d'enregistrer.",
    dropzone: 'Glissez le fichier ici ou cliquez pour charger',
    dropzoneFormats: 'PDF, Excel (.xlsx/.xls), CSV, TXT',
    fileReady: 'prêt pour l\'analyse',
    removeFile: 'Supprimer le fichier',
    unsupportedFormat: 'Format non supporté. Utilisez PDF, Excel (.xlsx/.xls), CSV ou TXT.',
    uploadFirst: 'Veuillez charger un fichier avant de continuer.',
    analyzeBtn: 'Analyser avec l\'IA et pré-remplir',
    analyzing: 'L\'IA analyse votre plan...',
    aiDone: 'Plan pré-rempli par l\'IA ✓',
    aiDoneDesc: (n) => `${n} repas structurés sur 7 jours. Vérifiez chaque jour, modifiez si nécessaire, puis enregistrez.`,
    restart: '← Recommencer avec un autre fichier',
    editFreely: 'Modifier librement',
    mealName: 'Nom du plat',
    ingredients: 'Ingrédients',
    ingredient: 'Ingrédient',
    qty: 'Qté',
    kcal: 'kcal',
    addIngredient: 'Ajouter un ingrédient',
    addMeal: 'Ajouter un repas',
    prev: 'Précédent',
    next: 'Suivant',
    savePlan: 'Enregistrer le Plan Complet',
    confirmWarning: '⚠️ Cela remplacera le plan alimentaire actuel pour toute la semaine. Confirmer ?',
    confirmYes: 'Oui, enregistrer',
    saving: 'Enregistrement...',
    cancel: 'Annuler',
    saveError: 'Erreur lors de l\'enregistrement : ',
    days: ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'],
    mealTypes: ['Petit-déjeuner','Collation matin','Déjeuner','Goûter','Dîner','Collation soir'],
    units: ['g','ml','pcs','c. à soupe','c. à café','tasses','tranches','portions'],
  },
};

const MEAL_TYPE_KEYS = ['breakfast','snack1','lunch','snack2','dinner','snack3'];
const DAY_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DEFAULT_UNITS = ['g','ml','pz','cucchiai','cucchiaini','tazze','fette','porzioni'];

const emptyIngredient = () => ({ name: '', quantity: '', unit: 'g', calories: '', protein: '', carbs: '', fat: '' });
const emptyMeal = (meal_type = 'breakfast') => ({ meal_type, name: '', ingredients: [emptyIngredient()], instructions: [] });
const emptyDay = () => MEAL_TYPE_KEYS.slice(0, 3).map(k => emptyMeal(k));

export default function DoctorMealPlanModal({ isOpen, onClose, user, existingMealPlans, onPlanSaved }) {
  const { language } = useLanguage();
  const T = TRANSLATIONS[language] || TRANSLATIONS.it;

  const DAYS = DAY_KEYS.map((key, i) => ({ key, label: T.days[i] }));
  const MEAL_TYPES = MEAL_TYPE_KEYS.map((key, i) => ({ key, label: T.mealTypes[i] }));
  const UNITS = T.units || DEFAULT_UNITS;

  const [step, setStep] = useState('input');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [plan, setPlan] = useState(() => {
    const initial = {};
    DAY_KEYS.forEach(k => { initial[k] = emptyDay(); });
    return initial;
  });
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const currentDay = DAYS[currentDayIndex];
  const dayMeals = plan[currentDay.key] || [];

  const handleFileChange = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExt = ['pdf', 'xlsx', 'xls', 'csv', 'txt'];
    if (!allowedExt.includes(ext)) {
      setError(T.unsupportedFormat);
      return;
    }
    setError('');
    setSelectedFile(file);
  };

  const handleParseWithAI = async () => {
    if (!selectedFile) { setError(T.uploadFirst); return; }
    setError('');
    setStep('parsing');

    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

    const schema = {
      type: "object",
      properties: Object.fromEntries(DAY_KEYS.map(k => [k, { type: "array", items: { "$ref": "#/definitions/meal" } }])),
      definitions: {
        meal: {
          type: "object",
          properties: {
            meal_type: { type: "string", enum: MEAL_TYPE_KEYS },
            name: { type: "string" },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" }, quantity: { type: "number" }, unit: { type: "string" },
                  calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }
                }
              }
            },
            instructions: { type: "array", items: { type: "string" } }
          }
        }
      }
    };

    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert nutritionist. Analyze the meal plan in the attached file and convert it into a structured weekly format (monday to sunday).
Extract all meals with their ingredients and nutritional values for each day.
If the plan doesn't specify all days, repeat the pattern for missing days.
If no nutritional values are given, estimate them realistically.
Use english keys: monday, tuesday, wednesday, thursday, friday, saturday, sunday.
For meal_type use: breakfast, snack1 (morning snack), lunch, snack2 (afternoon snack), dinner, snack3 (evening snack).`,
      file_urls: [file_url],
      response_json_schema: schema
    });

    const newPlan = {};
    DAY_KEYS.forEach(k => {
      const aiMeals = parsed[k];
      if (aiMeals && aiMeals.length > 0) {
        newPlan[k] = aiMeals.map(m => ({
          meal_type: m.meal_type || 'breakfast',
          name: m.name || '',
          ingredients: (m.ingredients || []).map(ing => ({
            name: ing.name || '', quantity: ing.quantity || '', unit: ing.unit || 'g',
            calories: ing.calories || '', protein: ing.protein || '', carbs: ing.carbs || '', fat: ing.fat || '',
          })),
          instructions: m.instructions || [],
        }));
      } else {
        newPlan[k] = emptyDay();
      }
    });

    setPlan(newPlan);
    setCurrentDayIndex(0);
    setStep('review');
  };

  const updateMeal = (mealIndex, field, value) => {
    setPlan(prev => {
      const meals = [...prev[currentDay.key]];
      meals[mealIndex] = { ...meals[mealIndex], [field]: value };
      return { ...prev, [currentDay.key]: meals };
    });
  };

  const addMeal = () => {
    const usedTypes = dayMeals.map(m => m.meal_type);
    const nextType = MEAL_TYPE_KEYS.find(k => !usedTypes.includes(k)) || 'snack3';
    setPlan(prev => ({ ...prev, [currentDay.key]: [...prev[currentDay.key], emptyMeal(nextType)] }));
  };

  const removeMeal = (i) => setPlan(prev => ({ ...prev, [currentDay.key]: prev[currentDay.key].filter((_, idx) => idx !== i) }));

  const addIngredient = (mealIndex) => {
    setPlan(prev => {
      const meals = [...prev[currentDay.key]];
      meals[mealIndex] = { ...meals[mealIndex], ingredients: [...meals[mealIndex].ingredients, emptyIngredient()] };
      return { ...prev, [currentDay.key]: meals };
    });
  };

  const removeIngredient = (mealIndex, ingIndex) => {
    setPlan(prev => {
      const meals = [...prev[currentDay.key]];
      meals[mealIndex] = { ...meals[mealIndex], ingredients: meals[mealIndex].ingredients.filter((_, i) => i !== ingIndex) };
      return { ...prev, [currentDay.key]: meals };
    });
  };

  const updateIngredient = (mealIndex, ingIndex, field, value) => {
    setPlan(prev => {
      const meals = [...prev[currentDay.key]];
      const ings = [...meals[mealIndex].ingredients];
      ings[ingIndex] = { ...ings[ingIndex], [field]: value };
      meals[mealIndex] = { ...meals[mealIndex], ingredients: ings };
      return { ...prev, [currentDay.key]: meals };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      for (const existing of existingMealPlans) {
        await base44.entities.MealPlan.delete(existing.id);
      }
      for (const k of DAY_KEYS) {
        for (const meal of (plan[k] || [])) {
          if (!meal.name.trim()) continue;
          const validIngredients = meal.ingredients
            .filter(ing => ing.name.trim() && ing.quantity)
            .map(ing => ({
              name: ing.name.trim(), quantity: parseFloat(ing.quantity) || 0, unit: ing.unit || 'g',
              calories: parseFloat(ing.calories) || 0, protein: parseFloat(ing.protein) || 0,
              carbs: parseFloat(ing.carbs) || 0, fat: parseFloat(ing.fat) || 0,
            }));
          await base44.entities.MealPlan.create({
            user_id: user.id, day_of_week: k, meal_type: meal.meal_type, name: meal.name.trim(),
            ingredients: validIngredients, instructions: meal.instructions || [],
            total_calories: Math.round(validIngredients.reduce((s, i) => s + i.calories, 0)),
            total_protein: Math.round(validIngredients.reduce((s, i) => s + i.protein, 0) * 10) / 10,
            total_carbs: Math.round(validIngredients.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
            total_fat: Math.round(validIngredients.reduce((s, i) => s + i.fat, 0) * 10) / 10,
            prep_time: 0, difficulty: 'easy',
          });
        }
      }
      onPlanSaved();
      onClose();
    } catch (err) {
      setError(T.saveError + err.message);
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  };

  const totalMealsInserted = DAY_KEYS.reduce((acc, k) => acc + (plan[k]?.filter(m => m.name.trim()).length || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">{T.title}</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === 'input' && T.subtitleInput}
                {step === 'parsing' && T.subtitleParsing}
                {step === 'review' && T.subtitleReview(totalMealsInserted)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {['input', 'review'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  step === s ? 'bg-purple-100 text-purple-700' :
                  (step === 'review' && s === 'input') ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step === 'review' && s === 'input' ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                  {s === 'input' ? T.step1 : T.step2}
                </div>
                {i === 0 && <div className="h-px flex-1 bg-gray-200" />}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* ── STEP 1: Input ── */}
          {(step === 'input' || step === 'parsing') && (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm font-semibold text-purple-800 mb-1">{T.howItWorks}</p>
                <p className="text-xs text-purple-700 leading-relaxed">{T.howItWorksDesc}</p>
              </div>

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById('plan-file-input').click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragOver ? 'border-purple-400 bg-purple-50' :
                  selectedFile ? 'border-green-400 bg-green-50' :
                  'border-gray-200 hover:border-purple-300 hover:bg-purple-50/40'
                }`}
              >
                <input id="plan-file-input" type="file" accept=".pdf,.xlsx,.xls,.csv,.txt" className="hidden"
                  onChange={e => handleFileChange(e.target.files[0])} />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">{selectedFile.name}</p>
                      <p className="text-xs text-green-600 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB — {T.fileReady}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" /> {T.removeFile}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                      <Upload className="w-7 h-7 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{T.dropzone}</p>
                      <p className="text-xs text-gray-400 mt-1">{T.dropzoneFormats}</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <Button onClick={handleParseWithAI} disabled={step === 'parsing' || !selectedFile}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-5 font-semibold rounded-xl text-base">
                {step === 'parsing' ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{T.analyzing}</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" />{T.analyzeBtn}</>
                )}
              </Button>
            </div>
          )}

          {/* ── STEP 2: Review ── */}
          {step === 'review' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">{T.aiDone}</p>
                  <p className="text-xs text-green-700 mt-0.5">{T.aiDoneDesc(totalMealsInserted)}</p>
                  <button onClick={() => { setStep('input'); setError(''); setSelectedFile(null); }}
                    className="text-xs text-green-700 underline mt-1 hover:text-green-900">{T.restart}</button>
                </div>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {DAYS.map((day, idx) => {
                  const hasMeals = plan[day.key]?.some(m => m.name.trim());
                  return (
                    <button key={day.key} onClick={() => setCurrentDayIndex(idx)}
                      className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        idx === currentDayIndex ? 'bg-[#26847F] text-white shadow' :
                        hasMeals ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {day.label.substring(0, 3)}
                      {hasMeals && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-800">{currentDay.label}</span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Edit3 className="w-3 h-3" /> {T.editFreely}
                </div>
              </div>

              <div className="space-y-4">
                {dayMeals.map((meal, mealIndex) => (
                  <div key={mealIndex} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <Select value={meal.meal_type} onValueChange={val => updateMeal(mealIndex, 'meal_type', val)}>
                        <SelectTrigger className="w-44 h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MEAL_TYPES.map(mt => <SelectItem key={mt.key} value={mt.key} className="text-xs">{mt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder={T.mealName} value={meal.name} onChange={e => updateMeal(mealIndex, 'name', e.target.value)} className="h-8 text-sm flex-1" />
                      <button onClick={() => removeMeal(mealIndex)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{T.ingredients}</Label>
                      {meal.ingredients.map((ing, ingIndex) => (
                        <div key={ingIndex} className="flex items-center gap-1.5 flex-wrap">
                          <Input placeholder={T.ingredient} value={ing.name} onChange={e => updateIngredient(mealIndex, ingIndex, 'name', e.target.value)} className="h-8 text-xs flex-1 min-w-[120px]" />
                          <Input placeholder={T.qty} type="number" value={ing.quantity} onChange={e => updateIngredient(mealIndex, ingIndex, 'quantity', e.target.value)} className="h-8 text-xs w-16" />
                          <Select value={ing.unit} onValueChange={val => updateIngredient(mealIndex, ingIndex, 'unit', val)}>
                            <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input placeholder={T.kcal} type="number" value={ing.calories} onChange={e => updateIngredient(mealIndex, ingIndex, 'calories', e.target.value)} className="h-8 text-xs w-16" />
                          <button onClick={() => removeIngredient(mealIndex, ingIndex)}
                            className="w-7 h-7 flex items-center justify-center rounded text-red-300 hover:text-red-500 transition-colors flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addIngredient(mealIndex)}
                        className="flex items-center gap-1 text-xs text-[#26847F] font-semibold hover:text-[#1f6b66] mt-1">
                        <Plus className="w-3.5 h-3.5" /> {T.addIngredient}
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={addMeal}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#26847F] hover:text-[#26847F] transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> {T.addMeal}
                </button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))} disabled={currentDayIndex === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> {T.prev}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDayIndex(Math.min(DAYS.length - 1, currentDayIndex + 1))} disabled={currentDayIndex === DAYS.length - 1}>
                  {T.next} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              {!showConfirm ? (
                <Button onClick={() => setShowConfirm(true)}
                  className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white py-5 font-semibold rounded-xl text-base">
                  <Upload className="w-5 h-5 mr-2" /> {T.savePlan}
                </Button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-800">{T.confirmWarning}</p>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {isSaving ? T.saving : T.confirmYes}
                    </Button>
                    <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isSaving} className="flex-1">
                      {T.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}