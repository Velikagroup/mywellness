import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function OneTimeOffer() {
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    document.title = "Offerta Esclusiva - MyWellness";
    window.scrollTo(0, 0);
  }, []);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const { data } = await base44.functions.invoke('stripeProcessOTO');
      
      if (data.success) {
        alert('🎉 Pagamento completato! Benvenuto in Premium per 12 mesi!');
        navigate(createPageUrl('Dashboard'));
      } else {
        alert(data.error || 'Errore durante il pagamento. Riprova.');
        setIsAccepting(false);
      }
    } catch (error) {
      console.error('Error processing OTO:', error);
      alert(error.response?.data?.error || 'Errore durante il pagamento. Riprova.');
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await base44.auth.updateMe({ order_bump_selected: false });
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Error declining OTO:', error);
      alert('Errore. Riprova.');
      setIsDeclining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#26847F] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 40px rgba(38, 132, 127, 0.4); }
          50% { box-shadow: 0 0 60px rgba(38, 132, 127, 0.6); }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes progress-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-[#26847F]/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl w-full relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-pulse-glow">
          {/* Header Badge */}
          <div className="bg-gradient-to-r from-[#26847F] via-teal-500 to-emerald-500 text-white text-center py-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            <p className="text-sm font-black uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              Offerta Esclusiva Una Tantum
              <Sparkles className="w-5 h-5 animate-pulse" />
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-6 md:px-12 pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-gray-700">Sei quasi alla fine!</span>
                <span className="font-black text-[#26847F] text-lg">75%</span>
              </div>
              <Progress value={75} className="h-3 bg-gray-200 [&>div]:!bg-gradient-to-r [&>div]:!from-[#26847F] [&>div]:!via-[#7dd3c0] [&>div]:!to-[#26847F] [&>div]:!bg-[length:200%_100%] [&>div]:animate-[progress-shimmer_3s_ease-in-out_infinite]" />
              <p className="text-xs text-gray-500 text-center">Un ultimo passo per completare il tuo anno Premium</p>
            </div>
          </div>

          <div className="p-6 md:p-12 pt-6 text-center">
          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-[#26847F] to-teal-600 mb-6 leading-tight"
          >
            Completa il Tuo Anno<br />
            Premium con Solo 99€
          </motion.h1>

          {/* Visual Calendar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-slate-50 via-white to-teal-50 rounded-3xl p-6 md:p-8 mb-8 shadow-lg border border-gray-100"
          >
            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-6 flex items-center justify-center gap-2">
              <span className="text-2xl">📅</span>
              Il Tuo Anno Premium Completo
            </h3>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">
              {[...Array(12)].map((_, i) => {
                const isAlreadyOwned = i < 3;
                const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className={`relative rounded-2xl p-4 text-center transition-all hover:scale-105 ${
                      isAlreadyOwned 
                        ? 'bg-gradient-to-br from-[#26847F] to-teal-600 text-white shadow-xl' 
                        : 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white shadow-xl animate-pulse'
                    }`}
                  >
                    <div className="text-sm font-bold mb-1">{monthNames[i]}</div>
                    <div className="text-[11px] font-semibold opacity-90">
                      {isAlreadyOwned ? '✓ Tuo' : '🔥 Ora'}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-md">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#26847F] to-teal-600 shadow-md"></div>
                <span className="text-sm text-gray-700 font-semibold">3 Mesi Già Tuoi</span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-md">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 shadow-md animate-pulse"></div>
                <span className="text-sm text-gray-700 font-semibold">9 Mesi Ora</span>
              </div>
            </div>

            <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              <p className="text-sm font-bold mb-2 relative z-10">Il Tuo Risparmio Incredibile:</p>
              <div className="flex items-center justify-center gap-4 mb-3 relative z-10">
                <span className="text-3xl text-white/60 line-through font-bold">351€</span>
                <span className="text-5xl font-black">99€</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 relative z-10">
                <span className="text-2xl">🎉</span>
                <span className="text-lg font-black">Oltre il 70% di SCONTO!</span>
              </div>
            </div>
          </motion.div>

          {/* Premium Features */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 bg-gradient-to-br from-slate-50 to-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-7 h-7 text-[#26847F] animate-pulse" />
              <h3 className="font-black text-gray-900 text-xl md:text-2xl">Piano Premium Include:</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Generazioni ILLIMITATE piani nutrizionali e allenamento',
                'Analisi progressi con foto AI',
                'Scansione etichette con Health Score AI',
                'Modifica schede AI per imprevisti',
                'Supporto prioritario'
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <CheckCircle className="w-6 h-6 text-[#26847F] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-left text-sm font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Highlight Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-3xl p-6 mb-8 overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            <div className="relative z-10">
              <p className="text-xl md:text-2xl font-black text-gray-900 flex items-center justify-center gap-2">
                <span className="text-3xl">💰</span>
                Un Anno Intero Premium
              </p>
              <p className="text-5xl md:text-6xl font-black text-white drop-shadow-lg mt-2">Solo 99€</p>
              <p className="text-base md:text-lg text-gray-900 font-bold mt-3 bg-white/40 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                Invece di 351€ (risparmi 252€)
              </p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
              className="w-full h-20 text-xl md:text-2xl font-black bg-gradient-to-r from-[#26847F] via-teal-500 to-emerald-500 hover:from-[#1f6b66] hover:via-teal-600 hover:to-emerald-600 text-white shadow-2xl mb-6 rounded-2xl transition-all hover:scale-105 hover:shadow-3xl relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></span>
              <span className="relative z-10">
                {isAccepting ? 'Elaborazione...' : 'Sì, Voglio Premium a 99€'}
              </span>
            </Button>

            {/* Decline Link */}
            <button
              onClick={handleDecline}
              disabled={isAccepting || isDeclining}
              className="text-sm text-gray-400 hover:text-gray-600 underline disabled:opacity-50 transition-colors mb-6"
            >
              {isDeclining ? 'Reindirizzamento...' : 'No grazie, non sono interessato'}
            </button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-lg">💳</span>
                </div>
                <span className="text-xs font-semibold">Pagamento<br/>Sicuro</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
                <span className="text-xs font-semibold">Garanzia<br/>30 giorni</span>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}