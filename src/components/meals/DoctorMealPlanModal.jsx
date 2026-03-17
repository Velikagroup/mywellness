import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Plus, Trash2, ChevronLeft, ChevronRight, Check, Loader2, AlertCircle, Upload, Edit3, FileText, X } from 'lucide-react';

const DAYS = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' },
];

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Colazione' },
  { key: 'snack1', label: 'Spuntino mattina' },
  { key: 'lunch', label: 'Pranzo' },
  { key: 'snack2', label: 'Merenda' },
  { key: 'dinner', label: 'Cena' },
  { key: 'snack3', label: 'Spuntino sera' },
];

const UNITS = ['g', 'ml', 'pz', 'cucchiai', 'cucchiaini', 'tazze', 'fette', 'porzioni'];

const emptyIngredient = () => ({ name: '', quantity: '', unit: 'g', calories: '', protein: '', carbs: '', fat: '' });
const emptyMeal = (meal_type = 'breakfast') => ({ meal_type, name: '', ingredients: [emptyIngredient()], instructions: [] });
const emptyDay = () => MEAL_TYPES.slice(0, 3).map(mt => emptyMeal(mt.key));

export default function DoctorMealPlanModal({ isOpen, onClose, user, existingMealPlans, onPlanSaved }) {
  const [step, setStep] = useState('input'); // 'input' | 'parsing' | 'review'
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [plan, setPlan] = useState(() => {
    const initial = {};
    DAYS.forEach(d => { initial[d.key] = emptyDay(); });
    return initial;
  });
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const currentDay = DAYS[currentDayIndex];
  const dayMeals = plan[currentDay.key] || [];

  // ── AI parsing ──────────────────────────────────────────────────────────────

  const handleFileChange = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'text/plain'];
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExt = ['pdf', 'xlsx', 'xls', 'csv', 'txt'];
    if (!allowed.includes(file.type) && !allowedExt.includes(ext)) {
      setError('Formato non supportato. Usa PDF, Excel (.xlsx/.xls), CSV o TXT.');
      return;
    }
    setError('');
    setSelectedFile(file);
  };

  const handleParseWithAI = async () => {
    if (!selectedFile) {
      setError('Carica un file prima di procedere.');
      return;
    }
    setError('');
    setStep('parsing');

    // Upload file first, then extract data
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

    const schema = {
      type: "object",
      properties: {
        monday: { type: "array", items: { "$ref": "#/definitions/meal" } },
        tuesday: { type: "array", items: { "$ref": "#/definitions/meal" } },
        wednesday: { type: "array", items: { "$ref": "#/definitions/meal" } },
        thursday: { type: "array", items: { "$ref": "#/definitions/meal" } },
        friday: { type: "array", items: { "$ref": "#/definitions/meal" } },
        saturday: { type: "array", items: { "$ref": "#/definitions/meal" } },
        sunday: { type: "array", items: { "$ref": "#/definitions/meal" } },
      },
      definitions: {
        meal: {
          type: "object",
          properties: {
            meal_type: { type: "string", enum: ["breakfast", "snack1", "lunch", "snack2", "dinner", "snack3"] },
            name: { type: "string" },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "number" },
                  unit: { type: "string" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" }
                }
              }
            },
            instructions: { type: "array", items: { type: "string" } }
          }
        }
      }
    };

    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt: `Sei un nutrizionista esperto. Analizza il piano alimentare prescritto nel file allegato e convertilo in formato strutturato per una settimana completa (lunedì-domenica).

Per ogni giorno della settimana, estrai tutti i pasti con i relativi ingredienti e valori nutrizionali.
Se il piano non specifica tutti i giorni, ripeti il pattern per i giorni mancanti.
Se non ci sono valori nutrizionali specifici per gli ingredienti, stimali in modo realistico.
Usa le chiavi in inglese: monday, tuesday, wednesday, thursday, friday, saturday, sunday.
Per meal_type usa: breakfast (colazione), snack1 (spuntino mattina), lunch (pranzo), snack2 (merenda), dinner (cena), snack3 (spuntino sera).`,
      file_urls: [file_url],
      response_json_schema: schema
    });

    // Build plan from AI response
    const newPlan = {};
    DAYS.forEach(d => {
      const aiMeals = parsed[d.key];
      if (aiMeals && aiMeals.length > 0) {
        newPlan[d.key] = aiMeals.map(m => ({
          meal_type: m.meal_type || 'breakfast',
          name: m.name || '',
          ingredients: (m.ingredients || []).map(ing => ({
            name: ing.name || '',
            quantity: ing.quantity || '',
            unit: ing.unit || 'g',
            calories: ing.calories || '',
            protein: ing.protein || '',
            carbs: ing.carbs || '',
            fat: ing.fat || '',
          })),
          instructions: m.instructions || [],
        }));
      } else {
        newPlan[d.key] = emptyDay();
      }
    });

    setPlan(newPlan);
    setCurrentDayIndex(0);
    setStep('review');
  };

  // ── plan editing helpers ────────────────────────────────────────────────────

  const updateMeal = (mealIndex, field, value) => {
    setPlan(prev => {
      const meals = [...prev[currentDay.key]];
      meals[mealIndex] = { ...meals[mealIndex], [field]: value };
      return { ...prev, [currentDay.key]: meals };
    });
  };

  const addMeal = () => {
    const usedTypes = dayMeals.map(m => m.meal_type);
    const nextType = MEAL_TYPES.find(mt => !usedTypes.includes(mt.key))?.key || 'snack3';
    setPlan(prev => ({ ...prev, [currentDay.key]: [...prev[currentDay.key], emptyMeal(nextType)] }));
  };

  const removeMeal = (mealIndex) => {
    setPlan(prev => ({ ...prev, [currentDay.key]: prev[currentDay.key].filter((_, i) => i !== mealIndex) }));
  };

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

  // ── save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      for (const existing of existingMealPlans) {
        await base44.entities.MealPlan.delete(existing.id);
      }
      for (const day of DAYS) {
        const meals = plan[day.key] || [];
        for (const meal of meals) {
          if (!meal.name.trim()) continue;
          const validIngredients = meal.ingredients
            .filter(ing => ing.name.trim() && ing.quantity)
            .map(ing => ({
              name: ing.name.trim(),
              quantity: parseFloat(ing.quantity) || 0,
              unit: ing.unit || 'g',
              calories: parseFloat(ing.calories) || 0,
              protein: parseFloat(ing.protein) || 0,
              carbs: parseFloat(ing.carbs) || 0,
              fat: parseFloat(ing.fat) || 0,
            }));

          await base44.entities.MealPlan.create({
            user_id: user.id,
            day_of_week: day.key,
            meal_type: meal.meal_type,
            name: meal.name.trim(),
            ingredients: validIngredients,
            instructions: meal.instructions || [],
            total_calories: Math.round(validIngredients.reduce((s, i) => s + i.calories, 0)),
            total_protein: Math.round(validIngredients.reduce((s, i) => s + i.protein, 0) * 10) / 10,
            total_carbs: Math.round(validIngredients.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
            total_fat: Math.round(validIngredients.reduce((s, i) => s + i.fat, 0) * 10) / 10,
            prep_time: 0,
            difficulty: 'easy',
          });
        }
      }
      onPlanSaved();
      onClose();
    } catch (err) {
      setError(`Errore durante il salvataggio: ${err.message}`);
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  };

  const totalMealsInserted = DAYS.reduce((acc, d) => acc + (plan[d.key]?.filter(m => m.name.trim()).length || 0), 0);

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
              <DialogTitle className="text-lg font-bold text-gray-900">Carica il tuo Piano</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === 'input' && 'Incolla il piano del medico/nutrizionista — l\'AI lo struttura automaticamente'}
                {step === 'parsing' && 'L\'AI sta analizzando il tuo piano...'}
                {step === 'review' && `Piano caricato: ${totalMealsInserted} pasti inseriti — controlla e poi salva`}
              </p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {['input', 'review'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  step === s ? 'bg-purple-100 text-purple-700' :
                  (step === 'review' && s === 'input') ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step === 'review' && s === 'input' ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                  {s === 'input' ? 'Inserisci piano' : 'Rivedi e salva'}
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
                <p className="text-sm font-semibold text-purple-800 mb-1">Come funziona</p>
                <p className="text-xs text-purple-700 leading-relaxed">
                  Copia e incolla il piano alimentare del tuo medico o nutrizionista nel campo qui sotto. 
                  L'AI leggerà tutte le informazioni (pasti, ingredienti, quantità, calorie) e le pre-inserirà 
                  automaticamente nella programmazione settimanale. Potrai poi verificare e modificare tutto prima di salvare.
                </p>
              </div>

              {/* File drop zone */}
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
                <input
                  id="plan-file-input"
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={e => handleFileChange(e.target.files[0])}
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">{selectedFile.name}</p>
                      <p className="text-xs text-green-600 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB — pronto per l'analisi</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" /> Rimuovi file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                      <Upload className="w-7 h-7 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Trascina il file qui o clicca per caricare</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, Excel (.xlsx/.xls), CSV, TXT</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleParseWithAI}
                disabled={step === 'parsing' || !planText.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-5 font-semibold rounded-xl text-base"
              >
                {step === 'parsing' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    L'AI sta analizzando il tuo piano...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analizza con AI e pre-inserisci
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ── STEP 2: Review ── */}
          {step === 'review' && (
            <>
              {/* Summary banner */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Piano pre-inserito dall'AI ✓</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {totalMealsInserted} pasti strutturati su 7 giorni. Controlla ogni giorno, modifica se necessario, poi salva.
                  </p>
                  <button
                    onClick={() => { setStep('input'); setError(''); setSelectedFile(null); }}
                    className="text-xs text-green-700 underline mt-1 hover:text-green-900"
                  >
                    ← Ricomincia con un altro testo
                  </button>
                </div>
              </div>

              {/* Day tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {DAYS.map((day, idx) => {
                  const hasMeals = plan[day.key]?.some(m => m.name.trim());
                  return (
                    <button
                      key={day.key}
                      onClick={() => setCurrentDayIndex(idx)}
                      className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        idx === currentDayIndex
                          ? 'bg-[#26847F] text-white shadow'
                          : hasMeals ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {day.label.substring(0, 3)}
                      {hasMeals && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              {/* Day label */}
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-800">{currentDay.label}</span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Edit3 className="w-3 h-3" /> Modifica liberamente
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-4">
                {dayMeals.map((meal, mealIndex) => (
                  <div key={mealIndex} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <Select value={meal.meal_type} onValueChange={val => updateMeal(mealIndex, 'meal_type', val)}>
                        <SelectTrigger className="w-44 h-8 text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEAL_TYPES.map(mt => (
                            <SelectItem key={mt.key} value={mt.key} className="text-xs">{mt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Nome del piatto"
                        value={meal.name}
                        onChange={e => updateMeal(mealIndex, 'name', e.target.value)}
                        className="h-8 text-sm flex-1"
                      />
                      <button
                        onClick={() => removeMeal(mealIndex)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ingredienti</Label>
                      {meal.ingredients.map((ing, ingIndex) => (
                        <div key={ingIndex} className="flex items-center gap-1.5 flex-wrap">
                          <Input
                            placeholder="Ingrediente"
                            value={ing.name}
                            onChange={e => updateIngredient(mealIndex, ingIndex, 'name', e.target.value)}
                            className="h-8 text-xs flex-1 min-w-[120px]"
                          />
                          <Input
                            placeholder="Qtà"
                            type="number"
                            value={ing.quantity}
                            onChange={e => updateIngredient(mealIndex, ingIndex, 'quantity', e.target.value)}
                            className="h-8 text-xs w-16"
                          />
                          <Select value={ing.unit} onValueChange={val => updateIngredient(mealIndex, ingIndex, 'unit', val)}>
                            <SelectTrigger className="h-8 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="kcal"
                            type="number"
                            value={ing.calories}
                            onChange={e => updateIngredient(mealIndex, ingIndex, 'calories', e.target.value)}
                            className="h-8 text-xs w-16"
                          />
                          <button
                            onClick={() => removeIngredient(mealIndex, ingIndex)}
                            className="w-7 h-7 flex items-center justify-center rounded text-red-300 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addIngredient(mealIndex)}
                        className="flex items-center gap-1 text-xs text-[#26847F] font-semibold hover:text-[#1f6b66] mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Aggiungi ingrediente
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addMeal}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#26847F] hover:text-[#26847F] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Aggiungi pasto
                </button>
              </div>

              {/* Day nav */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))} disabled={currentDayIndex === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Precedente
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDayIndex(Math.min(DAYS.length - 1, currentDayIndex + 1))} disabled={currentDayIndex === DAYS.length - 1}>
                  Successivo <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Confirm / Save */}
              {!showConfirm ? (
                <Button
                  onClick={() => setShowConfirm(true)}
                  className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white py-5 font-semibold rounded-xl text-base"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Salva Piano Completo
                </Button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-800">
                    ⚠️ Questo sostituirà il piano alimentare attuale per tutta la settimana. Confermi?
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {isSaving ? 'Salvataggio...' : 'Sì, salva'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isSaving} className="flex-1">
                      Annulla
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