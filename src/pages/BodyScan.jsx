import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ScanLine, Calendar, TrendingUp, TrendingDown, Percent, Activity, Cake, User, Layers, Eye, Droplets } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function BodyScanPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [bodyScanHistory, setBodyScanHistory] = useState([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const history = await base44.entities.BodyScanResult.filter(
        { user_id: currentUser.id },
        '-created_date'
      );
      setBodyScanHistory(history);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const latestScan = bodyScanHistory[0];
  const olderScans = bodyScanHistory.slice(1);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      {/* Header */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&display=swap');
        
        .animated-text-gradient {
          background: linear-gradient(90deg, #26847F, #14b8a6, #10b981, #14b8a6, #26847F);
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textGradientFlow 4s ease-in-out infinite;
        }

        @keyframes textGradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="mb-12 text-center">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-4 tracking-tight leading-[1.1]">
          Body <span className="animated-text-gradient">Scan</span>
        </h1>
        <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
          {t('bodyScan.subtitle')}
        </p>
      </div>

      {/* Latest Scan */}
      {latestScan ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-4"
        >
          {/* Header con data */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-gray-700" />
              <h2 className="font-bold text-gray-900 text-base">{t('bodyScan.latestScan')}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(latestScan.created_date), 'dd/MM/yyyy')}</span>
            </div>
          </div>

          <div className="space-y-4">
              {/* Foto */}
              <div className="grid grid-cols-3 gap-4">
                <div className="relative rounded-2xl overflow-hidden water-glass-effect">
                  <img 
                    src={latestScan.front_photo_url} 
                    className="w-full h-64 object-cover" 
                    alt="Front" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-2 text-center">
                    {t('bodyScan.frontView')}
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden water-glass-effect">
                  <img 
                    src={latestScan.side_photo_url} 
                    className="w-full h-64 object-cover" 
                    alt="Side" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-2 text-center">
                    {t('bodyScan.sideView')}
                  </div>
                </div>
                {latestScan.back_photo_url && (
                  <div className="relative rounded-2xl overflow-hidden water-glass-effect">
                    <img 
                      src={latestScan.back_photo_url} 
                      className="w-full h-64 object-cover" 
                      alt="Back" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-2 text-center">
                      {t('bodyScan.backView')}
                    </div>
                  </div>
                )}
              </div>

              {/* Metriche Scientifiche Primarie */}
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5" />
                  {t('bodyScan.bodyComposition')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Età Biologica - PIÙ IN RISALTO */}
                  <div className="bg-green-100/60 backdrop-blur-md rounded-2xl p-5 border-2 border-green-400">
                    <div className="flex items-center gap-2 mb-2">
                      <Cake className="w-5 h-5 text-green-700" />
                      <p className="text-xs text-green-800 font-bold uppercase tracking-wide">{t('bodyScan.biologicalAge')}</p>
                    </div>
                    <p className="text-4xl font-black text-green-700">{latestScan.body_age_estimate} <span className="text-lg text-green-600">{t('bodyScan.years')}</span></p>
                  </div>

                  {/* Somatotipo */}
                  <div className="bg-purple-100/60 backdrop-blur-md rounded-2xl p-5 border-2 border-purple-400">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-purple-700" />
                      <p className="text-xs text-purple-800 font-bold uppercase tracking-wide">{t('bodyScan.somatotype')}</p>
                    </div>
                    <p className="text-2xl font-black text-purple-700 capitalize break-words">{latestScan.somatotype}</p>
                  </div>

                  {/* Body Fat */}
                  <div className="bg-orange-100/60 backdrop-blur-md rounded-2xl p-5 border-2 border-orange-400">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-5 h-5 text-orange-700" />
                      <p className="text-xs text-orange-800 font-bold uppercase tracking-wide">{t('bodyScan.bodyFat')}</p>
                    </div>
                    <p className="text-3xl font-black text-orange-700">{latestScan.body_fat_percentage}%</p>
                  </div>

                  {/* Definizione */}
                  <div className="bg-blue-100/60 backdrop-blur-md rounded-2xl p-5 border-2 border-blue-400">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-5 h-5 text-blue-700" />
                      <p className="text-xs text-blue-800 font-bold uppercase tracking-wide">{t('bodyScan.muscleDefinition')}</p>
                    </div>
                    <p className="text-3xl font-black text-blue-700">{latestScan.muscle_definition_score}<span className="text-base text-blue-600">/100</span></p>
                  </div>
                </div>
              </div>

              {/* Metriche Secondarie */}
              {(latestScan.skin_texture || latestScan.skin_tone || latestScan.swelling_percentage !== undefined) && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5" />
                    {t('bodyScan.tissueAnalysis')}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {latestScan.skin_texture && (() => {
                      const goodTextures = ['liscia', 'uniforme', 'sana', 'elastica', 'idratata', 'smooth', 'healthy'];
                      const badTextures = ['ruvida', 'danneggiata', 'secca', 'irregolare', 'rough', 'damaged', 'dry'];
                      const isGood = goodTextures.some(t => latestScan.skin_texture.toLowerCase().includes(t));
                      const isBad = badTextures.some(t => latestScan.skin_texture.toLowerCase().includes(t));
                      const bgStyle = isGood 
                        ? 'bg-green-100/60 backdrop-blur-md' 
                        : isBad 
                        ? 'bg-red-100/60 backdrop-blur-md' 
                        : 'water-glass-effect';
                      const textColor = isGood ? 'text-green-700' : isBad ? 'text-red-700' : 'text-gray-900';
                      const borderColor = isGood ? 'border-green-300' : isBad ? 'border-red-300' : 'border-gray-200';
                      
                      return (
                        <div className={`rounded-2xl p-3 text-center ${bgStyle} border-2 ${borderColor}`}>
                          <p className="text-xs text-gray-700 mb-1 font-semibold">Texture Pelle</p>
                          <p className={`text-sm font-bold ${textColor}`}>{latestScan.skin_texture}</p>
                        </div>
                      );
                    })()}
                    {latestScan.skin_tone && (() => {
                      const goodTones = ['uniforme', 'sano', 'equilibrato', 'normale', 'healthy', 'even', 'balanced'];
                      const badTones = ['irregolare', 'disomogeneo', 'spento', 'pallido', 'uneven', 'dull', 'unbalanced'];
                      const isGood = goodTones.some(t => latestScan.skin_tone.toLowerCase().includes(t));
                      const isBad = badTones.some(t => latestScan.skin_tone.toLowerCase().includes(t));
                      const bgStyle = isGood 
                        ? 'bg-green-100/60 backdrop-blur-md' 
                        : isBad 
                        ? 'bg-red-100/60 backdrop-blur-md' 
                        : 'water-glass-effect';
                      const textColor = isGood ? 'text-green-700' : isBad ? 'text-red-700' : 'text-gray-900';
                      const borderColor = isGood ? 'border-green-300' : isBad ? 'border-red-300' : 'border-gray-200';
                      
                      return (
                        <div className={`rounded-2xl p-3 text-center ${bgStyle} border-2 ${borderColor}`}>
                          <p className="text-xs text-gray-700 mb-1 font-semibold">Tono Cutaneo</p>
                          <p className={`text-sm font-bold ${textColor}`}>{latestScan.skin_tone}</p>
                        </div>
                      );
                    })()}
                    {latestScan.swelling_percentage !== undefined && (() => {
                      const percentage = latestScan.swelling_percentage;
                      const isGood = percentage <= 20;
                      const isBad = percentage > 40;
                      const bgStyle = isGood 
                        ? 'bg-green-100/60 backdrop-blur-md' 
                        : isBad 
                        ? 'bg-red-100/60 backdrop-blur-md' 
                        : 'bg-yellow-100/60 backdrop-blur-md';
                      const textColor = isGood ? 'text-green-700' : isBad ? 'text-red-700' : 'text-yellow-700';
                      const iconColor = isGood ? 'text-green-600' : isBad ? 'text-red-600' : 'text-yellow-600';
                      const borderColor = isGood ? 'border-green-300' : isBad ? 'border-red-300' : 'border-yellow-300';
                      
                      return (
                        <div className={`rounded-2xl p-3 text-center ${bgStyle} border-2 ${borderColor}`}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Droplets className={`w-3 h-3 ${iconColor}`} />
                            <p className="text-xs text-gray-700 font-semibold">Gonfiore</p>
                          </div>
                          <p className={`text-sm font-bold ${textColor}`}>{percentage}%</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Postura */}
              {latestScan.posture_assessment && (() => {
                const goodPosture = ['buona', 'corretta', 'ottima', 'equilibrata', 'allineata', 'good', 'correct', 'excellent', 'aligned'];
                const badPosture = ['scorretta', 'sbagliata', 'problematica', 'curva', 'cifosi', 'lordosi', 'scoliosi', 'poor', 'incorrect', 'bad'];
                const isGood = goodPosture.some(p => latestScan.posture_assessment.toLowerCase().includes(p));
                const isBad = badPosture.some(p => latestScan.posture_assessment.toLowerCase().includes(p));
                const bgStyle = isGood 
                  ? 'bg-green-100/60 backdrop-blur-md' 
                  : isBad 
                  ? 'bg-red-100/60 backdrop-blur-md' 
                  : 'water-glass-effect';
                const borderColor = isGood ? 'border-green-300' : isBad ? 'border-red-300' : 'border-gray-200';
                
                return (
                  <div className={`rounded-2xl p-4 ${bgStyle} border-2 ${borderColor}`}>
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">📊 {t('bodyScan.posturalAssessment')}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{latestScan.posture_assessment}</p>
                  </div>
                );
              })()}

              {/* Aree Problematiche e Punti di Forza */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestScan.problem_areas && latestScan.problem_areas.length > 0 && (
                  <div className="bg-red-100/60 backdrop-blur-md rounded-2xl p-4 border-2 border-red-400">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      {t('bodyScan.criticalAreas')}
                    </p>
...
                  </div>
                )}

                {latestScan.strong_areas && latestScan.strong_areas.length > 0 && (
                  <div className="bg-green-100/60 backdrop-blur-md rounded-2xl p-4 border-2 border-green-400">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {t('bodyScan.strengths')}
                    </p>
                    <ul className="space-y-1">
                      {latestScan.strong_areas.map((area, idx) => (
                        <li key={idx} className="text-sm text-gray-700">• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-8">
          <ScanLine className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg mb-2">{t('bodyScan.noBodyScan')}</p>
          <p className="text-gray-500 text-sm">{t('bodyScan.useButtonBelow')}</p>
        </div>
      )}

      {/* Storico */}
      {olderScans.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('bodyScan.scanHistory')}</h2>
          <div className="space-y-3">
            <AnimatePresence>
              {olderScans.map((scan, index) => {
                // Compara con la scansione precedente
                const previousScan = index > 0 ? olderScans[index - 1] : latestScan;
                const ageChange = previousScan.body_age_estimate - scan.body_age_estimate; // positivo = miglioramento
                const fatChange = previousScan.body_fat_percentage - scan.body_fat_percentage; // positivo = miglioramento
                const muscleChange = scan.muscle_definition_score - previousScan.muscle_definition_score; // positivo = miglioramento
                const improvementScore = ageChange * 0.3 + fatChange * 0.35 + muscleChange * 0.35;
                
                let bgColor = 'bg-white';
                let borderColor = 'border-gray-200';
                let progressColor = 'text-gray-700';
                let progressIcon = null;
                let progressLabel = t('bodyScan.stable');
                
                if (improvementScore > 2) {
                  bgColor = 'bg-green-50';
                  borderColor = 'border-green-300';
                  progressColor = 'text-green-700';
                  progressIcon = TrendingUp;
                  progressLabel = `${t('bodyScan.improved')} ${improvementScore.toFixed(1)}`;
                } else if (improvementScore < -2) {
                  bgColor = 'bg-red-50';
                  borderColor = 'border-red-300';
                  progressColor = 'text-red-700';
                  progressIcon = TrendingDown;
                  progressLabel = `${t('bodyScan.declined')} ${Math.abs(improvementScore).toFixed(1)}`;
                }
                
                return (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`water-glass-effect border-2 ${borderColor} rounded-xl overflow-hidden hover:shadow-lg transition-all ${bgColor}`}
                >
                  <button
                    onClick={() => setExpandedHistoryId(expandedHistoryId === scan.id ? null : scan.id)}
                    className={`w-full flex items-center gap-4 p-4 transition-colors text-left ${bgColor === 'bg-green-50' ? 'hover:bg-green-100' : bgColor === 'bg-red-50' ? 'hover:bg-red-100' : 'hover:bg-gray-50'}`}
                  >
                    <img 
                      src={scan.front_photo_url} 
                      className="w-20 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-200" 
                      alt="Front" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 justify-between">
                        <div className="flex items-center gap-2">
                          <Cake className="w-5 h-5 text-green-600" />
                          <span className="font-bold text-gray-900 text-lg">{scan.body_age_estimate}y</span>
                        </div>
                        {progressIcon && React.createElement(progressIcon, { className: `w-5 h-5 ${progressColor}` })}
                        <p className="text-xs text-gray-500">
                          {format(new Date(scan.created_date), 'dd MMM', { locale: it })}
                        </p>
                      </div>
                      {(improvementScore !== 0) && (
                        <div className={`text-xs font-bold ${progressColor} mb-2`}>
                          {progressLabel}
                        </div>
                      )}
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs mb-2">
                        <div className="flex items-center gap-1">
                          <Percent className="w-3 h-3 text-orange-600" />
                          <span className="text-orange-600 font-semibold">{scan.body_fat_percentage}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-600 font-semibold">{scan.muscle_definition_score}/100</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-purple-600" />
                          <span className="text-purple-600 font-semibold capitalize">{scan.somatotype}</span>
                        </div>
                      </div>
                      {(scan.skin_texture || scan.skin_tone || scan.swelling_percentage !== undefined) && (
                        <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-gray-300">
                          {scan.skin_texture && (
                            <div className="flex flex-col">
                              <p className="text-gray-500 text-xs mb-1">{t('bodyScan.texture')}</p>
                              <span className="text-gray-700 font-semibold truncate">{scan.skin_texture}</span>
                            </div>
                          )}
                          {scan.skin_tone && (
                            <div className="flex flex-col">
                              <p className="text-gray-500 text-xs mb-1">{t('bodyScan.tone')}</p>
                              <span className="text-gray-700 font-semibold truncate">{scan.skin_tone}</span>
                            </div>
                          )}
                          {scan.swelling_percentage !== undefined && (
                            <div className="flex flex-col">
                              <p className="text-gray-500 text-xs mb-1">{t('bodyScan.swelling')}</p>
                              <span className="text-gray-700 font-semibold">{scan.swelling_percentage}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                        expandedHistoryId === scan.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedHistoryId === scan.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                              <img src={scan.front_photo_url} className="w-full h-48 object-cover" alt="Front" />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-1.5 text-center">
                                {t('bodyScan.frontView')}
                              </div>
                            </div>
                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                              <img src={scan.side_photo_url} className="w-full h-48 object-cover" alt="Side" />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-1.5 text-center">
                                {t('bodyScan.sideView')}
                              </div>
                            </div>
                            {scan.back_photo_url && (
                              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                <img src={scan.back_photo_url} className="w-full h-48 object-cover" alt="Back" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-1.5 text-center">
                                  {t('bodyScan.backView')}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-1 mb-1">
                                  <User className="w-3 h-3 text-purple-600" />
                                  <p className="text-xs text-gray-600">{t('bodyScan.somatotype')}</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900 capitalize">{scan.somatotype}</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-1 mb-1">
                                  <Percent className="w-3 h-3 text-orange-600" />
                                  <p className="text-xs text-gray-600">{t('bodyScan.bodyFat')}</p>
                                </div>
                                <p className="text-lg font-bold text-orange-600">{scan.body_fat_percentage}%</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-1 mb-1">
                                  <Layers className="w-3 h-3 text-blue-600" />
                                  <p className="text-xs text-gray-600">{t('bodyScan.muscleDefinition')}</p>
                                </div>
                                <p className="text-lg font-bold text-blue-600">{scan.muscle_definition_score}/100</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-1 mb-1">
                                  <Cake className="w-3 h-3 text-green-600" />
                                  <p className="text-xs text-gray-600">{t('bodyScan.biologicalAge')}</p>
                                </div>
                                <p className="text-lg font-bold text-green-600">{scan.body_age_estimate}y</p>
                              </div>
                            </div>

                            {scan.posture_assessment && (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">{t('bodyScan.posturalAssessment')}</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{scan.posture_assessment}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              {scan.problem_areas && scan.problem_areas.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">{t('bodyScan.criticalAreas')}</p>
...
                                </div>
                              )}
                              {scan.strong_areas && scan.strong_areas.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">{t('bodyScan.strengths')}</p>
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
                      </motion.div>
                      )}
                      </AnimatePresence>
                      </motion.div>
                      );
                      })}
                      </AnimatePresence>
                      </div>
                      </div>
                      )}
                      </div>
                      );
                      }