
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogPost } from '@/entities/BlogPost';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { User } from '@/entities/User';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';

export default function BlogArticle() {
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadArticle();
  }, []);

  const loadArticle = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const slug = urlParams.get('slug');
      
      if (!slug) {
        navigate(createPageUrl('Blog'));
        return;
      }

      const articles = await BlogPost.filter({ slug, published: true });
      if (articles.length > 0) {
        setArticle(articles[0]);
        await BlogPost.update(articles[0].id, { views: (articles[0].views || 0) + 1 });
      } else {
        navigate(createPageUrl('Blog'));
      }
    } catch (error) {
      console.error('Error loading article:', error);
      navigate(createPageUrl('Blog'));
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    const quizUrl = window.location.origin + createPageUrl('Quiz');
    await base44.auth.redirectToLogin(quizUrl);
  };

  const getCategoryInfo = (categoryId) => {
    const categories = {
      dimagrimento: { label: 'Dimagrimento', icon: '🔥', color: 'bg-red-100 text-red-700' },
      nutrizione: { label: 'Nutrizione', icon: '🥗', color: 'bg-green-100 text-green-700' },
      allenamento: { label: 'Allenamento', icon: '💪', color: 'bg-blue-100 text-blue-700' },
      benessere: { label: 'Benessere', icon: '✨', color: 'bg-purple-100 text-purple-700' },
      motivazione: { label: 'Motivazione', icon: '🎯', color: 'bg-orange-100 text-orange-700' }
    };
    return categories[categoryId] || { label: categoryId, icon: '📄', color: 'bg-gray-100 text-gray-700' };
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
  const formattedDate = new Date(article.created_date).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen pb-32" style={{ background: '#ffffff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5753;
        }
        
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
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

        .burger-line:first-child {
          top: 0;
        }

        .burger-line:last-child {
          bottom: 0;
        }

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

        .cta-floating {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(38, 132, 127, 0.4), 0 0 40px rgba(38, 132, 127, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(38, 132, 127, 0.6), 0 0 60px rgba(38, 132, 127, 0.3);
          }
        }

        .article-content {
          color: #1f2937;
          line-height: 1.8;
        }

        .article-content h1,
        .article-content h2,
        .article-content h3,
        .article-content h4 {
          font-weight: 700;
          color: #111827;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          line-height: 1.3;
        }

        .article-content h1 {
          font-size: 2.25rem;
        }

        .article-content h2 {
          font-size: 1.875rem;
        }

        .article-content h3 {
          font-size: 1.5rem;
        }

        .article-content h4 {
          font-size: 1.25rem;
        }

        .article-content p {
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
        }

        .article-content ul,
        .article-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }

        .article-content li {
          margin-bottom: 0.75rem;
          font-size: 1.125rem;
        }

        .article-content strong {
          font-weight: 700;
          color: #111827;
        }

        .article-content em {
          font-style: italic;
        }

        .article-content a {
          color: var(--brand-primary);
          text-decoration: underline;
        }

        .article-content a:hover {
          color: var(--brand-primary-hover);
        }

        .article-content blockquote {
          border-left: 4px solid var(--brand-primary);
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: #4b5563;
          background: var(--brand-primary-light);
          padding: 1.5rem;
          border-radius: 0.5rem;
        }

        .article-content code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-family: 'Courier New', monospace;
        }

        .article-content pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1.5rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          margin: 2rem 0;
        }

        .article-content pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }

        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 1rem;
          margin: 2rem 0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .article-content hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 3rem 0;
        }
      `}</style>

      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[80%] max-w-sm md:w-auto md:max-w-none">
        <div className="hidden md:flex water-glass-effect rounded-full items-center gap-8 px-6 py-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-5 flex-shrink-0 cursor-pointer"
            onClick={() => navigate(createPageUrl('Home'))}
          />

          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => navigate(createPageUrl('pricing'))}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">
              Prezzi
            </button>
            <button
              onClick={() => navigate(createPageUrl('Blog'))}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">
              Blog
            </button>
            <button
              onClick={handleLogin}
              className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap rounded-full transition-colors">
              Log-in
            </button>
            
            <button
              onClick={() => navigate(createPageUrl('Quiz'))}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white py-2 px-4 text-sm font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-colors">
              Quiz Gratuito
            </button>
          </div>
        </div>

        <div className="md:hidden water-glass-effect rounded-3xl px-6 py-3">
          <div className="flex items-center justify-between">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
              alt="MyWellness"
              className="h-6 cursor-pointer"
              onClick={() => navigate(createPageUrl('Home'))}
            />
            
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

          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="pt-4 pb-2 space-y-3">
              <button
                onClick={() => {
                  navigate(createPageUrl('pricing'));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                Prezzi
              </button>
              <button
                onClick={() => {
                  navigate(createPageUrl('Blog'));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                Blog
              </button>
              <button
                onClick={() => {
                  handleLogin();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                Log-in
              </button>
              <button
                onClick={() => {
                  navigate(createPageUrl('Quiz'));
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2">
                Quiz Gratuito
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-36 md:pt-44 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate(createPageUrl('Blog'))}
            variant="ghost"
            className="mb-8 text-gray-600 hover:text-gray-900 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna al Blog
          </Button>

          <div className="mb-12">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className={`px-4 py-2 ${categoryInfo.color} rounded-full text-sm font-semibold`}>
                {categoryInfo.icon} {categoryInfo.label}
              </span>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.reading_time} min
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

          {/* Elegant Separator */}
          <div className="mb-12 h-px bg-gray-300"></div>

          <ReactMarkdown className="article-content">
            {article.content}
          </ReactMarkdown>

          <div className="mt-12 bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 rounded-3xl p-8 text-center">
            <p className="text-gray-700 mb-6 text-lg">
              Scritto da <strong>{article.author || 'Team MyWellness'}</strong>
            </p>
            <Button
              onClick={() => navigate(createPageUrl('Quiz'))}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg"
            >
              Inizia il Tuo Percorso Gratuito
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
        <Button
          onClick={() => navigate(createPageUrl('Quiz'))}
          className="cta-floating bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white rounded-full px-8 py-6 text-base font-semibold shadow-2xl"
        >
          🎯 Realizza il tuo piano personalizzato
        </Button>
      </div>

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
