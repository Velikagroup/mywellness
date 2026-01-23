import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, FlipHorizontal, RotateCcw, UtensilsCrossed, Scale, ScanLine, Image, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UnifiedCameraModal({ isOpen, onClose, user }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('calories'); // 'calories', 'weight', 'bodyscan'
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [capturedImage, setCapturedImage] = useState(null);
  
  // Calorie mode states
  const [analyzing, setAnalyzing] = useState(false);
  const [calorieResult, setCalorieResult] = useState(null);

  // Weight mode states
  const [weightKg, setWeightKg] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  // Body scan mode states
  const [bodyScanPhotos, setBodyScanPhotos] = useState({
    front: null,
    side: null
  });
  const [currentBodyScanStep, setCurrentBodyScanStep] = useState('front');
  const [bodyScanAnalyzing, setBodyScanAnalyzing] = useState(false);
  const [bodyScanResult, setBodyScanResult] = useState(null);
  const [savingBodyScan, setSavingBodyScan] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [bodyScanHistory, setBodyScanHistory] = useState([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  useEffect(() => {
    if (isOpen && mode !== 'weight') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, mode]);

  useEffect(() => {
    if (mode === 'weight') {
      stopCamera();
      setCameraActive(false);
    } else if (isOpen) {
      startCamera();
    }
  }, [mode]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Impossibile accedere alla fotocamera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      const imageUrl = URL.createObjectURL(blob);
      
      if (mode === 'calories') {
        setCapturedImage(imageUrl);
        stopCamera();
        await analyzeCalories(blob);
      } else if (mode === 'bodyscan') {
        handleBodyScanPhoto(imageUrl, blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const analyzeCalories = async (blob) => {
    setAnalyzing(true);
    try {
      const file = new File([blob], 'food.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analizza questa foto di cibo e fornisci SOLO i valori nutrizionali per la PORZIONE VISIBILE nella foto.
        
        IMPORTANTE: Stima la quantità basandoti sulla PORZIONE REALE visibile, non una porzione standard.
        
        Fornisci i dati in questo formato JSON preciso:
        {
          "nome_cibo": "nome del cibo",
          "porzione_stimata": "descrizione della porzione (es: 1 piatto, 200g, 1 fetta)",
          "calorie": numero,
          "proteine": numero (in grammi),
          "carboidrati": numero (in grammi),
          "grassi": numero (in grammi)
        }`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            nome_cibo: { type: "string" },
            porzione_stimata: { type: "string" },
            calorie: { type: "number" },
            proteine: { type: "number" },
            carboidrati: { type: "number" },
            grassi: { type: "number" }
          }
        }
      });

      setCalorieResult({ ...result, photo_url: file_url });
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('Errore durante l\'analisi. Riprova.');
    }
    setAnalyzing(false);
  };

  const handleBodyScanPhoto = (imageUrl, blob) => {
    const updatedPhotos = {
      ...bodyScanPhotos,
      [currentBodyScanStep]: imageUrl
    };
    setBodyScanPhotos(updatedPhotos);

    // Controlla se front e side sono state scattate (back opzionale)
    if (updatedPhotos.front && updatedPhotos.side) {
      // Foto necessarie presenti, procedi all'analisi
      stopCamera();
      analyzeBodyScan(updatedPhotos);
    } else {
      // Trova la prossima foto mancante
      if (!updatedPhotos.front) {
        setCurrentBodyScanStep('front');
      } else if (!updatedPhotos.side) {
        setCurrentBodyScanStep('side');
      }
    }
  };

  const removeBodyScanPhoto = (step) => {
    setBodyScanPhotos(prev => ({
      ...prev,
      [step]: null
    }));
    // Se rimuovi una foto, torna a quello step
    setCurrentBodyScanStep(step);
  };

  const analyzeBodyScan = async (photos) => {
    setBodyScanAnalyzing(true);
    try {
      // Upload only front and side photos
      const uploadedPhotos = {};
      for (const [key, imageUrl] of Object.entries(photos)) {
        if (imageUrl && (key === 'front' || key === 'side')) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `${key}.jpg`, { type: 'image/jpeg' });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          uploadedPhotos[key] = file_url;
        }
      }

      // Analyze body
      const { analyzeBodyImage } = await import('@/functions/analyzeBodyImage');
      const result = await analyzeBodyImage({
        front_photo_url: uploadedPhotos.front,
        side_photo_url: uploadedPhotos.side,
        back_photo_url: null,
        user_id: user.id,
        height: user.height,
        weight: user.weight || user.current_weight,
        age: user.age,
        gender: user.gender
      });

      setBodyScanResult({
        ...result,
        photos: uploadedPhotos,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error analyzing body scan:', error);
      alert('Errore durante l\'analisi. Riprova.');
    }
    setBodyScanAnalyzing(false);
  };

  const saveBodyScanResult = async () => {
    if (!bodyScanResult || !user) return;
    
    setSavingBodyScan(true);
    try {
      await base44.entities.BodyScanResult.create({
        user_id: user.id,
        front_photo_url: bodyScanResult.photos.front,
        side_photo_url: bodyScanResult.photos.side,
        back_photo_url: null,
        somatotype: bodyScanResult.somatotype,
        body_fat_percentage: bodyScanResult.body_fat_percentage,
        muscle_definition_score: bodyScanResult.muscle_definition_score,
        body_age_estimate: bodyScanResult.body_age_estimate,
        posture_assessment: bodyScanResult.posture_assessment,
        problem_areas: bodyScanResult.problem_areas,
        strong_areas: bodyScanResult.strong_areas,
        skin_texture: bodyScanResult.skin_texture,
        skin_tone: bodyScanResult.skin_tone,
        swelling_percentage: bodyScanResult.swelling_percentage
      });
      alert('✅ Body scan salvato con successo!');
      onClose();
    } catch (error) {
      console.error('Error saving body scan:', error);
      alert('Errore durante il salvataggio');
    }
    setSavingBodyScan(false);
  };

  const loadBodyScanHistory = async () => {
    if (!user) return;
    try {
      const history = await base44.entities.BodyScanResult.filter(
        { user_id: user.id },
        '-created_date'
      );
      setBodyScanHistory(history);
      setExpandedHistoryId(null);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading body scan history:', error);
      alert('Errore durante il caricamento dello storico');
    }
  };

  const saveWeight = async () => {
    if (!weightKg || !user) {
      alert('Inserisci un peso valido');
      return;
    }

    setSavingWeight(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await base44.entities.WeightHistory.create({
        user_id: user.id,
        weight: parseFloat(weightKg),
        date: today
      });
      alert('✅ Peso registrato con successo!');
      onClose();
    } catch (error) {
      console.error('Error saving weight:', error);
      alert('Errore durante il salvataggio');
    }
    setSavingWeight(false);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCalorieResult(null);
    startCamera();
  };

  const kgToLbs = (kg) => (kg * 2.20462).toFixed(1);
  const lbsToKg = (lbs) => (lbs / 2.20462).toFixed(1);

  const handleGallerySelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    if (mode === 'calories') {
      setCapturedImage(imageUrl);
      stopCamera();
      await analyzeCalories(file);
    } else if (mode === 'bodyscan') {
      handleBodyScanPhoto(imageUrl, file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-16 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {cameraActive && mode !== 'bodyscan' && (
            <button
              onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <FlipHorizontal className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Body Scan History Button */}
      {mode === 'bodyscan' && !bodyScanAnalyzing && !bodyScanResult && (
        <button
          onClick={loadBodyScanHistory}
          className="absolute bottom-60 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-all"
        >
          Storico Body Scan
        </button>
      )}

      {/* Mode Selector Buttons */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        <button
          onClick={() => setMode('calories')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            mode === 'calories' 
              ? 'bg-[#26847F] text-white scale-110' 
              : 'bg-white/20 text-white backdrop-blur-sm'
          }`}
        >
          <UtensilsCrossed className="w-6 h-6" />
          <span className="text-xs font-medium">Calories</span>
        </button>

        <button
          onClick={() => setMode('weight')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            mode === 'weight' 
              ? 'bg-[#26847F] text-white scale-110' 
              : 'bg-white/20 text-white backdrop-blur-sm'
          }`}
        >
          <Scale className="w-6 h-6" />
          <span className="text-xs font-medium">Weight</span>
        </button>

        <button
          onClick={() => setMode('bodyscan')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            mode === 'bodyscan' 
              ? 'bg-[#26847F] text-white scale-110' 
              : 'bg-white/20 text-white backdrop-blur-sm'
          }`}
        >
          <ScanLine className="w-6 h-6" />
          <span className="text-xs font-medium">Body Scan</span>
        </button>
      </div>

      {/* Camera View (for calories and bodyscan modes) */}
      {mode !== 'weight' && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Body Scan Photo Indicators */}
          {mode === 'bodyscan' && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10 flex gap-4">
              {['front', 'side'].map((step) => (
                <div
                  key={step}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl ${
                    bodyScanPhotos[step] 
                      ? 'bg-green-500/80' 
                      : currentBodyScanStep === step 
                      ? 'bg-[#26847F]/80' 
                      : 'bg-white/20'
                  } backdrop-blur-sm`}
                >
                  {bodyScanPhotos[step] && (
                    <button
                      onClick={() => removeBodyScanPhoto(step)}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 hover:bg-red-600 transition-colors z-20"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <div className="w-16 h-20 rounded-lg border-2 border-white/50 flex items-center justify-center">
                    {bodyScanPhotos[step] ? (
                      <img src={bodyScanPhotos[step]} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className="text-xs text-white font-medium capitalize">{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Gallery Button (solo per calories e bodyscan) */}
          {(mode === 'calories' || mode === 'bodyscan') && !capturedImage && !calorieResult && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleGallerySelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-8 left-8 p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <Image className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Capture Button */}
          {cameraActive && !capturedImage && !calorieResult && (
            <button
              onClick={capturePhoto}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-[#26847F] border-4 border-white shadow-2xl hover:scale-110 transition-transform active:scale-95"
            />
          )}
        </>
      )}

      {/* Weight Mode UI */}
      {mode === 'weight' && (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <Scale className="w-16 h-16 mx-auto mb-4 text-[#26847F]" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Log Weight</h2>
              <p className="text-gray-600">Inserisci il tuo peso attuale</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Peso (kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="70.5"
                  className="h-14 text-lg text-center"
                />
                {weightKg && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    ≈ {kgToLbs(weightKg)} lbs
                  </p>
                )}
              </div>

              <Button
                onClick={saveWeight}
                disabled={savingWeight || !weightKg}
                className="w-full h-14 bg-[#26847F] hover:bg-[#1f6b66] text-white text-lg font-semibold"
              >
                {savingWeight ? 'Salvataggio...' : 'Salva Peso'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calorie Analysis Result */}
      {mode === 'calories' && analyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold">Analisi in corso...</p>
          </div>
        </div>
      )}

      {mode === 'calories' && calorieResult && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-20 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl my-auto">
            {/* Foto del Cibo */}
            {calorieResult.photo_url && (
              <div className="relative w-full h-48 rounded-t-3xl overflow-hidden bg-gray-100">
                <img 
                  src={calorieResult.photo_url} 
                  alt="Cibo analizzato"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                  <h3 className="text-xl font-bold text-white capitalize">{calorieResult.nome_cibo}</h3>
                  <p className="text-xs text-white/90">Porzione: {calorieResult.porzione_stimata}</p>
                </div>
              </div>
            )}

            <div className="p-8">
              {/* Calorie Box - Prominente */}
              <div className="mb-6 bg-gradient-to-br from-[#26847F]/10 to-[#26847F]/5 border-2 border-[#26847F]/20 rounded-2xl p-6">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2 text-center">Energia Totale</p>
                <p className="text-5xl font-bold text-[#26847F] text-center">{calorieResult.calorie}</p>
                <p className="text-sm font-medium text-gray-500 text-center mt-1">kcal</p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 mb-6"></div>

              {/* Macronutrienti */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Composizione Macronutrizionale</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">{calorieResult.proteine}g</p>
                    <p className="text-xs text-gray-600 font-medium mt-1">Proteine</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">{calorieResult.carboidrati}g</p>
                    <p className="text-xs text-gray-600 font-medium mt-1">Carboidrati</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">{calorieResult.grassi}g</p>
                    <p className="text-xs text-gray-600 font-medium mt-1">Grassi</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rifai
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  Chiudi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Body Scan Analyzing */}
      {mode === 'bodyscan' && bodyScanAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold">Analisi del corpo in corso...</p>
            <p className="text-sm text-white/70 mt-2">Attendere prego</p>
          </div>
        </div>
      )}

      {/* Body Scan Result */}
      {mode === 'bodyscan' && bodyScanResult && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-20 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl my-auto">
            {/* Header con foto */}
            <div className="relative rounded-t-3xl overflow-hidden bg-white border-b border-gray-200">
              <div className="grid grid-cols-2 gap-3 p-4">
                {bodyScanResult.photos.front && (
                  <img src={bodyScanResult.photos.front} className="w-full h-56 object-cover rounded-lg" alt="Front" />
                )}
                {bodyScanResult.photos.side && (
                  <img src={bodyScanResult.photos.side} className="w-full h-56 object-cover rounded-lg" alt="Side" />
                )}
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-500 mb-1">Analisi del {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <h3 className="text-2xl font-bold text-gray-900">Risultati Body Scan</h3>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Metriche Principali */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Somatotipo</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{bodyScanResult.somatotype}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Massa Grassa</p>
                  <p className="text-2xl font-bold text-gray-900">{bodyScanResult.body_fat_percentage}%</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Definizione Muscolare</p>
                  <p className="text-2xl font-bold text-gray-900">{bodyScanResult.muscle_definition_score}<span className="text-base text-gray-500">/100</span></p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Età Biologica</p>
                  <p className="text-2xl font-bold text-gray-900">{bodyScanResult.body_age_estimate} <span className="text-base text-gray-500">anni</span></p>
                </div>
              </div>

              {/* Postura */}
              {bodyScanResult.posture_assessment && (
                <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Valutazione Posturale</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{bodyScanResult.posture_assessment}</p>
                </div>
              )}

              {/* Aree Problematiche e Punti di Forza */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {bodyScanResult.problem_areas && bodyScanResult.problem_areas.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2">Aree da Migliorare</p>
                    <ul className="space-y-1">
                      {bodyScanResult.problem_areas.map((area, idx) => (
                        <li key={idx} className="text-sm text-red-800">• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {bodyScanResult.strong_areas && bodyScanResult.strong_areas.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">Punti di Forza</p>
                    <ul className="space-y-1">
                      {bodyScanResult.strong_areas.map((area, idx) => (
                        <li key={idx} className="text-sm text-green-800">• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Dettagli Aggiuntivi */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {bodyScanResult.skin_texture && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1">Texture Pelle</p>
                    <p className="text-sm font-semibold text-gray-900">{bodyScanResult.skin_texture}</p>
                  </div>
                )}
                {bodyScanResult.skin_tone && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1">Tono Pelle</p>
                    <p className="text-sm font-semibold text-gray-900">{bodyScanResult.skin_tone}</p>
                  </div>
                )}
                {bodyScanResult.swelling_percentage !== undefined && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1">Gonfiore</p>
                    <p className="text-sm font-semibold text-gray-900">{bodyScanResult.swelling_percentage}%</p>
                  </div>
                )}
              </div>

              {/* Pulsanti Azione */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setBodyScanResult(null);
                    setBodyScanPhotos({ front: null, side: null });
                    setCurrentBodyScanStep('front');
                    startCamera();
                  }}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Nuovo Scan
                </Button>
                <Button
                  onClick={saveBodyScanResult}
                  disabled={savingBodyScan}
                  className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  {savingBodyScan ? 'Salvataggio...' : 'Salva Scan'}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="px-6 border-gray-300 hover:bg-gray-50"
                >
                  Chiudi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Body Scan History Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl my-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Storico Body Scan</h3>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setExpandedHistoryId(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {bodyScanHistory.length === 0 ? (
                <div className="text-center py-12">
                  <ScanLine className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">Nessun body scan salvato</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bodyScanHistory.map((scan) => (
                    <div key={scan.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedHistoryId(expandedHistoryId === scan.id ? null : scan.id)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <img 
                          src={scan.front_photo_url} 
                          className="w-16 h-20 object-cover rounded-lg flex-shrink-0" 
                          alt="Front" 
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-lg">
                            {new Date(scan.created_date).toLocaleDateString('it-IT', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedHistoryId === scan.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedHistoryId === scan.id && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <img src={scan.front_photo_url} className="w-full h-48 object-cover rounded-lg" alt="Front" />
                            <img src={scan.side_photo_url} className="w-full h-48 object-cover rounded-lg" alt="Side" />
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Somatotipo</p>
                                <p className="text-xl font-bold text-gray-900 capitalize">{scan.somatotype}</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Massa Grassa</p>
                                <p className="text-xl font-bold text-gray-900">{scan.body_fat_percentage}%</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Definizione</p>
                                <p className="text-xl font-bold text-gray-900">{scan.muscle_definition_score}/100</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Età Biologica</p>
                                <p className="text-xl font-bold text-gray-900">{scan.body_age_estimate} anni</p>
                              </div>
                            </div>

                            {scan.posture_assessment && (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Postura</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{scan.posture_assessment}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              {scan.problem_areas && scan.problem_areas.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2">Aree da Migliorare</p>
                                  <ul className="space-y-1">
                                    {scan.problem_areas.map((area, idx) => (
                                      <li key={idx} className="text-sm text-red-800">• {area}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {scan.strong_areas && scan.strong_areas.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">Punti di Forza</p>
                                  <ul className="space-y-1">
                                    {scan.strong_areas.map((area, idx) => (
                                      <li key={idx} className="text-sm text-green-800">• {area}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}