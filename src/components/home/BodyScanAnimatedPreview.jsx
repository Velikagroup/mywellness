import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlipHorizontal, X, Image, Camera, ScanLine } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { BarChart3 } from 'lucide-react';

export default function BodyScanAnimatedPreview() {
  const { t } = useLanguage();
  const [phase, setPhase] = useState('scan'); // 'scan' o 'results'

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => prev === 'scan' ? 'results' : 'scan');
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-[340px] mx-auto aspect-[9/16] bg-black rounded-[40px] overflow-hidden shadow-2xl border-8 border-gray-900">
      {/* Scanning Phase - First 3 seconds */}
      <AnimatePresence mode="wait">
        {phase === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Camera background with body scan photo */}
            <div className="absolute inset-0">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c70ad6966_medicina-estetica-granada-kclinik-1.jpg"
                alt="Body Scan"
                className="w-full h-full object-cover"
              />
              
              {/* Scanning overlay effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"
                animate={{
                  y: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 pt-6 px-4">
              <div className="flex items-center justify-between">
                <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
                  <X className="w-5 h-5 text-white" />
                </button>
                <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
                  <FlipHorizontal className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Body Scan Photo Indicators */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 flex gap-3">
              {/* Front - Active */}
              <div className="relative flex flex-col items-center gap-2 p-2 rounded-xl bg-black/80 backdrop-blur-sm border-2 border-white">
                <div className="w-12 h-16 rounded-lg border-2 border-white/50 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] text-white font-medium">{t('home.bodyScanFront')}</span>
              </div>

              {/* Side - Not active */}
              <div className="relative flex flex-col items-center gap-2 p-2 rounded-xl bg-white/40 backdrop-blur-sm">
                <div className="w-12 h-16 rounded-lg border-2 border-white/50 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white/60" />
                </div>
                <span className="text-[10px] text-white/60 font-medium">{t('home.bodyScanSide')}</span>
              </div>

              {/* Back - Not active */}
              <div className="relative flex flex-col items-center gap-2 p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <div className="w-12 h-16 rounded-lg border-2 border-white/50 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white/60" />
                </div>
                <span className="text-[10px] text-white/60 font-medium">{t('home.bodyScanBack')}</span>
              </div>
            </div>

            {/* Body outline guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-24">
              <div className="relative w-48 h-96">
                <svg className="w-full h-full" viewBox="0 0 100 200" fill="none">
                  {/* Head */}
                  <ellipse cx="50" cy="20" rx="12" ry="15" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                  {/* Torso */}
                  <path d="M 38 35 L 35 80 L 32 120 L 35 160 L 38 180" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                  <path d="M 62 35 L 65 80 L 68 120 L 65 160 L 62 180" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                  {/* Shoulders */}
                  <line x1="38" y1="35" x2="25" y2="45" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                  <line x1="62" y1="35" x2="75" y2="45" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                  {/* Arms */}
                  <line x1="25" y1="45" x2="20" y2="100" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                  <line x1="75" y1="45" x2="80" y2="100" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                  {/* Legs */}
                  <line x1="38" y1="180" x2="35" y2="200" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                  <line x1="62" y1="180" x2="65" y2="200" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                </svg>
                <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white text-xs font-semibold text-center">{t('home.bodyScanPosition')}</p>
              </div>
            </div>

            {/* Gallery Button */}
            <button className="absolute bottom-28 left-4 p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <Image className="w-5 h-5 text-white" />
            </button>

            {/* Mode Selector Buttons */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-black text-white scale-110">
                <ScanLine className="w-5 h-5" />
                <span className="text-[10px] font-medium">Body Scan</span>
              </button>
            </div>

            {/* Capture Button */}
            <button className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-black shadow-2xl z-20" />
          </motion.div>
        )}

        {/* Results Phase - Last 3 seconds */}
        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full overflow-y-auto"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/b0bb1d6ad_mywellness-background-4k.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="p-5 space-y-4">
              {/* Status Bar */}
              <div className="text-xs text-gray-600 text-center pt-2">2:41</div>

              {/* Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">
                  Body <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Scan</span>
                </h2>
                <p className="text-xs text-gray-600 mt-2">{t('home.bodyScanSubtitle')}</p>
              </div>

              {/* Body Composition Analysis Title */}
              <div className="mt-4">
                <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {t('home.bodyScanComposition')}
                </h3>

                {/* Stats Grid 2x2 */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Biological Age - Green */}
                  <div className="water-glass-effect rounded-3xl p-4 border border-gray-200/50">
                    <div className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                      👤 {t('home.bodyScanBiologicalAge').toUpperCase()}
                    </div>
                    <div className="text-3xl font-black text-emerald-600">21</div>
                    <div className="text-xs text-emerald-600 font-semibold">{t('home.bodyScanYears')}</div>
                  </div>

                  {/* Somatotype - Purple */}
                  <div className="water-glass-effect rounded-3xl p-4 border border-gray-200/50">
                    <div className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1">
                      👤 {t('home.bodyScanSomatotype').toUpperCase()}
                    </div>
                    <div className="text-lg font-black text-purple-600">Ectomorph</div>
                  </div>

                  {/* Body Fat - Orange */}
                  <div className="water-glass-effect rounded-3xl p-4 border border-gray-200/50">
                    <div className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1">
                      📊 {t('home.bodyScanBodyFat').toUpperCase()}
                    </div>
                    <div className="text-3xl font-black text-orange-600">19%</div>
                  </div>

                  {/* Definition - Blue */}
                  <div className="water-glass-effect rounded-3xl p-4 border border-gray-200/50">
                    <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
                      📐 {t('home.bodyScanDefinition').toUpperCase()}
                    </div>
                    <div className="text-2xl font-black text-blue-600">78<span className="text-sm">/100</span></div>
                  </div>
                  </div>

                  {/* Areas To Focus */}
                  <div className="mt-4 water-glass-effect rounded-3xl p-4 border border-gray-200/50">
                  <div className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                    ⚡ {t('home.bodyScanAreasToFocus').toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-700">Glutes, lower abs</div>
                  </div>

                  {/* Strengths */}
                  <div className="mt-3 water-glass-effect rounded-3xl p-4 border border-gray-200/50">
                  <div className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                    📈 {t('home.bodyScanStrengths').toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-700">
                    • Toned legs<br/>• Shoulder definition<br/>• Core strength
                  </div>
                  </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}