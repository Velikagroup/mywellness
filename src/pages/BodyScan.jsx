import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ScanLine, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
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
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-[#26847F]">
            <div className="bg-gradient-to-r from-[#26847F] to-[#3fb8af] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <ScanLine className="w-5 h-5" />
                  <p className="font-semibold">Ultima Scansione</p>
                </div>
                <div className="flex items-center gap-2 text-white text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(latestScan.created_date), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Foto */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <img 
                  src={latestScan.front_photo_url} 
                  className="w-full h-56 object-cover rounded-lg" 
                  alt="Front" 
                />
                <img 
                  src={latestScan.side_photo_url} 
                  className="w-full h-56 object-cover rounded-lg" 
                  alt="Side" 
                />
              </div>

              {/* Metriche */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Somatotipo</p>
                  <p className="text-xl font-bold text-purple-900 capitalize">{latestScan.somatotype}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Massa Grassa</p>
                  <p className="text-xl font-bold text-orange-900">{latestScan.body_fat_percentage}%</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Definizione</p>
                  <p className="text-xl font-bold text-blue-900">{latestScan.muscle_definition_score}/100</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Età Biologica</p>
                  <p className="text-xl font-bold text-green-900">{latestScan.body_age_estimate} anni</p>
                </div>
              </div>

              {/* Postura */}
              {latestScan.posture_assessment && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Valutazione Posturale</p>
                  <p className="text-sm text-blue-900 leading-relaxed">{latestScan.posture_assessment}</p>
                </div>
              )}

              {/* Aree Problematiche e Punti di Forza */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestScan.problem_areas && latestScan.problem_areas.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Aree da Migliorare
                    </p>
                    <ul className="space-y-1">
                      {latestScan.problem_areas.map((area, idx) => (
                        <li key={idx} className="text-sm text-red-800">• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestScan.strong_areas && latestScan.strong_areas.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Punti di Forza
                    </p>
                    <ul className="space-y-1">
                      {latestScan.strong_areas.map((area, idx) => (
                        <li key={idx} className="text-sm text-green-800">• {area}</li>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Storico Scansioni</h2>
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
                      className="w-16 h-20 object-cover rounded-lg flex-shrink-0" 
                      alt="Front" 
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">
                        {format(new Date(scan.created_date), 'dd MMMM yyyy', { locale: it })}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-600 mt-1">
                        <span>BF: {scan.body_fat_percentage}%</span>
                        <span>Def: {scan.muscle_definition_score}/100</span>
                        <span className="capitalize">{scan.somatotype}</span>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedHistoryId === scan.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedHistoryId === scan.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <img src={scan.front_photo_url} className="w-full h-48 object-cover rounded-lg" alt="Front" />
                        <img src={scan.side_photo_url} className="w-full h-48 object-cover rounded-lg" alt="Side" />
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Somatotipo</p>
                            <p className="text-xl font-bold text-gray-900 capitalize">{scan.somatotype}</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Massa Grassa</p>
                            <p className="text-xl font-bold text-gray-900">{scan.body_fat_percentage}%</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Definizione</p>
                            <p className="text-xl font-bold text-gray-900">{scan.muscle_definition_score}/100</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Età Biologica</p>
                            <p className="text-xl font-bold text-gray-900">{scan.body_age_estimate} anni</p>
                          </div>
                        </div>

                        {scan.posture_assessment && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Postura</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{scan.posture_assessment}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          {scan.problem_areas && scan.problem_areas.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2">Aree da Migliorare</p>
                              <ul className="space-y-1">
                                {scan.problem_areas.map((area, idx) => (
                                  <li key={idx} className="text-sm text-red-800">• {area}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {scan.strong_areas && scan.strong_areas.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">Punti di Forza</p>
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
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}