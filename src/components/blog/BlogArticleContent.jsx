import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/components/i18n/LanguageContext';

// Map language code to blog page name
const getBlogPageName = (langCode) => {
  const langBlogPages = {
    'en': 'blog',
    'it': 'itblog',
    'es': 'esblog',
    'pt': 'ptblog',
    'de': 'deblog',
    'fr': 'frblog'
  };
  return langBlogPages[langCode] || 'blog';
};

const getPricingPageName = (langCode) => {
  const langPricingPages = {
    'en': 'pricing',
    'it': 'itpricing',
    'es': 'espricing',
    'pt': 'ptpricing',
    'de': 'depricing',
    'fr': 'frpricing'
  };
  return langPricingPages[langCode] || 'pricing';
};

const getQuizPageUrl = (langCode) => {
  const langQuizPages = {
    'en': '/Quiz',
    'it': '/ItQuiz',
    'es': '/EsQuiz',
    'pt': '/PtQuiz',
    'de': '/DeQuiz',
    'fr': '/FrQuiz'
  };
  return langQuizPages[langCode] || '/Quiz';
};

// Translations
const articleTranslations = {
  it: {
    backToBlog: 'Torna al Blog',
    minRead: 'min',
    writtenBy: 'Scritto da',
    startJourney: 'Inizia il Tuo Percorso Gratuito',
    floatingCta: '🎯 Realizza il tuo piano personalizzato',
    pricing: 'Prezzi',
    blog: 'Blog',
    login: 'Accedi',
    freeQuiz: 'Quiz Gratuito',
    categories: {
      dimagrimento: 'Dimagrimento',
      nutrizione: 'Nutrizione',
      allenamento: 'Allenamento',
      benessere: 'Benessere',
      motivazione: 'Motivazione'
    }
  },
  en: {
    backToBlog: 'Back to Blog',
    minRead: 'min',
    writtenBy: 'Written by',
    startJourney: 'Start Your Free Journey',
    floatingCta: '🎯 Get your personalized plan',
    pricing: 'Pricing',
    blog: 'Blog',
    login: 'Login',
    freeQuiz: 'Free Quiz',
    categories: {
      dimagrimento: 'Weight Loss',
      nutrizione: 'Nutrition',
      allenamento: 'Training',
      benessere: 'Wellness',
      motivazione: 'Motivation'
    }
  },
  es: {
    backToBlog: 'Volver al Blog',
    minRead: 'min',
    writtenBy: 'Escrito por',
    startJourney: 'Comienza Tu Viaje Gratis',
    floatingCta: '🎯 Obtén tu plan personalizado',
    pricing: 'Precios',
    blog: 'Blog',
    login: 'Iniciar sesión',
    freeQuiz: 'Quiz Gratis',
    categories: {
      dimagrimento: 'Adelgazamiento',
      nutrizione: 'Nutrición',
      allenamento: 'Entrenamiento',
      benessere: 'Bienestar',
      motivazione: 'Motivación'
    }
  },
  pt: {
    backToBlog: 'Voltar ao Blog',
    minRead: 'min',
    writtenBy: 'Escrito por',
    startJourney: 'Comece Sua Jornada Grátis',
    floatingCta: '🎯 Obtenha seu plano personalizado',
    pricing: 'Preços',
    blog: 'Blog',
    login: 'Entrar',
    freeQuiz: 'Quiz Grátis',
    categories: {
      dimagrimento: 'Emagrecimento',
      nutrizione: 'Nutrição',
      allenamento: 'Treino',
      benessere: 'Bem-estar',
      motivazione: 'Motivação'
    }
  },
  de: {
    backToBlog: 'Zurück zum Blog',
    minRead: 'Min',
    writtenBy: 'Geschrieben von',
    startJourney: 'Starte Deine Kostenlose Reise',
    floatingCta: '🎯 Hol dir deinen personalisierten Plan',
    pricing: 'Preise',
    blog: 'Blog',
    login: 'Anmelden',
    freeQuiz: 'Kostenloses Quiz',
    categories: {
      dimagrimento: 'Abnehmen',
      nutrizione: 'Ernährung',
      allenamento: 'Training',
      benessere: 'Wohlbefinden',
      motivazione: 'Motivation'
    }
  },
  fr: {
    backToBlog: 'Retour au Blog',
    minRead: 'min',
    writtenBy: 'Écrit par',
    startJourney: 'Commencez Votre Parcours Gratuit',
    floatingCta: '🎯 Obtenez votre plan personnalisé',
    pricing: 'Tarifs',
    blog: 'Blog',
    login: 'Connexion',
    freeQuiz: 'Quiz Gratuit',
    categories: {
      dimagrimento: 'Minceur',
      nutrizione: 'Nutrition',
      allenamento: 'Entraînement',
      benessere: 'Bien-être',
      motivazione: 'Motivation'
    }
  }
};

