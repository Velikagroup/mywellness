import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, X, Zap, Target, TrendingUp, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/entities/User';
import { motion } from 'framer-motion';

export default function OneTimeOffer() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minuti in secondi
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    document.title = "Offerta Speciale - MyWellness";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await User.updateMyUserData({ order_bump_selected: true });
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
      await User.updateMyUserData({ order_bump_selected: false });
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Error declining OTO:', error);
      alert('Errore. Riprova.');
      setIsDeclining(false);
    }
  };

  const proFeatures = [
    { icon: Zap, title: 'Piano Allenamento AI', desc: 'Schede personalizzate per i tuoi obiettivi' },
    { icon: Target, title: 'Analisi Foto Progressi', desc: 'Computer vision per tracciare i cambiamenti' },
    { icon: TrendingUp, title: 'Grafici Avanzati', desc: 'Visualizza ogni dettaglio dei tuoi progressi' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Timer */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-6 text-center mb-8 shadow-2xl"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="w-6 h-6" />
            <h3 className="text-2xl font-bold">Offerta Irripetibile</h3>
          </div>
          <p className="text-3xl font-black mb-2">{formatTime(timeLeft)}</p>
          <p className="text-sm opacity-90">Questa pagina si chiuderà automaticamente</p>
        </motion.div>

        {/* Main Offer */}
        <Card className="border-2 border-[var(--brand-primary)] shadow-2xl mb-6">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <span className="inline-block bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 text-white px-6 py-2 rounded-full text-sm font-bold mb-4">
                ⚡ UPGRADE PRO - SOLO OGGI
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                Passa a PRO con il <span className="text-[var(--brand-primary)]">50% di Sconto</span>
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Sblocca il piano allenamento AI e l'analisi progressi fotografica
              </p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl text-gray-400 line-through">134€</span>
                <span className="text-6xl font-black text-[var(--brand-primary)]">67€</span>
                <span className="text-gray-600">/anno</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Risparmi 67€ accettando ora</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {proFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gradient-to-br from-[var(--brand-primary)]/10 to-teal-50 p-6 rounded-xl text-center"
                  >
                    <Icon className="w-12 h-12 text-[var(--brand-primary)] mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="space-y-3 mb-8 bg-gray-50 p-6 rounded-xl">
              {[
                'Piano allenamento settimanale personalizzato',
                'Analisi AI delle foto progressi',
                'Grafici avanzati e proiezioni obiettivi',
                'Sostituzione ingredienti AI illimitata',
                'Supporto prioritario'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={handleAccept}
                disabled={isAccepting || isDeclining}
                className="flex-1 h-16 text-xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white shadow-xl"
              >
                {isAccepting ? 'Elaborazione...' : '✅ Sì, Voglio il PRO a 67€'}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={isAccepting || isDeclining}
                variant="outline"
                className="flex-1 h-16 text-lg border-2 border-gray-300 hover:bg-gray-100"
              >
                {isDeclining ? 'Reindirizzamento...' : 'No, Continua con Piano Base'}
              </Button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              💳 Pagamento sicuro • 🔒 Garanzia 30 giorni soddisfatti o rimborsati
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-gray-500 text-sm">
          <p>Questa offerta è valida solo su questa pagina e scade tra {formatTime(timeLeft)}</p>
        </div>
      </div>
    </div>
  );
}