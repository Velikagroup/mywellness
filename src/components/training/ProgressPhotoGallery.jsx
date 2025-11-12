import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Calendar, TrendingUp, TrendingDown, Minus, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ProgressPhotoGallery({ isOpen, onClose, userId }) {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadPhotos();
    }
  }, [isOpen, userId]);

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const allPhotos = await base44.entities.ProgressPhoto.filter({ user_id: userId });
      // Ordina per data decrescente (più recente prima)
      const sortedPhotos = allPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPhotos(sortedPhotos);
    } catch (error) {
      console.error('Error loading progress photos:', error);
    }
    setIsLoading(false);
  };

  const getComparisonIcon = (result) => {
    if (result === 'improved') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (result === 'regressed') return <TrendingDown className="w-4 h-4 text-red-600" />;
    if (result === 'maintained') return <Minus className="w-4 h-4 text-blue-600" />;
    return null;
  };

  const getComparisonLabel = (result) => {
    const labels = {
      improved: 'Migliorato',
      regressed: 'Regresso',
      maintained: 'Mantenuto',
      first_photo: 'Prima Foto'
    };
    return labels[result] || result;
  };

  const getComparisonColor = (result) => {
    if (result === 'improved') return 'bg-green-50 text-green-700 border-green-200';
    if (result === 'regressed') return 'bg-red-50 text-red-700 border-red-200';
    if (result === 'maintained') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-[var(--brand-primary)]" />
              Galleria Foto Progressi
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nessuna foto di progresso</p>
              <p className="text-sm text-gray-400 mt-2">Carica la tua prima foto per iniziare a tracciare i progressi!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  {photos.length} {photos.length === 1 ? 'foto' : 'foto'} totali
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-[var(--brand-primary)] transition-all cursor-pointer hover:shadow-xl"
                  >
                    <div className="aspect-[3/4] relative">
                      <img
                        src={photo.photo_url}
                        alt={`Foto del ${format(new Date(photo.date), 'd MMMM yyyy', { locale: it })}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(photo.date), 'd MMM yyyy', { locale: it })}
                        </div>
                        {photo.weight && (
                          <span className="text-xs font-semibold text-gray-700">
                            {photo.weight} kg
                          </span>
                        )}
                      </div>

                      {photo.ai_analysis?.comparison_result && photo.ai_analysis.comparison_result !== 'first_photo' && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getComparisonColor(photo.ai_analysis.comparison_result)}`}>
                          {getComparisonIcon(photo.ai_analysis.comparison_result)}
                          <span>{getComparisonLabel(photo.ai_analysis.comparison_result)}</span>
                        </div>
                      )}

                      {photo.ai_analysis?.comparison_result === 'first_photo' && (
                        <div className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-medium">
                          🎯 Foto Iniziale
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Foto del {format(new Date(selectedPhoto.date), 'd MMMM yyyy', { locale: it })}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="aspect-[3/4] max-h-[500px] relative rounded-xl overflow-hidden border-2 border-gray-200">
                <img
                  src={selectedPhoto.photo_url}
                  alt="Progress Photo"
                  className="w-full h-full object-contain bg-gray-50"
                />
              </div>

              {selectedPhoto.weight && (
                <div className="bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 rounded-xl p-4 border-2 border-[var(--brand-primary)]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Peso registrato:</span>
                    <span className="text-2xl font-bold text-[var(--brand-primary)]">
                      {selectedPhoto.weight} kg
                    </span>
                  </div>
                </div>
              )}

              {selectedPhoto.ai_analysis && (
                <div className="space-y-4">
                  {selectedPhoto.ai_analysis.comparison_result && (
                    <div className={`p-4 rounded-xl border-2 ${getComparisonColor(selectedPhoto.ai_analysis.comparison_result)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getComparisonIcon(selectedPhoto.ai_analysis.comparison_result)}
                        <h3 className="font-bold text-lg">
                          {getComparisonLabel(selectedPhoto.ai_analysis.comparison_result)}
                        </h3>
                      </div>
                    </div>
                  )}

                  {selectedPhoto.ai_analysis.visible_improvements?.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">✅ Miglioramenti Visibili:</h4>
                      <ul className="space-y-1">
                        {selectedPhoto.ai_analysis.visible_improvements.map((improvement, idx) => (
                          <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                            <span className="text-green-600">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedPhoto.ai_analysis.visible_regressions?.length > 0 && (
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-2">⚠️ Aree da Migliorare:</h4>
                      <ul className="space-y-1">
                        {selectedPhoto.ai_analysis.visible_regressions.map((regression, idx) => (
                          <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span>{regression}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedPhoto.ai_analysis.overall_assessment && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">📊 Valutazione Complessiva:</h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {selectedPhoto.ai_analysis.overall_assessment}
                      </p>
                    </div>
                  )}

                  {selectedPhoto.ai_analysis.recommendations?.length > 0 && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">💡 Raccomandazioni AI:</h4>
                      <ul className="space-y-1">
                        {selectedPhoto.ai_analysis.recommendations.map((recommendation, idx) => (
                          <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedPhoto.ai_analysis.motivational_message && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-300">
                      <h4 className="font-semibold text-yellow-900 mb-2">💪 Messaggio Motivazionale:</h4>
                      <p className="text-sm text-yellow-800 leading-relaxed italic">
                        "{selectedPhoto.ai_analysis.motivational_message}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedPhoto.notes && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">📝 Note Personali:</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedPhoto.notes}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}