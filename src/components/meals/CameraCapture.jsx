import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CameraCapture({ onCapture, onClose, t }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoomLevels = [1, 2, 4];
  const zoom = zoomLevels[zoomIndex];
  const [touchStart, setTouchStart] = useState(null);

  const handleSwipe = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe da sinistra a destra = aumenta zoom
    if (diff > 50) {
      setZoomIndex((prev) => (prev + 1) % zoomLevels.length);
    }
    // Swipe da destra a sinistra = diminuisci zoom
    else if (diff < -50) {
      setZoomIndex((prev) => (prev - 1 + zoomLevels.length) % zoomLevels.length);
    }

    setTouchStart(null);
  };

  // Accedi alla fotocamera
  useEffect(() => {
    // Nascondi il menu mobile quando la camera è aperta
    document.body.setAttribute('data-camera-open', 'true');
    
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        setError('Impossibile accedere alla fotocamera');
      }
    };

    startCamera();

    return () => {
      // Ripristina il menu mobile quando la camera si chiude
      document.body.removeAttribute('data-camera-open');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      
      // Applica lo zoom al canvas
      context.translate(canvasRef.current.width / 2, canvasRef.current.height / 2);
      context.scale(zoom, zoom);
      context.translate(-canvasRef.current.width / 2, -canvasRef.current.height / 2);
      
      context.drawImage(video, 0, 0);
      
      const photoData = canvasRef.current.toDataURL('image/jpeg');
      setCapturedPhoto(photoData);
      
      // Aggiungi alla lista di foto recenti
      setRecentPhotos(prev => [photoData, ...prev].slice(0, 5));
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const confirmPhoto = async () => {
    if (capturedPhoto) {
      // Converti dataURL a File
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      onCapture(file);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleGallerySelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-4">
        <p className="text-white text-center">{error}</p>
        <Button onClick={onClose} variant="outline">
          Chiudi
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Bottone chiudi (X in alto a sinistra) */}
      <button
        onClick={onClose}
        className="absolute top-10 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <X className="w-7 h-7 text-white" strokeWidth={3} />
      </button>

      {!capturedPhoto ? (
        <>
          {/* Video dalla fotocamera */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: `scale(${zoom})` }}
            onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
            onTouchEnd={handleSwipe}
          />

          {/* Pulsante galleria (stile liquid glass) */}
          <button
            onClick={handleGalleryClick}
            className="absolute bottom-8 left-6 z-10 p-4 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            style={{
              width: '64px',
              height: '64px',
              backdropFilter: 'blur(12px) saturate(180%)',
              background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.75) 0%, rgba(243, 244, 246, 0.65) 50%, rgba(249, 250, 241, 0.75) 100%)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            {recentPhotos.length > 0 ? (
              <img
                src={recentPhotos[0]}
                alt="Ultima foto"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-600" />
            )}
          </button>

          {/* Zoom Selector (sopra bottone scatta foto) */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {zoomLevels.map((level, index) => (
              <button
                key={level}
                onClick={() => setZoomIndex(index)}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                  zoomIndex === index
                    ? 'bg-white text-[#26847F]'
                    : 'bg-black/50 text-white'
                }`}
              >
                {level}x
              </button>
            ))}
          </div>

          {/* Bottone scatta foto (centro basso) */}
          <button
            onClick={capturePhoto}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform border-4 border-gray-200"
          >
            <div className="w-14 h-14 bg-gradient-to-r from-[#26847F] to-teal-600 rounded-full" />
          </button>
        </>
      ) : (
        <>
          {/* Preview della foto scattata */}
          <img
            src={capturedPhoto}
            alt="Foto scattata"
            className="w-full h-full object-contain bg-black"
          />

          {/* Bottoni: Ritira / Conferma */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-6">
            <button
              onClick={retakePhoto}
              className="w-14 h-14 bg-gray-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={confirmPhoto}
              className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <Check className="w-6 h-6 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}