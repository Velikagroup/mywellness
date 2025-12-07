import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Privacy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden animated-gradient-bg">
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

      {/* Navbar */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-[300px]">
        <div className="water-glass-effect rounded-full px-6 py-3 flex justify-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-6 cursor-pointer"
            onClick={() => navigate(createPageUrl('Home'))}
          />
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto water-glass-effect rounded-3xl p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Privacy Policy</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Ultimo aggiornamento: Gennaio 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduzione</h2>
              <p>
                VELIKA GROUP LLC ("noi", "nostro") rispetta la tua privacy e si impegna a proteggere i tuoi dati personali. Questa Privacy Policy spiega how raccogliamo, utilizziamo, conserviamo e proteggiamo le tue informazioni quando utilizzi MyWellness (il "Servizio").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informazioni che Raccogliamo</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Informazioni Fornite da Te</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dati di Registrazione:</strong> nome, cognome, email, password</li>
                <li><strong>Dati di Pagamento:</strong> informazioni della carta di credito (elaborate in modo sicuro da Stripe)</li>
                <li><strong>Dati di Fatturazione:</strong> nome/ragione sociale, indirizzo, codice fiscale/partita IVA, PEC/SDI</li>
                <li><strong>Dati di Contatto:</strong> numero di telefono</li>
                <li><strong>Dati di Profilo:</strong> data di nascita, età, genere, altezza, peso, misure corporee</li>
                <li><strong>Dati sugli Obiettivi:</strong> peso target, tipo di corpo desiderato, zone da migliorare</li>
                <li><strong>Dati sullo Stile di Vita:</strong> livello di attività fisica, esperienza fitness, preferenze alimentari, allergie</li>
                <li><strong>Foto:</strong> immagini dei pasti e foto progresso caricate da te</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Informazioni Raccolte Automaticamente</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Indirizzo IP</li>
                <li>Tipo di browser e dispositivo</li>
                <li>Sistema operativo</li>
                <li>Pagine visitate e tempo di permanenza</li>
                <li>Data e ora di accesso</li>
                <li>Cookie e tecnologie simili</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Come Utilizziamo le Tue Informazioni</h2>
              <p className="mb-3">Utilizziamo i tuoi dati per:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornire e migliorare il Servizio</li>
                <li>Creare piani nutrizionali e di allenamento personalizzati</li>
                <li>Processare pagamenti e gestire abbonamenti</li>
                <li>Inviare conferme, fatture e comunicazioni importanti</li>
                <li>Analizzare i progressi e fornire feedback</li>
                <li>Migliorare i nostri algoritmi di intelligenza artificiale</li>
                <li>Prevenire frodi e garantire la sicurezza</li>
                <li>Rispondere a richieste di supporto</li>
                <li>Inviare comunicazioni di marketing (solo se hai dato il consenso)</li>
                <li>Rispettare obblighi legali</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base Giuridica del Trattamento (GDPR)</h2>
              <p className="mb-3">Per gli utenti nell'Unione Europea, trattiamo i dati personali sulla base di:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consenso:</strong> per marketing e cookie non essenziali</li>
                <li><strong>Esecuzione del Contratto:</strong> per fornire il Servizio</li>
                <li><strong>Obbligo Legale:</strong> per conformità fiscale e legale</li>
                <li><strong>Legittimo Interesse:</strong> per migliorare il Servizio e prevenire frodi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Accesso tramite Google (Google Sign-In)</h2>
              <p className="mb-3">
                Se scegli di accedere a MyWellness utilizzando il tuo account Google ("Accedi con Google"), raccogliamo le seguenti informazioni dal tuo profilo Google:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Nome completo:</strong> per personalizzare la tua esperienza</li>
                <li><strong>Indirizzo email:</strong> per identificare il tuo account e inviarti comunicazioni importanti</li>
                <li><strong>Foto profilo:</strong> per visualizzarla nel tuo account (opzionale)</li>
              </ul>
              <p className="mb-3">
                <strong>Come utilizziamo questi dati:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Per creare e gestire il tuo account MyWellness</li>
                <li>Per autenticarti in modo sicuro senza dover creare una nuova password</li>
                <li>Per personalizzare la tua esperienza all'interno dell'app</li>
              </ul>
              <p className="mb-3">
                <strong>NON</strong> accediamo ai tuoi contatti Google, alla tua cronologia di navigazione, ai tuoi file Google Drive o ad altri dati del tuo account Google. L'accesso è limitato esclusivamente alle informazioni di profilo di base necessarie per l'autenticazione.
              </p>
              <p>
                Puoi revocare l'accesso di MyWellness al tuo account Google in qualsiasi momento dalle impostazioni di sicurezza del tuo account Google all'indirizzo: <a href="https://myaccount.google.com/permissions" className="text-[var(--brand-primary)] underline" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/permissions</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Condivisione dei Dati</h2>
              <p className="mb-3">Potremmo condividere i tuoi dati con:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.1 Fornitori di Servizi</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> per l'elaborazione dei pagamenti</li>
                <li><strong>Provider di Hosting:</strong> per archiviare i dati</li>
                <li><strong>Servizi Email:</strong> per inviare comunicazioni</li>
                <li><strong>Servizi AI:</strong> per generare piani personalizzati e analizzare foto</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.2 Autorità Legali</h3>
              <p>Quando richiesto dalla legge o per proteggere i nostri diritti.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.3 Trasferimenti Aziendali</h3>
              <p>In caso di fusione, acquisizione o vendita di asset.</p>

              <p className="mt-4"><strong>NON</strong> vendiamo i tuoi dati personali a terze parti per scopi di marketing.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Sicurezza dei Dati</h2>
              <p className="mb-3">Implementiamo misure di sicurezza tecniche e organizzative per proteggere i tuoi dati:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Crittografia SSL/TLS per tutte le trasmissioni</li>
                <li>Archiviazione sicura dei dati su server protetti</li>
                <li>Accesso limitato ai dati personali solo al personale autorizzato</li>
                <li>Monitoraggio regolare per rilevare vulnerabilità</li>
                <li>Backup regolari dei dati</li>
              </ul>
              <p className="mt-4">
                Tuttavia, nessun metodo di trasmissione su Internet è completamente sicuro. Non possiamo garantire la sicurezza assoluta dei tuoi dati.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Conservazione dei Dati</h2>
              <p className="mb-3">
                Conserviamo i tuoi dati personali per il tempo necessario a fornire il Servizio e per rispettare obblighi legali:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Attivi:</strong> per tutta la durata dell'abbonamento</li>
                <li><strong>Account Cancellati:</strong> 90 giorni dopo la cancellazione (per permettere riattivazione), poi i dati vengono eliminati</li>
                <li><strong>Dati di Fatturazione:</strong> 10 anni per obblighi fiscali</li>
                <li><strong>Log di Sicurezza:</strong> fino a 12 mesi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. I Tuoi Diritti</h2>
              <p className="mb-3">In conformità al GDPR e altre leggi sulla privacy, hai i seguenti diritti:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Accesso:</strong> richiedere una copia dei tuoi dati personali</li>
                <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
                <li><strong>Cancellazione:</strong> richiedere la cancellazione dei tuoi dati ("diritto all'oblio")</li>
                <li><strong>Limitazione:</strong> limitare il trattamento dei tuoi dati</li>
                <li><strong>Portabilità:</strong> ricevere i tuoi dati in formato strutturato</li>
                <li><strong>Opposizione:</strong> opporti al trattamento dei tuoi dati</li>
                <li><strong>Revoca del Consenso:</strong> revocare il consenso precedentemente dato</li>
                <li><strong>Reclamo:</strong> presentare reclamo all'autorità di controllo</li>
              </ul>
              <p className="mt-4">
                Per esercitare questi diritti, contattaci a: velika.03@outlook.it
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookie</h2>
              <p className="mb-3">
                Utilizziamo cookie e tecnologie simili per:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookie Essenziali:</strong> necessari per il funzionamento del Servizio</li>
                <li><strong>Cookie Analitici:</strong> per comprendere come utilizzi il Servizio</li>
                <li><strong>Cookie di Marketing:</strong> per personalizzare annunci (solo con consenso)</li>
              </ul>
              <p className="mt-4">
                Puoi gestire le preferenze sui cookie nelle impostazioni del tuo browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Privacy dei Minori</h2>
              <p>
                Il Servizio non è destinato a minori di 18 anni. Non raccogliamo consapevolmente dati personali da minori di 18 anni. Se scopriamo di aver raccolto dati da un minore, li cancelleremo immediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Trasferimenti Internazionali</h2>
              <p>
                I tuoi dati possono essere trasferiti e archiviati su server negli Stati Uniti e in altri paesi. Implementiamo salvaguardie appropriate per garantire che i tuoi dati siano protetti in conformità a questa Privacy Policy e alle leggi applicabili.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Modifiche alla Privacy Policy</h2>
              <p>
                Potremmo aggiornare questa Privacy Policy periodicamente. Ti informeremo di modifiche sostanziali tramite email o notifica nel Servizio. L'uso continuato del Servizio dopo le modifiche costituisce accettazione della nuova Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contatti</h2>
              <p className="mb-4">
                Per domande sulla privacy o per esercitare i tuoi diritti, contattaci:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">VELIKA GROUP LLC</p>
                <p className="font-semibold">Data Protection Officer</p>
                <p>30 N Gould St 32651</p>
                <p>Sheridan, WY 82801, United States</p>
                <p>EIN: 36-5141800</p>
                <p>Email: velika.03@outlook.it</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
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