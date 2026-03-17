import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../i18n/LanguageContext';
import { Search, Camera, Loader2, Check, Package, AlertCircle, X, Upload, RefreshCw } from 'lucide-react';

const LABELS = {
  it: {
    title: 'Sostituisci Ingrediente',
    replacing: 'Stai sostituendo',
    tabType: '✏️ Scrivi nome',
    tabScan: '📷 Scansiona',
    inputPlaceholder: 'Es. petto di pollo, avena, spinaci...',
    searchBtn: 'Cerca valori nutrizionali',
    searching: 'Ricerca in corso...',
    scanDesc: 'Carica foto del prodotto e/o della tabella nutrizionale per ottenere i valori esatti',
    frontPhoto: 'Foto prodotto (fronte)',
    labelPhoto: 'Foto tabella nutrizionale',
    analyzeBtn: 'Analizza con AI',
    analyzing: 'Analisi in corso...',
    preview: 'Nuovo ingrediente',
    kcal: 'kcal',
    protein: 'Prot',
    carbs: 'Carb',
    fat: 'Grassi',
    applyAll: 'Sostituisci anche in tutte le altre ricette del piano',
    addPantry: 'Aggiungi automaticamente alla dispensa',
    confirm: '✓ Conferma sostituzione',
    cancel: 'Annulla',
    pantryAdded: '✓ Aggiunto alla dispensa',
    errorFetch: 'Impossibile trovare i valori nutrizionali. Riprova.',
    errorScan: 'Impossibile analizzare le foto. Riprova.',
    uploadClick: 'Clicca per caricare',
  },
  en: {
    title: 'Replace Ingredient',
    replacing: 'Replacing',
    tabType: '✏️ Type name',
    tabScan: '📷 Scan',
    inputPlaceholder: 'E.g. chicken breast, oats, spinach...',
    searchBtn: 'Search nutritional values',
    searching: 'Searching...',
    scanDesc: 'Upload a photo of the product and/or the nutritional label to get exact values',
    frontPhoto: 'Product photo (front)',
    labelPhoto: 'Nutritional label photo',
    analyzeBtn: 'Analyze with AI',
    analyzing: 'Analyzing...',
    preview: 'New ingredient',
    kcal: 'kcal',
    protein: 'Prot',
    carbs: 'Carbs',
    fat: 'Fat',
    applyAll: 'Replace in all other recipes in the plan too',
    addPantry: 'Automatically add to pantry',
    confirm: '✓ Confirm replacement',
    cancel: 'Cancel',
    pantryAdded: '✓ Added to pantry',
    errorFetch: 'Could not find nutritional values. Try again.',
    errorScan: 'Could not analyze photos. Try again.',
    uploadClick: 'Click to upload',
  },
  es: {
    title: 'Sustituir Ingrediente',
    replacing: 'Sustituyendo',
    tabType: '✏️ Escribir nombre',
    tabScan: '📷 Escanear',
    inputPlaceholder: 'Ej. pechuga de pollo, avena, espinacas...',
    searchBtn: 'Buscar valores nutricionales',
    searching: 'Buscando...',
    scanDesc: 'Sube una foto del producto y/o la etiqueta nutricional para obtener valores exactos',
    frontPhoto: 'Foto del producto (frontal)',
    labelPhoto: 'Foto de la etiqueta nutricional',
    analyzeBtn: 'Analizar con IA',
    analyzing: 'Analizando...',
    preview: 'Nuevo ingrediente',
    kcal: 'kcal',
    protein: 'Prot',
    carbs: 'Carb',
    fat: 'Grasas',
    applyAll: 'Sustituir también en todas las demás recetas del plan',
    addPantry: 'Añadir automáticamente a la despensa',
    confirm: '✓ Confirmar sustitución',
    cancel: 'Cancelar',
    pantryAdded: '✓ Añadido a la despensa',
    errorFetch: 'No se pudieron encontrar los valores nutricionales. Inténtalo de nuevo.',
    errorScan: 'No se pudieron analizar las fotos. Inténtalo de nuevo.',
    uploadClick: 'Haz clic para cargar',
  },
  pt: {
    title: 'Substituir Ingrediente',
    replacing: 'A substituir',
    tabType: '✏️ Escrever nome',
    tabScan: '📷 Digitalizar',
    inputPlaceholder: 'Ex. peito de frango, aveia, espinafre...',
    searchBtn: 'Pesquisar valores nutricionais',
    searching: 'A pesquisar...',
    scanDesc: 'Carregue uma foto do produto e/ou da tabela nutricional para obter valores exatos',
    frontPhoto: 'Foto do produto (frente)',
    labelPhoto: 'Foto da tabela nutricional',
    analyzeBtn: 'Analisar com IA',
    analyzing: 'A analisar...',
    preview: 'Novo ingrediente',
    kcal: 'kcal',
    protein: 'Prot',
    carbs: 'Carb',
    fat: 'Gordura',
    applyAll: 'Substituir também em todas as outras receitas do plano',
    addPantry: 'Adicionar automaticamente à dispensa',
    confirm: '✓ Confirmar substituição',
    cancel: 'Cancelar',
    pantryAdded: '✓ Adicionado à dispensa',
    errorFetch: 'Não foi possível encontrar os valores nutricionais. Tente novamente.',
    errorScan: 'Não foi possível analisar as fotos. Tente novamente.',
    uploadClick: 'Clique para carregar',
  },
  de: {
    title: 'Zutat ersetzen',
    replacing: 'Ersetze',
    tabType: '✏️ Name eingeben',
    tabScan: '📷 Scannen',
    inputPlaceholder: 'z.B. Hähnchenbrust, Haferflocken, Spinat...',
    searchBtn: 'Nährwerte suchen',
    searching: 'Suche läuft...',
    scanDesc: 'Lade ein Foto des Produkts und/oder der Nährwerttabelle hoch für genaue Werte',
    frontPhoto: 'Produktfoto (Vorderseite)',
    labelPhoto: 'Foto der Nährwerttabelle',
    analyzeBtn: 'Mit KI analysieren',
    analyzing: 'Analysiere...',
    preview: 'Neue Zutat',
    kcal: 'kcal',
    protein: 'Prot',
    carbs: 'Kohlenhydr',
    fat: 'Fett',
    applyAll: 'Auch in allen anderen Rezepten des Plans ersetzen',
    addPantry: 'Automatisch zur Vorratskammer hinzufügen',
    confirm: '✓ Ersatz bestätigen',
    cancel: 'Abbrechen',
    pantryAdded: '✓ Zur Vorratskammer hinzugefügt',
    errorFetch: 'Nährwerte konnten nicht gefunden werden. Versuche es erneut.',
    errorScan: 'Fotos konnten nicht analysiert werden. Versuche es erneut.',
    uploadClick: 'Zum Hochladen klicken',
  },
  fr: {
    title: 'Remplacer l\'ingrédient',
    replacing: 'Remplacement de',
    tabType: '✏️ Saisir le nom',
    tabScan: '📷 Scanner',
    inputPlaceholder: 'Ex. blanc de poulet, flocons d\'avoine, épinards...',
    searchBtn: 'Rechercher les valeurs nutritionnelles',
    searching: 'Recherche en cours...',
    scanDesc: 'Chargez une photo du produit et/ou de la table nutritionnelle pour des valeurs exactes',
    frontPhoto: 'Photo du produit (face)',
    labelPhoto: 'Photo de la table nutritionnelle',
    analyzeBtn: 'Analyser avec l\'IA',
    analyzing: 'Analyse en cours...',
    preview: 'Nouvel ingrédient',
    kcal: 'kcal',
    protein: 'Prot',
    carbs: 'Gluc',
    fat: 'Lip',
    applyAll: 'Remplacer aussi dans toutes les autres recettes du plan',
    addPantry: 'Ajouter automatiquement au garde-manger',
    confirm: '✓ Confirmer le remplacement',
    cancel: 'Annuler',
    pantryAdded: '✓ Ajouté au garde-manger',
    errorFetch: 'Impossible de trouver les valeurs nutritionnelles. Réessayez.',
    errorScan: 'Impossible d\'analyser les photos. Réessayez.',
    uploadClick: 'Cliquer pour charger',
  },
};

const NutritionSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    quantity: { type: "number" },
    unit: { type: "string" },
    calories: { type: "number" },
    protein: { type: "number" },
    carbs: { type: "number" },
    fat: { type: "number" }
  },
  required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fat"]
};

export default function IngredientReplaceModal({ ingredient, meal, userId, onClose, onConfirm }) {
  const { language } = useLanguage();
  const T = LABELS[language] || LABELS.it;

  const [tab, setTab] = useState('type');
  const [typedName, setTypedName] = useState('');
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [labelPhoto, setLabelPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [applyAll, setApplyAll] = useState(true);
  const [addToPantry, setAddToPantry] = useState(true);
  const [pantryAdded, setPantryAdded] = useState(false);
  const frontRef = useRef();
  const labelRef = useRef();

  const handleSearch = async () => {
    if (!typedName.trim()) return;
    setIsLoading(true);
    setError('');
    setPreview(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a nutritionist. The user wants to replace the ingredient "${ingredient.name}" (${ingredient.quantity}${ingredient.unit}) in the meal "${meal.name}" with "${typedName}".
Provide accurate nutritional data for "${typedName}" using the same quantity (${ingredient.quantity}${ingredient.unit}) or a sensible portion. Use the language: ${language}.
Return ONLY the JSON.`,
        response_json_schema: NutritionSchema
      });
      setPreview(result);
    } catch {
      setError(T.errorFetch);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async () => {
    if (!frontPhoto && !labelPhoto) return;
    setIsLoading(true);
    setError('');
    setPreview(null);
    try {
      const urls = [];
      if (frontPhoto) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: frontPhoto });
        urls.push(file_url);
      }
      if (labelPhoto) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: labelPhoto });
        urls.push(file_url);
      }
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a nutritionist. From the provided product photo(s), extract the ingredient name and nutritional values per 100g or per portion (use the same quantity as the original: ${ingredient.quantity}${ingredient.unit} if possible). Language: ${language}. Return ONLY the JSON.`,
        file_urls: urls,
        response_json_schema: NutritionSchema
      });
      setPreview(result);
    } catch {
      setError(T.errorScan);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    let savedToPantry = false;
    if (addToPantry && tab === 'scan') {
      try {
        await base44.entities.UserIngredient.create({
          user_id: userId,
          name: preview.name,
          quantity: preview.quantity,
          unit: preview.unit,
          calories_per_100g: Math.round((preview.calories / preview.quantity) * 100),
          protein_per_100g: Math.round(((preview.protein || 0) / preview.quantity) * 100 * 10) / 10,
          carbs_per_100g: Math.round(((preview.carbs || 0) / preview.quantity) * 100 * 10) / 10,
          fat_per_100g: Math.round(((preview.fat || 0) / preview.quantity) * 100 * 10) / 10,
        });
        savedToPantry = true;
        setPantryAdded(true);
      } catch (e) {
        console.warn('Pantry save failed:', e);
      }
    }
    onConfirm(preview, applyAll, ingredient.name);
  };

  const PhotoUpload = ({ label, file, setFile, inputRef }) => (
    <div>
      <Label className="text-xs text-gray-500 font-semibold mb-1.5 block">{label}</Label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all ${file ? 'border-[#26847F] bg-[#f0fdf8]' : 'border-gray-200 hover:border-[#26847F] hover:bg-gray-50'}`}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => setFile(e.target.files[0])} />
        {file ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#26847F]" />
              <span className="text-xs text-[#26847F] font-medium truncate max-w-[150px]">{file.name}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); setFile(null); }}
              className="text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">{T.uploadClick}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <DialogTitle className="text-base font-bold text-gray-900">{T.title}</DialogTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            {T.replacing}: <span className="font-semibold text-gray-700">{ingredient.name}</span> ({ingredient.quantity}{ingredient.unit})
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {['type', 'scan'].map(t => (
              <button key={t} onClick={() => { setTab(t); setPreview(null); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'type' ? T.tabType : T.tabScan}
              </button>
            ))}
          </div>

          {/* Type tab */}
          {tab === 'type' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={typedName}
                  onChange={e => setTypedName(e.target.value)}
                  placeholder={T.inputPlaceholder}
                  className="flex-1 h-10 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isLoading || !typedName.trim()}
                  className="h-10 px-4 bg-[#26847F] hover:bg-[#1f6b66] text-white text-sm">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Scan tab */}
          {tab === 'scan' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">{T.scanDesc}</p>
              <PhotoUpload label={T.frontPhoto} file={frontPhoto} setFile={setFrontPhoto} inputRef={frontRef} />
              <PhotoUpload label={T.labelPhoto} file={labelPhoto} setFile={setLabelPhoto} inputRef={labelRef} />
              <Button onClick={handleScan} disabled={isLoading || (!frontPhoto && !labelPhoto)}
                className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white text-sm h-10">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{T.analyzing}</> : T.analyzeBtn}
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Loading indicator for type */}
          {isLoading && tab === 'type' && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#26847F]" />
              <span>{T.searching}</span>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="bg-gradient-to-br from-[#f0fdf8] to-emerald-50 border border-[#26847F]/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{T.preview}</p>
                  <p className="text-base font-bold text-gray-900">{preview.name}</p>
                  <p className="text-xs text-gray-500">{preview.quantity}{preview.unit}</p>
                </div>
                <button onClick={() => { setPreview(null); setError(''); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-600">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: T.kcal, value: Math.round(preview.calories), color: 'text-[#26847F]' },
                  { label: T.protein, value: `${Math.round(preview.protein)}g`, color: 'text-red-500' },
                  { label: T.carbs, value: `${Math.round(preview.carbs)}g`, color: 'text-blue-500' },
                  { label: T.fat, value: `${Math.round(preview.fat)}g`, color: 'text-yellow-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center bg-white rounded-xl p-2 shadow-sm">
                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options (shown when preview is ready) */}
          {preview && (
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div onClick={() => setApplyAll(!applyAll)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${applyAll ? 'bg-[#26847F] border-[#26847F]' : 'border-gray-300 group-hover:border-[#26847F]'}`}>
                  {applyAll && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-700">{T.applyAll}</span>
              </label>

              {tab === 'scan' && (
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div onClick={() => setAddToPantry(!addToPantry)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${addToPantry ? 'bg-[#26847F] border-[#26847F]' : 'border-gray-300 group-hover:border-[#26847F]'}`}>
                    {addToPantry && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-purple-500" />
                    {pantryAdded ? <span className="text-[#26847F] font-semibold">{T.pantryAdded}</span> : T.addPantry}
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2.5">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11 text-sm">
            {T.cancel}
          </Button>
          {preview && (
            <button onClick={handleConfirm}
              className="flex-1 h-11 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #26847F 0%, #1a9e97 100%)', boxShadow: '0 4px 15px rgba(38,132,127,0.35)' }}>
              {T.confirm}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}