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
          className="mb-8"
        >
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            {/* Header con data */}
            <div className="p-4 border-b border-gray-200">
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

            <div className="p-6">
              {/* Foto */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={latestScan.front_photo_url} 
                    className="w-full h-64 object-cover" 
                    alt="Front" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-2 text-center">
                    Vista Frontale
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={latestScan.side_photo_url} 
                    className="w-full h-64 object-cover" 
                    alt="Side" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-2 text-center">
                    Vista Laterale
                  </div>
                </div>
              </div>

              {/* Metriche Scientifiche Primarie */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Analisi Composizione Corporea
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-gray-600">Somatotipo</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900 capitalize">{latestScan.somatotype}</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="w-4 h-4 text-orange-600" />
                      <p className="text-xs text-gray-600">Body Fat %</p>
                    </div>
                    <p className="text-xl font-bold text-orange-600">{latestScan.body_fat_percentage}%</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600">Definizione</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{latestScan.muscle_definition_score}<span className="text-sm text-gray-500">/100</span></p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Cake className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-gray-600">Età Biologica</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">{latestScan.body_age_estimate} <span className="text-sm text-gray-500">anni</span></p>
                  </div>
                </div>
              </div>

              {/* Metriche Secondarie */}
              {(latestScan.skin_texture || latestScan.skin_tone || latestScan.swelling_percentage !== undefined) && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Analisi Tessutale
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {latestScan.skin_texture && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Texture Pelle</p>
                        <p className="text-sm font-bold text-gray-900">{latestScan.skin_texture}</p>
                      </div>
                    )}
                    {latestScan.skin_tone && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Tono Cutaneo</p>
                        <p className="text-sm font-bold text-gray-900">{latestScan.skin_tone}</p>
                      </div>
                    )}
                    {latestScan.swelling_percentage !== undefined && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Droplets className="w-3 h-3 text-blue-500" />
                          <p className="text-xs text-gray-600">Gonfiore</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{latestScan.swelling_percentage}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Postura */}
              {latestScan.posture_assessment && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">📊 Valutazione Posturale</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{latestScan.posture_assessment}</p>
                </div>
              )}

              {/* Aree Problematiche e Punti di Forza */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {latestScan.problem_areas && latestScan.problem_areas.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
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
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
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
                          <div className="grid grid-cols-2 gap-3 mb-4">
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