import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Calculator, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function CalorieMeter({ isOpen, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !description.trim()) {
      alert('Carica una foto o inserisci una descrizione');
      return;
    }

    setIsAnalyzing(true);
    try {
      let fileUrl = null;
      if (selectedFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
        fileUrl = uploadResult.file_url;
      }

      const prompt = `Sei un nutrizionista esperto. ${
        fileUrl 
          ? 'Analizza questa foto di un piatto e calcola il contenuto nutrizionale.' 
          : `Analizza questo piatto: "${description}"`
      }

Fornisci:
- Nome del piatto (in italiano)
- Calorie totali
- Proteine (g)
- Carboidrati (g)
- Grassi (g)
- Porzione stimata (g)
- Ingredienti principali identificati`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: fileUrl ? [fileUrl] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            dish_name: { type: "string" },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
            portion_size: { type: "number" },
            main_ingredients: { type: "array", items: { type: "string" } }
          }
        }
      });

      setResult(analysis);
    } catch (error) {
      console.error('Error analyzing:', error);
      alert('Errore durante l\'analisi. Riprova.');
    }
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-[#26847F]" />
            Conta Calorie Istantaneo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!result ? (
            <>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#26847F] transition-colors">
                  {previewUrl ? (
                    <div className="relative">
                      <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" />
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">Carica una foto del piatto</p>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="meal-photo-input"
                      />
                      <label htmlFor="meal-photo-input">
                        <Button asChild variant="outline" className="cursor-pointer">
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Seleziona Foto
                          </span>
                        </Button>
                      </label>
                    </>
                  )}
                </div>

                <div className="text-center text-sm text-gray-500 font-semibold">OPPURE</div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrivi il piatto
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Es: Pasta al pomodoro con basilico, circa 200g"
                    className="h-24"
                    disabled={!!selectedFile}
                  />
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!selectedFile && !description.trim())}
                className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white h-12 text-base font-bold"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analisi in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Calcola Calorie
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              {previewUrl && (
                <img src={previewUrl} alt="Analyzed" className="w-full h-40 object-cover rounded-lg" />
              )}

              <div className="bg-gradient-to-br from-[#e9f6f5] to-blue-50 rounded-xl p-4 border-2 border-[#26847F]/30">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{result.dish_name}</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Calorie</p>
                    <p className="text-2xl font-bold text-[#26847F]">{Math.round(result.calories)}</p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Porzione</p>
                    <p className="text-2xl font-bold text-gray-800">{Math.round(result.portion_size)}</p>
                    <p className="text-xs text-gray-500">g</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white/80 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Proteine</p>
                    <p className="text-lg font-bold text-red-600">{result.protein.toFixed(1)}g</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Carbo</p>
                    <p className="text-lg font-bold text-blue-600">{result.carbs.toFixed(1)}g</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Grassi</p>
                    <p className="text-lg font-bold text-yellow-600">{result.fat.toFixed(1)}g</p>
                  </div>
                </div>

                {result.main_ingredients?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Ingredienti identificati:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.main_ingredients.map((ing, idx) => (
                        <span key={idx} className="text-xs bg-white/70 px-2 py-1 rounded-full text-gray-700 border border-gray-200">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Nuova Analisi
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  Chiudi
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}