import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Camera, Upload, Loader2, Check, ChevronRight, Image as ImageIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressPhotoGallery from '@/components/training/ProgressPhotoGallery';

export default function BodyScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [previousScan, setPreviousScan] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
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
        
        // Check if coming from camera with photos
        if (location.state?.photos && location.state?.fromCamera) {
          const cameraPhotos = location.state.photos;
          const photoUrls = {
            front: cameraPhotos.find(p => p.position === 'front')?.url || null,
            side: cameraPhotos.find(p => p.position === 'side')?.url || null,
            back: cameraPhotos.find(p => p.position === 'back')?.url || null
          };
          setPhotos(photoUrls);
          
          // Auto-start analysis
          if (photoUrls.front) {
            setTimeout(() => handleAnalyze(photoUrls, currentUser), 500);
          }
        }
        
        // Load previous scan for comparison
        const previousScans = await base44.entities.BodyScanResult.filter(
          { user_id: currentUser.id },
          '-created_date',
          2
        );
        if (previousScans.length > 0) {
          setPreviousScan(previousScans[0]);
        }
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    loadUser();
  }, [navigate, location]);

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

  const handleAnalyze = async (photoUrls = null, userData = null) => {
    const photosToAnalyze = photoUrls || photos;
    const userToUse = userData || user;
    
    if (!photosToAnalyze.front) {
      setError('La foto frontale è obbligatoria');
      return;
    }

    setStep(2);
    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('analyzeBodyImage', {
        frontPhotoUrl: photosToAnalyze.front,
        sidePhotoUrl: photosToAnalyze.side,
        backPhotoUrl: photosToAnalyze.back,
        userAge: userToUse?.age,
        userHeight: userToUse?.height,
        userWeight: userToUse?.weight,
        userGender: userToUse?.gender
      });

      if (response.data.success) {
        setScanResult(response.data.scanResult);
        
        // Save scan result to database
        await base44.entities.BodyScanResult.create({
          user_id: userToUse.id,
          front_photo_url: photosToAnalyze.front,
          side_photo_url: photosToAnalyze.side,
          back_photo_url: photosToAnalyze.back,
          somatotype: response.data.scanResult.somatotype,
          body_fat_percentage: response.data.scanResult.body_fat_percentage,
          muscle_definition_score: response.data.scanResult.muscle_definition_score,
          body_age_estimate: response.data.scanResult.body_age_estimate,
          posture_assessment: response.data.scanResult.posture_assessment,
          problem_areas: response.data.scanResult.problem_areas,
          strong_areas: response.data.scanResult.strong_areas,
          skin_texture: response.data.scanResult.skin_texture,
          skin_tone: response.data.scanResult.skin_tone,
          swelling_percentage: response.data.scanResult.swelling_percentage
        });
        
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
            {/* Progress Comparison - Before/After */}
            {previousScan && (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 Confronto Progressi
                  </CardTitle>
                  <CardDescription>
                    Comparazione con la tua ultima scansione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Body Fat Comparison */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">Massa Grassa</h4>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs text-gray-500">Prima</p>
                          <p className="text-lg font-bold text-gray-700">{previousScan.body_fat_percentage?.toFixed(1)}%</p>
                        </div>
                        <div className="text-2xl">→</div>
                        <div>
                          <p className="text-xs text-gray-500">Ora</p>
                          <p className="text-lg font-bold text-blue-600">{scanResult.body_fat_percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      {scanResult.body_fat_percentage < previousScan.body_fat_percentage && (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <TrendingDown className="w-4 h-4" />
                          <span>-{(previousScan.body_fat_percentage - scanResult.body_fat_percentage).toFixed(1)}%</span>
                        </div>
                      )}
                      {scanResult.body_fat_percentage > previousScan.body_fat_percentage && (
                        <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                          <TrendingUp className="w-4 h-4" />
                          <span>+{(scanResult.body_fat_percentage - previousScan.body_fat_percentage).toFixed(1)}%</span>
                        </div>
                      )}
                      {scanResult.body_fat_percentage === previousScan.body_fat_percentage && (
                        <div className="flex items-center gap-1 text-gray-600 text-sm font-medium">
                          <Minus className="w-4 h-4" />
                          <span>Stabile</span>
                        </div>
                      )}
                    </div>

                    {/* Muscle Definition Comparison */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">Definizione Muscolare</h4>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs text-gray-500">Prima</p>
                          <p className="text-lg font-bold text-gray-700">{previousScan.muscle_definition_score}/100</p>
                        </div>
                        <div className="text-2xl">→</div>
                        <div>
                          <p className="text-xs text-gray-500">Ora</p>
                          <p className="text-lg font-bold text-green-600">{scanResult.muscle_definition_score}/100</p>
                        </div>
                      </div>
                      {scanResult.muscle_definition_score > previousScan.muscle_definition_score && (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <TrendingUp className="w-4 h-4" />
                          <span>+{(scanResult.muscle_definition_score - previousScan.muscle_definition_score)}</span>
                        </div>
                      )}
                      {scanResult.muscle_definition_score < previousScan.muscle_definition_score && (
                        <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                          <TrendingDown className="w-4 h-4" />
                          <span>{(scanResult.muscle_definition_score - previousScan.muscle_definition_score)}</span>
                        </div>
                      )}
                      {scanResult.muscle_definition_score === previousScan.muscle_definition_score && (
                        <div className="flex items-center gap-1 text-gray-600 text-sm font-medium">
                          <Minus className="w-4 h-4" />
                          <span>Stabile</span>
                        </div>
                      )}
                    </div>

                    {/* Body Age Comparison */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">Età Biologica</h4>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs text-gray-500">Prima</p>
                          <p className="text-lg font-bold text-gray-700">{previousScan.body_age_estimate?.toFixed(0)} anni</p>
                        </div>
                        <div className="text-2xl">→</div>
                        <div>
                          <p className="text-xs text-gray-500">Ora</p>
                          <p className="text-lg font-bold text-purple-600">{scanResult.body_age_estimate.toFixed(0)} anni</p>
                        </div>
                      </div>
                      {scanResult.body_age_estimate < previousScan.body_age_estimate && (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <TrendingDown className="w-4 h-4" />
                          <span>-{(previousScan.body_age_estimate - scanResult.body_age_estimate).toFixed(0)} anni</span>
                        </div>
                      )}
                      {scanResult.body_age_estimate > previousScan.body_age_estimate && (
                        <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                          <TrendingUp className="w-4 h-4" />
                          <span>+{(scanResult.body_age_estimate - previousScan.body_age_estimate).toFixed(0)} anni</span>
                        </div>
                      )}
                      {scanResult.body_age_estimate === previousScan.body_age_estimate && (
                        <div className="flex items-center gap-1 text-gray-600 text-sm font-medium">
                          <Minus className="w-4 h-4" />
                          <span>Stabile</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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

            {/* Progress Gallery Button */}
            <Button
              onClick={() => setShowGallery(true)}
              variant="outline"
              className="w-full h-12 border-2 border-[#26847F] text-[#26847F] hover:bg-[#26847F]/10"
              size="lg"
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              📸 Galleria Progressi
            </Button>

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

      {/* Progress Photo Gallery Modal */}
      {showGallery && user && (
        <ProgressPhotoGallery
          user={user}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}