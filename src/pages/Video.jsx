import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Video() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!isLoading) {
      // Dopo 2 secondi nascondi l'intro e mostra il video
      const timer = setTimeout(() => {
        setShowIntro(false);
        setShowVideo(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap');
        
        @keyframes smoothFadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes textGradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .intro-text {
          animation: smoothFadeInUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          font-family: 'Inter', sans-serif;
          background: linear-gradient(90deg, #26847F, #14b8a6, #10b981, #14b8a6, #26847F);
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: smoothFadeInUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     textGradientFlow 4s ease-in-out infinite;
          white-space: nowrap;
        }
      `}</style>

      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4"
          >
            <h1 className="intro-text text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black">
              Immagina di poter cambiare il tuo corpo.
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {showVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-screen flex items-center justify-center"
        >
          {/* Qui andrà il video */}
        </motion.div>
      )}
    </div>
  );
}