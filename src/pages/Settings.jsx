import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { rememberMeManager } from '../components/utils/rememberMeManager';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  User,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  Download,
  Trash2,
  Crown,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Share2,
  DollarSign,
  Copy,
  ExternalLink,
  Globe,
  ChevronDown,
  Check,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UpgradeModal from '../components/meals/UpgradeModal';
import TicketChatWidget from '../components/support/TicketChatWidget';
import { useLanguage, SUPPORTED_LANGUAGES } from '../components/i18n/LanguageContext';

export default function Settings() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);

  // Account
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Password (solo se non Google OAuth)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifiche
  const [emailNotifications, setEmailNotifications] = useState({
    marketing: true,
    product_updates: true,
    renewal_reminders: true,
    workout_reminders: true
  });

  // Fatturazione
  const [billingInfo, setBillingInfo] = useState({
    billingType: 'private',
    companyName: '',
    taxId: '',
    pecSdi: '',
    address: '',
    city: '',
    zip: '',
    country: 'IT'
  });

  // Support Ticket
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('tecnico');
  const [showTicketChat, setShowTicketChat] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelFeedbackDialog, setShowCancelFeedbackDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationDetails, setCancellationDetails] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedTicketForChat, setSelectedTicketForChat] = useState(null);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);
  
  // HealthKit
  const [isHealthKitConnected, setIsHealthKitConnected] = useState(false);
  const [isSyncingHealthKit, setIsSyncingHealthKit] = useState(false);
  const [healthKitAvailable, setHealthKitAvailable] = useState(false);
  
  // Translation for the language warning banner
  const languageWarningTexts = {
    it: "Hai cambiato lingua! Per vedere i piani di nutrizione e allenamento nella nuova lingua, dovrai rigenerarli. Altrimenti rimarranno nella lingua originale.",
    en: "You changed language! To see your nutrition and workout plans in the new language, you'll need to regenerate them. Otherwise they'll remain in the original language.",
    es: "¡Cambiaste de idioma! Para ver tus planes de nutrición y entrenamiento en el nuevo idioma, deberás regenerarlos. De lo contrario, permanecerán en el idioma original.",
    pt: "Você mudou o idioma! Para ver seus planos de nutrição e treino no novo idioma, você precisará regenerá-los. Caso contrário, eles permanecerão no idioma original.",
    de: "Sie haben die Sprache geändert! Um Ihre Ernährungs- und Trainingspläne in der neuen Sprache zu sehen, müssen Sie sie neu generieren. Andernfalls bleiben sie in der ursprünglichen Sprache.",
    fr: "Vous avez changé de langue ! Pour voir vos plans de nutrition et d'entraînement dans la nouvelle langue, vous devrez les régénérer. Sinon, ils resteront dans la langue d'origine."
  };

  // Affiliazione
  const [affiliateStats, setAffiliateStats] = useState(null);
  const [isLoadingAffiliate, setIsLoadingAffiliate] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    loadUserData();
    
    // Verifica disponibilità bridge HealthKit
    if (window.__mw_sync) {
      setHealthKitAvailable(true);
      // Verifica se già connesso (localStorage)
      const hkConnected = localStorage.getItem('hk_connected') === '1';
      setIsHealthKitConnected(hkConnected);
    }
    
    // Setup callback per risultati sync (opzionale, per future implementazioni)
    window.__mw_sync_result = function(payload) {
      console.log('📊 HealthKit sync result:', payload);
      if (payload.success) {
        setIsHealthKitConnected(true);
        localStorage.setItem('hk_connected', '1');
        alert('✅ HealthKit sincronizzato con successo!');
      } else {
        alert('❌ Errore sincronizzazione HealthKit: ' + (payload.message || 'Errore sconosciuto'));
      }
      setIsSyncingHealthKit(false);
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('onboarding') === 'success') {
      loadAffiliateStats();
    }
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      // 🔍 DEBUG: Controlla provider SSO e password
      console.log('🔍 SSO Provider:', currentUser?.sso_provider);
      console.log('🔍 Has password_hash:', !!currentUser?.password_hash);
      console.log('🔍 User email:', currentUser?.email);
      console.log('🔍 All user data:', currentUser);
      
      // ✅ Se l'utente non ha subscription, rimanda al quiz
      if (!currentUser.subscription_status || 
          (currentUser.subscription_status !== 'active' && currentUser.subscription_status !== 'trial')) {
        console.warn('⚠️ User has no active subscription, redirecting to Quiz');
        navigate(createPageUrl('Quiz'), { replace: true });
        return;
      }
      
      setUser(currentUser);

      setFullName(currentUser.full_name || '');
      setPhoneNumber(currentUser.phone_number || '');

      setBillingInfo({
        billingType: currentUser.billing_type || 'private',
        companyName: currentUser.company_name || '',
        taxId: currentUser.tax_id || '',
        pecSdi: currentUser.pec_sdi || '',
        address: currentUser.billing_address || '',
        city: currentUser.billing_city || '',
        zip: currentUser.billing_zip || '',
        country: currentUser.billing_country || 'IT'
      });

      setEmailNotifications({
        marketing: currentUser.email_notifications?.marketing ?? true,
        product_updates: currentUser.email_notifications?.product_updates ?? true,
        renewal_reminders: currentUser.email_notifications?.renewal_reminders ?? true,
        workout_reminders: currentUser.email_notifications?.workout_reminders ?? true
      });

      // ✅ FIX: Carica transazioni tramite backend function per bypassare RLS
      try {
        const txResponse = await base44.functions.invoke('getUserTransactions');
        const txData = txResponse.data || txResponse;
        if (txData.success && txData.transactions) {
          setTransactions(txData.transactions);
        } else {
          setTransactions([]);
        }
      } catch (txError) {
        console.error('❌ Error loading transactions:', txError);
        setTransactions([]);
      }

      try {
        const userTickets = await base44.entities.SupportTicket.filter({ user_id: currentUser.id }, '-created_date');
        console.log('🎫 Loaded tickets:', userTickets);
        setSupportTickets(userTickets || []);
      } catch (ticketError) {
        console.error('❌ Error loading tickets:', ticketError);
        setSupportTickets([]);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      navigate(createPageUrl('Home'));
    }
    setIsLoading(false);
  };

  const handleSavePersonalInfo = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: fullName,
        phone_number: phoneNumber
      });
      alert('✅ Informazioni salvate con successo!');
      await loadUserData();
    } catch (error) {
      console.error('Error saving personal info:', error);
      alert('❌ Errore nel salvataggio');
    }
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('❌ Le password non coincidono');
      return;
    }
    if (newPassword.length < 8) {
      alert('❌ La password deve essere almeno 8 caratteri');
      return;
    }

    setIsSaving(true);
    try {
      alert('⚠️ Funzionalità cambio password in arrivo. Usa "Reset Password" dalla pagina di login.');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('❌ Errore nel cambio password');
    }
    setIsSaving(false);
  };

  const handleSaveBillingInfo = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        billing_type: billingInfo.billingType,
        company_name: billingInfo.companyName,
        tax_id: billingInfo.taxId,
        pec_sdi: billingInfo.pecSdi,
        billing_address: billingInfo.address,
        billing_city: billingInfo.city,
        billing_zip: billingInfo.zip,
        billing_country: billingInfo.country
      });
      alert('✅ Dati di fatturazione salvati!');
      await loadUserData();
    } catch (error) {
      console.error('Error saving billing info:', error);
      alert('❌ Errore nel salvataggio');
    }
    setIsSaving(false);
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        email_notifications: emailNotifications
      });
      alert('✅ Preferenze notifiche salvate!');
      await loadUserData();
    } catch (error) {
      console.error('Error saving notifications:', error);
      alert('❌ Errore nel salvataggio');
    }
    setIsSaving(false);
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      alert('❌ Compila tutti i campi');
      return;
    }

    setIsSaving(true);
    setIsGeneratingAI(true);
    try {
      const priority = user.subscription_plan === 'premium' ? 'premium' : 'normale';

      // Crea il ticket
      const newTicket = await base44.entities.SupportTicket.create({
        user_id: user.id,
        user_email: user.email,
        user_plan: user.subscription_plan,
        subject: ticketSubject,
        message: ticketMessage,
        category: ticketCategory,
        priority: priority,
        status: 'aperto'
      });

      setCurrentTicket(newTicket);
      setShowTicketChat(true);

      // Genera risposta AI nella lingua dell'utente
      const languageNames = {
        it: 'italiano',
        en: 'English',
        es: 'español',
        pt: 'português',
        de: 'Deutsch',
        fr: 'français'
      };
      const responseLang = languageNames[language] || 'italiano';
      
      const aiResponseData = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a virtual assistant for MyWellness, a fitness and nutrition app with AI personalized plans.

The user has opened a support ticket with the following information:
- Plan: ${user.subscription_plan || 'base'}
- Category: ${ticketCategory}
- Subject: ${ticketSubject}
- Message: ${ticketMessage}

IMPORTANT: Respond ONLY in ${responseLang} language.

Provide a helpful, professional and complete response.
If you cannot fully resolve the issue, still provide useful information.
Do NOT mention email or direct contacts. If human support is needed, tell the user to click the "Need More Help" button below.
Be concise but detailed (max 200 words).`,
        add_context_from_internet: false
      });

      const aiText = aiResponseData.data || aiResponseData;
      setAiResponse(aiText);

      // Aggiorna il ticket con la risposta AI
      await base44.entities.SupportTicket.update(newTicket.id, {
        ai_response: aiText
      });

      setTicketSubject('');
      setTicketMessage('');
      setTicketCategory('tecnico');
      await loadUserData();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('❌ Errore nell\'invio del ticket');
      setShowTicketChat(false);
    }
    setIsSaving(false);
    setIsGeneratingAI(false);
  };

  const handleTicketResolved = async () => {
    try {
      await base44.entities.SupportTicket.update(currentTicket.id, {
        ai_resolved: true,
        status: 'risolto',
        resolved_at: new Date().toISOString()
      });
      alert('✅ Ticket chiuso! Siamo felici di averti aiutato.');
      setShowTicketChat(false);
      setCurrentTicket(null);
      setAiResponse('');
      await loadUserData();
    } catch (error) {
      console.error('Error resolving ticket:', error);
      alert('❌ Errore nella chiusura del ticket');
    }
  };

  const handleNeedMoreHelp = async () => {
    try {
      // Chiudi il dialog AI
      setShowTicketChat(false);
      setAiResponse('');
      
      // Apri la chat widget SENZA aggiungere la risposta AI al messaggio
      // L'utente vedrà solo il suo messaggio originale
      setSelectedTicketForChat(currentTicket);
      setCurrentTicket(null);
      
      await loadUserData();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleUpgradePlan = () => {
    setShowUpgradeDialog(true);
  };

  const handleCancelClick = () => {
    setShowCancelDialog(false);
    setShowCancelFeedbackDialog(true);
  };

  const handleCancelSubscription = async () => {
    if (!cancellationReason) {
      alert('❌ Seleziona un motivo');
      return;
    }

    if (cancellationReason === 'altro' && !cancellationDetails.trim()) {
      alert('❌ Specifica il motivo');
      return;
    }

    if (wouldRecommend === null) {
      alert('❌ Rispondi alla domanda finale');
      return;
    }

    setIsSaving(true);
    try {
      const accountAge = Math.floor((new Date() - new Date(user.created_date)) / (1000 * 60 * 60 * 24));

      const response = await base44.functions.invoke('cancelMySubscription', {
        cancellation_reason: cancellationReason,
        additional_details: cancellationDetails || null,
        would_recommend: wouldRecommend,
        days_used: accountAge
      });
      const data = response.data || response;

      if (data.success) {
        alert('✅ Abbonamento cancellato. Grazie per il tuo feedback!');
        setShowCancelFeedbackDialog(false);
        setCancellationReason('');
        setCancellationDetails('');
        setWouldRecommend(null);
        
        // Reload immediato per aggiornare l'UI con il banner di cancellazione
        setTimeout(async () => {
          await loadUserData();
        }, 500);
      } else {
        alert('❌ Errore: ' + data.error);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('❌ Errore nella cancellazione');
    }
    setIsSaving(false);
  };

  const handleDownloadInvoice = async (transaction) => {
    try {
      // Genera fattura personalizzata con dati utente e IVA
      const response = await base44.functions.invoke('generateInvoicePDF', {
        transactionId: transaction.id
      });

      const data = response.data || response;

      if (data.success && data.invoiceHTML) {
        // Apri la fattura HTML in una nuova finestra
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(data.invoiceHTML);
          newWindow.document.close();
        } else {
          // Fallback per iOS/Safari che blocca popup
          const blob = new Blob([data.invoiceHTML], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          window.location.href = url;
        }
      } else {
        alert(data.error || 'Errore nella generazione della fattura');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Errore nella generazione della fattura');
    }
  };

  const handleLogout = async () => {
    try {
      // Pulisci remember me token
      rememberMeManager.clearToken();
      
      // Effettua logout Base44
      await base44.auth.logout();
      
      // Redirect alla pagina di login
      window.location.href = 'https://projectmywellness.com/login';
    } catch (error) {
      console.error("Errore durante il logout:", error);
      window.location.href = 'https://projectmywellness.com/login';
    }
  };

  const loadAffiliateStats = async () => {
    if (isLoadingAffiliate) return; // Previeni chiamate multiple
    setIsLoadingAffiliate(true);
    try {
      const response = await base44.functions.invoke('affiliateGetStats');
      const data = response.data || response;
      setAffiliateStats(data);
    } catch (error) {
      console.error('Error loading affiliate stats:', error);
    }
    setIsLoadingAffiliate(false);
  };

  const handleGenerateAffiliateLink = async () => {
    setIsLoadingAffiliate(true);
    try {
      const response = await base44.functions.invoke('affiliateGenerateLink');
      const data = response.data || response;
      if (data.success) {
        await loadAffiliateStats();
        alert('✅ Link di affiliazione generato!');
      }
    } catch (error) {
      console.error('Error generating affiliate link:', error);
      alert('❌ Errore nella generazione del link');
    }
    setIsLoadingAffiliate(false);
  };

  const handleConnectStripe = async () => {
    setIsLoadingAffiliate(true);
    try {
      const response = await base44.functions.invoke('affiliateCreateConnectAccount');
      const data = response.data || response;
      if (data.success && data.onboarding_url) {
        window.location.href = data.onboarding_url;
      } else if (data.error && data.error.includes('signed up for Connect')) {
        alert(`⚠️ AZIONE RICHIESTA:

Stripe Connect non è attivo sul tuo account Stripe.

Per abilitare i pagamenti di affiliazione:

1. Vai su https://dashboard.stripe.com/settings/applications
2. Nella sezione "Standard" o "Express" clicca su "Get Started"
3. Completa il form di attivazione
4. Torna qui e riprova

Questo è un passaggio una tantum necessario per poter pagare gli affiliati.`);
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      const errorMsg = error.response?.data?.error || error.message;
      if (errorMsg && errorMsg.includes('signed up for Connect')) {
        alert(`⚠️ AZIONE RICHIESTA:

Stripe Connect non è attivo sul tuo account Stripe.

Per abilitare i pagamenti di affiliazione:

1. Vai su https://dashboard.stripe.com/settings/applications
2. Nella sezione "Standard" o "Express" clicca su "Get Started"
3. Completa il form di attivazione (richiede 5 minuti)
4. Torna qui e riprova

Questo è necessario per poter pagare gli affiliati automaticamente.`);
      } else {
        alert('❌ Errore: ' + errorMsg);
      }
    }
    setIsLoadingAffiliate(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 10) {
      alert('❌ Importo minimo: €10');
      return;
    }
    if (amount > affiliateStats.stats.available_balance) {
      alert('❌ Credito insufficiente');
      return;
    }

    setIsWithdrawing(true);
    try {
      const response = await base44.functions.invoke('affiliateRequestWithdrawal', { amount });
      const data = response.data || response;
      if (data.success) {
        alert('✅ Prelievo effettuato! I soldi arriveranno sul tuo conto in 2-7 giorni.');
        setWithdrawAmount('');
        await loadAffiliateStats();
      } else {
        alert('❌ ' + (data.error || 'Errore nel prelievo'));
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('❌ Errore nel prelievo: ' + error.message);
    }
    setIsWithdrawing(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('✅ Copiato negli appunti!');
  };

  const handleConnectHealthKit = () => {
    console.log('🔍 Checking available bridges...');
    console.log('window.__mw_sync:', typeof window.__mw_sync);
    console.log('window.__ios_healthkit:', typeof window.__ios_healthkit);
    console.log('window.webkit:', typeof window.webkit);
    
    // 🔍 DEBUG: Mostra TUTTI i messageHandlers disponibili
    if (window.webkit?.messageHandlers) {
      console.log('📱 Available webkit messageHandlers:', Object.keys(window.webkit.messageHandlers));
    }
    
    // Prova diversi bridge nativi iOS/Android
    const iosHealthKit = window.__ios_healthkit || window.__mw_sync;
    const webkitBridge = window.webkit?.messageHandlers?.healthkit;
    
    if (!iosHealthKit && !webkitBridge) {
      alert('⚠️ HealthKit bridge non disponibile. Usa l\'app iOS/Android.');
      return;
    }

    setIsSyncingHealthKit(true);
    
    try {
      // Chiama il bridge nativo appropriato
      if (webkitBridge) {
        console.log('📱 Using webkit bridge');
        webkitBridge.postMessage({ action: 'syncHealthKit', appId: '68d44c626cc2c19cca9c750d', userId: user.id });
      } else if (iosHealthKit) {
        console.log('📱 Using __ios_healthkit or __mw_sync bridge');
        iosHealthKit({ 
          action: 'syncTodayNative', 
          appId: '68d44c626cc2c19cca9c750d' 
        });
      }
      
      // Se non c'è callback, marca come connesso dopo 2 secondi
      setTimeout(() => {
        setIsHealthKitConnected(true);
        localStorage.setItem('hk_connected', '1');
        setIsSyncingHealthKit(false);
        alert('✅ HealthKit connesso! La sincronizzazione è in corso.');
      }, 2000);
    } catch (error) {
      console.error('❌ HealthKit sync error:', error);
      alert('❌ Errore durante la connessione a HealthKit.');
      setIsSyncingHealthKit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  const planLabels = {
    trial: 'Standard',
    standard: 'Standard',
    base: 'Base',
    pro: 'Pro',
    premium: 'Premium'
  };

  const statusLabels = {
    trial: 'Attivo',
    active: 'Attivo',
    expired: 'Scaduto',
    cancelled: 'Cancellato'
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('settings.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('settings.subtitle')}</p>
        </div>

        <Tabs defaultValue="account" className="w-full" onValueChange={(value) => {
          if (value === 'affiliate' && !affiliateStats) {
            loadAffiliateStats();
          }
        }}>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-gray-100/80 p-1 rounded-lg">
              <TabsTrigger value="account" className="text-xs sm:text-sm whitespace-nowrap">{t('settings.tabAccount')}</TabsTrigger>
              <TabsTrigger value="subscription" className="text-xs sm:text-sm whitespace-nowrap">{t('settings.tabSubscription')}</TabsTrigger>
              <TabsTrigger value="billing" className="text-xs sm:text-sm whitespace-nowrap">{t('settings.tabBilling')}</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm whitespace-nowrap">{t('settings.tabNotifications')}</TabsTrigger>
              <TabsTrigger value="affiliate" className="text-xs sm:text-sm whitespace-nowrap">{t('settings.tabAffiliate')}</TabsTrigger>
              <TabsTrigger value="help" className="text-xs sm:text-sm whitespace-nowrap">{t('settings.tabSupport')}</TabsTrigger>
            </TabsList>
          </div>

          {/* ACCOUNT */}
          <TabsContent value="account" className="space-y-6">
            {/* Language Settings */}
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t('settings.language')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowLanguageDialog(true)}
                  variant="outline"
                  className="w-full justify-between h-12"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4" />
                    <span>{t('settings.changeLanguage')}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">📱</div>
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">
                      ℹ️ Utenti iOS/Android - App Lock
                    </p>
                    <p className="text-sm text-blue-800">
                      Se hai l'app mobile (iOS o Android) e vuoi gestire l'App Lock (blocco con Face ID/Touch ID/Impronta), clicca casualmente 3 volte sullo schermo per accedere alle impostazioni nascoste.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-6 h-6 text-amber-600" />
                  HealthKit Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isHealthKitConnected ? (
                  <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm text-green-900 font-semibold">
                        ✅ HealthKit connesso
                      </p>
                    </div>
                    <p className="text-sm text-green-800">
                      I tuoi dati di attività vengono sincronizzati automaticamente.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-700">
                      Sincronizza automaticamente calorie bruciate e attività fisica da HealthKit.
                    </p>
                    <Button
                      onClick={handleConnectHealthKit}
                      disabled={isSyncingHealthKit}
                      className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white"
                    >
                      {isSyncingHealthKit ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Connessione in corso...</span>
                        </div>
                      ) : (
                        '🍎 Connetti HealthKit'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle>{t('settings.personalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">{t('settings.fullName')}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('settings.email')}</Label>
                  <Input
                    id="email"
                    value={user?.email}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('settings.phone')}</Label>
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <Button
                  onClick={handleSavePersonalInfo}
                  disabled={isSaving}
                  className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  {isSaving ? t('settings.saving') : t('settings.saveChanges')}
                </Button>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle>Password</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-semibold mb-2">
                    ℹ️ Accesso con Google OAuth
                  </p>
                  <p className="text-sm text-blue-800">
                    Per impostare una password e accedere anche con email/password, usa il link "Password dimenticata?" dalla pagina di login.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="pt-6">
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('settings.logout')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUBSCRIPTION */}
          <TabsContent value="subscription" className="space-y-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle>{t('settings.yourPlan')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#E0F2F0] to-teal-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">{t('settings.currentPlan')}</p>
                    <p className="text-2xl font-bold text-gray-900">{planLabels[user?.subscription_plan] || 'N/D'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('settings.status')}: <span className="font-semibold">{statusLabels[user?.subscription_status] || 'N/D'}</span>
                    </p>
                  </div>
                  <Crown className="w-12 h-12 text-[#26847F]" />
                </div>

                {user?.subscription_status === 'active' && user?.subscription_period_end && (
                  <p className="text-sm text-gray-600">
                    {t('settings.nextRenewal')}: <strong>{new Date(user.subscription_period_end).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US')}</strong>
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleUpgradePlan}
                    className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                  >
                    {user?.subscription_plan === 'premium' ? t('settings.changePlan') : t('settings.upgradePlan')}
                  </Button>

                  {(user?.subscription_status === 'active' || user?.subscription_status === 'trial') && !user?.cancellation_at_period_end && (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('settings.cancelSubscription')}
                    </Button>
                  )}
                </div>

                {user?.cancellation_at_period_end && user?.subscription_period_end && (
                  <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <p className="text-sm text-orange-900">
                        {user.subscription_status === 'trial' 
                          ? `${t('settings.trialCancelled')} ${new Date(user.subscription_period_end).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US')}`
                          : `${t('settings.subscriptionCancelled')} ${new Date(user.subscription_period_end).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US')}`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BILLING */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle>{t('settings.billingData')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={billingInfo.billingType}
                  onValueChange={(value) => setBillingInfo({...billingInfo, billingType: value})}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="billing-private" />
                    <Label htmlFor="billing-private">{t('settings.private')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="company" id="billing-company" />
                    <Label htmlFor="billing-company">{t('settings.company')}</Label>
                  </div>
                </RadioGroup>

                {billingInfo.billingType === 'company' && (
                  <div>
                    <Label>{t('settings.companyName')}</Label>
                    <Input
                      value={billingInfo.companyName}
                      onChange={(e) => setBillingInfo({...billingInfo, companyName: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                )}

                <div>
                  <Label>{billingInfo.billingType === 'company' ? t('settings.taxId') : t('settings.fiscalCode')}</Label>
                  <Input
                    value={billingInfo.taxId}
                    onChange={(e) => setBillingInfo({...billingInfo, taxId: e.target.value})}
                    className="bg-white"
                    />
                </div>

                {billingInfo.billingType === 'company' && (
                  <div>
                    <Label>{t('settings.pecSdi')}</Label>
                    <Input
                      value={billingInfo.pecSdi}
                      onChange={(e) => setBillingInfo({...billingInfo, pecSdi: e.target.value})}
                      className="bg-white"
                      />
                  </div>
                )}

                <div>
                  <Label>{t('settings.address')}</Label>
                  <Input
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('settings.city')}</Label>
                    <Input
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label>{t('settings.zip')}</Label>
                    <Input
                      value={billingInfo.zip}
                      onChange={(e) => setBillingInfo({...billingInfo, zip: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveBillingInfo}
                  disabled={isSaving}
                  className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  {isSaving ? t('settings.saving') : t('settings.saveBilling')}
                </Button>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle>{t('settings.transactionHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{t('settings.noTransactions')}</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div>
                          <p className="font-semibold">{tx.description || t('settings.paymentDescription')}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(tx.payment_date).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US')} - {tx.plan} ({tx.billing_period})
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-[#26847F]">€{tx.amount.toFixed(2)}</p>
                          <Button
                            onClick={() => handleDownloadInvoice(tx)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {t('settings.invoice')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle>{t('settings.emailPreferences')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.marketing')}</p>
                    <p className="text-sm text-gray-500">{t('settings.marketingDesc')}</p>
                  </div>
                  <Switch
                    checked={emailNotifications.marketing}
                    onCheckedChange={(checked) => setEmailNotifications({...emailNotifications, marketing: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.productUpdates')}</p>
                    <p className="text-sm text-gray-500">{t('settings.productUpdatesDesc')}</p>
                  </div>
                  <Switch
                    checked={emailNotifications.product_updates}
                    onCheckedChange={(checked) => setEmailNotifications({...emailNotifications, product_updates: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.renewalReminders')}</p>
                    <p className="text-sm text-gray-500">{t('settings.renewalRemindersDesc')}</p>
                  </div>
                  <Switch
                    checked={emailNotifications.renewal_reminders}
                    onCheckedChange={(checked) => setEmailNotifications({...emailNotifications, renewal_reminders: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.workoutReminders')}</p>
                    <p className="text-sm text-gray-500">{t('settings.workoutRemindersDesc')}</p>
                  </div>
                  <Switch
                    checked={emailNotifications.workout_reminders}
                    onCheckedChange={(checked) => setEmailNotifications({...emailNotifications, workout_reminders: checked})}
                  />
                </div>
                <Button
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  {isSaving ? t('settings.saving') : t('settings.savePreferences')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AFFILIAZIONE */}
          <TabsContent value="affiliate" className="space-y-6">
            {!affiliateStats?.has_affiliate_link ? (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-600" />
                    {t('settings.affiliateProgram')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    🎉 <strong>{t('settings.affiliateDescription')}</strong>
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✅ <strong>{t('settings.affiliateCommission')}</strong></li>
                    <li>✅ <strong>{t('settings.affiliateDiscount')}</strong></li>
                    <li>✅ <strong>{t('settings.affiliateWithdrawals')}</strong></li>
                    <li>✅ <strong>{t('settings.affiliateCredits')}</strong></li>
                  </ul>
                  <Button
                    onClick={handleGenerateAffiliateLink}
                    disabled={isLoadingAffiliate}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isLoadingAffiliate ? t('settings.generating') : t('settings.generateLink')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{t('settings.availableCredit')}</p>
                          <p className="text-3xl font-bold text-green-700">
                            €{affiliateStats.stats.available_balance.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t('settings.autoDeducted')}
                          </p>
                        </div>
                        <DollarSign className="w-10 h-10 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{t('settings.totalEarned')}</p>
                          <p className="text-3xl font-bold text-blue-700">
                            €{affiliateStats.stats.total_earned.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t('settings.commissionHistory')}
                          </p>
                        </div>
                        <Crown className="w-10 h-10 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{t('settings.payingAffiliates')}</p>
                          <p className="text-3xl font-bold text-purple-700">
                            {affiliateStats.stats.total_referrals}
                          </p>
                        </div>
                        <Users className="w-10 h-10 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{t('settings.linkClicks')}</p>
                          <p className="text-3xl font-bold text-orange-700">
                            {affiliateStats.stats.total_link_clicks || 0}
                          </p>
                        </div>
                        <Users className="w-10 h-10 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Link di Affiliazione */}
                <Card className="water-glass-effect border-gray-200/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5" />
                      {t('settings.yourAffiliateLink')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={affiliateStats.affiliate_url}
                        readOnly
                        className="bg-gray-50 font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(affiliateStats.affiliate_url)}
                        variant="outline"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>{t('settings.howItWorks')}</strong> {t('settings.howItWorksDesc')}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Prelievi */}
                <Card className="water-glass-effect border-gray-200/30">
                  <CardHeader>
                    <CardTitle>{t('settings.withdrawCredits')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!affiliateStats.stats.onboarding_completed ? (
                      <div className="space-y-4">
                        {affiliateStats.stats.available_balance < 100 ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-700 mb-2">
                              🔒 {t('settings.unlockWithdrawals')}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                              <div 
                                className="bg-gradient-to-r from-[#26847F] to-teal-500 h-3 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (affiliateStats.stats.available_balance / 100) * 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              €{affiliateStats.stats.available_balance.toFixed(2)} / €100.00
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <p className="text-sm text-amber-900 mb-3">
                                ⚠️ {t('settings.connectStripeNotice')}
                              </p>
                            </div>
                            <Button
                              onClick={handleConnectStripe}
                              disabled={isLoadingAffiliate}
                              className="w-full bg-[#635BFF] hover:bg-[#5248E6] text-white"
                            >
                              {isLoadingAffiliate ? t('settings.connecting') : t('settings.connectStripe')}
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">{t('settings.stripeConnected')}</span>
                        </div>
                        <div>
                          <Label>{t('settings.withdrawAmount')}</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              type="number"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="10.00"
                              min="10"
                              step="0.01"
                              className="bg-white"
                            />
                            <Button
                              onClick={handleWithdraw}
                              disabled={isWithdrawing || !withdrawAmount}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isWithdrawing ? t('settings.withdrawing') : t('settings.withdraw')}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">
                          💡 {t('settings.withdrawalNote')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transazioni Affiliati */}
                {affiliateStats.affiliate_transactions?.length > 0 && (
                  <Card className="water-glass-effect border-gray-200/30">
                    <CardHeader>
                      <CardTitle>{t('settings.affiliateTransactions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {affiliateStats.affiliate_transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-semibold text-sm">{tx.referred_user_email}</p>
                              <p className="text-xs text-gray-600">
                                {new Date(tx.payment_date).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US')} • {t('settings.paid')}: €{tx.amount_paid.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-700">+€{tx.commission_amount.toFixed(2)}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                tx.commission_status === 'available' ? 'bg-green-100 text-green-700' :
                                tx.commission_status === 'withdrawn' ? 'bg-gray-100 text-gray-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {tx.commission_status === 'available' ? t('settings.available') :
                                 tx.commission_status === 'withdrawn' ? t('settings.withdrawn') : t('settings.used')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={loadAffiliateStats}
                  variant="outline"
                  className="w-full"
                >
                  {t('settings.refreshStats')}
                </Button>
              </>
            )}
          </TabsContent>

          {/* HELP */}
          <TabsContent value="help" className="space-y-6">
            {user?.subscription_plan === 'premium' && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="font-bold text-purple-900">{t('settings.prioritySupport')}</p>
                      <p className="text-sm text-purple-700">{t('settings.prioritySupportDesc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle>{t('settings.submitTicket')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supportTickets.some(tkt => tkt.status !== 'risolto' && tkt.status !== 'chiuso' && !tkt.ai_resolved) ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 mb-1">{t('settings.openTicketWarning')}</p>
                        <p className="text-sm text-amber-700">
                          {t('settings.openTicketWarningDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>{t('settings.category')}</Label>
                      <Select value={ticketCategory} onValueChange={setTicketCategory}>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tecnico">{t('settings.categoryTechnical')}</SelectItem>
                          <SelectItem value="fatturazione">{t('settings.categoryBilling')}</SelectItem>
                          <SelectItem value="abbonamento">{t('settings.categorySubscription')}</SelectItem>
                          <SelectItem value="funzionalita">{t('settings.categoryFeature')}</SelectItem>
                          <SelectItem value="altro">{t('settings.categoryOther')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('settings.subject')}</Label>
                      <Input
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder={t('settings.subjectPlaceholder')}
                        className="bg-white"
                      />
                    </div>

                    <div>
                      <Label>{t('settings.message')}</Label>
                      <Textarea
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder={t('settings.messagePlaceholder')}
                        className="bg-white h-32"
                      />
                    </div>

                    <Button
                      onClick={handleSubmitTicket}
                      disabled={isSaving}
                      className="bg-[#26847F] hover:bg-[#1f6b66] text-white w-full"
                    >
                      {isSaving ? t('settings.sending') : t('settings.sendTicket')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle>{t('settings.yourTickets')}</CardTitle>
              </CardHeader>
              <CardContent>
                {supportTickets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{t('settings.noTickets')}</p>
                ) : (
                  <div className="space-y-3">
                    {supportTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicketForChat(ticket)}
                        className="p-4 border rounded-lg bg-white hover:shadow-lg transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold group-hover:text-[#26847F] transition-colors">{ticket.subject}</p>
                              {ticket.priority === 'premium' && (
                                <Crown className="w-4 h-4 text-purple-600" />
                              )}
                              {ticket.ai_resolved && (
                                <Badge className="bg-green-100 text-green-700 text-xs">🤖 {t('settings.resolvedAI')}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{ticket.message.split('\n\n---')[0]}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(ticket.created_date).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US')} - {ticket.category}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            ticket.status === 'aperto' ? 'bg-blue-100 text-blue-700' :
                            ticket.status === 'in_lavorazione' ? 'bg-yellow-100 text-yellow-700' :
                            ticket.status === 'risolto' || ticket.ai_resolved ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.ai_resolved ? 'risolto' : ticket.status}
                          </div>
                        </div>
                        {(ticket.admin_response || ticket.ai_response) && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            {ticket.admin_response && <span>💬 {t('settings.responseReceived')}</span>}
                            {ticket.ai_response && !ticket.admin_response && <span>🤖 {t('settings.aiResponseAvailable')}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG UPGRADE */}
      {showUpgradeDialog && (
        <UpgradeModal
          isOpen={showUpgradeDialog}
          onClose={() => setShowUpgradeDialog(false)}
          currentPlan={user?.subscription_plan || 'base'}
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          onUpgradeSuccess={async () => {
            alert('✅ Piano aggiornato con successo!');
            setShowUpgradeDialog(false);
            await loadUserData();
          }}
          onUpgradeError={(errorMsg) => {
            alert('❌ Errore: ' + errorMsg);
          }}
        />
      )}

      {/* DIALOG CANCEL */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Cancella Abbonamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-700">
              Sei sicuro di voler cancellare? L'abbonamento resterà attivo fino alla scadenza del periodo corrente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setShowCancelDialog(false)} variant="outline" className="flex-1">
                No, torna indietro
              </Button>
              <Button onClick={handleCancelClick} variant="destructive" className="flex-1">
                Sì, cancella
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelFeedbackDialog} onOpenChange={setShowCancelFeedbackDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Prima di andartene...</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-gray-700">
              Ci dispiace vederti andare. Aiutaci a migliorare: perché hai deciso di cancellare?
            </p>

            <div className="space-y-3">
              {[
                { value: 'troppo_costoso', label: '💰 Troppo costoso per me', icon: '💰' },
                { value: 'non_uso_abbastanza', label: '⏰ Non la uso abbastanza', icon: '⏰' },
                { value: 'risultati_non_soddisfacenti', label: '📉 Non vedo i risultati sperati', icon: '📉' },
                { value: 'troppo_complesso', label: '🤯 Troppo complicata da usare', icon: '🤯' },
                { value: 'problemi_tecnici', label: '⚠️ Problemi tecnici o bug', icon: '⚠️' },
                { value: 'mancano_funzionalita', label: '🔧 Mancano funzionalità che mi servono', icon: '🔧' },
                { value: 'preferisco_altra_app', label: '🔄 Ho trovato un\'alternativa migliore', icon: '🔄' },
                { value: 'obiettivo_raggiunto', label: '🎯 Ho raggiunto il mio obiettivo!', icon: '🎯' },
                { value: 'altro', label: '📝 Altro motivo (specifica sotto)', icon: '📝' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCancellationReason(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    cancellationReason === option.value
                      ? 'border-[#26847F] bg-[#E0F2F0]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm sm:text-base font-medium text-gray-800">{option.label}</span>
                </button>
              ))}
            </div>

            {(cancellationReason === 'altro' || cancellationReason) && (
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  {cancellationReason === 'altro' ? 'Raccontaci di più (obbligatorio):' : 'Vuoi aggiungere altri dettagli? (opzionale)'}
                </Label>
                <Textarea
                  value={cancellationDetails}
                  onChange={(e) => setCancellationDetails(e.target.value)}
                  placeholder="Scrivi qui..."
                  className="h-24 bg-white resize-none"
                />
              </div>
            )}

            {cancellationReason && (
              <div className="pt-4 border-t border-gray-200">
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Un'ultima domanda: consiglieresti MyWellness ad altri?
                </Label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setWouldRecommend(true)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      wouldRecommend === true
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">👍</span>
                    <span className="text-sm font-medium text-gray-800">Sì, lo consiglierei</span>
                  </button>
                  <button
                    onClick={() => setWouldRecommend(false)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      wouldRecommend === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">👎</span>
                    <span className="text-sm font-medium text-gray-800">No, non lo consiglierei</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowCancelFeedbackDialog(false);
                  setCancellationReason('');
                  setCancellationDetails('');
                  setWouldRecommend(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Annulla
              </Button>
              <Button
                onClick={handleCancelSubscription}
                disabled={isSaving || !cancellationReason || wouldRecommend === null || (cancellationReason === 'altro' && !cancellationDetails.trim())}
                variant="destructive"
                className="flex-1"
              >
                {isSaving ? 'Cancellazione...' : 'Conferma Cancellazione'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Chat Ticket AI */}
      <Dialog open={showTicketChat} onOpenChange={setShowTicketChat}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              💬 {t('settings.aiAnalyzing')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Ticket Info */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">{currentTicket?.subject}</p>
              <p className="text-sm text-gray-600 mb-3">{currentTicket?.message}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                {currentTicket?.category === 'tecnico' ? t('settings.catTechnical') :
                 currentTicket?.category === 'fatturazione' ? t('settings.catBilling') :
                 currentTicket?.category === 'abbonamento' ? t('settings.catSubscription') :
                 currentTicket?.category === 'funzionalita' ? t('settings.catFeature') :
                 t('settings.catOther')}
              </Badge>
                <Badge className="bg-purple-100 text-purple-700 text-xs">{user?.subscription_plan}</Badge>
              </div>
            </div>

            {/* AI Response */}
            {isGeneratingAI ? (
              <div className="p-6 bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 rounded-xl border-2 border-[var(--brand-primary)]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-primary)]"></div>
                  <p className="font-bold text-gray-900">{t('settings.aiAnalyzingDesc')}</p>
                </div>
                <p className="text-sm text-gray-600">{t('settings.aiGenerating')}</p>
              </div>
            ) : aiResponse ? (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 rounded-xl border-2 border-[var(--brand-primary)]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">🤖</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t('settings.aiAssistant')}</p>
                      <p className="text-xs text-gray-500">{t('settings.aiAutoResponse')}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-700 mb-3 text-center">
                    {t('settings.wasHelpful')}
                  </p>
                  
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      onClick={handleTicketResolved}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 h-auto"
                    >
                      {t('settings.problemResolved')}
                    </Button>
                    
                    <Button
                      onClick={handleNeedMoreHelp}
                      size="sm"
                      variant="outline"
                      className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-3 py-1.5 h-auto"
                    >
                      {t('settings.needMoreHelp')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Chat Widget */}
      {selectedTicketForChat && (
        <TicketChatWidget
          ticket={selectedTicketForChat}
          onClose={() => setSelectedTicketForChat(null)}
          onUpdate={loadUserData}
        />
      )}

      {/* Language Selection Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-6 h-6 text-[#26847F]" />
              {t('settings.selectLanguage')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {showLanguageWarning && (
              <Alert className="bg-amber-50 border-amber-200 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm ml-2">
                  {languageWarningTexts[language] || languageWarningTexts.en}
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    if (lang.code !== language) {
                      setLanguage(lang.code);
                      setShowLanguageWarning(true);
                    }
                  }}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    language === lang.code
                      ? 'border-[#26847F] bg-[#e9f6f5]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className={`font-semibold text-lg flex-1 text-left ${
                    language === lang.code ? 'text-[#26847F]' : 'text-gray-700'
                  }`}>
                    {lang.name}
                  </span>
                  {language === lang.code && (
                    <Check className="w-5 h-5 text-[#26847F]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}