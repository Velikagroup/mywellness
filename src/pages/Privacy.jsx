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
    content: `
      <h2>1. Introducción</h2>
      <p>VELIKA GROUP LLC ("nosotros", "nuestro") respeta tu privacidad y se compromete a proteger tus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos tu información cuando utilizas MyWellness (el "Servicio").</p>

      <h2>2. Información que Recopilamos</h2>
      <h3>2.1 Información Proporcionada por Ti</h3>
      <ul>
        <li><strong>Datos de Registro:</strong> nombre, apellido, correo electrónico, contraseña</li>
        <li><strong>Datos de Pago:</strong> información de tarjeta de crédito (procesada de forma segura por Stripe)</li>
        <li><strong>Datos de Facturación:</strong> nombre/razón social, dirección, número de identificación fiscal</li>
        <li><strong>Datos de Contacto:</strong> número de teléfono</li>
        <li><strong>Datos de Perfil:</strong> fecha de nacimiento, edad, género, altura, peso, medidas corporales</li>
        <li><strong>Datos de Objetivos:</strong> peso objetivo, tipo de cuerpo deseado, áreas a mejorar</li>
        <li><strong>Datos de Estilo de Vida:</strong> nivel de actividad física, experiencia fitness, preferencias alimentarias, alergias</li>
        <li><strong>Fotos:</strong> imágenes de comidas y fotos de progreso cargadas por ti</li>
      </ul>

      <h3>2.2 Información Recopilada Automáticamente</h3>
      <ul>
        <li>Dirección IP</li>
        <li>Tipo de navegador y dispositivo</li>
        <li>Sistema operativo</li>
        <li>Páginas visitadas y tiempo de permanencia</li>
        <li>Fecha y hora de acceso</li>
        <li>Cookies y tecnologías similares</li>
      </ul>

      <h2>3. Cómo Utilizamos tu Información</h2>
      <p>Utilizamos tus datos para:</p>
      <ul>
        <li>Proporcionar y mejorar el Servicio</li>
        <li>Crear planes nutricionales y de entrenamiento personalizados</li>
        <li>Procesar pagos y gestionar suscripciones</li>
        <li>Enviar confirmaciones, facturas y comunicaciones importantes</li>
        <li>Analizar el progreso y proporcionar retroalimentación</li>
        <li>Mejorar nuestros algoritmos de inteligencia artificial</li>
        <li>Prevenir fraudes y garantizar la seguridad</li>
        <li>Responder a solicitudes de soporte</li>
        <li>Enviar comunicaciones de marketing (solo si has dado consentimiento)</li>
        <li>Cumplir con obligaciones legales</li>
      </ul>

      <h2>4. Base Legal para el Tratamiento (GDPR)</h2>
      <p>Para usuarios en la Unión Europea, procesamos datos personales basados en:</p>
      <ul>
        <li><strong>Consentimiento:</strong> para marketing y cookies no esenciales</li>
        <li><strong>Ejecución del Contrato:</strong> para proporcionar el Servicio</li>
        <li><strong>Obligación Legal:</strong> para cumplimiento fiscal y legal</li>
        <li><strong>Interés Legítimo:</strong> para mejorar el Servicio y prevenir fraudes</li>
      </ul>

      <h2>5. Acceso mediante Google (Google Sign-In)</h2>
      <p>Si eliges acceder a MyWellness usando tu cuenta de Google, recopilamos la siguiente información de tu perfil de Google:</p>
      <ul>
        <li><strong>Nombre completo:</strong> para personalizar tu experiencia</li>
        <li><strong>Dirección de correo electrónico:</strong> para identificar tu cuenta y enviarte comunicaciones importantes</li>
        <li><strong>Foto de perfil:</strong> para mostrarla en tu cuenta (opcional)</li>
      </ul>
      <p><strong>NO</strong> accedemos a tus contactos de Google, historial de navegación, archivos de Google Drive u otros datos de tu cuenta de Google. El acceso se limita exclusivamente a la información básica del perfil necesaria para la autenticación.</p>

      <h2>6. Compartir Datos</h2>
      <p>Podemos compartir tus datos con:</p>
      <h3>6.1 Proveedores de Servicios</h3>
      <ul>
        <li><strong>Stripe:</strong> para procesamiento de pagos</li>
        <li><strong>Proveedores de Hosting:</strong> para almacenar datos</li>
        <li><strong>Servicios de Email:</strong> para enviar comunicaciones</li>
        <li><strong>Servicios de IA:</strong> para generar planes personalizados y analizar fotos</li>
      </ul>
      <p><strong>NO</strong> vendemos tus datos personales a terceros con fines de marketing.</p>

      <h2>7. Seguridad de Datos</h2>
      <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos:</p>
      <ul>
        <li>Cifrado SSL/TLS para todas las transmisiones</li>
        <li>Almacenamiento seguro de datos en servidores protegidos</li>
        <li>Acceso limitado a datos personales solo para personal autorizado</li>
        <li>Monitoreo regular para detectar vulnerabilidades</li>
        <li>Copias de seguridad regulares de datos</li>
      </ul>

      <h2>8. Retención de Datos</h2>
      <p>Conservamos tus datos personales el tiempo necesario para proporcionar el Servicio:</p>
      <ul>
        <li><strong>Cuentas Activas:</strong> durante la duración de la suscripción</li>
        <li><strong>Cuentas Canceladas:</strong> 90 días después de la cancelación, luego se eliminan los datos</li>
        <li><strong>Datos de Facturación:</strong> 10 años por obligaciones fiscales</li>
      </ul>

      <h2>9. Tus Derechos</h2>
      <p>De acuerdo con el GDPR y otras leyes de privacidad, tienes los siguientes derechos:</p>
      <ul>
        <li><strong>Acceso:</strong> solicitar una copia de tus datos personales</li>
        <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
        <li><strong>Supresión:</strong> solicitar la eliminación de tus datos</li>
        <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado</li>
      </ul>
      <p>Para ejercer estos derechos, contáctanos en: velika.03@outlook.it</p>

      <h2>10. Contacto</h2>
      <div class="contact-box">
        <p><strong>VELIKA GROUP LLC</strong></p>
        <p>30 N Gould St 32651, Sheridan, WY 82801, United States</p>
        <p>EIN: 36-5141800 | Email: velika.03@outlook.it</p>
      </div>
    `
  },
  pt: {
    title: "Política de Privacidade",
    lastUpdated: "Última atualização: Janeiro 2025",
    content: `
      <h2>1. Introdução</h2>
      <p>VELIKA GROUP LLC ("nós", "nosso") respeita sua privacidade e está comprometido em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações quando você usa o MyWellness (o "Serviço").</p>

      <h2>2. Informações que Coletamos</h2>
      <h3>2.1 Informações Fornecidas por Você</h3>
      <ul>
        <li><strong>Dados de Registro:</strong> nome, sobrenome, e-mail, senha</li>
        <li><strong>Dados de Pagamento:</strong> informações do cartão de crédito (processadas com segurança pela Stripe)</li>
        <li><strong>Dados de Faturamento:</strong> nome/razão social, endereço, número de identificação fiscal</li>
        <li><strong>Dados de Contato:</strong> número de telefone</li>
        <li><strong>Dados de Perfil:</strong> data de nascimento, idade, gênero, altura, peso, medidas corporais</li>
        <li><strong>Dados de Objetivos:</strong> peso alvo, tipo de corpo desejado, áreas a melhorar</li>
        <li><strong>Dados de Estilo de Vida:</strong> nível de atividade física, experiência fitness, preferências alimentares, alergias</li>
        <li><strong>Fotos:</strong> imagens de refeições e fotos de progresso carregadas por você</li>
      </ul>

      <h3>2.2 Informações Coletadas Automaticamente</h3>
      <ul>
        <li>Endereço IP</li>
        <li>Tipo de navegador e dispositivo</li>
        <li>Sistema operacional</li>
        <li>Páginas visitadas e tempo de permanência</li>
        <li>Data e hora de acesso</li>
        <li>Cookies e tecnologias similares</li>
      </ul>

      <h2>3. Como Usamos suas Informações</h2>
      <p>Usamos seus dados para:</p>
      <ul>
        <li>Fornecer e melhorar o Serviço</li>
        <li>Criar planos nutricionais e de treino personalizados</li>
        <li>Processar pagamentos e gerenciar assinaturas</li>
        <li>Enviar confirmações, faturas e comunicações importantes</li>
        <li>Analisar o progresso e fornecer feedback</li>
        <li>Melhorar nossos algoritmos de inteligência artificial</li>
        <li>Prevenir fraudes e garantir segurança</li>
        <li>Responder a solicitações de suporte</li>
        <li>Enviar comunicações de marketing (apenas se você consentiu)</li>
        <li>Cumprir obrigações legais</li>
      </ul>

      <h2>4. Base Legal para o Processamento (GDPR)</h2>
      <p>Para usuários na União Europeia, processamos dados pessoais com base em:</p>
      <ul>
        <li><strong>Consentimento:</strong> para marketing e cookies não essenciais</li>
        <li><strong>Execução do Contrato:</strong> para fornecer o Serviço</li>
        <li><strong>Obrigação Legal:</strong> para conformidade fiscal e legal</li>
        <li><strong>Interesse Legítimo:</strong> para melhorar o Serviço e prevenir fraudes</li>
      </ul>

      <h2>5. Acesso via Google (Google Sign-In)</h2>
      <p>Se você escolher acessar o MyWellness usando sua conta do Google, coletamos as seguintes informações do seu perfil do Google:</p>
      <ul>
        <li><strong>Nome completo:</strong> para personalizar sua experiência</li>
        <li><strong>Endereço de e-mail:</strong> para identificar sua conta e enviar comunicações importantes</li>
        <li><strong>Foto de perfil:</strong> para exibi-la em sua conta (opcional)</li>
      </ul>
      <p><strong>NÃO</strong> acessamos seus contatos do Google, histórico de navegação, arquivos do Google Drive ou outros dados da sua conta do Google. O acesso é limitado exclusivamente às informações básicas de perfil necessárias para autenticação.</p>

      <h2>6. Compartilhamento de Dados</h2>
      <p>Podemos compartilhar seus dados com:</p>
      <h3>6.1 Provedores de Serviços</h3>
      <ul>
        <li><strong>Stripe:</strong> para processamento de pagamentos</li>
        <li><strong>Provedores de Hospedagem:</strong> para armazenar dados</li>
        <li><strong>Serviços de E-mail:</strong> para enviar comunicações</li>
        <li><strong>Serviços de IA:</strong> para gerar planos personalizados e analisar fotos</li>
      </ul>
      <p><strong>NÃO</strong> vendemos seus dados pessoais a terceiros para fins de marketing.</p>

      <h2>7. Segurança de Dados</h2>
      <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:</p>
      <ul>
        <li>Criptografia SSL/TLS para todas as transmissões</li>
        <li>Armazenamento seguro de dados em servidores protegidos</li>
        <li>Acesso limitado a dados pessoais apenas para pessoal autorizado</li>
        <li>Monitoramento regular para detectar vulnerabilidades</li>
        <li>Backups regulares de dados</li>
      </ul>

      <h2>8. Retenção de Dados</h2>
      <p>Retemos seus dados pessoais pelo tempo necessário para fornecer o Serviço:</p>
      <ul>
        <li><strong>Contas Ativas:</strong> durante a duração da assinatura</li>
        <li><strong>Contas Canceladas:</strong> 90 dias após o cancelamento, depois os dados são excluídos</li>
        <li><strong>Dados de Faturamento:</strong> 10 anos por obrigações fiscais</li>
      </ul>

      <h2>9. Seus Direitos</h2>
      <p>De acordo com o GDPR e outras leis de privacidade, você tem os seguintes direitos:</p>
      <ul>
        <li><strong>Acesso:</strong> solicitar uma cópia de seus dados pessoais</li>
        <li><strong>Retificação:</strong> corrigir dados imprecisos ou incompletos</li>
        <li><strong>Exclusão:</strong> solicitar a exclusão de seus dados</li>
        <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
      </ul>
      <p>Para exercer esses direitos, entre em contato: velika.03@outlook.it</p>

      <h2>10. Contato</h2>
      <div class="contact-box">
        <p><strong>VELIKA GROUP LLC</strong></p>
        <p>30 N Gould St 32651, Sheridan, WY 82801, United States</p>
        <p>EIN: 36-5141800 | Email: velika.03@outlook.it</p>
      </div>
    `
  },
  de: {
    title: "Datenschutzerklärung",
    lastUpdated: "Letzte Aktualisierung: Januar 2025",
    content: `
      <h2>1. Einführung</h2>
      <p>VELIKA GROUP LLC ("wir", "unser") respektiert Ihre Privatsphäre und verpflichtet sich, Ihre personenbezogenen Daten zu schützen. Diese Datenschutzerklärung erklärt, wie wir Ihre Informationen sammeln, verwenden, speichern und schützen, wenn Sie MyWellness (den "Dienst") nutzen.</p>

      <h2>2. Informationen, die wir sammeln</h2>
      <h3>2.1 Von Ihnen bereitgestellte Informationen</h3>
      <ul>
        <li><strong>Registrierungsdaten:</strong> Vorname, Nachname, E-Mail, Passwort</li>
        <li><strong>Zahlungsdaten:</strong> Kreditkarteninformationen (sicher verarbeitet durch Stripe)</li>
        <li><strong>Rechnungsdaten:</strong> Name/Firmenname, Adresse, Steuernummer</li>
        <li><strong>Kontaktdaten:</strong> Telefonnummer</li>
        <li><strong>Profildaten:</strong> Geburtsdatum, Alter, Geschlecht, Größe, Gewicht, Körpermaße</li>
        <li><strong>Zieldaten:</strong> Zielgewicht, gewünschter Körpertyp, zu verbessernde Bereiche</li>
        <li><strong>Lifestyle-Daten:</strong> körperliche Aktivität, Fitness-Erfahrung, Ernährungspräferenzen, Allergien</li>
        <li><strong>Fotos:</strong> Mahlzeitenbilder und Fortschrittsfotos, die von Ihnen hochgeladen wurden</li>
      </ul>

      <h3>2.2 Automatisch gesammelte Informationen</h3>
      <ul>
        <li>IP-Adresse</li>
        <li>Browser-Typ und Gerät</li>
        <li>Betriebssystem</li>
        <li>Besuchte Seiten und Verweildauer</li>
        <li>Datum und Uhrzeit des Zugriffs</li>
        <li>Cookies und ähnliche Technologien</li>
      </ul>

      <h2>3. Wie wir Ihre Informationen verwenden</h2>
      <p>Wir verwenden Ihre Daten, um:</p>
      <ul>
        <li>Den Dienst bereitzustellen und zu verbessern</li>
        <li>Personalisierte Ernährungs- und Trainingspläne zu erstellen</li>
        <li>Zahlungen zu verarbeiten und Abonnements zu verwalten</li>
        <li>Bestätigungen, Rechnungen und wichtige Mitteilungen zu senden</li>
        <li>Fortschritte zu analysieren und Feedback zu geben</li>
        <li>Unsere KI-Algorithmen zu verbessern</li>
        <li>Betrug zu verhindern und Sicherheit zu gewährleisten</li>
        <li>Auf Support-Anfragen zu antworten</li>
        <li>Marketing-Kommunikation zu senden (nur mit Ihrer Zustimmung)</li>
        <li>Rechtliche Verpflichtungen zu erfüllen</li>
      </ul>

      <h2>4. Rechtsgrundlage für die Verarbeitung (DSGVO)</h2>
      <p>Für Nutzer in der Europäischen Union verarbeiten wir personenbezogene Daten auf der Grundlage von:</p>
      <ul>
        <li><strong>Einwilligung:</strong> für Marketing und nicht-essenzielle Cookies</li>
        <li><strong>Vertragserfüllung:</strong> zur Bereitstellung des Dienstes</li>
        <li><strong>Rechtliche Verpflichtung:</strong> für steuerliche und rechtliche Compliance</li>
        <li><strong>Berechtigtes Interesse:</strong> zur Verbesserung des Dienstes und Betrugsprävention</li>
      </ul>

      <h2>5. Zugriff über Google (Google Sign-In)</h2>
      <p>Wenn Sie sich für den Zugriff auf MyWellness mit Ihrem Google-Konto entscheiden, sammeln wir folgende Informationen aus Ihrem Google-Profil:</p>
      <ul>
        <li><strong>Vollständiger Name:</strong> zur Personalisierung Ihrer Erfahrung</li>
        <li><strong>E-Mail-Adresse:</strong> zur Identifizierung Ihres Kontos und zum Versenden wichtiger Mitteilungen</li>
        <li><strong>Profilbild:</strong> zur Anzeige in Ihrem Konto (optional)</li>
      </ul>
      <p>Wir greifen <strong>NICHT</strong> auf Ihre Google-Kontakte, Ihren Browserverlauf, Google Drive-Dateien oder andere Daten Ihres Google-Kontos zu. Der Zugriff beschränkt sich ausschließlich auf grundlegende Profilinformationen, die für die Authentifizierung erforderlich sind.</p>

      <h2>6. Datenweitergabe</h2>
      <p>Wir können Ihre Daten weitergeben an:</p>
      <h3>6.1 Dienstleister</h3>
      <ul>
        <li><strong>Stripe:</strong> für Zahlungsabwicklung</li>
        <li><strong>Hosting-Anbieter:</strong> zur Datenspeicherung</li>
        <li><strong>E-Mail-Dienste:</strong> zum Versenden von Mitteilungen</li>
        <li><strong>KI-Dienste:</strong> zur Erstellung personalisierter Pläne und Fotoanalyse</li>
      </ul>
      <p>Wir verkaufen Ihre personenbezogenen Daten <strong>NICHT</strong> an Dritte für Marketingzwecke.</p>

      <h2>7. Datensicherheit</h2>
      <p>Wir implementieren technische und organisatorische Sicherheitsmaßnahmen zum Schutz Ihrer Daten:</p>
      <ul>
        <li>SSL/TLS-Verschlüsselung für alle Übertragungen</li>
        <li>Sichere Datenspeicherung auf geschützten Servern</li>
        <li>Begrenzter Zugriff auf personenbezogene Daten nur für autorisiertes Personal</li>
        <li>Regelmäßige Überwachung zur Erkennung von Schwachstellen</li>
        <li>Regelmäßige Datensicherungen</li>
      </ul>

      <h2>8. Datenspeicherung</h2>
      <p>Wir speichern Ihre personenbezogenen Daten so lange, wie es zur Bereitstellung des Dienstes erforderlich ist:</p>
      <ul>
        <li><strong>Aktive Konten:</strong> für die Dauer des Abonnements</li>
        <li><strong>Gekündigte Konten:</strong> 90 Tage nach Kündigung, danach werden Daten gelöscht</li>
        <li><strong>Rechnungsdaten:</strong> 10 Jahre aufgrund steuerlicher Verpflichtungen</li>
      </ul>

      <h2>9. Ihre Rechte</h2>
      <p>Gemäß DSGVO und anderen Datenschutzgesetzen haben Sie folgende Rechte:</p>
      <ul>
        <li><strong>Zugriff:</strong> eine Kopie Ihrer personenbezogenen Daten anfordern</li>
        <li><strong>Berichtigung:</strong> ungenaue oder unvollständige Daten korrigieren</li>
        <li><strong>Löschung:</strong> die Löschung Ihrer Daten beantragen</li>
        <li><strong>Datenübertragbarkeit:</strong> Ihre Daten in strukturiertem Format erhalten</li>
      </ul>
      <p>Um diese Rechte auszuüben, kontaktieren Sie uns unter: velika.03@outlook.it</p>

      <h2>10. Kontakt</h2>
      <div class="contact-box">
        <p><strong>VELIKA GROUP LLC</strong></p>
        <p>30 N Gould St 32651, Sheridan, WY 82801, United States</p>
        <p>EIN: 36-5141800 | E-Mail: velika.03@outlook.it</p>
      </div>
    `
  },
  fr: {
    title: "Politique de Confidentialité",
    lastUpdated: "Dernière mise à jour: Janvier 2025",
    content: `
      <h2>1. Introduction</h2>
      <p>VELIKA GROUP LLC ("nous", "notre") respecte votre vie privée et s'engage à protéger vos données personnelles. Cette Politique de Confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations lorsque vous utilisez MyWellness (le "Service").</p>

      <h2>2. Informations que nous collectons</h2>
      <h3>2.1 Informations fournies par vous</h3>
      <ul>
        <li><strong>Données d'inscription:</strong> prénom, nom, e-mail, mot de passe</li>
        <li><strong>Données de paiement:</strong> informations de carte de crédit (traitées en toute sécurité par Stripe)</li>
        <li><strong>Données de facturation:</strong> nom/raison sociale, adresse, numéro d'identification fiscale</li>
        <li><strong>Données de contact:</strong> numéro de téléphone</li>
        <li><strong>Données de profil:</strong> date de naissance, âge, genre, taille, poids, mesures corporelles</li>
        <li><strong>Données d'objectifs:</strong> poids cible, type de corps souhaité, zones à améliorer</li>
        <li><strong>Données de style de vie:</strong> niveau d'activité physique, expérience fitness, préférences alimentaires, allergies</li>
        <li><strong>Photos:</strong> images de repas et photos de progrès téléchargées par vous</li>
      </ul>

      <h3>2.2 Informations collectées automatiquement</h3>
      <ul>
        <li>Adresse IP</li>
        <li>Type de navigateur et appareil</li>
        <li>Système d'exploitation</li>
        <li>Pages visitées et temps de visite</li>
        <li>Date et heure d'accès</li>
        <li>Cookies et technologies similaires</li>
      </ul>

      <h2>3. Comment nous utilisons vos informations</h2>
      <p>Nous utilisons vos données pour:</p>
      <ul>
        <li>Fournir et améliorer le Service</li>
        <li>Créer des plans nutritionnels et d'entraînement personnalisés</li>
        <li>Traiter les paiements et gérer les abonnements</li>
        <li>Envoyer des confirmations, factures et communications importantes</li>
        <li>Analyser les progrès et fournir des commentaires</li>
        <li>Améliorer nos algorithmes d'intelligence artificielle</li>
        <li>Prévenir la fraude et assurer la sécurité</li>
        <li>Répondre aux demandes de support</li>
        <li>Envoyer des communications marketing (uniquement avec votre consentement)</li>
        <li>Respecter les obligations légales</li>
      </ul>

      <h2>4. Base légale du traitement (RGPD)</h2>
      <p>Pour les utilisateurs dans l'Union européenne, nous traitons les données personnelles sur la base de:</p>
      <ul>
        <li><strong>Consentement:</strong> pour le marketing et les cookies non essentiels</li>
        <li><strong>Exécution du contrat:</strong> pour fournir le Service</li>
        <li><strong>Obligation légale:</strong> pour la conformité fiscale et légale</li>
        <li><strong>Intérêt légitime:</strong> pour améliorer le Service et prévenir la fraude</li>
      </ul>

      <h2>5. Accès via Google (Google Sign-In)</h2>
      <p>Si vous choisissez d'accéder à MyWellness en utilisant votre compte Google, nous collectons les informations suivantes de votre profil Google:</p>
      <ul>
        <li><strong>Nom complet:</strong> pour personnaliser votre expérience</li>
        <li><strong>Adresse e-mail:</strong> pour identifier votre compte et envoyer des communications importantes</li>
        <li><strong>Photo de profil:</strong> pour l'afficher dans votre compte (facultatif)</li>
      </ul>
      <p>Nous n'accédons <strong>PAS</strong> à vos contacts Google, à votre historique de navigation, à vos fichiers Google Drive ou à d'autres données de votre compte Google. L'accès est limité exclusivement aux informations de profil de base nécessaires pour l'authentification.</p>

      <h2>6. Partage des données</h2>
      <p>Nous pouvons partager vos données avec:</p>
      <h3>6.1 Fournisseurs de services</h3>
      <ul>
        <li><strong>Stripe:</strong> pour le traitement des paiements</li>
        <li><strong>Fournisseurs d'hébergement:</strong> pour stocker les données</li>
        <li><strong>Services d'e-mail:</strong> pour envoyer des communications</li>
        <li><strong>Services d'IA:</strong> pour générer des plans personnalisés et analyser les photos</li>
      </ul>
      <p>Nous ne vendons <strong>PAS</strong> vos données personnelles à des tiers à des fins de marketing.</p>

      <h2>7. Sécurité des données</h2>
      <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données:</p>
      <ul>
        <li>Chiffrement SSL/TLS pour toutes les transmissions</li>
        <li>Stockage sécurisé des données sur des serveurs protégés</li>
        <li>Accès limité aux données personnelles uniquement au personnel autorisé</li>
        <li>Surveillance régulière pour détecter les vulnérabilités</li>
        <li>Sauvegardes régulières des données</li>
      </ul>

      <h2>8. Conservation des données</h2>
      <p>Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir le Service:</p>
      <ul>
        <li><strong>Comptes actifs:</strong> pendant la durée de l'abonnement</li>
        <li><strong>Comptes annulés:</strong> 90 jours après l'annulation, puis les données sont supprimées</li>
        <li><strong>Données de facturation:</strong> 10 ans pour obligations fiscales</li>
      </ul>

      <h2>9. Vos droits</h2>
      <p>Conformément au RGPD et à d'autres lois sur la confidentialité, vous disposez des droits suivants:</p>
      <ul>
        <li><strong>Accès:</strong> demander une copie de vos données personnelles</li>
        <li><strong>Rectification:</strong> corriger les données inexactes ou incomplètes</li>
        <li><strong>Suppression:</strong> demander la suppression de vos données</li>
        <li><strong>Portabilité:</strong> recevoir vos données dans un format structuré</li>
      </ul>
      <p>Pour exercer ces droits, contactez-nous à: velika.03@outlook.it</p>

      <h2>10. Contact</h2>
      <div class="contact-box">
        <p><strong>VELIKA GROUP LLC</strong></p>
        <p>30 N Gould St 32651, Sheridan, WY 82801, United States</p>
        <p>EIN: 36-5141800 | E-mail: velika.03@outlook.it</p>
      </div>
    `
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