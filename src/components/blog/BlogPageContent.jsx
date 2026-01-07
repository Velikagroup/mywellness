import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Search, Clock, ArrowRight, ChevronDown } from 'lucide-react';
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

const getQuizPageName = (langCode) => {
  const langQuizPages = {
    'en': 'enquiz',
    'it': 'itquiz',
    'es': 'esquiz',
    'pt': 'ptquiz',
    'de': 'dequiz',
    'fr': 'frquiz'
  };
  return langQuizPages[langCode] || 'quiz';
};

const getBlogArticleUrl = (langCode, slug) => {
  const articlePages = {
    'en': 'blogarticle',
    'it': 'itblogarticle',
    'es': 'esblogarticle',
    'pt': 'ptblogarticle',
    'de': 'deblogarticle',
    'fr': 'frblogarticle'
  };
  const pageName = articlePages[langCode] || 'blogarticle';
  return createPageUrl(pageName) + `?slug=${slug}`;
};

// Translations for the blog page
const blogTranslations = {
  it: {
    heroTitle: 'Blog',
    heroTitleHighlight: 'MyWellness',
    heroSubtitle: 'Scopri i nostri articoli su nutrizione, fitness e benessere',
    searchPlaceholder: 'Cerca articoli...',
    allCategories: 'Tutte',
    categories: {
      dimagrimento: 'Dimagrimento',
      nutrizione: 'Nutrizione',
      allenamento: 'Allenamento',
      benessere: 'Benessere',
      motivazione: 'Motivazione'
    },
    readMore: 'Leggi di più',
    minRead: 'min lettura',
    noArticles: 'Nessun articolo trovato',
    noArticlesDesc: 'Non ci sono ancora articoli disponibili in questa lingua.',
    pricing: 'Prezzi',
    blog: 'Blog',
    login: 'Accedi',
    freeQuiz: 'Quiz Gratuito'
  },
  en: {
    heroTitle: 'Blog',
    heroTitleHighlight: 'MyWellness',
    heroSubtitle: 'Discover our articles on nutrition, fitness and wellness',
    searchPlaceholder: 'Search articles...',
    allCategories: 'All',
    categories: {
      dimagrimento: 'Weight Loss',
      nutrizione: 'Nutrition',
      allenamento: 'Training',
      benessere: 'Wellness',
      motivazione: 'Motivation'
    },
    readMore: 'Read more',
    minRead: 'min read',
    noArticles: 'No articles found',
    noArticlesDesc: 'There are no articles available in this language yet.',
    pricing: 'Pricing',
    blog: 'Blog',
    login: 'Login',
    freeQuiz: 'Free Quiz'
  },
  es: {
    heroTitle: 'Blog',
    heroTitleHighlight: 'MyWellness',
    heroSubtitle: 'Descubre nuestros artículos sobre nutrición, fitness y bienestar',
    searchPlaceholder: 'Buscar artículos...',
    allCategories: 'Todos',
    categories: {
      dimagrimento: 'Adelgazamiento',
      nutrizione: 'Nutrición',
      allenamento: 'Entrenamiento',
      benessere: 'Bienestar',
      motivazione: 'Motivación'
    },
    readMore: 'Leer más',
    minRead: 'min lectura',
    noArticles: 'No se encontraron artículos',
    noArticlesDesc: 'Todavía no hay artículos disponibles en este idioma.',
    pricing: 'Precios',
    blog: 'Blog',
    login: 'Iniciar sesión',
    freeQuiz: 'Quiz Gratis'
  },
  pt: {
    heroTitle: 'Blog',
    heroTitleHighlight: 'MyWellness',
    heroSubtitle: 'Descubra nossos artigos sobre nutrição, fitness e bem-estar',
    searchPlaceholder: 'Pesquisar artigos...',
    allCategories: 'Todos',
    categories: {
      dimagrimento: 'Emagrecimento',
      nutrizione: 'Nutrição',
      allenamento: 'Treino',
      benessere: 'Bem-estar',
      motivazione: 'Motivação'
    },
    readMore: 'Leia mais',
    minRead: 'min leitura',
    noArticles: 'Nenhum artigo encontrado',
    noArticlesDesc: 'Ainda não há artigos disponíveis neste idioma.',
    pricing: 'Preços',
    blog: 'Blog',
    login: 'Entrar',
    freeQuiz: 'Quiz Grátis'
  },
  de: {
    heroTitle: 'Blog',
    heroTitleHighlight: 'MyWellness',
    heroSubtitle: 'Entdecken Sie unsere Artikel über Ernährung, Fitness und Wohlbefinden',
    searchPlaceholder: 'Artikel suchen...',
    allCategories: 'Alle',
    categories: {
      dimagrimento: 'Abnehmen',
      nutrizione: 'Ernährung',
      allenamento: 'Training',
      benessere: 'Wohlbefinden',
      motivazione: 'Motivation'
    },
    readMore: 'Mehr lesen',
    minRead: 'Min. Lesezeit',
    noArticles: 'Keine Artikel gefunden',
    noArticlesDesc: 'Es sind noch keine Artikel in dieser Sprache verfügbar.',
    pricing: 'Preise',
    blog: 'Blog',
    login: 'Anmelden',
    freeQuiz: 'Kostenloses Quiz'
  },
  fr: {
    heroTitle: 'Blog',
    heroTitleHighlight: 'MyWellness',
    heroSubtitle: 'Découvrez nos articles sur la nutrition, le fitness et le bien-être',
    searchPlaceholder: 'Rechercher des articles...',
    allCategories: 'Tous',
    categories: {
      dimagrimento: 'Minceur',
      nutrizione: 'Nutrition',
      allenamento: 'Entraînement',
      benessere: 'Bien-être',
      motivazione: 'Motivation'
    },
    readMore: 'Lire la suite',
    minRead: 'min lecture',
    noArticles: 'Aucun article trouvé',
    noArticlesDesc: "Il n'y a pas encore d'articles disponibles dans cette langue.",
    pricing: 'Tarifs',
    blog: 'Blog',
    login: 'Connexion',
    freeQuiz: 'Quiz Gratuit'
  }
};

