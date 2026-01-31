import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Camera, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function CameraFeaturesPreviewDemo() {
  const { t } = useLanguage();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: t('home.cameraFeature1Title') || 'Conta Calorie AI',
      subtitle: t('home.cameraFeature1Subtitle') || 'Scatta e scopri le calorie',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: t('home.cameraFeature2Title') || 'Health Score',
      subtitle: t('home.cameraFeature2Subtitle') || 'Analisi tabella nutrizionale',
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: t('home.cameraFeature3Title') || 'Body Scan',
      subtitle: t('home.cameraFeature3Subtitle') || 'Analisi composizione corporea',
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="water-glass-effect border border-white/40 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
      <style>{`
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, rgba(249, 250, 251, 0.75) 0%, rgba(243, 244, 246, 0.65) 50%, rgba(249, 250, 241, 0.75) 100%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        @keyframes pulse-ring {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }

        @keyframes scan-line {
          0% {
            top: 0%;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        .scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>

      {/* Pulsante + Centrale */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          {/* Anello pulsante esterno */}
          <div className="absolute inset-0 rounded-full bg-[#26847F] opacity-20 pulse-ring"></div>
          <div className="absolute inset-0 rounded-full bg-[#26847F] opacity-20 pulse-ring" style={{ animationDelay: '1s' }}></div>
          
          {/* Pulsante centrale */}
          <button
            className="relative rounded-full bg-gradient-to-br from-[#26847F] to-teal-600 text-white flex items-center justify-center transition-all hover:scale-110"
            style={{
              width: '80px',
              height: '80px',
              boxShadow: '0 8px 24px 0 rgba(38, 132, 127, 0.4), inset -2px -2px 4px rgba(255, 255, 255, 0.3), inset 2px 2px 4px rgba(38, 132, 127, 0.3)'
            }}
          >
            <Plus className="w-10 h-10" strokeWidth={2.5} />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-4 font-medium">
          {t('home.cameraTapToStart') || 'Tocca per iniziare'}
        </p>
      </div>

      {/* Area Camera Preview */}
      <div className="relative bg-black rounded-2xl overflow-hidden" style={{ height: '300px' }}>
        {/* Background immagine corrente */}
        <img
          key={currentFeature}
          src={features[currentFeature].image}
          alt={features[currentFeature].title}
          className="absolute inset-0 w-full h-full object-cover slide-up"
        />

        {/* Overlay scuro */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Linea di scansione */}
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent scan-line"></div>

        {/* Frame di scansione */}
        <div className="absolute inset-8 border-2 border-white/50 rounded-xl">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#26847F]"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#26847F]"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#26847F]"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#26847F]"></div>
        </div>

        {/* Badge funzionalità corrente */}
        <div key={`badge-${currentFeature}`} className="absolute top-6 left-6 right-6 slide-up">
          <div className={`bg-gradient-to-r ${features[currentFeature].color} rounded-2xl px-4 py-3 shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{features[currentFeature].title}</p>
                <p className="text-white/90 text-xs">{features[currentFeature].subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Indicatore AI Processing */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#26847F] rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-[#26847F] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-[#26847F] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-white text-xs font-medium">AI Processing...</span>
          </div>
        </div>
      </div>

      {/* Indicatori sotto */}
      <div className="flex justify-center gap-2 mt-6">
        {features.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentFeature
                ? 'w-8 bg-[#26847F]'
                : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Badge "Preview" */}
      <div className="absolute top-4 right-4">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          DEMO
        </div>
      </div>
    </Card>
  );
}