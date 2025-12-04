import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Calendar, TrendingUp, TrendingDown, Trash2, Utensils, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { it, enUS, es, pt, de, fr } from 'date-fns/locale';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProgressPhotoGallery({ isOpen, onClose, photos, onDeletePhoto }) {
  const { t, language } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = React.useState(null);
  
  const localeMap = { it, en: enUS, es, pt, de, fr };
  const dateLocale = localeMap[language] || enUS;

  const BODY_PHOTO_LABELS = {
    'front': { label: t('bodyPhotos.front'), icon: '⬆️' },
    'side_left': { label: t('bodyPhotos.sideLeft'), icon: '⬅️' },
    'side_right': { label: t('bodyPhotos.sideRight'), icon: '➡️' },
    'back': { label: t('bodyPhotos.back'), icon: '⬇️' }
  };

  if (!isOpen) return null;

  // Filtra solo le foto che hanno un URL valido
  const validPhotos = photos.filter(p => p.photo_url && p.photo_url.trim() !== '');
  const sortedPhotos = [...validPhotos].sort((a, b) => new Date(b.date) - new Date(a.date));

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
            📸 {t('upgradeModal.progressGalleryTitle')}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {sortedPhotos.length} {sortedPhotos.length === 1 ? t('upgradeModal.photoUploaded') : t('upgradeModal.photosUploaded')}
          </p>
        </DialogHeader>

        {sortedPhotos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">{t('upgradeModal.noPhotos')}</p>
            <p className="text-sm text-gray-400 mt-2">{t('upgradeModal.startTracking')}</p>
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
                    alt={`Progress ${format(new Date(photo.date), 'dd MMM yyyy', { locale: dateLocale })}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {photo.ai_analysis?.comparison_result && photo.ai_analysis.comparison_result !== 'first_photo' && (
                    <div className={`absolute top-2 right-2 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1 ${
                      photo.ai_analysis.comparison_result === 'improved' ? 'bg-green-500/90 text-white' :
                      photo.ai_analysis.comparison_result === 'regressed' ? 'bg-red-500/90 text-white' :
                      'bg-blue-500/90 text-white'
                    }`}>
                      {getComparisonIcon(photo.ai_analysis.comparison_result)}
                      <span className="text-xs font-bold uppercase">
                        {photo.ai_analysis.comparison_result === 'improved' ? t('upgradeModal.improved') :
                         photo.ai_analysis.comparison_result === 'regressed' ? t('upgradeModal.regressed') :
                         t('upgradeModal.stable')}
                      </span>
                    </div>
                  )}

                  {photo.ai_analysis?.comparison_result === 'first_photo' && (
                    <div className="absolute top-2 right-2 px-3 py-1.5 rounded-full bg-purple-500/90 text-white backdrop-blur-md">
                      <span className="text-xs font-bold">🎯 {t('upgradeModal.firstPhoto')}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {format(new Date(photo.date), 'dd MMMM yyyy', { locale: dateLocale })}
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

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t('upgradeModal.deleteConfirm'))) {
                      onDeletePhoto(photo.id);
                    }
                  }}
                  className="absolute top-2 left-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all"
                  title={t('upgradeModal.deletePhoto')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  📸 {format(new Date(selectedPhoto.date), 'dd MMMM yyyy', { locale: dateLocale })}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    🎯 {t('upgradeModal.analyzedZone')} {selectedPhoto.ai_analysis?.target_zone || 'N/A'}
                  </h3>
                  <div className="relative">
                    <img
                      src={selectedPhoto.photo_url}
                      alt="Progress detail"
                      className="w-full max-h-[400px] object-contain rounded-lg border-2 border-gray-200"
                    />
                    {selectedPhoto.weight && (
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                        <span className="font-bold text-gray-900">⚖️ {selectedPhoto.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPhoto.ai_analysis?.body_photo_urls && Object.keys(selectedPhoto.ai_analysis.body_photo_urls).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      📁 {t('upgradeModal.bodyArchive')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(selectedPhoto.ai_analysis.body_photo_urls).map(([photoType, photoUrl]) => {
                        const photoInfo = BODY_PHOTO_LABELS[photoType] || { label: photoType, icon: '📷' };
                        return (
                          <div key={photoType} className="relative group">
                            <div className="aspect-[3/4] relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all">
                              <img
                                src={photoUrl}
                                alt={photoInfo.label}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <p className="text-white text-xs font-semibold text-center">
                                  {photoInfo.icon} {photoInfo.label}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedPhoto.ai_analysis && (
                  <div className="space-y-4">
                    {/* 🔥 CONFRONTO PRIMA VS DOPO - SEZIONE PROMINENTE */}
                    {selectedPhoto.ai_analysis.comparison_with_previous && selectedPhoto.ai_analysis.comparison_result !== 'first_photo' && (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-300 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-bold text-indigo-900 text-base">
                            📊 {t('upgradeModal.beforeAfterComparison')} {selectedPhoto.ai_analysis.days_since_previous && `(${selectedPhoto.ai_analysis.days_since_previous} ${t('upgradeModal.daysAgo')})`}
                          </h4>
                        </div>
                        <div className="bg-white/60 p-4 rounded-lg">
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                            {selectedPhoto.ai_analysis.comparison_with_previous}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className={`rounded-xl p-4 border-2 ${getComparisonColor(selectedPhoto.ai_analysis.comparison_result)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getComparisonIcon(selectedPhoto.ai_analysis.comparison_result)}
                        <h4 className="font-bold text-gray-900">{t('upgradeModal.generalEvaluation')}</h4>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedPhoto.ai_analysis.overall_assessment}
                      </p>
                    </div>

                    {selectedPhoto.ai_analysis.visible_characteristics?.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">{t('upgradeModal.observedCharacteristics')}</h4>
                        <ul className="space-y-1">
                          {selectedPhoto.ai_analysis.visible_characteristics.map((char, idx) => (
                            <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                              <span className="text-blue-600">✓</span>{char}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedPhoto.ai_analysis.visible_differences?.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">{t('upgradeModal.observedDifferences')}</h4>
                        <ul className="space-y-1">
                          {selectedPhoto.ai_analysis.visible_differences.map((diff, idx) => (
                            <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                              <span className="text-yellow-600">↔️</span>{diff}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedPhoto.ai_analysis.nutrition_recommendations?.length > 0 && (
                      <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                        <h4 className="font-bold text-orange-900 mb-2 text-sm flex items-center gap-2">
                          <Utensils className="w-4 h-4" />
                          🍽️ {t('progressAnalyzer.nutritionRecommendations')}
                        </h4>
                        <ul className="space-y-1">
                          {selectedPhoto.ai_analysis.nutrition_recommendations.map((rec, idx) => (
                            <li key={idx} className="text-xs text-orange-800 flex gap-2"><span>→</span><span>{rec}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedPhoto.ai_analysis.workout_recommendations?.length > 0 && (
                      <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-300">
                        <h4 className="font-bold text-indigo-900 mb-2 text-sm flex items-center gap-2">
                          <Dumbbell className="w-4 h-4" />
                          💪 {t('progressAnalyzer.workoutRecommendations')}
                        </h4>
                        <ul className="space-y-1">
                          {selectedPhoto.ai_analysis.workout_recommendations.map((rec, idx) => (
                            <li key={idx} className="text-xs text-indigo-800 flex gap-2"><span>→</span><span>{rec}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedPhoto.ai_analysis.recommendations?.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-2">💡 {t('upgradeModal.aiRecommendations')}</h4>
                        <ul className="space-y-1">
                          {selectedPhoto.ai_analysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                              <span className="text-purple-600">→</span>{rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedPhoto.ai_analysis.applied_changes && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">✅ {t('upgradeModal.appliedChanges')}</h4>
                        {selectedPhoto.ai_analysis.applied_changes.diet?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-green-800 mb-1">🍽️ {t('upgradeModal.diet')}</p>
                            <ul className="space-y-0.5">
                              {selectedPhoto.ai_analysis.applied_changes.diet.map((change, idx) => (
                                <li key={idx} className="text-xs text-green-700">• {change}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedPhoto.ai_analysis.applied_changes.workout?.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-green-800 mb-1">💪 {t('upgradeModal.workout')}</p>
                            <ul className="space-y-0.5">
                              {selectedPhoto.ai_analysis.applied_changes.workout.map((change, idx) => (
                                <li key={idx} className="text-xs text-green-700">• {change}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedPhoto.ai_analysis.motivational_message && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                        <p className="text-purple-900 font-medium text-center italic">
                          💪 {selectedPhoto.ai_analysis.motivational_message}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedPhoto.notes && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">📝 {t('upgradeModal.personalNotes')}</h4>
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