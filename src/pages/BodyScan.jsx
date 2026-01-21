import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Camera, Upload, Loader2, Check, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function BodyScanPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: upload, 2: analyzing, 3: results
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [photos, setPhotos] = useState({
    front: null,
    side: null,
    back: null
  });
  
  const [scanResult, setScanResult] = useState(null);
  const fileInputRefs = {
    front: useRef(null),
    side: useRef(null),
    back: useRef(null)
  };

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    loadUser();
  }, [navigate]);

  const handlePhotoUpload = async (e, position) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotos(prev => ({
        ...prev,
        [position]: file_url
      }));
      setError(null);
    } catch (err) {
      setError(`Errore nel caricamento foto ${position}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!photos.front) {
      setError('La foto frontale è obbligatoria');
      return;
    }

    setStep(2);
    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('analyzeBodyImage', {
        frontPhotoUrl: photos.front,
        sidePhotoUrl: photos.side,
        backPhotoUrl: photos.back,
        userAge: user?.age,
        userHeight: user?.height,
        userWeight: user?.weight,
        userGender: user?.gender
      });

      if (response.data.success) {
        setScanResult(response.data.scanResult);
        setStep(3);
      } else {
        setError(response.data.error || 'Errore nell\'analisi');
        setStep(1);
      }
    } catch (err) {
      setError(`Errore: ${err.message}`);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('generatePersonalizedMealPlan', {
        dietType: 'balanced',
        mealsPerDay: 3
      });
      navigate(createPageUrl('Meals'));
    } catch (err) {
      setError(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWorkoutPlan = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('generatePersonalizedWorkoutPlan', {
        daysPerWeek: 4,
        location: 'gym'
      });
      navigate(createPageUrl('Workouts'));
    } catch (err) {
      setError(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  return (
    <div className="min-h-screen pt-6 pb-32 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📸 Body Scan AI</h1>
          <p className="text-xl text-gray-600">Scansiona il tuo corpo e ottieni analisi personalizzate</p>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Upload Photos */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Carica le tue foto</CardTitle>
                <CardDescription>Abbiamo bisogno di foto da 3 angolazioni per un'analisi accurata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Front Photo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="font-semibold mb-2">Foto Frontale</h3>
                    <p className="text-sm text-gray-600 mb-4">In piedi, di fronte alla camera, corpo interamente visibile</p>
                    
                    {photos.front ? (
                      <div className="mb-4">
                        <img src={photos.front} alt="Front" className="w-full max-h-40 object-cover rounded-lg" />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRefs.front.current?.click()}
                          className="mt-3"
                        >
                          Cambia foto
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => fileInputRefs.front.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Carica foto
                      </Button>
                    )}
                    <input
                      ref={fileInputRefs.front}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handlePhotoUpload(e, 'front')}
                    />
                  </div>
                </div>

                {/* Side Photo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="font-semibold mb-2">Foto Laterale</h3>
                    <p className="text-sm text-gray-600 mb-4">Di profilo, corpo interamente visibile (opzionale ma consigliato)</p>
                    
                    {photos.side ? (
                      <div className="mb-4">
                        <img src={photos.side} alt="Side" className="w-full max-h-40 object-cover rounded-lg" />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRefs.side.current?.click()}
                          className="mt-3"
                        >
                          Cambia foto
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => fileInputRefs.side.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Carica foto
                      </Button>
                    )}
                    <input
                      ref={fileInputRefs.side}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handlePhotoUpload(e, 'side')}
                    />
                  </div>
                </div>

                {/* Back Photo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="font-semibold mb-2">Foto Posteriore</h3>
                    <p className="text-sm text-gray-600 mb-4">Di spalle alla camera, corpo interamente visibile (opzionale ma consigliato)</p>
                    
                    {photos.back ? (
                      <div className="mb-4">
                        <img src={photos.back} alt="Back" className="w-full max-h-40 object-cover rounded-lg" />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRefs.back.current?.click()}
                          className="mt-3"
                        >
                          Cambia foto
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => fileInputRefs.back.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Carica foto
                      </Button>
                    )}
                    <input
                      ref={fileInputRefs.back}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handlePhotoUpload(e, 'back')}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={!photos.front || loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analizzando...
                    </>
                  ) : (
                    <>
                      Analizza il tuo corpo
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === 2 && (
          <Card className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold mb-2">Analizzando il tuo corpo...</h2>
            <p className="text-gray-600">Questo potrebbe richiedere qualche minuto. Non ricaricare la pagina.</p>
          </Card>
        )}

        {/* Step 3: Results */}
        {step === 3 && scanResult && (
          <div className="space-y-6">
            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Somatotipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600 capitalize">{scanResult.somatotype}</p>
                  <p className="text-sm text-gray-600 mt-2">Tipo di corpo naturale</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Massa Grassa</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">{scanResult.body_fat_percentage.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600 mt-2">Percentuale di grasso corporeo</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Età del Corpo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">{scanResult.body_age_estimate.toFixed(0)} anni</p>
                  <p className="text-sm text-gray-600 mt-2">Stima biologica</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Definizione Muscolare</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{scanResult.muscle_definition_score}/100</p>
                  <p className="text-sm text-gray-600 mt-2">Score di definizione</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Analisi Dettagliata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Texture Pelle</h4>
                  <p className="text-gray-700">{scanResult.skin_texture}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tono Pelle</h4>
                  <p className="text-gray-700">{scanResult.skin_tone}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Gonfiore Stimato</h4>
                  <p className="text-gray-700">{scanResult.swelling_percentage.toFixed(1)}%</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Valutazione Postura</h4>
                  <p className="text-gray-700">{scanResult.posture_assessment}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Aree da Migliorare</h4>
                  <ul className="space-y-1">
                    {scanResult.problem_areas.map((area, i) => (
                      <li key={i} className="text-gray-700">• {area}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Aree Forti</h4>
                  <ul className="space-y-1">
                    {scanResult.strong_areas.map((area, i) => (
                      <li key={i} className="text-gray-700">• {area}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleGenerateMealPlan}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 h-12"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    🍽️ Genera Piano Nutrizionale
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                onClick={handleGenerateWorkoutPlan}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 h-12"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    💪 Genera Piano Allenamento
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}