export default function BlogPageContent() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = blogTranslations[language] || blogTranslations.en;
  
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileLangMenuOpen, setMobileLangMenuOpen] = useState(false);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const filterRef = useRef(null);
  const searchInputRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user for Dashboard button
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPosts();
  }, [language]);

  useEffect(() => {
    const handleScroll = () => {
      if (filterRef.current) {
        const filterTop = filterRef.current.getBoundingClientRect().top;
        setIsFilterSticky(filterTop <= 100);
      }
    };

    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      // Try direct fetch without any filtering first
      const allPosts = await base44.entities.BlogPost.list('-created_date', 500);
      
      console.log('🔍 RAW API Response:', allPosts.length, 'posts');
      console.log('🔍 Current language:', language);
      
      if (allPosts.length === 0) {
        console.error('❌ NO POSTS RETURNED FROM API');
        setPosts([]);
        setIsLoading(false);
        return;
      }
      
      // Log first few posts to see structure
      allPosts.slice(0, 5).forEach((post, idx) => {
        const lang = post.data?.language || post.language;
        console.log(`📄 Post ${idx + 1}:`, {
          id: post.id,
          title: post.data?.title || post.title,
          language: lang,
          languageType: typeof lang,
          languageValue: JSON.stringify(lang),
          published: post.data?.published || post.published
        });
      });
      
      // Normalize and filter
      const normalized = allPosts.map(p => ({
        id: p.id,
        created_date: p.created_date,
        ...(p.data || p)
      }));
      
      const publishedOnly = normalized.filter(p => p.published === true);
      console.log('📚 Published posts:', publishedOnly.length);
      
      let filtered;
      if (language === 'it') {
        filtered = publishedOnly.filter(p => !p.language || p.language === 'it');
      } else {
        filtered = publishedOnly.filter(p => p.language === language);
      }
      
      console.log('✅ FINAL filtered posts for', language, ':', filtered.length);
      
      setPosts(filtered);
    } catch (error) {
      console.error('❌ ERROR loading posts:', error);
      setPosts([]);
    }
    setIsLoading(false);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.meta_description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLanguageChange = (newLang) => {
    setLangMenuOpen(false);
    setMobileLangMenuOpen(false);
    window.location.href = createPageUrl(getBlogPageName(newLang));
  };

  const handleLogin = async () => {
    const checkoutUrl = window.location.origin + createPageUrl('Checkout') + '?plan=base';
    await base44.auth.redirectToLogin(checkoutUrl);
  };

  const handleArticleClick = (post) => {
    navigate(getBlogArticleUrl(language, post.slug));
  };

  const categories = ['all', 'dimagrimento', 'nutrizione', 'allenamento', 'benessere', 'motivazione'];

  if (isLoading) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient-bg overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%; }
          33% { background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%; }
          66% { background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%; }
          100% { background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%; }
        }
        
        @keyframes textGradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animated-gradient-bg {
          background: #f9fafb;
          background-image: 
            radial-gradient(circle at 10% 20%, #f5f9ff 0%, transparent 50%),
            radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, #d4bbff 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
            radial-gradient(circle at 90% 85%, #e0ccff 0%, transparent 50%);
          background-size: 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%;
          animation: gradientShift 45s ease-in-out infinite;
          background-attachment: fixed;
        }
        
        .animated-text-gradient {
          background: linear-gradient(90deg, var(--brand-primary), #14b8a6, #10b981, #14b8a6, var(--brand-primary));
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textGradientFlow 4s ease-in-out infinite;
        }

        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 251, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        .burger-line {
          display: block;
          width: 24px;
          height: 2px;
          background-color: #4b5563;
          transition: all 0.3s ease;
          position: absolute;
          left: 0;
        }

        .burger-container {
          position: relative;
          width: 24px;
          height: 10px;
        }

        .burger-line:first-child { top: 0; }
        .burger-line:last-child { bottom: 0; }

        .burger-open .burger-line:first-child {
          top: 4px;
          transform: rotate(45deg);
        }

        .burger-open .burger-line:last-child {
          bottom: 4px;
          transform: rotate(-45deg);
        }

        .mobile-menu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease-out;
        }

        .mobile-menu.open {
          max-height: 400px;
        }
      `}</style>

      {/* NAVBAR - Identical to pricing */}
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
            
            {user ? (
              <button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap rounded-full transition-colors">
                Dashboard
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap rounded-full transition-colors">
                {t.login}
              </button>
            )}
            
            <button
              onClick={() => navigate(createPageUrl(getQuizPageName(language)))}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white py-2 px-4 text-sm font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-colors">
              {t.freeQuiz}
            </button>
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className={`md:hidden water-glass-effect px-6 py-[4px] transition-all duration-300 rounded-[30px]`}>
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
                onClick={() => {
                  navigate(createPageUrl(getPricingPageName(language)));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                {t.pricing}
              </button>
              <button
                onClick={() => {
                  navigate(createPageUrl(getBlogPageName(language)));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                {t.blog}
              </button>
              
              <div className="border-t border-gray-200/50 pt-3 mt-3">
                {user ? (
                  <button
                    onClick={() => {
                      navigate(createPageUrl('Dashboard'));
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2">
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleLogin();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                      {t.login}
                    </button>
                    <button
                  onClick={() => {
                    navigate(createPageUrl(getQuizPageName(language)));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2 mt-2">
                  {t.freeQuiz}
                </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            {t.heroTitle} <span className="animated-text-gradient">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {t.heroSubtitle}
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8" ref={searchInputRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchDropdownOpen(e.target.value.length > 0);
                }}
                onFocus={() => searchQuery.length > 0 && setSearchDropdownOpen(true)}
                className="w-full pl-12 pr-4 py-3 rounded-full water-glass-effect border border-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <div ref={filterRef} className={`sticky top-20 z-30 py-4 px-4 md:px-6 transition-all ${isFilterSticky ? 'water-glass-effect shadow-sm' : ''}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'water-glass-effect text-gray-700 hover:bg-white/50'
                }`}
              >
                {cat === 'all' ? t.allCategories : (t.categories[cat] || cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <section className="py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.noArticles}</h3>
              <p className="text-gray-600">{t.noArticlesDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => handleArticleClick(post)}
                  className="water-glass-effect rounded-2xl overflow-hidden border border-white/40 hover:border-white/60 transition-all hover:shadow-xl cursor-pointer group"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-[var(--brand-primary-light)] text-[var(--brand-primary)] rounded-full text-xs font-semibold">
                        {t.categories[post.category] || post.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {post.reading_time} {t.minRead}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[var(--brand-primary)] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.meta_description}
                    </p>
                    
                    <div className="flex items-center text-[var(--brand-primary)] font-semibold text-sm group-hover:gap-2 transition-all">
                      {t.readMore}
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              © VELIKA GROUP LLC. All Rights Reserved.
            </p>
            <p className="text-xs text-gray-500">
              30 N Gould St 32651 Sheridan, WY 82801, United States
            </p>
            <p className="text-xs text-gray-500">
              EIN: 36-5141800 - velika.03@outlook.it
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}