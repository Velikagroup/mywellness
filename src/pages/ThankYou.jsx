
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ThankYou() {
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

        .liquid-glass-card {
          backdrop-filter: blur(16px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.8) 0%, 
            rgba(255, 255, 255, 0.6) 50%, 
            rgba(255, 255, 255, 0.8) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.15),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
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
      `}</style>

      {/* Fixed Logo Navbar */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-[300px]">
        <div className="water-glass-effect rounded-full px-6 py-3 flex justify-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-6"
          />
        </div>
      </div>

      {/* Main Content - Reduced padding */}
      <div className="flex items-center justify-center min-h-screen pt-28 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full">

          <Card className="border-0 shadow-2xl liquid-glass-card overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/10 via-transparent to-purple-500/10 pointer-events-none"></div>
            
            <CardHeader className="relative text-center pt-12 sm:pt-16 pb-8 px-4 sm:px-8">
              <motion.div
                className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 150 }}>
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </motion.div>
              
              <CardTitle className="tracking-tight text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-900 bg-clip-text text-transparent mb-4 px-2">
                Grazie per il tuo acquisto!
              </CardTitle>
              <p className="text-lg sm:text-xl text-gray-600 font-medium px-2">
                Il tuo ordine è stato completato con successo 🎉
              </p>
            </CardHeader>
            
            <CardContent className="relative px-4 sm:px-8 pb-8 sm:pb-12 space-y-6 sm:space-y-8">
              {/* Email Instructions */}
              <div className="bg-gradient-to-br from-[var(--brand-primary-light)] to-teal-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-[var(--brand-primary)]/30">
                <div className="flex items-start gap-4 mb-4">
                  <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--brand-primary)] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      Controlla la tua email
                    </h3>
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                      Ti abbiamo inviato un'email con:
                    </p>
                  </div>
                </div>
                
                <ul className="space-y-3 ml-8 sm:ml-12">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-gray-700">Una <strong>password temporanea</strong> per accedere</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-gray-700">Un pulsante <strong>"Accedi alla Dashboard"</strong> per iniziare subito</span>
                  </li>
                </ul>
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-inner">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--brand-primary)]" />
                  Prossimi passi:
                </h3>
                <ol className="space-y-2 sm:space-y-3 ml-4 sm:ml-6 list-decimal text-sm sm:text-base text-gray-700">
                  <li><strong>Apri la tua email</strong> e cerca l'email da MyWellness</li>
                  <li><strong>Copia la password temporanea</strong> che troverai nell'email</li>
                  <li><strong>Clicca sul pulsante "Accedi alla Dashboard"</strong> nell'email</li>
                  <li><strong>Crea la tua password personale</strong> quando richiesto</li>
                  <li><strong>Completa il quiz</strong> per creare il tuo piano personalizzato</li>
                </ol>
              </div>

              {/* Support */}
              <div className="text-center pt-4">
                <p className="text-xs sm:text-sm text-gray-500 px-2">
                  Non hai ricevuto l'email? Controlla la cartella spam o contattaci a <strong>velika.03@outlook.it</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
