import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Calendar, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ProgressPhotoGallery({ isOpen, onClose, photos, onDeletePhoto }) {
  const [selectedPhoto, setSelectedPhoto] = React.useState(null);

  if (!isOpen) return null;

  const sortedPhotos = [...photos].sort((a, b) => new Date(b.date) - new Date(a.date));

  const getComparisonIcon = (result) => {
    if (result === 'improved') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (result === 'regressed') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getComparisonColor = (result) => {
    if (result === 'improved') return 'border-green-300 bg-green-50';
    if (result === 'regressed') return 'border-red-300 bg-red-50';
    if (result === 'maintained') return 'border-blue-300 bg-blue-50';
    return 'border-gray-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📸 Galleria Progressi
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {sortedPhotos.length} {sortedPhotos.length === 1 ? 'foto caricata' : 'foto caricate'}
          </p>
        </DialogHeader>

        {sortedPhotos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Nessuna foto ancora caricata</p>
            <p className="text-sm text-gray-400 mt-2">Inizia a tracciare i tuoi progressi!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPhotos.map((photo) => (
              <div
                key={photo.id}
                className={`relative rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg cursor-pointer ${getComparisonColor(photo.ai_analysis?.comparison_result)}`}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={photo.photo_url}
                    alt={`Progress ${format(new Date(photo.date), 'dd MMM yyyy', { locale: it })}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badge Risultato */}
                  {photo.ai_analysis?.comparison_result && photo.ai_analysis.comparison_result !== 'first_photo' && (
                    <div className={`absolute top-2 right-2 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1 ${
                      photo.ai_analysis.comparison_result === 'improved' ? 'bg-green-500/90 text-white' :
                      photo.ai_analysis.comparison_result === 'regressed' ? 'bg-red-500/90 text-white' :
                      'bg-blue-500/90 text-white'
                    }`}>
                      {getComparisonIcon(photo.ai_analysis.comparison_result)}
                      <span className="text-xs font-bold uppercase">
                        {photo.ai_analysis.comparison_result === 'improved' ? 'Migliorato' :
                         photo.ai_analysis.comparison_result === 'regressed' ? 'Peggiorato' :
                         'Stabile'}
                      </span>
                    </div>
                  )}

                  {photo.ai_analysis?.comparison_result === 'first_photo' && (
                    <div className="absolute top-2 right-2 px-3 py-1.5 rounded-full bg-purple-500/90 text-white backdrop-blur-md">
                      <span className="text-xs font-bold">🎯 PRIMA FOTO</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {format(new Date(photo.date), 'dd MMMM yyyy', { locale: it })}
                    </p>
                    {photo.weight && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-medium text-gray-700">
                        {photo.weight} kg
                      </span>
                    )}
                  </div>
                  {photo.notes && (
                    <p className="text-xs text-gray-600 line-clamp-2">{photo.notes}</p>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Vuoi davvero eliminare questa foto?')) {
                      onDeletePhoto(photo.id);
                    }
                  }}
                  className="absolute top-2 left-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all"
                  title="Elimina foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Detail View Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  📸 {format(new Date(selectedPhoto.date), 'dd MMMM yyyy', { locale: it })}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="relative">
                  <img
                    src={selectedPhoto.photo_url}
                    alt="Progress detail"
                    className="w-full max-h-[500px] object-contain rounded-lg border-2 border-gray-200"
                  />
                  {selectedPhoto.weight && (
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                      <span className="font-bold text-gray-900">⚖️ {selectedPhoto.weight} kg</span>
                    </div>
                  )}
                </div>

                {selectedPhoto.ai_analysis && (
                  <div className="space-y-4">
                    {/* Overall Assessment */}
                    <div className={`rounded-xl p-4 border-2 ${getComparisonColor(selectedPhoto.ai_analysis.comparison_result)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getComparisonIcon(selectedPhoto.ai_analysis.comparison_result)}
                        <h4 className="font-bold text-gray-900">Valutazione Generale</h4>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedPhoto.ai_analysis.overall_assessment}
                      </p>
                    </div>

                    {/* Visible Improvements */}
                    {selectedPhoto.ai_analysis.visible_improvements?.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Miglioramenti Visibili
                        </h4>
                        <ul className="space-y-1">
                          {selectedPhoto.ai_analysis.visible_improvements.map((improvement, idx) => (
                            <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                              <span className="text-green-600">✓</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Visible Regressions */}
                    {selectedPhoto.ai_analysis.visible_regressions?.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                          <TrendingDown className="w-4 h-4" />
                          Aree da Migliorare
                        </h4>
                        <ul className="space-y-1">
                          {selectedPhoto.ai_analysis.visible_regressions.map((regression, idx) => (
                            <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                              <span className="text-red-600">•</span>
                              {regression}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {selectedPhoto.ai_analysis.recommendations?.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">💡 Raccomandazioni AI</h4>
                        <ul className="space-y-1">
                          {selectedPhoto.ai_analysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                              <span className="text-blue-600">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Motivational Message */}
                    {selectedPhoto.ai_analysis.motivational_message && (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <p className="text-purple-900 font-medium text-center">
                          💪 {selectedPhoto.ai_analysis.motivational_message}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedPhoto.notes && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">📝 Note Personali</h4>
                    <p className="text-gray-700 text-sm">{selectedPhoto.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}