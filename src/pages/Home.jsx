import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from "@/api/base44Client";
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
  Users
} from 'lucide-react';
import { motion, useScroll, useTransform } from "framer-motion";
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

export default function Home() {
  const navigate = useNavigate();
  const [showNavQuizButton, setShowNavQuizButton] = useState(false);
  const [showMobileFloatingButton, setShowMobileFloatingButton] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroQuizButtonRef = useRef(null);

  const [liveStats, setLiveStats] = useState({ users: 0, totalKg: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [showQuizPopup, setShowQuizPopup] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

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
        navigate(createPageUrl('Quiz'));
      }
    } catch (error) {
      if (error?.response?.status !== 401 && !error?.message?.includes('401')) {
        console.error("Error during get started flow:", error);
      }
      navigate(createPageUrl('Quiz'));
    }
    setIsLoading(false);
  };

  const handleQuizPopupStart = (gender) => {
    localStorage.setItem('quizData', JSON.stringify({ gender }));
    setShowQuizPopup(false);
    navigate(createPageUrl('Quiz'));
  };

  const handleQuizPopupClose = () => {
    setShowQuizPopup(false);
  };

  const handleLogin = async () => {
    const quizUrl = window.location.origin + createPageUrl('Quiz');
    await base44.auth.redirectToLogin(quizUrl);
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
        <div className={`hidden md:flex water-glass-effect rounded-full items-center nav-expand transition-all ${showNavQuizButton ? 'gap-8 pl-6 pr-6 py-3' : 'gap-8 px-6 py-3'}`}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-5 flex-shrink-0" />

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
            <Button
              onClick={handleLogin}
              variant="ghost"
              size="sm"
              className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap">
              Log-in
            </Button>
            
            {showNavQuizButton &&
            <Button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white py-2 px-4 text-sm font-medium rounded-full quiz-button-slide whitespace-nowrap flex-shrink-0">
                Quiz Gratuito
              </Button>
            }
          </div>
        </div>

        <div className="md:hidden water-glass-effect rounded-3xl px-6 py-3">
          <div className="flex items-center justify-between">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
              alt="MyWellness"
              className="h-6" />
            
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
                onClick={handleLogin}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                Log-in
              </button>
              <Button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2">
                Quiz Gratuito
              </Button>
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
            Quiz Gratuito
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
                Alimentato da Intelligenza Artificiale
              </span>
            </div>
          </div>
          
          <div className="mb-8 md:mb-12">
            <AppDemoFlow />
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1] px-2">
            Il tuo percorso <span className="animated-text-gradient">Wellness</span>,
            guidato dall'<span className="animated-text-gradient">AI</span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            Piani nutrizionali e allenamenti personalizzati, creati dall'intelligenza artificiale e adattati in tempo reale ai tuoi progressi.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-2">
            <Button
              ref={heroQuizButtonRef}
              onClick={handleGetStarted}
              disabled={isLoading}
              className="w-full sm:w-auto bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-full px-8 py-4 text-base font-semibold shadow-xl hover:shadow-2xl transition-all">
              Quiz Gratuito
            </Button>
            <Button
              onClick={handleWatchDemo}
              variant="outline"
              className="hidden w-full sm:w-auto border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] rounded-full px-6 py-3 text-sm font-medium">
              Guarda Demo
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
                <p className="text-sm text-gray-500 mb-1">Utilizzato da oltre</p>
                <p className="text-3xl md:text-4xl font-black text-gray-900">
                  {liveStats.users.toLocaleString('it-IT')} <span className="text-[var(--brand-primary)]">persone</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">🔥 Aggiornamento in tempo reale</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Come Funziona</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Un percorso guidato dall'intelligenza artificiale in 6 step
              </p>
            </motion.div>
          </div>

          {/* Step 1 - Quiz */}
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center mb-32"
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
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">📋 Assessment Iniziale</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Quiz Personalizzato</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                Rispondi a domande mirate su peso, altezza, obiettivi e preferenze. L'AI crea il tuo profilo metabolico completo.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">⚡ 3 minuti</span>
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">🎯 100% Personalizzato</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-md mx-auto">
                <QuizPreviewDemo />
              </div>
            </motion.div>
          </motion.div>

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
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">📊 Analisi Scientifica</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Dashboard Scientifica
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                Visualizza BMR, fabbisogno calorico, massa grassa e proiezioni obiettivi in tempo reale.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">🔬 Calcoli Precisi</span>
                <span className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">📈 Tracking Live</span>
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
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">🍽️ Nutrizione AI</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Pasti Personalizzati</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                Piano settimanale completo: ricette con foto AI, ingredienti esatti, macro nutrizionali e lista della spesa automatica.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">🤖 Ricette AI</span>
                <span className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">🛒 Lista Spesa</span>
                <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">📸 Foto Realistiche</span>
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
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">🛒 Spesa Smart</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Lista della Spesa AI</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                L'AI genera automaticamente la lista della spesa settimanale, organizzata per categorie di acquisto e ottimizzata per i tuoi pasti.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">📊 Auto-generata</span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">🗂️ Categorie Smart</span>
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">✅ Tracking Acquisti</span>
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
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">📱 Scansione Smart</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Scanner Ingredienti</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                Scansiona barcode o etichette nutrizionali degli alimenti che hai in frigorifero. L'AI inserisce automaticamente i valori REALI nel tuo piano, non supposizioni generiche.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">📊 Database 500k+ alimenti</span>
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">🎯 Valori Precisi</span>
                <span className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">⚡ Inserimento Automatico</span>
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
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">📦 Gestione Intelligente</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Dispensa AI</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                Fotografa gli alimenti in casa: l'AI crea un catalogo completo con kcal e macro precisi. Il piano nutrizionale si rigenera utilizzando prioritariamente ciò che hai già, riducendo sprechi e costi.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">📸 Catalogazione Automatica</span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">🎯 Valori Precisi</span>
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">♻️ Zero Sprechi</span>
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

          {/* Step 6 - Health Score */}
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center mb-32"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              className="order-1 md:order-1"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">🏷️ Scansione Etichette</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Health Score AI</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                Scansiona etichette nutrizionali: l'AI assegna uno score 0-10 e ti dice se quel prodotto è sano per i tuoi obiettivi.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">🔬 Analisi Scientifica</span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">📊 Score 0-10</span>
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">💡 Raccomandazioni AI</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-2"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-md mx-auto">
                <HealthScorePreviewDemo />
              </div>
            </motion.div>
          </motion.div>

        {/* Step 7 - Meal Tracking */}
        <motion.div
          className="grid md:grid-cols-2 gap-12 items-center mb-32"
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
                <span className="text-sm font-semibold text-[var(--brand-primary)]">✓ Tracking Smart</span>
              </div>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Segna i Pasti</h3>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
              Spunta semplicemente i pasti che mangi per un tracking base. Vuoi essere più preciso? Scatta una foto per quantità esatte e macro perfettamente allineati.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">✓ Spunta Base</span>
              <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">📸 Foto Opzionale</span>
              <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">🎯 Precisione Massima</span>
            </div>
          </motion.div>
          <motion.div
            className="order-2 md:order-1"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}>
            <div className="max-w-md mx-auto">
              <MealTrackingPreviewDemo />
            </div>
          </motion.div>
        </motion.div>

        {/* Step 8 - Photo Analyzer */}
        <motion.div
          className="grid md:grid-cols-2 gap-12 items-center mb-32"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}>
          <motion.div
            className="order-1 md:order-1"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}>
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <div className="step-badge px-4 py-2 rounded-full">
                <span className="text-sm font-semibold text-[var(--brand-primary)]">📷 Computer Vision</span>
              </div>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Conto Calorico AI</h3>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
              Scatta foto dei pasti: l'AI analizza calorie e macro. Se vai oltre, i piani nutrizionali e di allenamento si ribilanciano automaticamente.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">🔍 Riconoscimento Cibo</span>
              <span className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium">⚖️ Ribilanciamento Automatico</span>
            </div>
          </motion.div>
          <motion.div
            className="order-2 md:order-2"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}>
            <div className="max-w-md mx-auto">
              <PhotoAnalyzerPreviewDemo />
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
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">🏆 Sport-Specific Training</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">
                Allenamento per il Tuo Sport
              </h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                Pratichi calcio, tennis, basket o qualsiasi altro sport? Il quiz ti chiede quale sport pratichi e crea un <strong>programma di allenamento specifico</strong> per migliorare le tue prestazioni in campo.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚽</span>
                  <p className="text-gray-600 text-sm"><strong>Calcio:</strong> Esplosività, resistenza, cambi di direzione</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🎾</span>
                  <p className="text-gray-600 text-sm"><strong>Tennis:</strong> Potenza del braccio, agilità, core stability</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🏀</span>
                  <p className="text-gray-600 text-sm"><strong>Basket:</strong> Salto, velocità, resistenza aerobica</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">🎯 60+ Sport Supportati</span>
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">💪 Palestra Inclusa</span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">📈 Periodizzazione</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-md mx-auto">
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
              className="order-1 md:order-1"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="step-badge px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">💪 Fitness AI</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">
                Workout su Misura
              </h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                Schede settimanali personalizzate con warm-up e cool-down, analisi AI dei progressi e modifiche immediate della scheda in caso di dolori o impedimenti.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-violet-50 text-violet-700 rounded-full text-sm font-medium">🎯 Progressione Adattiva</span>
                <span className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium">📸 Analisi Progressi AI</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-2"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-md mx-auto">
                <WorkoutPreviewDemo />
              </div>
            </motion.div>
          </motion.div>

          {/* Step 10 - Progress Photo Analysis */}
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
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">🔬 Analisi Scientifica</span>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">Personal Trainer AI</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed text-center md:text-left">
                Carica foto della zona target: l'AI analizza scientificamente i progressi confrontando pelle, grasso, definizione muscolare. Ti suggerisce modifiche nutrizionali e di allenamento che puoi applicare ai tuoi piani.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">📸 Confronto Prima/Dopo</span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">🔬 Analisi Dettagliata</span>
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">💡 Suggerimenti Personalizzati</span>
              </div>
            </motion.div>
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="max-w-4xl mx-auto">
                <ProgressPhotoPreviewDemo />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900">
              Cosa Dicono i Nostri Utenti.
            </h2>
          </div>

          <div className="relative pb-32">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
              {testimonials.slice(0, window.innerWidth < 768 ? 6 : testimonials.length).map((testimonial, index) => (
              <div
                key={index}
                className="water-glass-effect rounded-2xl p-6 border border-white/40 hover:border-white/60 transition-all break-inside-avoid mb-6">
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
                  {liveStats.totalKg.toLocaleString('it-IT')}
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
                persi dai nostri utenti
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                🔥 Media: 4.5kg per utente • Aggiornamento in tempo reale
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 mb-4">
              <button
                onClick={() => navigate(createPageUrl('Privacy'))}
                className="text-sm text-gray-600 hover:text-[var(--brand-primary)] transition-colors underline">
                Privacy Policy
              </button>
              <button
                onClick={() => navigate(createPageUrl('Terms'))}
                className="text-sm text-gray-600 hover:text-[var(--brand-primary)] transition-colors underline">
                Termini e Condizioni
              </button>
            </div>
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

      {/* Quiz Pop-up */}
      <Dialog open={showQuizPopup} onOpenChange={handleQuizPopupClose}>
        <DialogContent 
          className="sm:max-w-lg rounded-3xl border-0 shadow-2xl p-0 overflow-hidden"
          style={{
            background: '#f9fafb',
            backgroundImage: `
              radial-gradient(circle at 10% 20%, #f5f9ff 0%, transparent 50%),
              radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
              radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, #d4bbff 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
              radial-gradient(circle at 90% 85%, #e0ccff 0%, transparent 50%)
            `,
            backgroundSize: '250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%',
            animation: 'gradientShift 45s ease-in-out infinite'
          }}
        >
          <div className="relative">
            {/* Progress Bar */}
            <div className="h-2 bg-gray-100">
              <div className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-400 w-[8%] rounded-r-full transition-all" />
            </div>

            {/* Progress Text */}
            <div className="px-8 pt-6 pb-2">
              <p className="text-sm text-gray-600 text-center">1 / 12 domande completate</p>
            </div>

            {/* Contenuto */}
            <div className="px-8 py-6">
              {/* Icona centrale */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand-primary)] to-teal-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Titolo principale */}
              <h3 className="text-3xl font-bold text-center mb-3">
                Scopri la tua <span className="animated-text-gradient">massa grassa</span>
              </h3>

              {/* Sottotitolo */}
              <p className="text-center text-gray-600 mb-6">
                e costruisci il <strong>piano nutrizionale</strong> fatto su misura per te
              </p>

              {/* Label */}
              <p className="text-center text-sm font-semibold text-gray-700 mb-4">
                Seleziona il tuo sesso:
              </p>

              {/* Scelta Genere - Style Minimale come nell'immagine */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => handleQuizPopupStart('male')}
                  className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[var(--brand-primary)] rounded-2xl p-6 transition-all hover:shadow-md"
                >
                  <div className="text-center space-y-2">
                    <div className="text-4xl mb-1">👨</div>
                    <div className="font-semibold text-gray-900">Uomo</div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuizPopupStart('female')}
                  className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[var(--brand-primary)] rounded-2xl p-6 transition-all hover:shadow-md"
                >
                  <div className="text-center space-y-2">
                    <div className="text-4xl mb-1">👩</div>
                    <div className="font-semibold text-gray-900">Donna</div>
                  </div>
                </button>
              </div>

              {/* Footer con bullet points */}
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base">⏱️</span>
                    <span>Richiede solo 3 minuti</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base">🎯</span>
                    <span>Calcoli scientifici precisi</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base">📊</span>
                    <span>I tuoi dati sono privati e sicuri</span>
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