export default function BlogArticleContent({ slug }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = articleTranslations[language] || articleTranslations.en;
  
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileLangMenuOpen, setMobileLangMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) {
      loadArticle();
    }
  }, [slug, language]);

  const loadArticle = async () => {
    try {
      if (!slug) {
        navigate(createPageUrl(getBlogPageName(language)));
        return;
      }

      // Try to find article by slug and language
      let articles = await base44.entities.BlogPost.filter({ slug, language, published: true });
      
      // If not found with language, try without language filter (for backward compatibility)
      if (articles.length === 0) {
        articles = await base44.entities.BlogPost.filter({ slug, published: true });
      }
      
      if (articles.length > 0) {
        setArticle(articles[0]);
        // Views update requires admin - skip for public users
        try {
          await base44.entities.BlogPost.update(articles[0].id, { views: (articles[0].views || 0) + 1 });
        } catch (viewsError) {
          // Ignore views update error for non-admin users
        }
      } else {
        navigate(createPageUrl(getBlogPageName(language)));
      }
    } catch (error) {
      console.error('Error loading article:', error);
      navigate(createPageUrl(getBlogPageName(language)));
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    const checkoutUrl = window.location.origin + createPageUrl('Checkout') + '?plan=base';
    await base44.auth.redirectToLogin(checkoutUrl);
  };

  const handleLanguageChange = (newLang) => {
    setLangMenuOpen(false);
    setMobileLangMenuOpen(false);
    // Navigate to the blog page for the new language
    window.location.href = createPageUrl(getBlogPageName(newLang));
  };

  const getCategoryInfo = (categoryId) => {
    const categories = {
      dimagrimento: { label: t.categories.dimagrimento, icon: '🔥', color: 'bg-red-100 text-red-700' },
      nutrizione: { label: t.categories.nutrizione, icon: '🥗', color: 'bg-green-100 text-green-700' },
      allenamento: { label: t.categories.allenamento, icon: '💪', color: 'bg-blue-100 text-blue-700' },
      benessere: { label: t.categories.benessere, icon: '✨', color: 'bg-purple-100 text-purple-700' },
      motivazione: { label: t.categories.motivazione, icon: '🎯', color: 'bg-orange-100 text-orange-700' }
    };
    return categories[categoryId] || { label: categoryId, icon: '📄', color: 'bg-gray-100 text-gray-700' };
  };

  const getDateLocale = () => {
    const locales = {
      it: 'it-IT',
      en: 'en-US',
      es: 'es-ES',
      pt: 'pt-BR',
      de: 'de-DE',
      fr: 'fr-FR'
    };
    return locales[language] || 'en-US';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  if (!article) return null;

  const categoryInfo = getCategoryInfo(article.category);
  const formattedDate = new Date(article.created_date).toLocaleDateString(getDateLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen pb-32" style={{ background: '#ffffff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * { font-family: 'Inter', sans-serif; }
        
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
        }
        
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, rgba(249, 250, 251, 0.75) 0%, rgba(243, 244, 246, 0.65) 50%, rgba(249, 250, 241, 0.75) 100%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        .burger-line { display: block; width: 24px; height: 2px; background-color: #4b5563; transition: all 0.3s ease; position: absolute; left: 0; }
        .burger-container { position: relative; width: 24px; height: 10px; }
        .burger-line:first-child { top: 0; }
        .burger-line:last-child { bottom: 0; }
        .burger-open .burger-line:first-child { top: 4px; transform: rotate(45deg); }
        .burger-open .burger-line:last-child { bottom: 4px; transform: rotate(-45deg); }
        .mobile-menu { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out; }
        .mobile-menu.open { max-height: 400px; }

        .cta-floating { animation: pulseGlow 2s ease-in-out infinite; }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(38, 132, 127, 0.4), 0 0 40px rgba(38, 132, 127, 0.2); }
          50% { box-shadow: 0 0 30px rgba(38, 132, 127, 0.6), 0 0 60px rgba(38, 132, 127, 0.3); }
        }

        .article-content { color: #1f2937; line-height: 1.8; }
        .article-content h1, .article-content h2, .article-content h3, .article-content h4 { font-weight: 700; color: #111827; margin-top: 2.5rem; margin-bottom: 1.25rem; line-height: 1.3; }
        .article-content h1 { font-size: 2.25rem; }
        .article-content h2 { font-size: 1.875rem; }
        .article-content h3 { font-size: 1.5rem; }
        .article-content h4 { font-size: 1.25rem; }
        .article-content p { margin-bottom: 1.5rem; font-size: 1.125rem; }
        .article-content ul, .article-content ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
        .article-content li { margin-bottom: 0.75rem; font-size: 1.125rem; }
        .article-content strong { font-weight: 700; color: #111827; }
        .article-content em { font-style: italic; }
        .article-content a { color: var(--brand-primary); text-decoration: underline; }
        .article-content a:hover { color: var(--brand-primary-hover); }
        .article-content blockquote { border-left: 4px solid var(--brand-primary); padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #4b5563; background: var(--brand-primary-light); padding: 1.5rem; border-radius: 0.5rem; }
        .article-content code { background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.875rem; font-family: 'Courier New', monospace; }
        .article-content pre { background: #1f2937; color: #f9fafb; padding: 1.5rem; border-radius: 0.75rem; overflow-x: auto; margin: 2rem 0; }
        .article-content pre code { background: transparent; padding: 0; color: inherit; }
        .article-content img { max-width: 100%; height: auto; border-radius: 1rem; margin: 2rem 0; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
        .article-content hr { border: none; border-top: 2px solid #e5e7eb; margin: 3rem 0; }
      `}</style>

      {/* NAVBAR - Identical to blog page */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm md:w-auto md:max-w-none px-2 md:px-0">
        <div className="hidden md:flex water-glass-effect rounded-full items-center gap-8 px-6 py-[8px]">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-5 flex-shrink-0 cursor-pointer"
            onClick={() => navigate(createPageUrl('Home'))}
          />

          <div className="flex items-center gap-4 flex-shrink-0">
            <button 
              onClick={() => navigate(createPageUrl(getPricingPageName(language)))}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">
              {t.pricing}
            </button>
            <button 
              onClick={() => navigate(createPageUrl(getBlogPageName(language)))}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">
              {t.blog}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap rounded-full transition-colors flex items-center gap-2">
                <span className="text-lg">{SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag}</span>
              </button>
              
              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)}></div>
                  <div className="absolute right-0 top-12 water-glass-effect rounded-2xl border border-white/40 shadow-xl p-2 min-w-[160px] z-50">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          language === lang.code
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-gray-700 hover:bg-white/50'
                        }`}>
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <button
              onClick={handleLogin}
              className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap rounded-full transition-colors">
              {t.login}
            </button>
            
            <button
              onClick={() => navigate(getQuizPageUrl(language))}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white py-2 px-4 text-sm font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-colors">
              {t.freeQuiz}
            </button>
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className="md:hidden water-glass-effect rounded-full px-6 py-[4px]">
          <div className="flex items-center justify-between">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
              alt="MyWellness"
              className="h-6 cursor-pointer"
              onClick={() => navigate(createPageUrl('Home'))}
            />
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setMobileLangMenuOpen(!mobileLangMenuOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Language">
                  <span className="text-xl">{SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag}</span>
                </button>
                
                {mobileLangMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMobileLangMenuOpen(false)}></div>
                    <div className="absolute right-0 top-12 water-glass-effect rounded-2xl border border-white/40 shadow-xl p-2 min-w-[160px] z-50">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            language === lang.code
                              ? 'bg-[var(--brand-primary)] text-white'
                              : 'text-gray-700 hover:bg-white/50'
                          }`}>
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 ${mobileMenuOpen ? 'burger-open' : ''}`}
                aria-label="Menu">
                <div className="burger-container">
                  <span className="burger-line"></span>
                  <span className="burger-line"></span>
                </div>
              </button>
            </div>
          </div>

          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="pt-4 pb-2 space-y-3">
              <button
                onClick={() => { navigate(createPageUrl(getPricingPageName(language))); setMobileMenuOpen(false); }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                {t.pricing}
              </button>
              <button
                onClick={() => { navigate(createPageUrl(getBlogPageName(language))); setMobileMenuOpen(false); }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                {t.blog}
              </button>
              <div className="border-t border-gray-200/50 pt-3 mt-3">
                <button
                  onClick={() => { handleLogin(); setMobileMenuOpen(false); }}
                  className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                  {t.login}
                </button>
                <button
                  onClick={() => { navigate(getQuizPageUrl(language)); setMobileMenuOpen(false); }}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2 mt-2">
                  {t.freeQuiz}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-36 md:pt-44 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate(createPageUrl(getBlogPageName(language)))}
            variant="ghost"
            className="mb-8 text-gray-600 hover:text-gray-900 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToBlog}
          </Button>

          <div className="mb-12">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className={`px-4 py-2 ${categoryInfo.color} rounded-full text-sm font-semibold`}>
                {categoryInfo.icon} {categoryInfo.label}
              </span>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.reading_time} {t.minRead}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              {article.meta_description}
            </p>
          </div>

          <div className="mb-12 h-px bg-gray-300"></div>

          <ReactMarkdown className="article-content">
            {article.content}
          </ReactMarkdown>

          <div className="mt-12 bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 rounded-3xl p-8 text-center">
            <p className="text-gray-700 mb-6 text-lg">
              {t.writtenBy} <strong>{article.author || 'Team MyWellness'}</strong>
            </p>
            <Button
              onClick={() => navigate(getQuizPageUrl(language))}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg"
            >
              {t.startJourney}
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
        <Button
          onClick={() => navigate(getQuizPageUrl(language))}
          className="cta-floating bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white rounded-full px-8 py-6 text-base font-semibold shadow-2xl"
        >
          {t.floatingCta}
        </Button>
      </div>

      <footer className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-gray-700">© VELIKA GROUP LLC. All Rights Reserved.</p>
            <p className="text-xs text-gray-500">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
            <p className="text-xs text-gray-500">EIN: 36-5141800 - velika.03@outlook.it</p>
          </div>
        </div>
      </footer>
    </div>
  );
}