import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ScanLine, Calendar, TrendingUp, TrendingDown, Percent, Activity, Cake, User, Layers, Eye, Droplets } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function BodyScanPage() {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Body Scan</h1>
        <p className="text-gray-600">Monitora i tuoi progressi fisici nel tempo</p>
      </div>

      {/* Latest Scan */}
      {latestScan ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-4"
        >
          {/* Header con data */}
          <div className="water-glass-effect rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-gray-700" />
                <h2 className="font-bold text-gray-900 text-lg">Ultima Scansione Corporea</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(latestScan.created_date), 'dd/MM/yyyy')}</span>
              </div>
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
                    Vista Frontale
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden water-glass-effect">
                  <img 
                    src={latestScan.side_photo_url} 
                    className="w-full h-64 object-cover" 
                    alt="Side" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-2 text-center">
                    Vista Laterale
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
                      Vista Posteriore
                    </div>
                  </div>
                )}
              </div>

              {/* Metriche Scientifiche Primarie */}
              <div>
                <div className="water-glass-effect rounded-2xl p-4 mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Analisi Composizione Corporea
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Età Biologica - PIÙ IN RISALTO */}
                  <div className="water-glass-effect rounded-2xl p-5 border-2 border-green-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Cake className="w-5 h-5 text-green-700" />
                      <p className="text-xs text-green-800 font-bold uppercase tracking-wide">Età Biologica</p>
                    </div>
                    <p className="text-4xl font-black text-green-700">{latestScan.body_age_estimate} <span className="text-lg text-green-600">anni</span></p>
                  </div>

                  {/* Somatotipo */}
                  <div className="water-glass-effect rounded-2xl p-5 border-2 border-purple-400/20">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-purple-700" />
                      <p className="text-xs text-purple-800 font-bold uppercase tracking-wide">Somatotipo</p>
                    </div>
                    <p className="text-3xl font-black text-purple-700 capitalize break-words">{latestScan.somatotype}</p>
                  </div>

                  {/* Body Fat */}
                  <div className="water-glass-effect rounded-2xl p-5 border-2 border-orange-400/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-5 h-5 text-orange-700" />
                      <p className="text-xs text-orange-800 font-bold uppercase tracking-wide">Body Fat %</p>
                    </div>
                    <p className="text-3xl font-black text-orange-700">{latestScan.body_fat_percentage}%</p>
                  </div>

                  {/* Definizione */}
                  <div className="water-glass-effect rounded-2xl p-5 border-2 border-blue-400/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-5 h-5 text-blue-700" />
                      <p className="text-xs text-blue-800 font-bold uppercase tracking-wide">Definizione</p>
                    </div>
                    <p className="text-3xl font-black text-blue-700">{latestScan.muscle_definition_score}<span className="text-base text-blue-600">/100</span></p>
                  </div>
                </div>
              </div>

              {/* Metriche Secondarie */}
              {(latestScan.skin_texture || latestScan.skin_tone || latestScan.swelling_percentage !== undefined) && (
                <div>
                  <div className="water-glass-effect rounded-2xl p-4 mb-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Analisi Tessutale
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {latestScan.skin_texture && (() => {
                      const goodTextures = ['liscia', 'uniforme', 'sana', 'elastica', 'idratata', 'smooth', 'healthy'];
                      const badTextures = ['ruvida', 'danneggiata', 'secca', 'irregolare', 'rough', 'damaged', 'dry'];
                      const isGood = goodTextures.some(t => latestScan.skin_texture.toLowerCase().includes(t));
                      const isBad = badTextures.some(t => latestScan.skin_texture.toLowerCase().includes(t));
                      const bgColor = isGood ? 'bg-green-50' : isBad ? 'bg-red-50' : 'bg-gray-50';
                      const textColor = isGood ? 'text-green-700' : isBad ? 'text-red-700' : 'text-gray-900';
                      const borderColor = isGood ? 'border-green-200' : isBad ? 'border-red-200' : 'border-gray-200';
                      
                      return (
                        <div className={`water-glass-effect rounded-2xl p-3 text-center ${bgColor} border-2 ${borderColor}`}>
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
                      const bgColor = isGood ? 'bg-green-50' : isBad ? 'bg-red-50' : 'bg-gray-50';
                      const textColor = isGood ? 'text-green-700' : isBad ? 'text-red-700' : 'text-gray-900';
                      const borderColor = isGood ? 'border-green-200' : isBad ? 'border-red-200' : 'border-gray-200';
                      
                      return (
                        <div className={`water-glass-effect rounded-2xl p-3 text-center ${bgColor} border-2 ${borderColor}`}>
                          <p className="text-xs text-gray-700 mb-1 font-semibold">Tono Cutaneo</p>
                          <p className={`text-sm font-bold ${textColor}`}>{latestScan.skin_tone}</p>
                        </div>
                      );
                    })()}
                    {latestScan.swelling_percentage !== undefined && (() => {
                      const percentage = latestScan.swelling_percentage;
                      const isGood = percentage <= 20;
                      const isBad = percentage > 40;
                      const bgColor = isGood ? 'bg-green-50' : isBad ? 'bg-red-50' : 'bg-yellow-50';
                      const textColor = isGood ? 'text-green-700' : isBad ? 'text-red-700' : 'text-yellow-700';
                      const iconColor = isGood ? 'text-green-600' : isBad ? 'text-red-600' : 'text-yellow-600';
                      const borderColor = isGood ? 'border-green-200' : isBad ? 'border-red-200' : 'border-yellow-200';
                      
                      return (
                        <div className={`water-glass-effect rounded-2xl p-3 text-center ${bgColor} border-2 ${borderColor}`}>
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
              {latestScan.posture_assessment && (
                <div className="water-glass-effect rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">📊 Valutazione Posturale</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{latestScan.posture_assessment}</p>
                </div>
              )}

              {/* Aree Problematiche e Punti di Forza */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestScan.problem_areas && latestScan.problem_areas.length > 0 && (
                  <div className="water-glass-effect rounded-2xl p-4 border-2 border-red-400/20">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Aree Critiche
                    </p>
                    <ul className="space-y-1">
                      {latestScan.problem_areas.map((area, idx) => (
                        <li key={idx} className="text-sm text-gray-700">• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestScan.strong_areas && latestScan.strong_areas.length > 0 && (
                  <div className="water-glass-effect rounded-2xl p-4 border-2 border-green-400/20">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Punti di Forza
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
          <p className="text-gray-600 text-lg mb-2">Nessun Body Scan ancora</p>
          <p className="text-gray-500 text-sm">Usa il pulsante + in basso per fare la tua prima scansione</p>
        </div>
      )}

      {/* Storico */}
      {olderScans.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Storico Scansioni</h2>
          <div className="space-y-3">
            <AnimatePresence>
              {olderScans.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all"
                >
                  <button
                    onClick={() => setExpandedHistoryId(expandedHistoryId === scan.id ? null : scan.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <img 
                      src={scan.front_photo_url} 
                      className="w-20 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-200" 
                      alt="Front" 
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-2">
                        {format(new Date(scan.created_date), 'dd MMMM yyyy', { locale: it })}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
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
                        <div className="flex items-center gap-1">
                          <Cake className="w-3 h-3 text-green-600" />
                          <span className="text-green-600 font-semibold">{scan.body_age_estimate}y</span>
                        </div>
                      </div>
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
                                Frontale
                              </div>
                            </div>
                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                              <img src={scan.side_photo_url} className="w-full h-48 object-cover" alt="Side" />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-1.5 text-center">
                                Laterale
                              </div>
                            </div>
                            {scan.back_photo_url && (
                              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                <img src={scan.back_photo_url} className="w-full h-48 object-cover" alt="Back" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-1.5 text-center">
                                  Posteriore
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-1 mb-1">
                                  <User className="w-3 h-3 text-purple-600" />
                                  <p className="text-xs text-gray-600">Somatotipo</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900 capitalize">{scan.somatotype}</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-1 mb-1">
                                  <Percent className="w-3 h-3 text-orange-600" />
                                  <p className="text-xs text-gray-600">Body Fat</p>
                                </div>
                                <p className="text-lg font-bold text-orange-600">{scan.body_fat_percentage}%</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-1 mb-1">
                                  <Layers className="w-3 h-3 text-blue-600" />
                                  <p className="text-xs text-gray-600">Definizione</p>
                                </div>
                                <p className="text-lg font-bold text-blue-600">{scan.muscle_definition_score}/100</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-1 mb-1">
                                  <Cake className="w-3 h-3 text-green-600" />
                                  <p className="text-xs text-gray-600">Età Bio.</p>
                                </div>
                                <p className="text-lg font-bold text-green-600">{scan.body_age_estimate}y</p>
                              </div>
                            </div>

                            {scan.posture_assessment && (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Postura</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{scan.posture_assessment}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              {scan.problem_areas && scan.problem_areas.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Aree Critiche</p>
                                  <ul className="space-y-1">
                                    {scan.problem_areas.map((area, idx) => (
                                      <li key={idx} className="text-sm text-red-800">• {area}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {scan.strong_areas && scan.strong_areas.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Punti di Forza</p>
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
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}