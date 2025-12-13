import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';

export default function Video() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [visibleWords, setVisibleWords] = useState(0);

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
    if (!isLoading && showIntro) {
      // Reset visible words
      setVisibleWords(0);

      // Show words one by one
      const words = ["Immagina", "di", "poter", "cambiare", "il", "tuo", "corpo"];
      words.forEach((_, index) => {
        setTimeout(() => {
          setVisibleWords(index + 1);
        }, index * 120);
      });

      // Dopo tutte le parole, nascondi l'intro e mostra il video
      const timer = setTimeout(() => {
        setShowIntro(false);
        setShowVideo(true);
      }, words.length * 120 + 4500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, showIntro, animationKey]);

  const restartAnimation = () => {
    setShowVideo(false);
    setShowIntro(true);
    setAnimationKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap');
        
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

        @keyframes smoothTextReveal {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .animated-gradient-text {
          font-family: 'Inter', sans-serif;
          background: 
            radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
            radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, #d4bbff 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
            radial-gradient(circle at 90% 85%, #e0ccff 0%, transparent 50%);
          background-size: 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 3s linear infinite, smoothTextReveal 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          white-space: nowrap;
        }
      `}</style>

      <div className="relative w-full max-w-7xl bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
        <AnimatePresence key={animationKey}>
          {showIntro && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex items-center justify-center z-50 px-4 md:px-12 overflow-hidden"
              style={{
                background: 'white'
              }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0.3 }}
                animate={{ scale: 40, opacity: 1 }}
                transition={{ 
                  delay: 1.5,
                  duration: 3.5,
                  ease: [0.19, 1.0, 0.22, 1.0]
                }}
                className="absolute top-1/2 left-1/2 pointer-events-none"
                style={{
                  width: '150px',
                  height: '150px',
                  marginLeft: '-75px',
                  marginTop: '-75px',
                  borderRadius: '50%',
                  background: `
                    radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
                    radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
                    radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
                    radial-gradient(circle at 70% 60%, #d4bbff 0%, transparent 50%),
                    radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
                    radial-gradient(circle at 90% 85%, #e0ccff 0%, transparent 50%)
                  `,
                  backgroundSize: '250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%',
                  animation: 'gradientShift 3s linear infinite',
                  filter: 'blur(80px)'
                }}
              />
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold flex items-center justify-center leading-relaxed pb-[2.625rem]"
            >
              {["Immagina", "di", "poter", "cambiare", "il", "tuo", "corpo"].slice(0, visibleWords).map((word, index) => (
                  <motion.span
                    key={index}
                    initial={{ 
                      opacity: 0,
                      filter: "blur(4px)"
                    }}
                    animate={{ 
                      opacity: 1,
                      filter: "blur(0px)"
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.19, 1.0, 0.22, 1.0]
                    }}
                    className="animated-gradient-text inline-block mr-3 sm:mr-4"
                  >
                    {word}
                  </motion.span>
                ))}
            </motion.h1>
          </motion.div>
          )}
          </AnimatePresence>

          {showVideo && (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full flex items-center justify-center bg-white"
          >
          <button
            onClick={restartAnimation}
            className="bg-[#26847F] hover:bg-[#1f6b66] text-white rounded-full p-8 shadow-2xl transition-all hover:scale-110"
            aria-label="Riavvia animazione"
          >
            <Play className="w-20 h-20" fill="currentColor" />
          </button>
          </motion.div>
          )}
          </div>
          </div>
          );
}