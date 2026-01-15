import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
      await base44.auth.updateMe({ order_bump_selected: true });
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Error accepting OTO:', error);
      alert('Errore durante l\'accettazione. Riprova.');
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
    <div className="min-h-screen bg-gradient-to-br from-[#26847F]/5 via-white to-teal-50 flex items-center justify-center px-4 py-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-[#26847F]"
      >
        {/* Header Badge */}
        <div className="bg-gradient-to-r from-[#26847F] to-teal-500 text-white text-center py-3">
          <p className="text-sm font-bold uppercase tracking-wider">✨ Offerta Esclusiva Una Tantum ✨</p>
        </div>

        <div className="p-8 md:p-12 text-center">
          {/* Main Headline */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
            Completa il Tuo Anno<br />
            <span className="text-[#26847F]">Premium</span> con Solo <span className="text-[#26847F]">99€</span>
          </h1>

          {/* Calculation Breakdown */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="text-center">
                <div className="text-5xl font-black text-[#26847F]">3</div>
                <div className="text-xs text-gray-600 font-medium mt-1">Già Acquistati</div>
              </div>
              <div className="text-4xl text-gray-400 font-bold">+</div>
              <div className="text-center">
                <div className="text-5xl font-black text-gray-900">9</div>
                <div className="text-xs text-gray-600 font-medium mt-1">Con Questa Offerta</div>
              </div>
              <div className="text-4xl text-gray-400 font-bold">=</div>
              <div className="text-center">
                <div className="text-5xl font-black text-green-600">12</div>
                <div className="text-xs text-gray-600 font-medium mt-1">Mesi Premium</div>
              </div>
            </div>

            <div className="border-t-2 border-gray-300 pt-4 mt-4">
              <p className="text-gray-700 font-semibold mb-2">Il Tuo Risparmio:</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl text-gray-400 line-through">22€/mese</span>
                <span className="text-4xl font-black text-[#26847F]">11€/mese</span>
              </div>
              <p className="text-sm text-green-700 font-bold mt-2">🎉 Dimezzi il costo mensile!</p>
            </div>
          </div>

          {/* Premium Features */}
          <div className="mb-8 bg-gradient-to-br from-[#26847F]/5 to-teal-50 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-[#26847F]" />
              <h3 className="font-bold text-gray-900 text-lg">Piano Premium Include:</h3>
            </div>
            <div className="space-y-2">
              {[
                'Generazioni ILLIMITATE piani nutrizionali e allenamento',
                'Analisi progressi con foto AI',
                'Scansione etichette con Health Score AI',
                'Modifica schede AI per imprevisti',
                'Supporto prioritario'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#26847F] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-left text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Highlight Box */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-8">
            <p className="text-lg font-bold text-gray-900">
              💰 Un Anno Intero di MyWellness Premium
            </p>
            <p className="text-3xl font-black text-[#26847F] mt-1">Solo 99€</p>
            <p className="text-sm text-gray-600 mt-2">Invece di 264€ (risparmi 165€)</p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            className="w-full h-20 text-2xl font-black bg-gradient-to-r from-[#26847F] to-teal-500 hover:from-[#1f6b66] hover:to-teal-600 text-white shadow-2xl mb-4 rounded-2xl"
          >
            {isAccepting ? 'Elaborazione...' : '✅ Sì, Voglio Premium a 99€'}
          </Button>

          {/* Decline Link */}
          <button
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
            className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
          >
            {isDeclining ? 'Reindirizzamento...' : 'No grazie, non sono interessato'}
          </button>

          {/* Trust Badge */}
          <p className="text-xs text-gray-500 mt-6">
            💳 Pagamento sicuro • 🔒 Garanzia 30 giorni
          </p>
        </div>
      </motion.div>
    </div>
  );
}