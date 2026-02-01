import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from "@/api/base44Client";
import { rememberMeManager } from '../components/utils/rememberMeManager';
import {
  Sparkles,
  Target,
  Utensils,
  Dumbbell,
  TrendingUp,
  Brain,
  Camera,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Zap,
  Activity,
  Image as ImageIcon,
  Clock,
  RefreshCw,
  BrainCircuit,
  Users,
  Globe,
  Plus
} from 'lucide-react';
import { motion, useScroll, useTransform } from "framer-motion";
import { LanguageProvider, useLanguage, SUPPORTED_LANGUAGES } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';
import WorkoutPreviewDemo from "../components/home/WorkoutPreviewDemo";
import MealPlanPreviewDemo from "../components/home/MealPlanPreviewDemo";
import PhotoAnalyzerPreviewDemo from "../components/home/PhotoAnalyzerPreviewDemo";
import QuizPreviewDemo from "../components/home/QuizPreviewDemo";
import DashboardPreviewDemo from "../components/home/DashboardPreviewDemo";
import HealthScorePreviewDemo from "../components/home/HealthScorePreviewDemo";
import ShoppingListPreviewDemo from "../components/home/ShoppingListPreviewDemo";
import IngredientScannerPreviewDemo from "../components/home/IngredientScannerPreviewDemo";
import PantryPreviewDemo from "../components/home/PantryPreviewDemo";
import MealTrackingPreviewDemo from "../components/home/MealTrackingPreviewDemo";
import ProgressPhotoPreviewDemo from "../components/home/ProgressPhotoPreviewDemo";
import AppDemoFlow from "../components/home/AppDemoFlow";
import SportQuizPreviewDemo from "../components/home/SportQuizPreviewDemo";
import CalorieCounterCameraPreview from "../components/home/CalorieCounterCameraPreview";
import NutritionScannerCameraPreview from "../components/home/NutritionScannerCameraPreview";
import BodyScanCameraPreview from "../components/home/BodyScanCameraPreview";

