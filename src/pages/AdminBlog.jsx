import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Trash2, Edit, Eye, EyeOff, Loader2, Check, Upload, Globe, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ArticleTranslator from '@/components/admin/ArticleTranslator';

export default function AdminBlog() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bulkTitles, setBulkTitles] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Image-related states removed as per changes.

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin' && currentUser.custom_role !== 'customer_support') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      setUser(currentUser);
      await loadPosts();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
    setIsLoading(false);
  };

  const loadPosts = async () => {
    const allPosts = await base44.entities.BlogPost.list('-created_date', 1000);
    setPosts(allPosts);
  };

  const createSlug = (title) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateArticles = async () => {
    if (!bulkTitles.trim()) {
      alert('Inserisci almeno un titolo!');
      return;
    }

    const titles = bulkTitles.split('\n').filter(t => t.trim());
    if (titles.length === 0) {
      alert('Nessun titolo valido trovato!');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus(`Preparazione generazione di ${titles.length} articoli...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i].trim();
      const progress = Math.round(((i + 1) / titles.length) * 100);
      
      setGenerationStatus(`Generazione ${i + 1}/${titles.length}: "${title.substring(0, 50)}..."`);
      setGenerationProgress(progress);

      try {
        // Check if article with same slug already exists
        const slug = createSlug(title);
        const existing = await base44.entities.BlogPost.filter({ slug });
        if (existing.length > 0) {
          console.log(`Articolo già esistente: ${title}`);
          continue;
        }

        // Generate article content with AI - AI decides category
        const articlePrompt = `Sei un esperto copywriter e content creator per blog di fitness e benessere.

TITOLO ARTICOLO: "${title}"

TASK: Scrivi un articolo completo, professionale e SEO-optimized in ITALIANO.

CATEGORIE DISPONIBILI:
- dimagrimento (perdita peso, calorie, metabolismo)
- nutrizione (dieta, alimentazione, pasti)
- allenamento (esercizi, workout, fitness)
- benessere (stile vita, salute generale)
- motivazione (mindset, costanza, obiettivi)

IMPORTANTE: Scegli la categoria PIÙ APPROPRIATA per questo titolo.

STRUTTURA RICHIESTA:
1. Categoria (scegli tra quelle sopra)
2. Meta Description (150-160 caratteri) - accattivante e ricca di keyword
3. Keywords SEO (5-7 parole chiave)
4. Contenuto completo (1500-2000 parole) in Markdown formattato

LINEE GUIDA CONTENUTO:
- Usa un tono friendly ma autorevole
- Includi sottotitoli (H2, H3) ben strutturati
- Aggiungi liste puntate e numerate dove appropriato
- Inserisci esempi pratici e actionable tips
- Includi call-to-action naturali nel testo
- Usa grassetto per enfatizzare concetti chiave
- Scrivi paragrafi brevi e leggibili (3-4 righe max)

STILE:
- Coinvolgente e motivazionale
- Basato su evidenze scientifiche quando possibile
- Orientato all'azione e ai risultati
- Empatico verso le sfide del lettore

IMPORTANTE: Il contenuto deve essere UNICO, ORIGINALE e di ALTA QUALITÀ.`;

        const articleData = await base44.integrations.Core.InvokeLLM({
          prompt: articlePrompt,
          response_json_schema: {
            type: "object",
            properties: {
              category: { type: "string" },
              meta_description: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              content: { type: "string" },
              reading_time: { type: "number" }
            }
          }
        });

        // Image generation removed as per changes.

        // Create blog post
        await base44.entities.BlogPost.create({
          title: title,
          slug: slug,
          meta_description: articleData.meta_description,
          meta_keywords: articleData.keywords,
          category: articleData.category,
          language: 'it', // Default language is Italian
          reading_time: articleData.reading_time || 5,
          content: articleData.content,
          author: user.full_name || "Team MyWellness",
          published: true,
          views: 0
        });

        successCount++;
        console.log(`✅ Articolo creato: ${title}`);

      } catch (error) {
        console.error(`❌ Errore generazione "${title}":`, error);
        errorCount++;
      }

      // Small delay to avoid rate limits (kept for stability)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setGenerationStatus(`✅ Completato! ${successCount} articoli generati, ${errorCount} errori.`);
    setGenerationProgress(100);
    
    setTimeout(async () => {
      setIsGenerating(false);
      setBulkTitles('');
      await loadPosts();
      setGenerationProgress(0);
      setGenerationStatus('');
    }, 3000);
  };

  const togglePublish = async (postId, currentStatus) => {
    await base44.entities.BlogPost.update(postId, { published: !currentStatus });
    await loadPosts();
  };

  const deletePost = async (postId) => {
    if (confirm('Sei sicuro di voler eliminare questo articolo?')) {
      await base44.entities.BlogPost.delete(postId);
      await loadPosts();
    }
  };

  const deleteItalianDuplicates = async () => {
    if (!confirm('Vuoi eliminare tutte le traduzioni italiane duplicate? (articoli con language=it E original_article_id)')) {
      return;
    }
    
    setIsLoading(true);
    const italianDuplicates = posts.filter(p => p.language === 'it' && p.original_article_id);
    
    console.log(`Trovati ${italianDuplicates.length} duplicati italiani da eliminare`);
    
    for (const post of italianDuplicates) {
      try {
        await base44.entities.BlogPost.delete(post.id);
        console.log(`Eliminato: ${post.title}`);
      } catch (error) {
        console.error(`Errore eliminazione ${post.title}:`, error);
      }
    }
    
    alert(`✅ Eliminati ${italianDuplicates.length} duplicati italiani!`);
    await loadPosts();
    setIsLoading(false);
  };

  const fixItalianLanguage = async () => {
    if (!confirm('Vuoi impostare language="it" su tutti gli articoli originali italiani?')) {
      return;
    }
    
    setIsLoading(true);
    const italianOriginals = posts.filter(p => !p.original_article_id && (!p.language || p.language === 'it'));
    
    console.log(`Trovati ${italianOriginals.length} articoli originali da aggiornare`);
    
    for (const post of italianOriginals) {
      try {
        await base44.entities.BlogPost.update(post.id, { language: 'it' });
        console.log(`Aggiornato: ${post.title}`);
      } catch (error) {
        console.error(`Errore aggiornamento ${post.title}:`, error);
      }
    }
    
    alert(`✅ Aggiornati ${italianOriginals.length} articoli con language="it"!`);
    await loadPosts();
    setIsLoading(false);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    
    try {
      await base44.entities.BlogPost.update(editingPost.id, {
        title: editingPost.title,
        content: editingPost.content,
        meta_description: editingPost.meta_description,
        category: editingPost.category,
      });
      
      await loadPosts();
      setEditingPost(null);
      alert('✅ Articolo aggiornato con successo!');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Errore durante l\'aggiornamento');
    }
  };

  // handleRegenerateImage and handleRegenerateAllImages functions removed as per changes.

  const categories = {
    dimagrimento: { label: 'Dimagrimento', icon: '🔥' },
    nutrizione: { label: 'Nutrizione', icon: '🥗' },
    allenamento: { label: 'Allenamento', icon: '💪' },
    benessere: { label: 'Benessere', icon: '✨' },
    motivazione: { label: 'Motivazione', icon: '🎯' }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  // Separate Italian articles from translations
  const italianPosts = posts.filter(p => p.language === 'it' || !p.language);
  const translatedPosts = posts.filter(p => p.language && p.language !== 'it');

  const stats = {
    total: posts.length,
    italian: italianPosts.length,
    translations: translatedPosts.length,
    published: posts.filter(p => p.published).length,
    drafts: posts.filter(p => !p.published).length,
    views: posts.reduce((sum, p) => sum + (p.views || 0), 0)
  };

  const languageFlags = {
    it: '🇮🇹',
    en: '🇬🇧',
    es: '🇪🇸',
    pt: '🇧🇷',
    de: '🇩🇪',
    fr: '🇫🇷'
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Blog</h1>
            <p className="text-gray-600">Gestisci articoli e traduzioni del blog</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fixItalianLanguage} variant="outline" className="text-green-600 hover:bg-green-50">
              <CheckCircle className="w-4 h-4 mr-2" />
              Fix Language IT
            </Button>
            <Button onClick={deleteItalianDuplicates} variant="outline" className="text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina Duplicati IT
            </Button>
            <Button onClick={() => navigate(createPageUrl('itblog'))} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Vedi Blog IT
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-8">
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Totale</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">🇮🇹 Italiani</p>
              <p className="text-2xl font-bold text-blue-600">{stats.italian}</p>
            </CardContent>
          </Card>
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">🌍 Traduzioni</p>
              <p className="text-2xl font-bold text-purple-600">{stats.translations}</p>
            </CardContent>
          </Card>
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Pubblicati</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </CardContent>
          </Card>
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Bozze</p>
              <p className="text-2xl font-bold text-orange-600">{stats.drafts}</p>
            </CardContent>
          </Card>
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Views</p>
              <p className="text-2xl font-bold text-gray-600">{stats.views}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="articles" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="articles">📝 Articoli Italiani</TabsTrigger>
            <TabsTrigger value="translations">🌍 Traduzioni</TabsTrigger>
          </TabsList>

          <TabsContent value="translations">
            <ArticleTranslator posts={posts} onRefresh={loadPosts} />
          </TabsContent>

          <TabsContent value="articles">
        {/* Edit Modal */}
        {editingPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white">
              <CardHeader>
                <CardTitle>Modifica Articolo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titolo</Label>
                  <Input
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Categoria</Label>
                  <select
                    value={editingPost.category}
                    onChange={(e) => setEditingPost({...editingPost, category: e.target.value})}
                    className="w-full mt-2 p-2 border rounded-md"
                  >
                    {Object.entries(categories).map(([key, cat]) => (
                      <option key={key} value={key}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Textarea
                    value={editingPost.meta_description}
                    onChange={(e) => setEditingPost({...editingPost, meta_description: e.target.value})}
                    rows={2}
                    className="mt-2"
                  />
                </div>

                {/* "Immagine in evidenza" section removed */}

                <div>
                  <Label>Contenuto (Markdown)</Label>
                  <Textarea
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                    rows={20}
                    className="mt-2 font-mono text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSaveEdit} className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">
                    <Check className="w-4 h-4 mr-2" />
                    Salva Modifiche
                  </Button>
                  <Button onClick={() => setEditingPost(null)} variant="outline" className="flex-1">
                    Annulla
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Generation */}
        {!isGenerating ? (
          <Card className="mt-8 water-glass-effect border-gray-200/30 shadow-xl">
            <CardHeader>
              <CardTitle>📝 Generazione Articoli in Bulk</CardTitle>
              <p className="text-sm text-gray-500">Inserisci un titolo per riga. L'AI genererà automaticamente contenuto + categoria per ogni articolo.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={bulkTitles}
                onChange={(e) => setBulkTitles(e.target.value)}
                placeholder="Inserisci i titoli, uno per riga&#10;&#10;Esempio:&#10;Come iniziare un percorso di dimagrimento senza stress&#10;Da dove partire se vuoi perdere peso&#10;I 5 errori che ti impediscono di dimagrire"
                rows={12}
                className="font-mono text-sm"
              />

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {bulkTitles.split('\n').filter(t => t.trim()).length} titoli rilevati
                </p>
                <Button
                  onClick={generateArticles}
                  disabled={!bulkTitles.trim()}
                  size="lg"
                  className="bg-[#26847F] hover:bg-[#1f6b66] text-white px-8 py-6 text-lg font-semibold shadow-lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Genera Articoli con AI
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8 water-glass-effect border-gray-200/30 shadow-xl">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-[var(--brand-primary-light)] rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Generazione in corso...</h3>
              <p className="text-gray-600">{generationStatus}</p>
              <Progress value={generationProgress} className="w-full" />
              <p className="text-sm text-gray-500">{generationProgress}% completato</p>
            </CardContent>
          </Card>
        )}

        {/* Articles List - Only Italian */}
        <Card className="mt-8 water-glass-effect border-gray-200/30 shadow-xl">
          <CardHeader>
            <CardTitle>🇮🇹 Articoli Italiani ({italianPosts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="🔍 Cerca articolo per titolo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              {italianPosts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nessun articolo ancora. Inizia a generare!</p>
              ) : (
                italianPosts
                  .filter(post => 
                    post.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => {
                    const viewsA = a.views || 0;
                    const viewsB = b.views || 0;
                    if (viewsB !== viewsA) {
                      return viewsB - viewsA;
                    }
                    return a.title.localeCompare(b.title);
                  })
                  .map(post => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 water-glass-effect border-gray-200/30 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇮🇹</span>
                          <h3 className="font-semibold text-gray-900">{post.title}</h3>
                          {post.published ? (
                            <Badge className="bg-green-100 text-green-700">Pubblicato</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700">Bozza</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {categories[post.category]?.icon} {categories[post.category]?.label} • {post.views || 0} visualizzazioni
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => window.open(`/itblog/${post.slug}`, '_blank')}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleEditPost(post)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => togglePublish(post.id, post.published)}
                        size="sm"
                        variant="outline"
                        className={post.published ? 'text-orange-600' : 'text-green-600'}
                      >
                        {post.published ? <EyeOff className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={() => deletePost(post.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}