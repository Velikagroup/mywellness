import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Se siamo su `/` redirect alla lingua italiana di default
    if (window.location.pathname === '/') {
      try {
        const savedLang = localStorage.getItem('preferred_language') || 'it';
        const supportedLangs = ['it', 'en', 'es', 'pt', 'de', 'fr'];
        const lang = supportedLangs.includes(savedLang) ? savedLang : 'it';
        window.location.replace('/' + lang);
      } catch (error) {
        console.error('Redirect error:', error);
        window.location.replace('/it');
      }
    }
  }, []);

  return (
    <div className="min-h-screen animated-gradient-bg flex items-center justify-center px-6 py-32 md:py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5753;
        }
        
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

        .number-404 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 10rem;
          font-weight: 900;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 3px var(--brand-primary);
          text-stroke: 3px var(--brand-primary);
          letter-spacing: 0.02em;
        }

        @media (max-width: 768px) {
          .number-404 {
            font-size: 6rem;
            -webkit-text-stroke: 2px var(--brand-primary);
            text-stroke: 2px var(--brand-primary);
          }
        }

        .float-animation {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>

      {/* Fixed Logo Navbar */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="water-glass-effect rounded-full px-6 py-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-6 cursor-pointer"
            onClick={() => navigate(createPageUrl('Home'))}
          />
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="water-glass-effect rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Icona animata */}
          <motion.div
            className="float-animation mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 rounded-full flex items-center justify-center shadow-xl">
              <Search className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Numero 404 gigante */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <h1 className="number-404">404</h1>
          </motion.div>

          {/* Titolo */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Ops! Pagina Non Trovata
          </motion.h2>

          {/* Descrizione */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed"
          >
            Sembra che la pagina che stai cercando non esista o sia stata spostata. 
            Non preoccuparti, il tuo percorso wellness continua!
          </motion.p>

          {/* Bottoni */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              onClick={() => navigate(createPageUrl('Home'))}
              className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all"
            >
              <Home className="w-5 h-5 mr-2" />
              Torna alla Home
            </Button>

            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] px-8 py-6 text-lg font-semibold rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Torna Indietro
            </Button>
          </motion.div>

          {/* Suggerimenti */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 pt-8 border-t border-gray-200/50"
          >
            <p className="text-sm text-gray-500 mb-4 font-semibold">
              Forse stavi cercando:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="px-4 py-2 bg-white/50 hover:bg-white/80 rounded-full text-sm text-gray-700 hover:text-[var(--brand-primary)] transition-all border border-gray-200/50 hover:border-[var(--brand-primary)]/30"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate(createPageUrl('Meals'))}
                className="px-4 py-2 bg-white/50 hover:bg-white/80 rounded-full text-sm text-gray-700 hover:text-[var(--brand-primary)] transition-all border border-gray-200/50 hover:border-[var(--brand-primary)]/30"
              >
                Piano Nutrizionale
              </button>
              <button
                onClick={() => navigate(createPageUrl('Workouts'))}
                className="px-4 py-2 bg-white/50 hover:bg-white/80 rounded-full text-sm text-gray-700 hover:text-[var(--brand-primary)] transition-all border border-gray-200/50 hover:border-[var(--brand-primary)]/30"
              >
                Allenamento
              </button>
              <button
                onClick={() => navigate(createPageUrl('pricing'))}
                className="px-4 py-2 bg-white/50 hover:bg-white/80 rounded-full text-sm text-gray-700 hover:text-[var(--brand-primary)] transition-all border border-gray-200/50 hover:border-[var(--brand-primary)]/30"
              >
                Piani e Prezzi
              </button>
            </div>
          </motion.div>
        </div>

        {/* Footer messaggio divertente */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-sm text-gray-500 mt-8"
        >
          💪 Ricorda: anche quando ti perdi, ogni passo conta verso il tuo obiettivo!
        </motion.p>
      </motion.div>
    </div>
  );
}