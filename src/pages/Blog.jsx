import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Clock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function Blog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);
  const [isFiltersSticky, setIsFiltersSticky] = useState(false);
  const [isFiltersStickyMobile, setIsFiltersStickyMobile] = useState(false);
  const filtersRef = useRef(null);
  const filtersMobileRef = useRef(null);
  const filterOriginalPosition = useRef(null);
  const filterMobileOriginalPosition = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPosts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Salva la posizione originale dei filtri desktop e mobile
    const saveOriginalPosition = () => {
      if (filtersRef.current && !filterOriginalPosition.current) {
        filterOriginalPosition.current = filtersRef.current.offsetTop;
      }
      if (filtersMobileRef.current && !filterMobileOriginalPosition.current) {
        filterMobileOriginalPosition.current = filtersMobileRef.current.offsetTop;
      }
    };

    const handleScroll = () => {
      // Desktop
      if (!filterOriginalPosition.current && filtersRef.current) {
        filterOriginalPosition.current = filtersRef.current.offsetTop;
      }
      // Mobile
      if (!filterMobileOriginalPosition.current && filtersMobileRef.current) {
        filterMobileOriginalPosition.current = filtersMobileRef.current.offsetTop;
      }

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Desktop sticky - becomes sticky when scroll passes their original position - 96px (nav height + offset)
      // 96px is equivalent to `top-24` in TailwindCSS.
      const shouldBeSticky = filterOriginalPosition.current && scrollTop > (filterOriginalPosition.current - 96);
      setIsFiltersSticky(shouldBeSticky);
      
      // Mobile sticky - solo quando lo scroll raggiunge esattamente o supera il punto dei filtri - 96px (nav height + offset)
      const shouldBeStickyMobile = filterMobileOriginalPosition.current && scrollTop >= (filterMobileOriginalPosition.current - 96);
      setIsFiltersStickyMobile(shouldBeStickyMobile);
    };

    // Wait for the DOM to be fully loaded and rendered to get the correct positions
    const timeoutId = setTimeout(() => {
      saveOriginalPosition();
      handleScroll(); // Initial check with potentially correct positions
    }, 100); // Small delay to ensure layout is stable

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearTimeout(timeoutId); // Clean up the timeout
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await base44.entities.BlogPost.filter({ published: true }, '-created_date', 100);
      setPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let filtered = posts;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter((post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.meta_description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPosts(filtered);
  }, [searchQuery, selectedCategory, posts]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const results = posts.filter((post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.meta_description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSearchResults(results);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery, posts]);

  const handleLogin = async () => {
    const quizUrl = window.location.origin + createPageUrl('Quiz');
    await base44.auth.redirectToLogin(quizUrl);
  };

  const handleArticleClick = (post) => {
    navigate(createPageUrl('BlogArticle') + `?slug=${post.slug}`);
  };

  const handleSearchResultClick = (slug) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(createPageUrl('BlogArticle') + `?slug=${slug}`);
  };

  const categories = [
    { id: 'all', label: 'Tutti gli Articoli', icon: '📚' },
    { id: 'dimagrimento', label: 'Dimagrimento', icon: '🔥' },
    { id: 'nutrizione', label: 'Nutrizione', icon: '🥗' },
    { id: 'allenamento', label: 'Allenamento', icon: '💪' },
    { id: 'benessere', label: 'Benessere', icon: '✨' },
    { id: 'motivazione', label: 'Motivazione', icon: '🎯' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 animated-gradient-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5753;
        }
        
        @keyframes textGradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
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
          background: linear-gradient(135deg, rgba(249, 250, 251, 0.75) 0%, rgba(243, 244, 246, 0.65) 50%, rgba(249, 250, 251, 0.75) 100%);
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
        .search-dropdown { animation: slideDown 0.2s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .mobile-categories-scroll { scrollbar-width: none; -ms-overflow-style: none; scroll-behavior: smooth; scroll-snap-type: x mandatory; }
        .mobile-categories-scroll::-webkit-scrollbar { display: none; }
        .mobile-categories-scroll > div > button { scroll-snap-align: start; }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
          33% {
            background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%;
          }
          66% {
            background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%;
          }
          100% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
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
      `}</style>

      {/* NAVBAR */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[80%] max-w-sm md:w-auto md:max-w-none">
        <div className="hidden md:flex water-glass-effect rounded-full items-center gap-8 px-6 py-3">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png" alt="MyWellness" className="h-5 flex-shrink-0 cursor-pointer" onClick={() => navigate(createPageUrl('Home'))} />
          <div className="flex items-center gap-4 flex-shrink-0">
            <button onClick={() => navigate(createPageUrl('pricing'))} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">Prezzi</button>
            <button onClick={() => navigate(createPageUrl('Blog'))} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">Blog</button>
            <button onClick={handleLogin} className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap rounded-full transition-colors">Log-in</button>
            <button onClick={() => navigate(createPageUrl('Quiz'))} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white py-2 px-4 text-sm font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-colors">Quiz Gratuito</button>
          </div>
        </div>
        <div className="md:hidden water-glass-effect rounded-3xl px-6 py-3">
          <div className="flex items-center justify-between">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png" alt="MyWellness" className="h-6 cursor-pointer" onClick={() => navigate(createPageUrl('Home'))} />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 ${mobileMenuOpen ? 'burger-open' : ''}`} aria-label="Menu">
              <div className="burger-container"><span className="burger-line"></span><span className="burger-line"></span></div>
            </button>
          </div>
          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="pt-4 pb-2 space-y-3">
              <button onClick={() => { navigate(createPageUrl('pricing')); setMobileMenuOpen(false); }} className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">Prezzi</button>
              <button onClick={() => { navigate(createPageUrl('Blog')); setMobileMenuOpen(false); }} className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">Blog</button>
              <button onClick={() => { handleLogin(); setMobileMenuOpen(false); }} className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">Log-in</button>
              <button onClick={() => { navigate(createPageUrl('Quiz')); setMobileMenuOpen(false); }} className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2">Quiz Gratuito</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="pt-36 md:pt-44 pb-8 md:pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1]">
            <span className="animated-text-gradient">Blog</span> MyWellness
          </h1>
          <p className="text-base md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">Guide, consigli pratici e strategie per raggiungere i tuoi obiettivi</p>
          <div className="max-w-2xl mx-auto relative" ref={searchRef}>
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <Input type="text" placeholder="Cerca articoli..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => searchQuery && setShowSearchDropdown(true)} className="pl-14 pr-6 h-16 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200/50 rounded-full shadow-lg focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="search-dropdown absolute top-full mt-2 w-full water-glass-effect border-2 border-gray-200/50 rounded-3xl shadow-2xl overflow-hidden z-50">
                {searchResults.map((post) => (
                  <button key={post.id} onClick={() => handleSearchResultClick(post.slug)} className="w-full px-6 py-4 text-left hover:bg-white/60 transition-all border-b border-gray-100/50 last:border-0 group">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0"><span className="text-2xl">{categories.find((c) => c.id === post.category)?.icon || '📄'}</span></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[var(--brand-primary)] transition-colors line-clamp-1">{post.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{post.meta_description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{post.reading_time} min</span>
                          <span className="text-xs px-2 py-0.5 bg-[var(--brand-primary-light)] text-[var(--brand-primary)] rounded-full font-medium">{categories.find((c) => c.id === post.category)?.label}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--brand-primary)] transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSearchDropdown && searchQuery && searchResults.length === 0 && (
              <div className="search-dropdown absolute top-full mt-2 w-full water-glass-effect border-2 border-gray-200/50 rounded-3xl shadow-2xl p-6 text-center z-50">
                <p className="text-gray-600">Nessun articolo trovato per "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile categories - sticky con liquid glass */}
      <div 
        ref={filtersMobileRef}
        className={`md:hidden z-40 py-4 px-6 transition-all duration-300 ${
          isFiltersStickyMobile 
            ? 'fixed top-24 left-0 right-0 mb-0'
            : 'relative max-w-7xl mx-auto mb-8'
        }`}
        style={{ background: 'transparent' }}
      >
        <div className="overflow-x-auto mobile-categories-scroll pb-2">
          <div className="flex gap-3 min-w-max px-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3.5 rounded-full font-semibold transition-all whitespace-nowrap text-base backdrop-blur-xl ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--brand-primary)] text-white scale-105'
                    : 'bg-white/70 text-gray-700 hover:bg-white/80'
                }`}
                style={selectedCategory !== cat.id ? {
                  backdropFilter: 'blur(12px) saturate(180%)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.7) 100%)',
                  // Removed boxShadow here as per request
                } : {}}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Desktop categories - solo bottoni senza sfondo */}
      <div ref={filtersRef} className={`hidden md:block z-40 py-6 px-6 transition-all duration-300 mb-12 ${isFiltersSticky ? 'fixed top-24 left-0 right-0' : 'relative'}`}>
        <div className="flex flex-wrap gap-3 justify-center max-w-7xl mx-auto">
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id)} 
              className={`px-6 py-3 rounded-full font-semibold transition-all shadow-lg backdrop-blur-xl ${
                selectedCategory === cat.id 
                  ? 'bg-[var(--brand-primary)] text-white' 
                  : 'bg-white/70 text-gray-700 hover:bg-white/80'
              }`}
              style={selectedCategory !== cat.id ? {
                backdropFilter: 'blur(12px) saturate(180%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.7) 100%)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)'
              } : {}}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder SOLO desktop */}
      <div className={`hidden md:block ${isFiltersSticky ? 'h-24' : ''}`}></div>

      <div className="max-w-7xl mx-auto px-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-600 text-lg">Nessun articolo trovato</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer" onClick={() => handleArticleClick(post)}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-[var(--brand-primary)] text-white text-xs font-semibold rounded-full">
                      {categories.find((c) => c.id === post.category)?.icon} {categories.find((c) => c.id === post.category)?.label}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-500"><Clock className="w-4 h-4" /><span>{post.reading_time} min</span></div>
                  </div>
                  <div className="my-4 h-px bg-gradient-to-r from-transparent via-[var(--brand-primary)]/30 to-transparent"></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[var(--brand-primary)] transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.meta_description}</p>
                  <div className="flex items-center text-[var(--brand-primary)] font-semibold">
                    Leggi l'articolo<ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <footer className="py-12 px-6 mt-20">
        <div className="max-w-6xl mx-auto"><div className="text-center space-y-2">
          <p className="text-sm font-semibold text-gray-700">© VELIKA GROUP LLC. All Rights Reserved.</p>
          <p className="text-xs text-gray-500">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
          <p className="text-xs text-gray-500">EIN: 36-5141800 - velika.03@outlook.it</p>
        </div></div>
      </footer>
    </div>
  );
}