
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Sparkles, CheckCircle, Shield, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

export default function Landing() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const SHOW_OFFER_AT_SECONDS = 10;
  const EMAIL_CAPTURE_AT_SECONDS = 10;

  const [showOverlay, setShowOverlay] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showTimedSection, setShowTimedSection] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [captureFormData, setCaptureFormData] = useState({ name: '', email: '' });
  const [isSubmittingCapture, setIsSubmittingCapture] = useState(false);

  useEffect(() => {
    document.title = "MyWellness - Trasforma il tuo corpo con l'AI";
  }, []);

  useEffect(() => {
    const checkUserStatus = async () => {
      setIsLoadingUser(true);
      try {
        const currentUser = await base44.auth.me();
        if (currentUser && currentUser.quiz_completed) {
          navigate(createPageUrl('Dashboard'), { replace: true });
          return;
        }
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    checkUserStatus();
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimedSection(true);
    }, SHOW_OFFER_AT_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const captured = localStorage.getItem('landingEmailCaptured');
    if (captured === 'true') {
      setEmailCaptured(true);
      console.log('✅ Email già catturata in precedenza');
    }

    const checkInterval = setInterval(() => {
      if (video.currentTime >= EMAIL_CAPTURE_AT_SECONDS && !emailCaptured && !showEmailCapture) {
        console.log('🛑 BLOCCO VIDEO! Tempo:', video.currentTime, 'secondi');
        video.pause();
        setShowEmailCapture(true);
        setShowOverlay(false);
        setIsVideoPlaying(false);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [emailCaptured, showEmailCapture]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
      const savedTime = localStorage.getItem('landingVideoTime');
      if (savedTime && !isNaN(parseFloat(savedTime))) {
        const time = parseFloat(savedTime);
        if (time > 0 && time < video.duration) {
          video.currentTime = time;
          console.log('⏰ Video ripristinato a:', time, 'secondi');
        }
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    if (video.duration) {
      handleLoadedMetadata();
    }

    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoPlaying) return;

    const updateProgress = () => {
      if (video.duration > 0) {
        const linearProgress = (video.currentTime / video.duration) * 100;
        const easedProgress = Math.pow(linearProgress / 100, 0.6) * 100;
        setLoadingProgress(Math.min(easedProgress, 98));
        localStorage.setItem('landingVideoTime', video.currentTime.toString());
      }
    };

    const interval = setInterval(updateProgress, 100);
    updateProgress();

    return () => clearInterval(interval);
  }, [isVideoPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      console.log('▶️ Video play');
      setShowOverlay(false);
      setIsVideoPlaying(true);
    };
    
    const handlePause = () => {
      console.log('⏸️ Video pause');
      if (!showEmailCapture) {
        setShowOverlay(true);
      }
      setIsVideoPlaying(false);
      if (video.currentTime > 0 && video.currentTime < video.duration && !showEmailCapture) {
        localStorage.setItem('landingVideoTime', video.currentTime.toString());
      }
    };
    
    const handleEnded = () => {
      console.log('✅ Video ended');
      setShowOverlay(true);
      setIsVideoPlaying(false);
      setLoadingProgress(98);
      localStorage.removeItem('landingVideoTime');
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [showEmailCapture]);

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (showEmailCapture) {
        return;
      }

      if (!hasStartedOnce) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        setHasStartedOnce(true);
        setLoadingProgress(0);
        localStorage.removeItem('landingVideoTime');
      } else {
        videoRef.current.muted = false;
      }
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setShowOverlay(false);
          setIsVideoPlaying(true);
        }).catch(error => {
          console.error("Error playing video:", error);
        });
      }
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current && !showEmailCapture) {
      if (videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setShowOverlay(false);
            setIsVideoPlaying(true);
          }).catch(error => {
            console.error("Error playing video:", error);
          });
        }
      } else {
        videoRef.current.pause();
        setShowOverlay(true);
        setIsVideoPlaying(false);
      }
    }
  };

  const handleEmailCaptureSubmit = async (e) => {
    e.preventDefault();
    if (!captureFormData.name || !captureFormData.email) {
      alert('Per favore compila tutti i campi');
      return;
    }

    setIsSubmittingCapture(true);
    try {
      await base44.auth.updateMe({
        full_name: captureFormData.name,
        email: captureFormData.email
      });

      localStorage.setItem('landingEmailCaptured', 'true');
      setEmailCaptured(true);
      setShowEmailCapture(false);

      if (videoRef.current) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsVideoPlaying(true);
          }).catch(error => {
            console.error("Error playing video:", error);
          });
        }
      }
    } catch (error) {
      console.error('Error saving email:', error);
      alert('Errore nel salvataggio. Riprova.');
    }
    setIsSubmittingCapture(false);
  };

  const handleCTA = () => {
    console.log('🔥 CTA CLICKED!');
    navigate(createPageUrl('LandingCheckout'));
  };

  const testimonials = [
  {
    name: "Francesca Marino",
    role: "Studentessa",
    photo: "https://i.pravatar.cc/400?img=29",
    text: "Budget studentesco limitato ma MyWellness mi ha creato pasti economici e nutrienti. Ho tonificato tutto il corpo spendendo poco! Gli allenamenti a casa senza attrezzi sono perfetti per me."
  },
  {
    name: "Roberto Greco",
    role: "Medico",
    photo: "https://i.pravatar.cc/400?img=60",
    text: "I calcoli sono precisissimi. Lo consiglio ai miei pazienti!"
  },
  {
    name: "Valentina Conti",
    role: "Influencer Fitness",
    photo: "https://i.pravatar.cc/400?img=49",
    text: "Ho provato tutto nel mondo fitness. MyWellness è l'unica app che si adatta veramente a me. L'AI fotografica è il futuro del tracking! I miei follower mi chiedono continuamente quale app uso per i miei progressi incredibili."
  },
  {
    name: "Sofia Rossi",
    role: "Marketing Manager",
    photo: "https://i.pravatar.cc/400?img=47",
    text: "L'analisi fotografica con AI è geniale! Mi tiene sempre motivata vedendo i progressi reali. Il supporto dell'intelligenza artificiale fa davvero la differenza. Non avrei mai pensato di poter raggiungere questi risultati così velocemente."
  },
  {
    name: "Luca Bianchi",
    role: "Developer",
    photo: "https://i.pravatar.cc/400?img=33",
    text: "Finalmente un'app che capisce le mie esigenze. La dieta vegetariana personalizzata è perfetta."
  },
  {
    name: "Giulia Ferrari",
    role: "Insegnante",
    photo: "https://i.pravatar.cc/400?img=25",
    text: "Dopo la gravidanza non riuscivo a tornare in forma. MyWellness mi ha aiutata a perdere 15kg in 4 mesi senza rinunce. Sono felicissima! L'AI ha capito perfettamente le mie esigenze di neomamma e mi ha creato un piano compatibile con i ritmi del bambino."
  },
  {
    name: "Alessandro Moretti",
    role: "Architetto",
    photo: "https://i.pravatar.cc/400?img=68",
    text: "A 42 anni pensavo fosse impossibile. Ho guadagnato 8kg di muscoli in 6 mesi!"
  },
  {
    name: "Chiara Lombardi",
    role: "Avvocato",
    photo: "https://i.pravatar.cc/400?img=38",
    text: "Con i ritmi di lavoro frenetici non avevo tempo. MyWellness mi ha organizzato tutto: pasti veloci e allenamenti da 30 minuti. Perfetto! Finalmente riesco a conciliare carriera e benessere fisico."
  },
  {
    name: "Davide Russo",
    role: "Personal Trainer",
    photo: "https://i.pravatar.cc/400?img=52",
    text: "L'AI genera piani migliori di quanto facessi manualmente. Incredibile!"
  },
  {
    name: "Elena Gallo",
    role: "Farmacista",
    photo: "https://i.pravatar.cc/400?img=44",
    text: "Ho problemi di tiroide e pensavo fosse impossibile dimagrire. L'AI ha calibrato tutto perfettamente considerando il mio metabolismo rallentato. -10kg in 5 mesi, mi sento rinata! Ora consiglio MyWellness a tutti i miei pazienti."
  },
  {
    name: "Matteo Costa",
    role: "Chef",
    photo: "https://i.pravatar.cc/400?img=59",
    text: "Le ricette sono bilanciate, gustose e creative. Finalmente unisco passione e salute!"
  },
  {
    name: "Marco Colombo",
    role: "Imprenditore",
    photo: "https://i.pravatar.cc/400?img=12",
    text: "Ho perso 12kg in 3 mesi. Le ricette sono deliziose e gli allenamenti perfetti!"
  }];

  const faqs = [
    {
      question: "Questa offerta è valida solo su questa pagina?",
      answer: "Sì! Questo è un prezzo esclusivo disponibile solo per chi guarda il video completo. Non lo troverai da nessun'altra parte."
    },
    {
      question: "Posso cancellare in qualsiasi momento?",
      answer: "Assolutamente sì. Puoi cancellare quando vuoi senza alcun vincolo o penale. Il servizio resterà attivo fino alla fine del periodo già pagato."
    },
    {
      question: "Cosa include il piano Premium?",
      answer: "Piano nutrizionale completo, piano allenamento, analisi AI dei pasti con foto, ribilanciamento automatico, sostituzione ingredienti AI, modifica scheda AI, analisi progressi foto e supporto prioritario."
    },
    {
      question: "Come funziona il pagamento?",
      answer: "Paghi oggi 67€ e hai accesso completo per 3 mesi al piano Premium. Dopo i 3 mesi, se vuoi continuare, il piano si rinnova al prezzo standard."
    },
    {
      question: "Quali metodi di pagamento accettate?",
      answer: "Accettiamo tutte le principali carte di credito/debito (Visa, Mastercard, American Express) e PayPal."
    },
    {
      question: "Come funziona l'analisi AI dei pasti?",
      answer: "Fotografi il tuo pasto e la nostra AI analizza automaticamente le calorie e i macronutrienti consumati, confrontandoli con il tuo piano."
    },
    {
      question: "Posso usare l'app senza connessione internet?",
      answer: "Alcune funzioni sono disponibili offline (come visualizzare ricette e piani salvati), ma per le analisi AI e l'aggiornamento dei dati è necessaria una connessione."
    },
    {
      question: "I piani sono personalizzati o generici?",
      answer: "Tutti i piani sono 100% personalizzati in base al tuo profilo: età, peso, altezza, obiettivi, preferenze alimentari, livello di attività e molto altro."
    },
    {
      question: "Cosa succede ai miei dati se cancello l'abbonamento?",
      answer: "I tuoi dati rimangono al sicuro per 90 giorni. Se riattivi l'abbonamento entro questo periodo, ritroverai tutto come l'hai lasciato."
    }
  ];

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient-bg overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5c57;
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
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9);
        }
        
        video::-webkit-media-controls { display: none !important; }
        
        /* MOBILE FIX DRASTICO */
        .mobile-button {
          position: relative !important;
          z-index: 9999 !important;
          pointer-events: auto !important;
          -webkit-tap-highlight-color: rgba(0,0,0,0);
          user-select: none;
        }
        
        .video-section {
          position: relative;
          pointer-events: none;
        }
        
        .video-section video {
          pointer-events: auto;
        }
      `}</style>

      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-[300px]">
        <div className="hidden md:flex water-glass-effect rounded-full items-center gap-8 px-6 py-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-5 flex-shrink-0"
          />
        </div>
        
        <div className="md:hidden water-glass-effect rounded-full px-6 py-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-6"
          />
        </div>
      </nav>

      <section className="pt-32 pb-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1] px-2">
            Scopri L'<span className="animated-text-gradient">AI</span> Che Ti Guida Nella <span className="animated-text-gradient">Perdita Di Peso</span>
          </h1>
          <p className="text-base md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            Guarda questo video e scopri il sistema che ha aiutato oltre 23.000 persone a raggiungere i loro obiettivi
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-2 video-section">
          {isVideoPlaying && (
            <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 transition-all duration-100 rounded-full"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          )}

          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              className="w-full"
              autoPlay
              muted
              playsInline
              controlsList="nodownload nofullscreen noremoteplayback"
              disablePictureInPicture
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              onContextMenu={(e) => e.preventDefault()}
              onClick={handleVideoClick}
            />

            {showOverlay && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <button
                  onClick={handlePlayClick}
                  className="w-24 h-24 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all pointer-events-auto"
                >
                  <Play className="w-12 h-12 text-[var(--brand-primary)] ml-2" fill="currentColor" />
                </button>
              </div>
            )}

            {showEmailCapture && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Continua a Guardare
                    </h3>
                    <p className="text-gray-600">
                      Inserisci i tuoi dati per continuare a scoprire come MyWellness può trasformare il tuo corpo
                    </p>
                  </div>

                  <form onSubmit={handleEmailCaptureSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="Nome completo"
                        value={captureFormData.name}
                        onChange={(e) => setCaptureFormData({...captureFormData, name: e.target.value})}
                        className="h-12 text-base"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={captureFormData.email}
                        onChange={(e) => setCaptureFormData({...captureFormData, email: e.target.value})}
                        className="h-12 text-base"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmittingCapture}
                      className="w-full h-12 bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white font-semibold"
                    >
                      {isSubmittingCapture ? 'Invio...' : 'Continua a Guardare'}
                    </Button>
                  </form>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    🔒 I tuoi dati sono al sicuro e protetti
                  </p>
                </motion.div>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-sm sm:text-base text-gray-600 mt-6 max-w-2xl mx-auto px-4">
          🎯 <strong>Attenzione:</strong> Questa pagina contiene un'offerta esclusiva disponibile solo per chi guarda il video completo
        </p>
      </section>

      {showTimedSection && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto mb-20 px-4 sm:px-6"
          >
            <Card className="border-0 shadow-2xl water-glass-effect overflow-hidden rounded-3xl">
              <CardContent className="p-6 sm:p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--brand-primary)]/10 to-teal-500/10 rounded-full mb-6 border border-[var(--brand-primary)]/20">
                    <Sparkles className="w-5 h-5 text-[var(--brand-primary)]" />
                    <span className="text-sm font-semibold text-[var(--brand-primary-dark-text)]">Offerta Esclusiva</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Il Tuo Piano Personalizzato
                  </h2>
                  <p className="text-gray-600 mb-2">
                    Inizia oggi il tuo percorso di trasformazione
                  </p>
                </div>

                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span className="text-2xl text-gray-400 line-through font-medium">€117</span>
                    <span className="text-6xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent">€67</span>
                  </div>
                  <p className="text-sm text-gray-500">Piano Premium - 3 Mesi</p>
                  <p className="text-xs text-[var(--brand-primary)] font-semibold mt-2">Risparmi €50!</p>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    'Piano nutrizionale personalizzato completo',
                    'Piano allenamento adattivo',
                    'Analisi AI dei pasti con foto',
                    'Ribilanciamento automatico calorie',
                    'Sostituzione ingredienti AI',
                    'Modifica scheda allenamento AI',
                    'Analisi progressi con foto AI',
                    'Supporto prioritario'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-[var(--brand-primary)]" />
                      </div>
                      <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCTA}
                  disabled={isLoading}
                  className="mobile-button w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Caricamento...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span>Accedi al Piano Premium</span>
                    </div>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  Questa offerta è valida solo su questa pagina
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <section className="py-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-bold text-center text-gray-900 mb-12">
                Cosa Dicono i Nostri Utenti.
              </h2>
              
              <div className="relative pb-32">
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                  {testimonials.slice(0, window.innerWidth < 768 ? 6 : testimonials.length).map((testimonial, index) => (
                    <div
                      key={index}
                      className="rounded-2xl p-6 border border-white/40 hover:border-white/60 transition-all break-inside-avoid mb-6 backdrop-blur-xl bg-gradient-to-br from-white/30 via-white/20 to-white/10 hover:from-white/40 hover:via-white/30 hover:to-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] hover:shadow-[0_8px_40px_0_rgba(31,38,135,0.25)]"
                      style={{
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 0 rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={testimonial.photo}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/90 shadow-md flex-shrink-0"
                        />
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
            </div>
          </section>

          <section className="py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center text-gray-900 mb-6 px-2">
                Trasforma Ora Il Tuo Corpo
              </h3>
              <button
                onClick={handleCTA}
                disabled={isLoading}
                className="mobile-button w-full sm:w-auto h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white rounded-xl px-8 sm:px-12 shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Caricamento...</span>
                  </div>
                ) : (
                  'Accedi Ora a 67€'
                )}
              </button>
            </div>
          </section>

          <section className="py-16 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-bold text-center text-gray-900 mb-16">Domande Frequenti</h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="water-glass-effect rounded-3xl border border-white/40 hover:border-white/60 transition-all shadow-lg hover:shadow-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/20 transition-all"
                    >
                      <h3 className="font-bold text-lg text-gray-900">{faq.question}</h3>
                      <div className={`transform transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    <div
                      className={`transition-all duration-300 ease-in-out ${
                        openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      } overflow-hidden`}
                    >
                      <p className="text-gray-700 leading-relaxed px-6 pb-6">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="border-0 shadow-2xl water-glass-effect overflow-hidden rounded-3xl">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Target className="w-10 h-10 text-white" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      Inizia Subito
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
                      Unisciti a migliaia di persone che hanno già trasformato il loro corpo con MyWellness
                    </p>

                    <div className="bg-gradient-to-br from-[var(--brand-primary)]/10 to-teal-500/10 rounded-2xl p-6 mb-8 border border-[var(--brand-primary)]/20">
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        Piano Premium - 3 Mesi
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xl text-gray-400 line-through">€117</span>
                        <span className="text-4xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent">€67</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Offerta esclusiva disponibile solo su questa pagina</p>
                    </div>

                    <button
                      onClick={handleCTA}
                      disabled={isLoading}
                      className="mobile-button w-full sm:w-auto bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Caricamento...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          <span>Accedi Ora</span>
                        </div>
                      )}
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>
        </>
      )}

      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-500 leading-relaxed text-center px-2">
            <strong>Disclaimer:</strong> Le informazioni fornite da MyWellness, inclusi piani nutrizionali e di allenamento generati dall'intelligenza artificiale, hanno esclusivamente scopo informativo ed educativo e non costituiscono consulenza medica, diagnosi o trattamento. I risultati individuali possono variare significativamente in base a molteplici fattori personali. Prima di iniziare qualsiasi programma nutrizionale o di esercizio fisico, è fondamentale consultare il proprio medico o un professionista sanitario qualificato, specialmente in presenza di condizioni mediche preesistenti, gravidanza, allattamento o assunzione di farmaci. MyWellness e VELIKA GROUP LLC declinano ogni responsabilità per eventuali danni diretti, indiretti, consequenziali o incidentali derivanti dall'uso delle informazioni o dei servizi forniti. L'uso di questa applicazione implica l'accettazione di questi termini e il riconoscimento che l'utente agisce sotto la propria responsabilità. Le testimonianze presentate rappresentano esperienze individuali e non garantiscono risultati identici per tutti gli utenti.
          </p>
        </div>
      </section>

      <footer className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2">
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
    </div>
  );
}