function HomeContent() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [showNavQuizButton, setShowNavQuizButton] = useState(false);
  const [showMobileFloatingButton, setShowMobileFloatingButton] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileLangMenuOpen, setMobileLangMenuOpen] = useState(false);
  const heroQuizButtonRef = useRef(null);

  const [liveStats, setLiveStats] = useState({ users: 0, totalKg: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Carica l'utente corrente per verificare se è loggato
    const loadCurrentUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        // User not logged in
        setUser(null);
      }
    };
    loadCurrentUser();
  }, [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Verifica remember me token all'avvio
    const checkRememberMe = async () => {
      const result = await rememberMeManager.checkToken();
      if (result.valid) {
        console.log('✅ Auto-login con remember me token');
        // Token valido, l'utente è già loggato via Base44
        // Naviga alla dashboard se ha completato quiz e ha subscription
        try {
          const currentUser = await base44.auth.me();
          if (currentUser && currentUser.quiz_completed && 
              (currentUser.subscription_status === 'active' || currentUser.subscription_status === 'trial')) {
            navigate(createPageUrl('Dashboard'), { replace: true });
            return;
          }
        } catch (error) {
          console.log('User not fully authenticated yet');
        }
      }
    };

    // Cattura codice affiliato dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const affiliateCode = urlParams.get('affiliate');
    if (affiliateCode) {
      localStorage.setItem('affiliateCode', affiliateCode.toUpperCase());
      console.log('🔗 Codice affiliato salvato:', affiliateCode.toUpperCase());
    }

    // Pop-up quiz dopo 5 secondi
    const timer = setTimeout(() => {
      setShowQuizPopup(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Removed automatic redirect to Quiz - let users browse the Home page freely

  useEffect(() => {
    const referenceDate = new Date('2025-11-06T00:00:00Z').getTime();
    const baseKg = 203112;
    const incrementIntervalSeconds = 10;

    const calculateLiveStats = () => {
      const now = Date.now();
      const secondsElapsed = Math.floor((now - referenceDate) / 1000);
      const incrementsCount = Math.floor(secondsElapsed / incrementIntervalSeconds);

      let totalIncrements = 0;
      for (let i = 0; i < incrementsCount; i++) {
        const seed = (i + 1) * 12345;
        const random = (seed * 9301 + 49297) % 233280 / 233280;
        const increment = Math.floor(random * 6) + 1;
        totalIncrements += increment;
      }

      const totalKg = baseKg + totalIncrements;
      const currentUsers = Math.floor(totalKg / 4.5);

      setLiveStats({ users: currentUsers, totalKg });
    };

    calculateLiveStats();
    const interval = setInterval(calculateLiveStats, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (heroQuizButtonRef.current) {
        const buttonRect = heroQuizButtonRef.current.getBoundingClientRect();
        setShowNavQuizButton(buttonRect.top < 0);

        const isMobile = window.innerWidth < 768;
        setShowMobileFloatingButton(isMobile && buttonRect.top < -200);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const testimonials = [
    {
      name: "Maria Santos",
      role: "Studentessa Universitaria",
      photo: "https://i.pravatar.cc/400?img=29",
      text: "Con il budget da studentessa non potevo permettermi un nutrizionista. MyWellness mi ha creato un piano alimentare economico e completo. Ho perso 8kg in 4 mesi spendendo pochissimo al supermercato. L'AI mi suggerisce sempre alternative più economiche quando un ingrediente costa troppo."
    },
    {
      name: "Luca Moretti",
      role: "Personal Trainer",
      photo: "https://i.pravatar.cc/400?img=60",
      text: "Da 6 anni alleno clienti e consiglio MyWellness a chi vuole supporto quotidiano tra le sessioni. L'analisi fotografica AI è impressionante - rileva progressi che io stesso fatico a notare. Il sistema di ribilanciamento automatico dei pasti è geniale per chi sgarra durante la settimana."
    },
    {
      name: "Gabriela Rodriguez",
      role: "Content Creator Fitness",
      photo: "https://i.pravatar.cc/400?img=49",
      text: "Ho provato ogni tipo di app e dieta in 8 anni di fitness. MyWellness è diversa: l'analisi fotografica con AI è incredibilmente precisa. Mi mostra progressi che nemmeno io notavo. Il piano nutrizionale si adatta automaticamente in base alle foto che carico. È come avere un personal trainer che ti segue 24/7."
    },
    {
      name: "Yuki Tanaka",
      role: "Marketing Manager",
      photo: "https://i.pravatar.cc/400?img=47",
      text: "Tra riunioni e scadenze non avevo mai tempo per allenarmi o cucinare sano. L'AI di MyWellness ha capito subito le mie esigenze: pasti pronti in 15 minuti e workout da 30 minuti. Ho perso 11kg in 5 mesi senza stress. La funzione che fotografa il piatto e calcola le calorie è geniale quando mangio fuori."
    },
    {
      name: "Thomas Weber",
      role: "Software Engineer",
      photo: "https://i.pravatar.cc/400?img=33",
      text: "Sono un tipo analitico e l'approccio scientifico di MyWellness mi ha conquistato. Dashboard con BMR, massa grassa, proiezioni peso... tutto calcolato con precisione. Il piano vegetariano è perfetto e la lista della spesa automatica mi fa risparmiare ore."
    },
    {
      name: "Anna Bianchi",
      role: "Insegnante Scuola Primaria",
      photo: "https://i.pravatar.cc/400?img=25",
      text: "Dopo la gravidanza pesavo 78kg e non riuscivo a tornare in forma. Ho scoperto MyWellness e in 6 mesi sono tornata a 58kg. L'app ha capito che avevo poco tempo con il neonato: workout brevi a casa senza attrezzi e ricette veloci. L'analisi fotografica mi ha motivata quando non vedevo progressi sulla bilancia."
    },
    {
      name: "Ahmed Hassan",
      role: "Imprenditore Edile",
      photo: "https://i.pravatar.cc/400?img=68",
      text: "A 45 anni pensavo fosse troppo tardi per rimettermi in forma. MyWellness mi ha dimostrato il contrario: ho guadagnato 9kg di massa muscolare in 7 mesi. Il piano di allenamento si adatta quando ho dolori articolari, cosa fondamentale alla mia età."
    },
    {
      name: "Elena Kowalski",
      role: "Avvocato Tributarista",
      photo: "https://i.pravatar.cc/400?img=38",
      text: "Ritmi lavorativi folli, cene con clienti, viaggi continui. MyWellness è l'unica app che è riuscita ad adattarsi al mio stile di vita caotico. Scatto foto dei pasti al ristorante e l'AI ricalcola tutto automaticamente. Ho perso 13kg mantenendo la mia vita sociale."
    },
    {
      name: "Marcus Johnson",
      role: "Personal Trainer Certificato",
      photo: "https://i.pravatar.cc/400?img=52",
      text: "Sono certificato da oltre 10 anni, e l'intelligenza artificiale di MyWellness genera schede migliori di quelle che creavo manualmente. La periodizzazione è scientifica e la progressione ottimale. Ho iniziato a usarla anche per i miei clienti - risparmio ore ogni settimana."
    },
    {
      name: "Francesca Moretti",
      role: "Farmacista",
      photo: "https://i.pravatar.cc/400?img=44",
      text: "Soffro di ipotiroidismo e perdere peso per me è sempre stato un incubo. Ho provato 20 diete diverse senza risultati. MyWellness ha calibrato il piano sul mio metabolismo rallentato: -12kg in 6 mesi senza soffrire la fame. Ora la consiglio a tutti i pazienti con problemi metabolici."
    },
    {
      name: "Diego Ramirez",
      role: "Chef de Cuisine",
      photo: "https://i.pravatar.cc/400?img=59",
      text: "Essere circondato dal cibo tutto il giorno rendeva impossibile seguire una dieta. MyWellness ha creato ricette che uniscono la mia passione culinaria con obiettivi nutrizionali precisi. Le ricette sono creative, bilanciate e deliziose. Ho perso 15kg senza rinunciare al piacere del cibo."
    },
    {
      name: "Luca Colombo",
      role: "CEO Startup Tech",
      photo: "https://i.pravatar.cc/400?img=12",
      text: "Non avevo tempo nemmeno per respirare, figuriamoci per allenarmi. MyWellness ha rivoluzionato il mio approccio: 30 minuti di workout 4 volte a settimana, pasti veloci e nutrienti. Ho perso 14kg in 4 mesi e i miei livelli di energia sono triplicati. È un investimento nella mia produttività."
    }
  ];

  const handleWatchDemo = () => {
    navigate(createPageUrl('Landing'));
  };

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();

      if (currentUser && currentUser.quiz_completed && 
          (currentUser.subscription_status === 'active' || currentUser.subscription_status === 'trial')) {
        navigate(createPageUrl('Dashboard'));
      } else {
        const quizPages = {
          'en': 'enquiz',
          'it': 'itquiz',
          'es': 'esquiz',
          'pt': 'ptquiz',
          'de': 'dequiz',
          'fr': 'frquiz'
        };
        navigate(createPageUrl(quizPages[language] || 'Quiz'));
      }
    } catch (error) {
      if (error?.response?.status !== 401 && !error?.message?.includes('401')) {
        console.error("Error during get started flow:", error);
      }
      const quizPages = {
        'en': 'enquiz',
        'it': 'itquiz',
        'es': 'esquiz',
        'pt': 'ptquiz',
        'de': 'dequiz',
        'fr': 'frquiz'
      };
      navigate(createPageUrl(quizPages[language] || 'Quiz'));
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    const quizPages = {
      'en': 'enquiz',
      'it': 'itquiz',
      'es': 'esquiz',
      'pt': 'ptquiz',
      'de': 'dequiz',
      'fr': 'frquiz'
    };
    const nextUrl = window.location.origin + createPageUrl(quizPages[language] || 'Quiz');
    base44.auth.redirectToLogin(nextUrl);
  };

  const handleQuizPopupStart = (gender) => {
    const quizDataKey = `quizData_${language}`;
    localStorage.setItem(quizDataKey, JSON.stringify({ gender }));
    setShowQuizPopup(false);
    const quizPages = {
      'en': 'enquiz',
      'it': 'itquiz',
      'es': 'esquiz',
      'pt': 'ptquiz',
      'de': 'dequiz',
      'fr': 'frquiz'
    };
    navigate(createPageUrl(quizPages[language] || 'Quiz'));
  };

  const handleQuizPopupClose = () => {
    setShowQuizPopup(false);
  };

  return (
    <div className="min-h-screen animated-gradient-bg overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&family=Poppins:wght@900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        html, body, #root {
          overflow-x: hidden !important;
          max-width: 100vw !important;
          position: relative;
        }
        
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5753;
        }

        @keyframes borderGradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
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
          animation: gradientShift 45s linear infinite;
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
          background: linear-gradient(135deg, rgba(249, 250, 251, 0.75) 0%, rgba(243, 244, 246, 0.65) 50%, rgba(249, 250, 241, 0.75) 100%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        .quiz-button-slide {
          animation: slideInFromRight 0.4s ease-out forwards;
        }

        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .mobile-floating-fade {
          animation: fadeInUp 0.3s ease-out forwards;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nav-expand {
          transition: all 0.4s ease-out;
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

        .burger-open .burger-line:first-child { top: 4px; transform: rotate(45deg); }
        .burger-open .burger-line:last-child { bottom: 4px; transform: rotate(-45deg); }

        .mobile-menu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease-out;
        }

        .mobile-menu.open {
          max-height: 300px;
        }

        .step-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 1rem;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .step-image-container:hover {
          transform: scale(1.02) translateY(-8px);
        }

        .step-image-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(38, 132, 127, 0.1) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 1;
        }

        .step-image-container:hover::before { opacity: 1; }

        .step-image {
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .step-image-container:hover .step-image {
          transform: scale(1.05);
        }

        .step-badge {
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(38, 132, 127, 0.2);
        }

        @media (max-width: 768px) {
          .animated-gradient-bg {
            animation: gradientShift 30s linear infinite;
            overflow-x: hidden;
          }
        }
      `}</style>

      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm md:w-auto md:max-w-none px-2 md:px-0">
        <div className={`hidden md:flex water-glass-effect rounded-full items-center nav-expand transition-all ${showNavQuizButton ? 'gap-8 pl-6 pr-6 py-[7px]' : 'gap-8 px-6 py-[7px]'}`}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-5 flex-shrink-0 cursor-pointer"
            onClick={() => navigate(createPageUrl('Home'))} />

          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => {
                const pricingPages = {
                  'en': 'pricing',
                  'it': 'itpricing',
                  'es': 'espricing',
                  'pt': 'ptpricing',
                  'de': 'depricing',
                  'fr': 'frpricing'
                };
                navigate(createPageUrl(pricingPages[language] || 'pricing'));
              }}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">
              {t('nav.pricing')}
            </button>
            <button
              onClick={() => {
                const blogPages = {
                  'en': 'Blog',
                  'it': 'itblog',
                  'es': 'esblog',
                  'pt': 'ptblog',
                  'de': 'deblog',
                  'fr': 'frblog'
                };
                navigate(createPageUrl(blogPages[language] || 'Blog'));
              }}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">
              {t('nav.blog')}
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
                    onClick={() => {
                      localStorage.setItem('preferred_language', lang.code);
                      setLanguage(lang.code);
                      window.location.pathname = '/' + lang.code;
                      setLangMenuOpen(false);
                    }}
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
                {t('nav.login')}
              </button>
            )}
            
            {showNavQuizButton &&
            <Button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white py-2 px-4 text-sm font-medium rounded-full quiz-button-slide whitespace-nowrap flex-shrink-0">
                {t('home.freeQuiz')}
              </Button>
            }
          </div>
        </div>

        <div className="md:hidden water-glass-effect px-6 py-1" style={{ borderRadius: '30px' }}>
          <div className="flex items-center justify-between">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
              alt="MyWellness"
              className="h-6 cursor-pointer"
              onClick={() => navigate(createPageUrl('Home'))} />
            
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
                          onClick={() => {
                            localStorage.setItem('preferred_language', lang.code);
                            setLanguage(lang.code);
                            window.location.pathname = '/' + lang.code;
                            setMobileLangMenuOpen(false);
                          }}
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
                  const pricingPages = {
                    'en': 'pricing',
                    'it': 'itpricing',
                    'es': 'espricing',
                    'pt': 'ptpricing',
                    'de': 'depricing',
                    'fr': 'frpricing'
                  };
                  navigate(createPageUrl(pricingPages[language] || 'pricing'));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                {t('nav.pricing')}
              </button>
              <button
                onClick={() => {
                  const blogPages = {
                    'en': 'Blog',
                    'it': 'itblog',
                    'es': 'esblog',
                    'pt': 'ptblog',
                    'de': 'deblog',
                    'fr': 'frblog'
                  };
                  navigate(createPageUrl(blogPages[language] || 'Blog'));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                {t('nav.blog')}
              </button>

              <div className="border-t border-gray-200/50 pt-3 mt-3">
                {user ? (
                  <Button
                    onClick={() => {
                      navigate(createPageUrl('Dashboard'));
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2">
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleLogin();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                      {t('nav.login')}
                    </button>
                    <Button
                      onClick={handleGetStarted}
                      disabled={isLoading}
                      className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2 mt-2">
                      {t('home.freeQuiz')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {showMobileFloatingButton &&
      <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-4 mobile-floating-fade">
          <Button
          onClick={handleGetStarted}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white rounded-full px-6 py-6 text-base font-semibold shadow-2xl">
            {t('home.freeQuiz')}
          </Button>
        </div>
      }

      <section className="pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-transparent border-2 border-transparent rounded-full text-sm shadow-lg" style={{
              backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #3b82f6 0%, #8b5cf6 25%, #a855f7 50%, #ec4899 75%, #3b82f6 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              backgroundSize: '100%, 300%',
              animation: 'borderGradientFlow 8s linear infinite'
            }}>
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-semibold" style={{
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 25%, #a855f7 50%, #ec4899 75%, #3b82f6 100%)',
                backgroundSize: '300% 100%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'borderGradientFlow 8s linear infinite'
              }}>
                {t('home.aiPowered')}
              </span>
            </div>
          </div>

          {/* iPhone 16 Pro Max con Body Scan Dashboard */}
          <div className="mb-12 flex justify-center px-4 md:px-0">
            <div className="relative w-full md:w-auto" style={{ width: 'calc(100% - 2rem)', maxWidth: '440px', height: '650px' }}>
              <style>{`
                @media (min-width: 768px) {
                  .iphone-container { width: 440px !important; }
                }
              `}</style>
              {/* iPhone Frame */}
              <div className="iphone-container absolute inset-0 rounded-[56px] bg-gradient-to-br from-gray-900 to-gray-700 shadow-2xl p-2">
                <div className="w-full h-full rounded-[52px] bg-black overflow-hidden relative">
                  {/* Dynamic Island */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-10" />
                  
                  {/* Screenshot Dashboard Body Scan */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-y-auto">
                    <div className="p-5 space-y-4">
                      {/* Status Bar */}
                      <div className="text-xs text-gray-600 text-center pt-2">2:41</div>

                      {/* Header */}
                      <div className="text-center">
                        <h2 className="text-3xl font-black text-gray-900">Body <span className="text-teal-500">Scan</span></h2>
                        <p className="text-xs text-gray-600 mt-2">Monitor your physical progress over time</p>
                      </div>

                      {/* Body Composition Analysis Title */}
                      <div className="mt-4">
                        <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Body Composition Analysis
                        </h3>

                        {/* Stats Grid 2x2 */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Biological Age - Green */}
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-3xl p-4">
                            <div className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                              👤 BIOLOGICAL AGE
                            </div>
                            <div className="text-3xl font-black text-emerald-600">23</div>
                            <div className="text-xs text-emerald-600 font-semibold">years</div>
                          </div>

                          {/* Somatotype - Purple */}
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-400 rounded-3xl p-4">
                            <div className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1">
                              👤 SOMATOTYPE
                            </div>
                            <div className="text-lg font-black text-purple-600">Mesomorph</div>
                          </div>

                          {/* Body Fat - Orange */}
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-400 rounded-3xl p-4">
                            <div className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1">
                              📊 BODY FAT %
                            </div>
                            <div className="text-3xl font-black text-orange-600">20%</div>
                          </div>

                          {/* Definition - Blue */}
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-400 rounded-3xl p-4">
                            <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
                              📐 DEFINITION
                            </div>
                            <div className="text-2xl font-black text-blue-600">65<span className="text-sm">/100</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1] px-2">
            {t('home.heroTitle1')} <span className="animated-text-gradient">{t('home.heroTitle2')}</span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            {t('home.heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-2">
            <Button
              ref={heroQuizButtonRef}
              onClick={handleGetStarted}
              disabled={isLoading}
              className="w-full sm:w-auto bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-full px-8 py-4 text-base font-semibold shadow-xl hover:shadow-2xl transition-all">
              {t('home.freeQuiz')}
            </Button>
            <Button
              onClick={handleWatchDemo}
              variant="outline"
              className="hidden w-full sm:w-auto border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] rounded-full px-6 py-3 text-sm font-medium">
              {t('home.watchDemo')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <div className="mt-16 pt-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center -space-x-3">
                <img src="https://i.pravatar.cc/400?img=29" alt="User" className="w-12 h-12 rounded-full border-3 border-white shadow-lg" />
                <img src="https://i.pravatar.cc/400?img=47" alt="User" className="w-12 h-12 rounded-full border-3 border-white shadow-lg" />
                <img src="https://i.pravatar.cc/400?img=33" alt="User" className="w-12 h-12 rounded-full border-3 border-white shadow-lg" />
                <img src="https://i.pravatar.cc/400?img=25" alt="User" className="w-12 h-12 rounded-full border-3 border-white shadow-lg" />
                <img src="https://i.pravatar.cc/400?img=68" alt="User" className="w-12 h-12 rounded-full border-3 border-white shadow-lg" />
                <div className="w-12 h-12 rounded-full border-3 border-white shadow-lg bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">{t('home.usedBy')}</p>
                <p className="text-3xl md:text-4xl font-black text-gray-900">
                  {liveStats.users.toLocaleString(language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-PT' : 'it-IT')} <span className="text-[var(--brand-primary)]">{t('home.people')}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{t('home.liveUpdate')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">{t('home.howItWorks')}</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('home.howItWorksSubtitle')}
              </p>
            </motion.div>
          </div>

          {/* Step 1 - Quick Actions Button */}
          <div className="w-full flex justify-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{ minHeight: '400px' }}
              className="flex items-center justify-center">
              <button
                className="rounded-full text-[#26847F] flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                style={{
                  width: '200px',
                  height: '200px',
                  backdropFilter: 'blur(12px) saturate(180%)',
                  background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.75) 0%, rgba(243, 244, 246, 0.65) 50%, rgba(249, 250, 241, 0.75) 100%)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}
              >
                <Plus className="w-24 h-24" strokeWidth={2.5} />
              </button>
            </motion.div>
          </div>

          {/* Camera Screenshots - 3 Features */}
          <div className="w-full mb-24 px-4">
            {/* Desktop: Grid normale */}
            <motion.div
              className="hidden md:grid grid-cols-3 gap-8 max-w-6xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Body Scan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col items-center"
              >
                <BodyScanCameraPreview />
                <h3 className="mt-6 text-xl font-bold text-gray-900">{t('home.bodyScanTitle')}</h3>
                <p className="mt-2 text-sm text-gray-600 text-center max-w-[280px]">{t('home.bodyScanDesc')}</p>
              </motion.div>

              {/* Calorie Counter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <CalorieCounterCameraPreview />
                <h3 className="mt-6 text-xl font-bold text-gray-900">{t('home.calorieCounterTitle')}</h3>
                <p className="mt-2 text-sm text-gray-600 text-center max-w-[280px]">{t('home.calorieCounterDesc')}</p>
              </motion.div>

              {/* Nutrition Scanner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col items-center"
              >
                <NutritionScannerCameraPreview />
                <h3 className="mt-6 text-xl font-bold text-gray-900">{t('home.nutritionScannerTitle')}</h3>
                <p className="mt-2 text-sm text-gray-600 text-center max-w-[280px]">{t('home.nutritionScannerDesc')}</p>
              </motion.div>
            </motion.div>

            {/* Mobile: Scroll orizzontale */}
            <div className="md:hidden overflow-x-auto pb-4 -mx-4">
              <div className="flex gap-6 px-4" style={{ width: 'max-content' }}>
                {/* Body Scan */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center"
                  style={{ width: '280px' }}
                >
                  <BodyScanCameraPreview />
                  <h3 className="mt-6 text-xl font-bold text-gray-900">{t('home.bodyScanTitle')}</h3>
                  <p className="mt-2 text-sm text-gray-600 text-center max-w-[280px]">{t('home.bodyScanDesc')}</p>
                </motion.div>

                {/* Calorie Counter */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-col items-center"
                  style={{ width: '280px' }}
                >
                  <CalorieCounterCameraPreview />
                  <h3 className="mt-6 text-xl font-bold text-gray-900">{t('home.calorieCounterTitle')}</h3>
                  <p className="mt-2 text-sm text-gray-600 text-center max-w-[280px]">{t('home.calorieCounterDesc')}</p>
                </motion.div>

                {/* Nutrition Scanner */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col items-center"
                  style={{ width: '280px' }}
                >
                  <NutritionScannerCameraPreview />
                  <h3 className="mt-6 text-xl font-bold text-gray-900">{t('home.nutritionScannerTitle')}</h3>
                  <p className="mt-2 text-sm text-gray-600 text-center max-w-[280px]">{t('home.nutritionScannerDesc')}</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Step 2 - Dashboard */}
          <motion.div
            className="mb-32"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">{t('home.step2Badge')}</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('home.step2Title')}
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                {t('home.step2Desc')}
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">{t('home.step2Tag1')}</span>
                <span className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">{t('home.step2Tag2')}</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-5xl mx-auto">
                <DashboardPreviewDemo />
              </div>
            </motion.div>
            </motion.div>



            {/* Step 3 - Meal Plan */}
            <motion.div
            className="grid md:grid-cols-2 gap-12 items-center mb-32"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              className="order-1 md:order-1"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">{t('home.step3Badge')}</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">{t('home.step3Title')}</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                {t('home.step3Desc')}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">{t('home.step3Tag1')}</span>
                <span className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">{t('home.step3Tag2')}</span>
                <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">{t('home.step3Tag3')}</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-2"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="w-full max-w-[calc(100vw-2rem)] md:max-w-md mx-auto px-2 md:px-0">
                <MealPlanPreviewDemo />
              </div>
            </motion.div>
          </motion.div>

          {/* Step 4 - Shopping List */}
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center mb-32"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">{t('home.step4Badge')}</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">{t('home.step4Title')}</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                {t('home.step4Desc')}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">{t('home.step4Tag1')}</span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{t('home.step4Tag2')}</span>
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">{t('home.step4Tag3')}</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-md mx-auto">
                <ShoppingListPreviewDemo />
              </div>
            </motion.div>
          </motion.div>

          {/* Step 5 - Ingredient Scanner */}
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center mb-32"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              className="order-1 md:order-1"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">{t('home.step5Badge')}</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">{t('home.step5Title')}</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                {t('home.step5Desc')}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">{t('home.step5Tag1')}</span>
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">{t('home.step5Tag2')}</span>
                <span className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">{t('home.step5Tag3')}</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-2"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-md mx-auto">
                <IngredientScannerPreviewDemo />
              </div>
            </motion.div>
          </motion.div>

          {/* Step 5.5 - Pantry Management */}
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center mb-32"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">{t('home.step6Badge')}</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">{t('home.step6Title')}</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                {t('home.step6Desc')}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">{t('home.step6Tag1')}</span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{t('home.step6Tag2')}</span>
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">{t('home.step6Tag3')}</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-md mx-auto">
                <PantryPreviewDemo />
              </div>
            </motion.div>
          </motion.div>







          {/* Step 8.5 - Sport Quiz */}
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center mb-32"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              className="order-1 md:order-1"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">{t('home.step10Badge')}</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">
                {t('home.step10Title')}
              </h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                {t('home.step10Desc')}
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <p className="text-gray-600 text-sm">{t('home.step10Detail1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <p className="text-gray-600 text-sm">{t('home.step10Detail2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <p className="text-gray-600 text-sm">{t('home.step10Detail3')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">{t('home.step10Tag1')}</span>
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">{t('home.step10Tag2')}</span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{t('home.step10Tag3')}</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-2"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-md mx-auto" style={{ height: '600px', minHeight: '600px', maxHeight: '600px' }}>
                <SportQuizPreviewDemo />
              </div>
            </motion.div>
          </motion.div>

          {/* Step 9 - Workout */}
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center mb-24"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">{t('home.step11Badge')}</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">
                {t('home.step11Title')}
              </h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                {t('home.step11Desc')}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-violet-50 text-violet-700 rounded-full text-sm font-medium">{t('home.step11Tag1')}</span>
                <span className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium">{t('home.step11Tag2')}</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-md mx-auto">
                <WorkoutPreviewDemo />
              </div>
            </motion.div>
          </motion.div>


        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900">
              {t('home.testimonialsTitle')}
            </h2>
          </div>

          <div className="relative pb-32">
            <div className="flex flex-wrap gap-6">
              {translations[language].pricing.testimonials.slice(0, window.innerWidth < 768 ? 6 : translations[language].pricing.testimonials.length).map((testimonial, index) => (
              <div
                key={index}
                className="water-glass-effect rounded-2xl p-6 border border-white/40 hover:border-white/60 transition-all w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/90 shadow-md flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                      <p className="text-xs text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {testimonial.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 text-center">
            <div className="inline-block">
              <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-4 flex items-baseline justify-center gap-2 sm:gap-3">
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: 'transparent',
                    WebkitTextStroke: '3px var(--brand-primary)',
                    textStroke: '3px var(--brand-primary)',
                    letterSpacing: '0.02em'
                  }}>
                  {liveStats.totalKg.toLocaleString(language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-PT' : 'it-IT')}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: 'transparent',
                    WebkitTextStroke: '3px var(--brand-primary)',
                    textStroke: '3px var(--brand-primary)',
                    letterSpacing: '0.02em'
                  }}>
                  kg
                </span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-semibold">
                {t('home.kgLost')}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                {t('home.avgPerUser')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 mb-4">
              <a
                href="https://projectmywellness.com/privacy"
                className="text-sm text-gray-600 hover:text-[var(--brand-primary)] transition-colors underline">
                {t('common.privacyPolicy')}
              </a>
              <a
                href="https://projectmywellness.com/terms"
                className="text-sm text-gray-600 hover:text-[var(--brand-primary)] transition-colors underline">
                {t('common.termsConditions')}
              </a>
            </div>
            <p className="text-sm font-semibold text-gray-700">
              © Copyright {new Date().getFullYear()}, All rights reserved
            </p>
          </div>
        </div>
      </footer>

      {/* Quiz Pop-up */}
      <Dialog open={showQuizPopup} onOpenChange={handleQuizPopupClose}>
        <DialogContent 
          hideClose={false}
          className="sm:max-w-[416px] rounded-3xl border-0 shadow-2xl p-0 overflow-hidden"
          style={{
            background: 'white'
          }}
        >
          <div className="relative bg-white">
            {/* Progress Bar */}
            <div className="h-0.5 bg-gray-200 w-full">
              <div className="h-full bg-gray-800 w-[8%] transition-all" />
            </div>

            {/* Contenuto */}
            <div className="px-6 py-8">
              {/* Titolo principale */}
              <h3 className="text-2xl font-bold text-left mb-2 text-gray-900">
                {t('home.popupTitle1')} <span className="text-[var(--brand-primary)]">{t('home.popupTitle2')}</span>
              </h3>

              {/* Sottotitolo */}
              <p className="text-left text-gray-600 text-sm mb-6">
                {t('home.popupSubtitle')} <strong className="text-gray-900">{t('home.popupSubtitle2')}</strong> {t('home.popupSubtitle3')}
              </p>

              {/* Label */}
              <p className="text-center text-sm font-medium text-gray-900 mb-4">
                {t('home.popupGenderLabel')}
              </p>

              {/* Scelta Genere - Layout Verticale */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleQuizPopupStart('male')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl p-4 transition-all"
                >
                  <div className="text-center">
                    <div className="font-medium text-base">{t('home.popupMale')}</div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuizPopupStart('female')}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-4 transition-all"
                >
                  <div className="text-center">
                    <div className="font-medium text-base">{t('home.popupFemale')}</div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuizPopupStart('other')}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-4 transition-all"
                >
                  <div className="text-center">
                    <div className="font-medium text-base">{t('home.popupOther')}</div>
                  </div>
                </button>
              </div>

              {/* Footer con bullet points */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <div className="space-y-2.5 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⏱️</span>
                    <span>{t('home.popupBullet1').replace('⏱️ ', '')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎯</span>
                    <span>{t('home.popupBullet2').replace('🎯 ', '')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📊</span>
                    <span>{t('home.popupBullet3').replace('📊 ', '')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const currentPath = window.location.pathname.toLowerCase();
    
    // Redirect solo se siamo esattamente su '/' o '/home'
    if (currentPath === '/' || currentPath === '/home') {
      const savedLang = localStorage.getItem('preferred_language');

      if (!savedLang) {
        // Rileva lingua da timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneToLanguage = {
          'Europe/Rome': 'it', 'Europe/Vatican': 'it', 'Europe/San_Marino': 'it',
          'Europe/Madrid': 'es', 'America/Mexico_City': 'es', 'America/Buenos_Aires': 'es', 
          'America/Bogota': 'es', 'America/Lima': 'es', 'America/Santiago': 'es',
          'America/Caracas': 'es', 'America/Guayaquil': 'es', 'America/La_Paz': 'es',
          'America/Sao_Paulo': 'pt', 'Europe/Lisbon': 'pt', 'Atlantic/Azores': 'pt',
          'America/Rio_Branco': 'pt', 'America/Fortaleza': 'pt',
          'Europe/Berlin': 'de', 'Europe/Vienna': 'de', 'Europe/Zurich': 'de',
          'Europe/Paris': 'fr', 'Europe/Brussels': 'fr', 'Europe/Luxembourg': 'fr',
          'Africa/Abidjan': 'fr', 'Africa/Dakar': 'fr', 'America/Montreal': 'fr'
        };

        let detectedLang = timezoneToLanguage[timezone];

        if (!detectedLang) {
          const browserLang = navigator.language.toLowerCase().split('-')[0];
          const supportedLangs = ['it', 'en', 'es', 'pt', 'de', 'fr'];
          detectedLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
        }

        localStorage.setItem('preferred_language', detectedLang);
        window.location.href = '/' + detectedLang;
      } else if (['it', 'en', 'es', 'pt', 'de', 'fr'].includes(savedLang)) {
        window.location.href = '/' + savedLang;
      }
    }
  }, [navigate]);

  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}

export { HomeContent };