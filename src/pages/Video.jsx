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
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .intro-text {
          animation: fadeInScale 0.8s ease-out forwards;
        }
      `}</style>

      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          >
            <h1 className="intro-text text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center px-8 leading-tight">
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