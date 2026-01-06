import React, { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, Smartphone } from 'lucide-react';

export default function AuthCallback() {
  const [status, setStatus] = useState('checking'); // checking, success, error, manual

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verifica se l'utente è autenticato
        const user = await base44.auth.me();
        
        if (user) {
          // ✅ Salva sessione persistente per Capacitor (solo se disponibile)
          if (window.Capacitor) {
            try {
              const { Preferences } = await import('@capacitor/preferences');
              await Preferences.set({ 
                key: 'user_authenticated', 
                value: 'true' 
              });
              await Preferences.set({ 
                key: 'user_id', 
                value: user.id 
              });
              console.log('✅ Sessione salvata in Capacitor Preferences');
            } catch (prefError) {
              console.error('❌ Errore salvataggio Preferences:', prefError);
            }
          }
          
          setStatus('success');
          
          // Controlla se ha quiz completato e subscription attiva
          if (user.quiz_completed && (user.subscription_status === 'active' || user.subscription_status === 'trial')) {
            // Utente completo - prova ad aprire Dashboard nell'app
            console.log('✅ Utente completo, apertura Dashboard app...');
            window.location.href = 'mywellness://dashboard';
          } else {
            // Utente nuovo/incompleto - prova ad aprire Quiz nell'app
            console.log('✅ Utente nuovo, apertura Quiz app...');
            window.location.href = 'mywellness://quiz';
          }
          
          // Dopo 2 secondi, se non si è aperta, mostra istruzioni
          setTimeout(() => {
            setStatus('manual');
          }, 2000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('❌ Auth error:', error);
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: '#f9fafb',
      backgroundImage: `
        radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
        radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
        radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%)
      `
    }}>
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png" 
          alt="MyWellness" 
          className="h-8 mx-auto mb-6"
        />

        {status === 'checking' && (
          <>
            <Loader2 className="w-16 h-16 text-[#26847F] animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifica login...</h1>
            <p className="text-gray-600">Attendere prego</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Login completato! ✅</h1>
            <p className="text-gray-600 mb-4">Apertura app in corso...</p>
            <Loader2 className="w-8 h-8 text-[#26847F] animate-spin mx-auto" />
          </>
        )}

        {status === 'manual' && (
          <>
            <Smartphone className="w-16 h-16 text-[#26847F] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Login completato! ✅</h1>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-4">
              <p className="text-blue-900 font-semibold mb-3">Se l'app non si è aperta automaticamente:</p>
              <ol className="text-left text-blue-800 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Torna alla schermata Home del tuo iPhone</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>Apri manualmente l'app <strong>MyWellness</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>Sarai già loggato e pronto a iniziare! 🎉</span>
                </li>
              </ol>
            </div>
            <button
              onClick={() => window.location.href = 'mywellness://auth-callback'}
              className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white font-semibold py-4 rounded-xl transition-all"
            >
              🔄 Riprova ad aprire l'app
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Errore di login</h1>
            <p className="text-gray-600 mb-4">Si è verificato un problema. Riprova.</p>
            <button
              onClick={() => window.location.href = 'https://projectmywellness.com'}
              className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white font-semibold py-4 rounded-xl transition-all"
            >
              Torna alla home
            </button>
          </>
        )}
      </div>
    </div>
  );
}