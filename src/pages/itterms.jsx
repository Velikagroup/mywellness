import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ItTerms() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{
      background: '#f9fafb',
      backgroundImage: `
        radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
        radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
        radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
        radial-gradient(circle at 70% 60%, #f3e8ff 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
        radial-gradient(circle at 90% 85%, #faf5ff 0%, transparent 50%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
        }
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, rgba(249, 250, 251, 0.75) 0%, rgba(243, 244, 246, 0.65) 50%, rgba(249, 250, 251, 0.75) 100%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-[300px]">
        <div className="water-glass-effect rounded-full px-6 py-3 flex justify-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-6 cursor-pointer"
            onClick={() => navigate(createPageUrl('ithome'))}
          />
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto water-glass-effect rounded-3xl p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Termini e Condizioni</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Ultimo aggiornamento: Gennaio 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Accettazione dei Termini</h2>
              <p>
                Accedendo e utilizzando MyWellness (il "Servizio"), gestito da VELIKA GROUP LLC ("noi", "nostro"), l'utente ("tu", "tuo") accetta di essere vincolato da questi Termini e Condizioni. Se non accetti questi termini, non utilizzare il Servizio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrizione del Servizio</h2>
              <p>
                MyWellness fornisce piani nutrizionali e di allenamento personalizzati generati tramite intelligenza artificiale. Il Servizio include analisi del corpo, monitoraggio dei progressi, ricette personalizzate e schede di allenamento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Abbonamenti e Pagamenti</h2>
              <p className="mb-3">
                <strong>3.1 Periodo di Prova:</strong> Offriamo un periodo di prova gratuito di 3 giorni. Durante questo periodo, non verranno effettuati addebiti. Puoi cancellare in qualsiasi momento prima della scadenza del periodo di prova.
              </p>
              <p className="mb-3">
                <strong>3.2 Rinnovo Automatico:</strong> Alla scadenza del periodo di prova, l'abbonamento si rinnoverà automaticamente al piano selezionato (Base, Pro o Premium) con fatturazione mensile o annuale secondo la tua scelta.
              </p>
              <p className="mb-3">
                <strong>3.3 Prezzi:</strong> I prezzi sono indicati in Euro (€) e possono variare. Il prezzo applicabile è quello visualizzato al momento dell'acquisto.
              </p>
              <p>
                <strong>3.4 Cancellazione:</strong> Puoi cancellare il tuo abbonamento in qualsiasi momento attraverso le impostazioni del tuo account. La cancellazione avrà effetto alla fine del periodo di fatturazione corrente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Utente</h2>
              <p className="mb-3">
                <strong>4.1 Registrazione:</strong> Per utilizzare il Servizio, devi creare un account fornendo informazioni accurate e complete.
              </p>
              <p className="mb-3">
                <strong>4.2 Sicurezza:</strong> Sei responsabile della sicurezza del tuo account e della riservatezza delle tue credenziali di accesso.
              </p>
              <p>
                <strong>4.3 Età Minima:</strong> Devi avere almeno 18 anni per utilizzare il Servizio. Se hai meno di 18 anni, devi ottenere il consenso di un genitore o tutore.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Uso Accettabile</h2>
              <p className="mb-3">Ti impegni a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utilizzare il Servizio solo per scopi personali e non commerciali</li>
                <li>Fornire informazioni accurate sul tuo profilo di salute</li>
                <li>Non condividere il tuo account con altre persone</li>
                <li>Non utilizzare il Servizio per attività illegali o non autorizzate</li>
                <li>Non tentare di violare la sicurezza del Servizio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Disclaimer Medico</h2>
              <p className="mb-3">
                <strong>IMPORTANTE:</strong> MyWellness NON fornisce consulenza medica. I piani nutrizionali e di allenamento sono generati da intelligenza artificiale e hanno esclusivamente scopo informativo ed educativo.
              </p>
              <p className="mb-3">
                Prima di iniziare qualsiasi programma nutrizionale o di esercizio fisico, consulta il tuo medico o un professionista sanitario qualificato, specialmente se hai condizioni mediche preesistenti, sei in gravidanza, allatti o assumi farmaci.
              </p>
              <p>
                L'uso del Servizio è a tuo esclusivo rischio e responsabilità.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Proprietà Intellettuale</h2>
              <p>
                Tutti i contenuti, software, codice, design, grafica, logo e materiali presenti nel Servizio sono di proprietà esclusiva di VELIKA GROUP LLC e sono protetti da copyright, marchi e altre leggi sulla proprietà intellettuale.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitazione di Responsabilità</h2>
              <p className="mb-3">
                Nella misura massima consentita dalla legge, VELIKA GROUP LLC non sarà responsabile per:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Danni diretti, indiretti, incidentali, consequenziali o punitivi</li>
                <li>Perdita di profitti, dati o opportunità commerciali</li>
                <li>Lesioni fisiche o danni alla salute derivanti dall'uso del Servizio</li>
                <li>Interruzioni o errori nel Servizio</li>
                <li>Contenuti o comportamenti di terze parti</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modifiche ai Termini</h2>
              <p>
                Ci riserviamo il diritto di modificare questi Termini e Condizioni in qualsiasi momento. Le modifiche saranno effettive immediatamente dopo la pubblicazione. L'uso continuato del Servizio dopo le modifiche costituisce accettazione dei nuovi termini.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Risoluzione</h2>
              <p>
                Ci riserviamo il diritto di sospendere o terminare il tuo account in caso di violazione di questi Termini, senza preavviso e senza rimborso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Legge Applicabile</h2>
              <p>
                Questi Termini sono regolati dalle leggi dello Stato del Wyoming, Stati Uniti, senza riguardo ai principi sui conflitti di legge.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contatti</h2>
              <p>
                Per domande su questi Termini e Condizioni, contattaci:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">VELIKA GROUP LLC</p>
                <p>30 N Gould St 32651</p>
                <p>Sheridan, WY 82801, United States</p>
                <p>EIN: 36-5141800</p>
                <p>Email: velika.03@outlook.it</p>
              </div>
            </section>
          </div>
        </div>
      </div>

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