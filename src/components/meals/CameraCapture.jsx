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

  // Accedi alla fotocamera
  useEffect(() => {
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

      {!capturedPhoto ? (
        <>
          {/* Video dalla fotocamera */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Preview foto recenti in basso a sinistra */}
          {recentPhotos.length > 0 && (
            <div className="absolute bottom-6 left-6 z-10">
              <button
                onClick={handleGalleryClick}
                className="w-14 h-14 rounded-lg overflow-hidden border-2 border-white shadow-lg hover:scale-105 transition-transform bg-white"
              >
                <img
                  src={recentPhotos[0]}
                  alt="Ultima foto"
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          )}

          {/* Bottone apri galleria (se nessuna foto recente) */}
          {recentPhotos.length === 0 && (
            <button
              onClick={handleGalleryClick}
              className="absolute bottom-6 left-6 z-10 w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <ImageIcon className="w-6 h-6 text-gray-800" />
            </button>
          )}

          {/* Bottone scatta foto (centro basso) */}
          <button
            onClick={capturePhoto}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform border-4 border-gray-200"
          >
            <div className="w-14 h-14 bg-gradient-to-r from-[#26847F] to-teal-600 rounded-full" />
          </button>

          {/* Bottone chiudi (destra basso) */}
          <button
            onClick={onClose}
            className="absolute bottom-6 right-6 z-10 w-14 h-14 bg-red-500 rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            <X className="w-6 h-6 text-white" />
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