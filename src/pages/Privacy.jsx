import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

const CONTENT = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: January 2025",
    content: `
      <h2>1. Introduction</h2>
      <p>VELIKA GROUP LLC ("we", "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store and protect your information when you use MyWellness (the "Service").</p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Information Provided by You</h3>
      <ul>
        <li><strong>Registration Data:</strong> first name, last name, email, password</li>
        <li><strong>Payment Data:</strong> credit card information (securely processed by Stripe)</li>
        <li><strong>Billing Data:</strong> name/company name, address, tax ID/VAT number, PEC/SDI</li>
        <li><strong>Contact Data:</strong> phone number</li>
        <li><strong>Profile Data:</strong> date of birth, age, gender, height, weight, body measurements</li>
        <li><strong>Goal Data:</strong> target weight, desired body type, areas to improve</li>
        <li><strong>Lifestyle Data:</strong> physical activity level, fitness experience, food preferences, allergies</li>
        <li><strong>Photos:</strong> meal images and progress photos uploaded by you</li>
      </ul>

      <h3>2.2 Information Collected Automatically</h3>
      <ul>
        <li>IP address</li>
        <li>Browser type and device</li>
        <li>Operating system</li>
        <li>Pages visited and dwell time</li>
        <li>Date and time of access</li>
        <li>Cookies and similar technologies</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use your data to:</p>
      <ul>
        <li>Provide and improve the Service</li>
        <li>Create personalized nutrition and workout plans</li>
        <li>Process payments and manage subscriptions</li>
        <li>Send confirmations, invoices and important communications</li>
        <li>Analyze progress and provide feedback</li>
        <li>Improve our artificial intelligence algorithms</li>
        <li>Prevent fraud and ensure security</li>
        <li>Respond to support requests</li>
        <li>Send marketing communications (only if you have given consent)</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>4. Legal Basis for Processing (GDPR)</h2>
      <p>For users in the European Union, we process personal data based on:</p>
      <ul>
        <li><strong>Consent:</strong> for marketing and non-essential cookies</li>
        <li><strong>Contract Performance:</strong> to provide the Service</li>
        <li><strong>Legal Obligation:</strong> for tax and legal compliance</li>
        <li><strong>Legitimate Interest:</strong> to improve the Service and prevent fraud</li>
      </ul>

      <h2>5. Access via Google (Google Sign-In)</h2>
      <p>If you choose to access MyWellness using your Google account ("Sign in with Google"), we collect the following information from your Google profile:</p>
      <ul>
        <li><strong>Full name:</strong> to personalize your experience</li>
        <li><strong>Email address:</strong> to identify your account and send you important communications</li>
        <li><strong>Profile photo:</strong> to display it in your account (optional)</li>
      </ul>
      <p><strong>How we use this data:</strong></p>
      <ul>
        <li>To create and manage your MyWellness account</li>
        <li>To authenticate you securely without having to create a new password</li>
        <li>To personalize your experience within the app</li>
      </ul>
      <p>We do <strong>NOT</strong> access your Google contacts, browsing history, Google Drive files or other data from your Google account. Access is limited exclusively to basic profile information necessary for authentication.</p>
      <p>You can revoke MyWellness access to your Google account at any time from your Google account security settings at: <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/permissions</a></p>

      <h2>6. Data Sharing</h2>
      <p>We may share your data with:</p>
      <h3>6.1 Service Providers</h3>
      <ul>
        <li><strong>Stripe:</strong> for payment processing</li>
        <li><strong>Hosting Providers:</strong> to store data</li>
        <li><strong>Email Services:</strong> to send communications</li>
        <li><strong>AI Services:</strong> to generate personalized plans and analyze photos</li>
      </ul>
      <h3>6.2 Legal Authorities</h3>
      <p>When required by law or to protect our rights.</p>
      <h3>6.3 Business Transfers</h3>
      <p>In case of merger, acquisition or asset sale.</p>
      <p>We do <strong>NOT</strong> sell your personal data to third parties for marketing purposes.</p>

      <h2>7. Data Security</h2>
      <p>We implement technical and organizational security measures to protect your data:</p>
      <ul>
        <li>SSL/TLS encryption for all transmissions</li>
        <li>Secure data storage on protected servers</li>
        <li>Limited access to personal data only to authorized personnel</li>
        <li>Regular monitoring to detect vulnerabilities</li>
        <li>Regular data backups</li>
      </ul>
      <p>However, no method of transmission over the Internet is completely secure. We cannot guarantee absolute security of your data.</p>

      <h2>8. Data Retention</h2>
      <p>We retain your personal data for as long as necessary to provide the Service and to comply with legal obligations:</p>
      <ul>
        <li><strong>Active Accounts:</strong> for the duration of the subscription</li>
        <li><strong>Cancelled Accounts:</strong> 90 days after cancellation (to allow reactivation), then data is deleted</li>
        <li><strong>Billing Data:</strong> 10 years for tax obligations</li>
        <li><strong>Security Logs:</strong> up to 12 months</li>
      </ul>

      <h2>9. Your Rights</h2>
      <p>In accordance with GDPR and other privacy laws, you have the following rights:</p>
      <ul>
        <li><strong>Access:</strong> request a copy of your personal data</li>
        <li><strong>Rectification:</strong> correct inaccurate or incomplete data</li>
        <li><strong>Deletion:</strong> request deletion of your data ("right to be forgotten")</li>
        <li><strong>Restriction:</strong> restrict processing of your data</li>
        <li><strong>Portability:</strong> receive your data in structured format</li>
        <li><strong>Objection:</strong> object to processing of your data</li>
        <li><strong>Withdrawal of Consent:</strong> revoke previously given consent</li>
        <li><strong>Complaint:</strong> file a complaint with the supervisory authority</li>
      </ul>
      <p>To exercise these rights, contact us at: velika.03@outlook.it</p>

      <h2>10. Cookies</h2>
      <p>We use cookies and similar technologies for:</p>
      <ul>
        <li><strong>Essential Cookies:</strong> necessary for the operation of the Service</li>
        <li><strong>Analytics Cookies:</strong> to understand how you use the Service</li>
        <li><strong>Marketing Cookies:</strong> to personalize ads (only with consent)</li>
      </ul>
      <p>You can manage cookie preferences in your browser settings.</p>

      <h2>11. Children's Privacy</h2>
      <p>The Service is not intended for minors under 18 years of age. We do not knowingly collect personal data from minors under 18 years of age. If we discover that we have collected data from a minor, we will delete it immediately.</p>

      <h2>12. International Transfers</h2>
      <p>Your data may be transferred and stored on servers in the United States and other countries. We implement appropriate safeguards to ensure that your data is protected in accordance with this Privacy Policy and applicable laws.</p>

      <h2>13. Changes to Privacy Policy</h2>
      <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or notification in the Service. Continued use of the Service after changes constitutes acceptance of the new Privacy Policy.</p>

      <h2>14. Contact</h2>
      <p>For privacy questions or to exercise your rights, contact us:</p>
      <div class="contact-box">
        <p><strong>VELIKA GROUP LLC</strong></p>
        <p><strong>Data Protection Officer</strong></p>
        <p>30 N Gould St 32651</p>
        <p>Sheridan, WY 82801, United States</p>
        <p>EIN: 36-5141800</p>
        <p>Email: velika.03@outlook.it</p>
      </div>
    `
  },
  it: {
    title: "Privacy Policy",
    lastUpdated: "Ultimo aggiornamento: Gennaio 2025",
    content: `
      <h2>1. Introduzione</h2>
      <p>VELIKA GROUP LLC ("noi", "nostro") rispetta la tua privacy e si impegna a proteggere i tuoi dati personali. Questa Privacy Policy spiega come raccogliamo, utilizziamo, conserviamo e proteggiamo le tue informazioni quando utilizzi MyWellness (il "Servizio").</p>

      <h2>2. Informazioni che Raccogliamo</h2>
      <h3>2.1 Informazioni Fornite da Te</h3>
      <ul>
        <li><strong>Dati di Registrazione:</strong> nome, cognome, email, password</li>
        <li><strong>Dati di Pagamento:</strong> informazioni della carta di credito (elaborate in modo sicuro da Stripe)</li>
        <li><strong>Dati di Fatturazione:</strong> nome/ragione sociale, indirizzo, codice fiscale/partita IVA, PEC/SDI</li>
        <li><strong>Dati di Contatto:</strong> numero di telefono</li>
        <li><strong>Dati di Profilo:</strong> data di nascita, età, genere, altezza, peso, misure corporee</li>
        <li><strong>Dati sugli Obiettivi:</strong> peso target, tipo di corpo desiderato, zone da migliorare</li>
        <li><strong>Dati sullo Stile di Vita:</strong> livello di attività fisica, esperienza fitness, preferenze alimentari, allergie</li>
        <li><strong>Foto:</strong> immagini dei pasti e foto progresso caricate da te</li>
      </ul>

      <h3>2.2 Informazioni Raccolte Automaticamente</h3>
      <ul>
        <li>Indirizzo IP</li>
        <li>Tipo di browser e dispositivo</li>
        <li>Sistema operativo</li>
        <li>Pagine visitate e tempo di permanenza</li>
        <li>Data e ora di accesso</li>
        <li>Cookie e tecnologie simili</li>
      </ul>

      <h2>3. Come Utilizziamo le Tue Informazioni</h2>
      <p>Utilizziamo i tuoi dati per:</p>
      <ul>
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

      <h2>4. Base Giuridica del Trattamento (GDPR)</h2>
      <p>Per gli utenti nell'Unione Europea, trattiamo i dati personali sulla base di:</p>
      <ul>
        <li><strong>Consenso:</strong> per marketing e cookie non essenziali</li>
        <li><strong>Esecuzione del Contratto:</strong> per fornire il Servizio</li>
        <li><strong>Obbligo Legale:</strong> per conformità fiscale e legale</li>
        <li><strong>Legittimo Interesse:</strong> per migliorare il Servizio e prevenire frodi</li>
      </ul>

      <h2>5. Accesso tramite Google (Google Sign-In)</h2>
      <p>Se scegli di accedere a MyWellness utilizzando il tuo account Google ("Accedi con Google"), raccogliamo le seguenti informazioni dal tuo profilo Google:</p>
      <ul>
        <li><strong>Nome completo:</strong> per personalizzare la tua esperienza</li>
        <li><strong>Indirizzo email:</strong> per identificare il tuo account e inviarti comunicazioni importanti</li>
        <li><strong>Foto profilo:</strong> per visualizzarla nel tuo account (opzionale)</li>
      </ul>
      <p><strong>Come utilizziamo questi dati:</strong></p>
      <ul>
        <li>Per creare e gestire il tuo account MyWellness</li>
        <li>Per autenticarti in modo sicuro senza dover creare una nuova password</li>
        <li>Per personalizzare la tua esperienza all'interno dell'app</li>
      </ul>
      <p><strong>NON</strong> accediamo ai tuoi contatti Google, alla tua cronologia di navigazione, ai tuoi file Google Drive o ad altri dati del tuo account Google. L'accesso è limitato esclusivamente alle informazioni di profilo di base necessarie per l'autenticazione.</p>
      <p>Puoi revocare l'accesso di MyWellness al tuo account Google in qualsiasi momento dalle impostazioni di sicurezza del tuo account Google all'indirizzo: <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/permissions</a></p>

      <h2>6. Condivisione dei Dati</h2>
      <p>Potremmo condividere i tuoi dati con:</p>
      <h3>6.1 Fornitori di Servizi</h3>
      <ul>
        <li><strong>Stripe:</strong> per l'elaborazione dei pagamenti</li>
        <li><strong>Provider di Hosting:</strong> per archiviare i dati</li>
        <li><strong>Servizi Email:</strong> per inviare comunicazioni</li>
        <li><strong>Servizi AI:</strong> per generare piani personalizzati e analizzare foto</li>
      </ul>
      <h3>6.2 Autorità Legali</h3>
      <p>Quando richiesto dalla legge o per proteggere i nostri diritti.</p>
      <h3>6.3 Trasferimenti Aziendali</h3>
      <p>In caso di fusione, acquisizione o vendita di asset.</p>
      <p><strong>NON</strong> vendiamo i tuoi dati personali a terze parti per scopi di marketing.</p>

      <h2>7. Sicurezza dei Dati</h2>
      <p>Implementiamo misure di sicurezza tecniche e organizzative per proteggere i tuoi dati:</p>
      <ul>
        <li>Crittografia SSL/TLS per tutte le trasmissioni</li>
        <li>Archiviazione sicura dei dati su server protetti</li>
        <li>Accesso limitato ai dati personali solo al personale autorizzato</li>
        <li>Monitoraggio regolare per rilevare vulnerabilità</li>
        <li>Backup regolari dei dati</li>
      </ul>
      <p>Tuttavia, nessun metodo di trasmissione su Internet è completamente sicuro. Non possiamo garantire la sicurezza assoluta dei tuoi dati.</p>

      <h2>8. Conservazione dei Dati</h2>
      <p>Conserviamo i tuoi dati personali per il tempo necessario a fornire il Servizio e per rispettare obblighi legali:</p>
      <ul>
        <li><strong>Account Attivi:</strong> per tutta la durata dell'abbonamento</li>
        <li><strong>Account Cancellati:</strong> 90 giorni dopo la cancellazione (per permettere riattivazione), poi i dati vengono eliminati</li>
        <li><strong>Dati di Fatturazione:</strong> 10 anni per obblighi fiscali</li>
        <li><strong>Log di Sicurezza:</strong> fino a 12 mesi</li>
      </ul>

      <h2>9. I Tuoi Diritti</h2>
      <p>In conformità al GDPR e altre leggi sulla privacy, hai i seguenti diritti:</p>
      <ul>
        <li><strong>Accesso:</strong> richiedere una copia dei tuoi dati personali</li>
        <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
        <li><strong>Cancellazione:</strong> richiedere la cancellazione dei tuoi dati ("diritto all'oblio")</li>
        <li><strong>Limitazione:</strong> limitare il trattamento dei tuoi dati</li>
        <li><strong>Portabilità:</strong> ricevere i tuoi dati in formato strutturato</li>
        <li><strong>Opposizione:</strong> opporti al trattamento dei tuoi dati</li>
        <li><strong>Revoca del Consenso:</strong> revocare il consenso precedentemente dato</li>
        <li><strong>Reclamo:</strong> presentare reclamo all'autorità di controllo</li>
      </ul>
      <p>Per esercitare questi diritti, contattaci a: velika.03@outlook.it</p>

      <h2>10. Cookie</h2>
      <p>Utilizziamo cookie e tecnologie simili per:</p>
      <ul>
        <li><strong>Cookie Essenziali:</strong> necessari per il funzionamento del Servizio</li>
        <li><strong>Cookie Analitici:</strong> per comprendere come utilizzi il Servizio</li>
        <li><strong>Cookie di Marketing:</strong> per personalizzare annunci (solo con consenso)</li>
      </ul>
      <p>Puoi gestire le preferenze sui cookie nelle impostazioni del tuo browser.</p>

      <h2>11. Privacy dei Minori</h2>
      <p>Il Servizio non è destinato a minori di 18 anni. Non raccogliamo consapevolmente dati personali da minori di 18 anni. Se scopriamo di aver raccolto dati da un minore, li cancelleremo immediatamente.</p>

      <h2>12. Trasferimenti Internazionali</h2>
      <p>I tuoi dati possono essere trasferiti e archiviati su server negli Stati Uniti e in altri paesi. Implementiamo salvaguardie appropriate per garantire che i tuoi dati siano protetti in conformità a questa Privacy Policy e alle leggi applicabili.</p>

      <h2>13. Modifiche alla Privacy Policy</h2>
      <p>Potremmo aggiornare questa Privacy Policy periodicamente. Ti informeremo di modifiche sostanziali tramite email o notifica nel Servizio. L'uso continuato del Servizio dopo le modifiche costituisce accettazione della nuova Privacy Policy.</p>

      <h2>14. Contatti</h2>
      <p>Per domande sulla privacy o per esercitare i tuoi diritti, contattaci:</p>
      <div class="contact-box">
        <p><strong>VELIKA GROUP LLC</strong></p>
        <p><strong>Data Protection Officer</strong></p>
        <p>30 N Gould St 32651</p>
        <p>Sheridan, WY 82801, United States</p>
        <p>EIN: 36-5141800</p>
        <p>Email: velika.03@outlook.it</p>
      </div>
    `
  },
  es: {
    title: "Política de Privacidad",
    lastUpdated: "Última actualización: Enero 2025",
    content: `<h2>1. Introducción</h2><p>VELIKA GROUP LLC ("nosotros", "nuestro") respeta tu privacidad...</p>`
  },
  pt: {
    title: "Política de Privacidade",
    lastUpdated: "Última atualização: Janeiro 2025",
    content: `<h2>1. Introdução</h2><p>VELIKA GROUP LLC ("nós", "nosso") respeita sua privacidade...</p>`
  },
  de: {
    title: "Datenschutzerklärung",
    lastUpdated: "Letzte Aktualisierung: Januar 2025",
    content: `<h2>1. Einführung</h2><p>VELIKA GROUP LLC ("wir", "unser") respektiert Ihre Privatsphäre...</p>`
  },
  fr: {
    title: "Politique de Confidentialité",
    lastUpdated: "Dernière mise à jour: Janvier 2025",
    content: `<h2>1. Introduction</h2><p>VELIKA GROUP LLC ("nous", "notre") respecte votre vie privée...</p>`
  }
};

export default function Privacy() {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState('en');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const content = CONTENT[selectedLang];

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
        .content h2 { font-size: 1.5rem; font-weight: bold; color: #111827; margin-top: 2rem; margin-bottom: 1rem; }
        .content h3 { font-size: 1.25rem; font-weight: 600; color: #111827; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .content ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .content li { margin: 0.5rem 0; }
        .content p { margin: 0.75rem 0; }
        .content a { color: var(--brand-primary); text-decoration: underline; }
        .contact-box { background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; }
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
          {/* Language Selector */}
          <div className="flex justify-end mb-6">
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white rounded-full border border-gray-200 transition-all">
                <Globe className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {LANGUAGES.find(l => l.code === selectedLang)?.flag} {LANGUAGES.find(l => l.code === selectedLang)?.name}
                </span>
              </button>

              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)}></div>
                  <div className="absolute right-0 top-12 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 min-w-[180px] z-50">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLang(lang.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          selectedLang === lang.code
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}>
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">{content.title}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">{content.lastUpdated}</p>

          <div 
            className="content space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
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