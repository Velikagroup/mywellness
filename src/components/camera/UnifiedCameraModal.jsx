import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, FlipHorizontal, RotateCcw, UtensilsCrossed, Scale, ScanLine } from 'lucide-react';
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
    side: null,
    back: null
  });
  const [currentBodyScanStep, setCurrentBodyScanStep] = useState('front');

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

      setCalorieResult(result);
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('Errore durante l\'analisi. Riprova.');
    }
    setAnalyzing(false);
  };

  const handleBodyScanPhoto = (imageUrl, blob) => {
    setBodyScanPhotos(prev => ({
      ...prev,
      [currentBodyScanStep]: imageUrl
    }));

    // Move to next step
    if (currentBodyScanStep === 'front') {
      setCurrentBodyScanStep('side');
    } else if (currentBodyScanStep === 'side') {
      setCurrentBodyScanStep('back');
    } else {
      // All photos captured, proceed to body scan page
      stopCamera();
      navigateToBodyScan();
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

  const navigateToBodyScan = async () => {
    try {
      // Upload all photos
      const photos = [];
      for (const [key, imageUrl] of Object.entries(bodyScanPhotos)) {
        if (imageUrl) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `${key}.jpg`, { type: 'image/jpeg' });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          photos.push({ position: key, url: file_url });
        }
      }

      // Navigate to body scan with photos
      navigate(createPageUrl('BodyScan'), { 
        state: { 
          photos: photos,
          fromCamera: true 
        } 
      });
      onClose();
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Errore durante il caricamento delle foto');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Header */}
      <div className="absolute top-16 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
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
              {['front', 'side', 'back'].map((step) => (
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
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-20 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{calorieResult.nome_cibo}</h3>
            <p className="text-sm text-gray-600 mb-6">Porzione: {calorieResult.porzione_stimata}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-orange-600">{calorieResult.calorie}</p>
                <p className="text-sm text-gray-600 font-medium">Calorie</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{calorieResult.proteine}g</p>
                <p className="text-sm text-gray-600 font-medium">Proteine</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{calorieResult.carboidrati}g</p>
                <p className="text-sm text-gray-600 font-medium">Carboidrati</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{calorieResult.grassi}g</p>
                <p className="text-sm text-gray-600 font-medium">Grassi</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Rifai
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-[#26847F] hover:bg-[#1f6b66]"
              >
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}