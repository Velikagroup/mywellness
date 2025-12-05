import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Languages, Check, X, Globe, ChevronDown, ChevronUp } from 'lucide-react';

const LANGUAGES = [
{ code: 'it', name: 'Italiano', flag: '🇮🇹' },
{ code: 'en', name: 'English', flag: '🇬🇧' },
{ code: 'es', name: 'Español', flag: '🇪🇸' },
{ code: 'pt', name: 'Português', flag: '🇧🇷' },
{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
{ code: 'fr', name: 'Français', flag: '🇫🇷' }];


export default function ArticleTranslator({ posts, onRefresh }) {
  const [expandedArticle, setExpandedArticle] = useState(null);
  const [translatingArticle, setTranslatingArticle] = useState(null);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translationStatus, setTranslationStatus] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState(['en', 'es', 'pt', 'de', 'fr']);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, article: '' });

  // Get only Italian articles (original articles)
  const italianArticles = posts.filter((p) => p.language === 'it' || !p.language);

  // Get translations for an article
  const getTranslationsForArticle = (articleId) => {
    return posts.filter((p) => p.original_article_id === articleId);
  };

  // Check which languages are already translated
  const getTranslatedLanguages = (articleId) => {
    const translations = getTranslationsForArticle(articleId);
    return translations.map((t) => t.language);
  };

  const createSlug = (title, langCode) => {
    const baseSlug = title.
    toLowerCase().
    normalize('NFD').
    replace(/[\u0300-\u036f]/g, '').
    replace(/[^a-z0-9]+/g, '-').
    replace(/^-+|-+$/g, '');
    return baseSlug;
  };

  const translateArticle = async (article, targetLang) => {
    const langName = LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;

    try {
      const translationPrompt = `Traduci questo articolo di blog in ${langName}.

TITOLO ORIGINALE: "${article.title}"

META DESCRIPTION ORIGINALE: "${article.meta_description}"

CONTENUTO ORIGINALE:
${article.content}

IMPORTANTE:
- Mantieni la stessa struttura Markdown
- Mantieni lo stesso tono e stile
- Traduci tutto inclusi i titoli, sottotitoli e call-to-action
- La traduzione deve essere naturale, non letterale
- Mantieni le keyword SEO appropriate per la lingua target`;

      const translatedData = await base44.integrations.Core.InvokeLLM({
        prompt: translationPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            meta_description: { type: "string" },
            content: { type: "string" },
            keywords: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Create translated article
      await base44.entities.BlogPost.create({
        title: translatedData.title,
        slug: createSlug(translatedData.title, targetLang),
        meta_description: translatedData.meta_description,
        meta_keywords: translatedData.keywords || article.meta_keywords,
        category: article.category,
        language: targetLang,
        original_article_id: article.id,
        reading_time: article.reading_time,
        content: translatedData.content,
        author: article.author,
        published: true,
        views: 0
      });

      return true;
    } catch (error) {
      console.error(`Error translating to ${targetLang}:`, error);
      return false;
    }
  };

  const translateToAllLanguages = async (article) => {
    const existingTranslations = getTranslatedLanguages(article.id);
    const languagesToTranslate = selectedLanguages.filter(
      (lang) => !existingTranslations.includes(lang) && lang !== 'it'
    );

    if (languagesToTranslate.length === 0) {
      alert('Tutte le lingue selezionate sono già tradotte!');
      return;
    }

    setTranslatingArticle(article.id);
    setTranslationProgress(0);
    setTranslationStatus(`Preparazione traduzione...`);

    let successCount = 0;

    for (let i = 0; i < languagesToTranslate.length; i++) {
      const lang = languagesToTranslate[i];
      const langName = LANGUAGES.find((l) => l.code === lang)?.name;

      setTranslationStatus(`Traduzione in ${langName}... (${i + 1}/${languagesToTranslate.length})`);
      setTranslationProgress(Math.round((i + 1) / languagesToTranslate.length * 100));

      const success = await translateArticle(article, lang);
      if (success) successCount++;

      // Small delay between translations
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setTranslationStatus(`✅ Completato! ${successCount}/${languagesToTranslate.length} traduzioni create.`);

    setTimeout(() => {
      setTranslatingArticle(null);
      setTranslationProgress(0);
      setTranslationStatus('');
      onRefresh();
    }, 2000);
  };

  const translateSingleLanguage = async (article, targetLang) => {
    setTranslatingArticle(article.id);
    setTranslationStatus(`Traduzione in ${LANGUAGES.find((l) => l.code === targetLang)?.name}...`);
    setTranslationProgress(50);

    const success = await translateArticle(article, targetLang);

    if (success) {
      setTranslationStatus('✅ Traduzione completata!');
      setTranslationProgress(100);
    } else {
      setTranslationStatus('❌ Errore durante la traduzione');
    }

    setTimeout(() => {
      setTranslatingArticle(null);
      setTranslationProgress(0);
      setTranslationStatus('');
      onRefresh();
    }, 2000);
  };

  const deleteTranslation = async (translationId) => {
    if (confirm('Sei sicuro di voler eliminare questa traduzione?')) {
      await base44.entities.BlogPost.delete(translationId);
      onRefresh();
    }
  };

  const filteredArticles = italianArticles.filter((article) =>
  article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Translate all articles to all selected languages
  const translateAllArticles = async () => {
    // Get articles that need translation
    const articlesToTranslate = filteredArticles.filter(article => {
      const existingTranslations = getTranslatedLanguages(article.id);
      const missingLangs = selectedLanguages.filter(
        lang => !existingTranslations.includes(lang) && lang !== 'it'
      );
      return missingLangs.length > 0;
    });

    if (articlesToTranslate.length === 0) {
      alert('Tutti gli articoli sono già tradotti nelle lingue selezionate!');
      return;
    }

    if (!confirm(`Stai per tradurre ${articlesToTranslate.length} articoli in ${selectedLanguages.length} lingue. Questa operazione può richiedere diversi minuti. Continuare?`)) {
      return;
    }

    setBulkTranslating(true);
    setBulkProgress({ current: 0, total: articlesToTranslate.length, article: '' });

    let totalSuccess = 0;
    let totalFailed = 0;

    try {
      for (let i = 0; i < articlesToTranslate.length; i++) {
        const article = articlesToTranslate[i];
        const existingTranslations = getTranslatedLanguages(article.id);
        const languagesToTranslate = selectedLanguages.filter(
          lang => !existingTranslations.includes(lang) && lang !== 'it'
        );

        setBulkProgress({
          current: i + 1,
          total: articlesToTranslate.length,
          article: article.title.substring(0, 50) + (article.title.length > 50 ? '...' : '')
        });

        for (const lang of languagesToTranslate) {
          const success = await translateArticle(article, lang);
          if (success) totalSuccess++;
          else totalFailed++;
          
          // Delay between translations to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      alert(`✅ Traduzione completata!\n${totalSuccess} traduzioni create\n${totalFailed} errori`);
    } catch (error) {
      console.error('Bulk translation error:', error);
      alert(`⚠️ Errore durante la traduzione.\n${totalSuccess} traduzioni completate prima dell'errore.`);
    } finally {
      setBulkTranslating(false);
      setBulkProgress({ current: 0, total: 0, article: '' });
      onRefresh();
    }
  };

  return (
    <Card className="water-glass-effect border-gray-200/30 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-[var(--brand-primary)]" />
            <CardTitle>Traduzioni Articoli</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Lingue target:</span>
            {LANGUAGES.filter((l) => l.code !== 'it').map((lang) =>
            <button
              key={lang.code}
              onClick={() => {
                if (selectedLanguages.includes(lang.code)) {
                  setSelectedLanguages(selectedLanguages.filter((l) => l !== lang.code));
                } else {
                  setSelectedLanguages([...selectedLanguages, lang.code]);
                }
              }}
              className={`text-xl p-1 rounded transition-all ${
              selectedLanguages.includes(lang.code) ?
              'bg-[var(--brand-primary-light)] ring-2 ring-[var(--brand-primary)]' :
              'opacity-40 hover:opacity-70'}`
              }
              title={lang.name}>

                {lang.flag}
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Gestisci le traduzioni degli articoli in 6 lingue. Gli articoli originali sono in italiano.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Translation Button */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 rounded-xl border border-[var(--brand-primary)]/20">
          <div>
            <h4 className="font-semibold text-gray-900">🚀 Traduzione di Massa</h4>
            <p className="text-sm text-gray-600">
              Traduci tutti gli articoli italiani nelle lingue selezionate
            </p>
          </div>
          <Button
            onClick={translateAllArticles}
            disabled={bulkTranslating || filteredArticles.length === 0}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
          >
            {bulkTranslating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Traduzione in corso...
              </>
            ) : (
              <>
                <Languages className="w-4 h-4 mr-2" />
                Traduci Tutti ({filteredArticles.length})
              </>
            )}
          </Button>
        </div>

        {/* Bulk Progress */}
        {bulkTranslating && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">
                Articolo {bulkProgress.current}/{bulkProgress.total}
              </span>
              <span className="text-sm text-blue-600">
                {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
              </span>
            </div>
            <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2 mb-2" />
            <p className="text-xs text-blue-600 truncate">📝 {bulkProgress.article}</p>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Cerca articolo italiano da tradurre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border rounded-lg" />


        {/* Articles List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredArticles.length === 0 ?
          <p className="text-center text-gray-500 py-8">
              Nessun articolo italiano trovato. Genera prima gli articoli in italiano.
            </p> :

          filteredArticles.map((article) => {
            const translations = getTranslationsForArticle(article.id);
            const translatedLangs = translations.map((t) => t.language);
            const isExpanded = expandedArticle === article.id;
            const isTranslating = translatingArticle === article.id;

            return (
              <div
                key={article.id}
                className="border rounded-lg overflow-hidden bg-white/50">

                  {/* Article Header */}
                  <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedArticle(isExpanded ? null : article.id)}>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇮🇹</span>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {article.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {LANGUAGES.filter((l) => l.code !== 'it').map((lang) =>
                        <span
                          key={lang.code}
                          className={`text-lg ${
                          translatedLangs.includes(lang.code) ?
                          '' :
                          'opacity-30'}`
                          }
                          title={translatedLangs.includes(lang.code) ? `${lang.name} ✓` : `${lang.name} - da tradurre`}>

                              {lang.flag}
                            </span>
                        )}
                          <span className="text-xs text-gray-500 ml-2">
                            {translations.length}/5 traduzioni
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isTranslating ?
                      <Loader2 className="w-5 h-5 text-[var(--brand-primary)] animate-spin" /> :

                      <>
                            <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            translateToAllLanguages(article);
                          }}
                          size="sm" className="bg-slate-900 text-primary-foreground px-3 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-8 hover:bg-[var(--brand-primary-hover)]"

                          disabled={translations.length >= 5}>

                              <Languages className="w-4 h-4 mr-1" />
                              Traduci Tutte
                            </Button>
                            {isExpanded ?
                        <ChevronUp className="w-5 h-5 text-gray-400" /> :

                        <ChevronDown className="w-5 h-5 text-gray-400" />
                        }
                          </>
                      }
                      </div>
                    </div>

                    {/* Translation Progress */}
                    {isTranslating &&
                  <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-600">{translationStatus}</p>
                        <Progress value={translationProgress} className="h-2" />
                      </div>
                  }
                  </div>

                  {/* Expanded Section */}
                  {isExpanded && !isTranslating &&
                <div className="border-t bg-gray-50/50 p-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Gestione Traduzioni:</p>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {LANGUAGES.filter((l) => l.code !== 'it').map((lang) => {
                      const translation = translations.find((t) => t.language === lang.code);
                      const hasTranslation = !!translation;

                      return (
                        <div
                          key={lang.code}
                          className={`p-3 rounded-lg border ${
                          hasTranslation ?
                          'bg-green-50 border-green-200' :
                          'bg-white border-gray-200'}`
                          }>

                              <div className="flex items-center justify-between mb-2">
                                <span className="text-lg">{lang.flag}</span>
                                {hasTranslation ?
                            <Check className="w-4 h-4 text-green-600" /> :

                            <X className="w-4 h-4 text-gray-300" />
                            }
                              </div>
                              <p className="text-xs font-medium text-gray-700">{lang.name}</p>
                              
                              {hasTranslation ?
                          <div className="mt-2 space-y-1">
                                  <Button
                              onClick={() => window.open(`/${lang.code}blog/${translation.slug}`, '_blank')}
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-7">

                                    Vedi
                                  </Button>
                                  <Button
                              onClick={() => deleteTranslation(translation.id)}
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-7 text-red-600 hover:bg-red-50">

                                    Elimina
                                  </Button>
                                </div> :

                          <Button
                            onClick={() => translateSingleLanguage(article, lang.code)}
                            size="sm"
                            className="w-full mt-2 text-xs h-7 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">

                                  Traduci
                                </Button>
                          }
                            </div>);

                    })}
                      </div>
                    </div>
                }
                </div>);

          })
          }
        </div>
      </CardContent>
    </Card>);

}