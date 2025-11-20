import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import UpgradeModal from '../components/meals/UpgradeModal';
import TicketChatWidget from '../components/support/TicketChatWidget';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  // Affiliazione
  const [affiliateStats, setAffiliateStats] = useState(null);
  const [isLoadingAffiliate, setIsLoadingAffiliate] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    loadUserData();
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
      
      // ✅ CRITICAL: Verifica se l'utente ha una subscription attiva o in trial
      if (!currentUser.subscription_status || 
          (currentUser.subscription_status !== 'active' && currentUser.subscription_status !== 'trial')) {
        console.warn('⚠️ User has no active subscription, redirecting to TrialSetup');
        navigate(createPageUrl('TrialSetup'), { replace: true });
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

      // ✅ FIX: Corretto l'ordinamento - rimuovi array, passa stringa
      const userTransactions = await base44.entities.Transaction.filter({ user_id: currentUser.id }, '-payment_date');
      console.log('📊 Transactions loaded:', userTransactions.length);
      setTransactions(userTransactions);

      const userTickets = await base44.entities.SupportTicket.filter({ user_id: currentUser.id }, '-created_date');
      setSupportTickets(userTickets);

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

      // Genera risposta AI
      const aiResponseData = await base44.integrations.Core.InvokeLLM({
        prompt: `Sei un assistente virtuale di MyWellness, un'app di fitness e nutrizione con piani personalizzati AI.

L'utente ha aperto un ticket di supporto con le seguenti informazioni:
- Piano: ${user.subscription_plan || 'base'}
- Categoria: ${ticketCategory}
- Oggetto: ${ticketSubject}
- Messaggio: ${ticketMessage}

Fornisci una risposta utile, professionale e completa in italiano. 
Se non puoi risolvere completamente il problema, fornisci comunque informazioni utili.
Alla fine della risposta, aggiungi: "Se questa risposta non risolve il tuo problema, il nostro team ti risponderà entro 24 ore. Continua pure a scrivere qui sotto se hai altre informazioni da aggiungere."
Sii conciso ma dettagliato (max 200 parole).`,
        add_context_from_internet: false
      });

      const aiText = aiResponseData.data || aiResponseData;

      // Aggiorna il ticket con la risposta AI
      const updatedTicket = await base44.entities.SupportTicket.update(newTicket.id, {
        ai_response: aiText,
        status: 'in_lavorazione'
      });

      // Apri direttamente la chat widget
      setSelectedTicketForChat({
        ...newTicket,
        ai_response: aiText,
        status: 'in_lavorazione'
      });

      setTicketSubject('');
      setTicketMessage('');
      setTicketCategory('tecnico');
      await loadUserData();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('❌ Errore nell\'invio del ticket');
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
      await base44.entities.SupportTicket.update(currentTicket.id, {
        status: 'in_lavorazione'
      });
      
      // Chiudi il dialog AI
      setShowTicketChat(false);
      setAiResponse('');
      
      // Apri la chat widget con messaggio che riceverà risposta entro 24h
      const updatedTicket = {
        ...currentTicket,
        status: 'in_lavorazione',
        message: currentTicket.message + '\n\n--- Risposta AI ---\n✅ Richiesta inoltrata al team! Riceverai risposta via chat entro 24 ore. Continua pure a scrivere qui sotto se hai altre informazioni da aggiungere.'
      };
      setSelectedTicketForChat(updatedTicket);
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

      await base44.entities.CancellationFeedback.create({
        user_id: user.id,
        user_email: user.email,
        user_plan: user.subscription_plan,
        cancellation_reason: cancellationReason,
        additional_details: cancellationDetails || null,
        would_recommend: wouldRecommend,
        days_used: accountAge
      });

      const response = await base44.functions.invoke('cancelMySubscription');
      const data = response.data || response;

      if (data.success) {
        alert('✅ Abbonamento cancellato. Grazie per il tuo feedback!');
        setShowCancelFeedbackDialog(false);
        setCancellationReason('');
        setCancellationDetails('');
        setWouldRecommend(null);
        await loadUserData();
      } else {
        alert('❌ Errore: ' + data.error);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('❌ Errore nella cancellazione');
    }
    setIsSaving(false);
  };

  const handleDownloadInvoice = async (transactionId) => {
    try {
      const response = await base44.functions.invoke('downloadStripeInvoice', {
        transactionId: transactionId
      });

      const data = response.data || response;

      if (data.success && data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      } else {
        alert(data.message || 'Fattura non disponibile per questa transazione');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      const errorMsg = error?.response?.data?.message || 'Errore nel scaricare la fattura';
      alert(errorMsg);
    }
  };

  const handleLogout = async () => {
    try {
      const homeUrl = window.location.origin + createPageUrl('Home');
      await base44.auth.logout(homeUrl);
    } catch (error) {
      console.error("Errore durante il logout:", error);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  const planLabels = {
    base: 'Base',
    pro: 'Pro',
    premium: 'Premium'
  };

  const statusLabels = {
    trial: 'Trial',
    active: 'Attivo',
    expired: 'Scaduto',
    cancelled: 'Cancellato'
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Impostazioni Account</h1>
          <p className="text-sm sm:text-base text-gray-600">Gestisci il tuo profilo e preferenze</p>
        </div>

        <Tabs defaultValue="account" className="w-full" onValueChange={(value) => {
          if (value === 'affiliate') {
            loadAffiliateStats();
          }
        }}>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-gray-100/80 p-1 rounded-lg">
              <TabsTrigger value="account" className="text-xs sm:text-sm whitespace-nowrap">Account</TabsTrigger>
              <TabsTrigger value="subscription" className="text-xs sm:text-sm whitespace-nowrap">Abbonamento</TabsTrigger>
              <TabsTrigger value="billing" className="text-xs sm:text-sm whitespace-nowrap">Fatturazione</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm whitespace-nowrap">Notifiche</TabsTrigger>
              <TabsTrigger value="affiliate" className="text-xs sm:text-sm whitespace-nowrap">Affiliazione</TabsTrigger>
              <TabsTrigger value="help" className="text-xs sm:text-sm whitespace-nowrap">Supporto</TabsTrigger>
            </TabsList>
          </div>

          {/* ACCOUNT */}
          <TabsContent value="account" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Informazioni Personali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Nome e Cognome</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (non modificabile)</Label>
                  <Input
                    id="email"
                    value={user?.email}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefono</Label>
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
                  {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                </Button>
              </CardContent>
            </Card>

            {!user?.email?.includes('@') || !user?.email?.includes('google') ? (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <p className="text-blue-900">
                      Stai usando Google OAuth. La password è gestita da Google.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Cambio Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Password Attuale</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Nuova Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Conferma Nuova Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    variant="outline"
                  >
                    {isSaving ? 'Salvataggio...' : 'Cambia Password'}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Esci dall'App
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUBSCRIPTION */}
          <TabsContent value="subscription" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Il Tuo Piano</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#E0F2F0] to-teal-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Piano Attuale</p>
                    <p className="text-2xl font-bold text-gray-900">{planLabels[user?.subscription_plan] || 'N/D'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Stato: <span className="font-semibold">{statusLabels[user?.subscription_status] || 'N/D'}</span>
                    </p>
                  </div>
                  <Crown className="w-12 h-12 text-[#26847F]" />
                </div>

                {user?.subscription_status === 'active' && user?.subscription_period_end && (
                  <p className="text-sm text-gray-600">
                    Prossimo rinnovo: <strong>{new Date(user.subscription_period_end).toLocaleDateString('it-IT')}</strong>
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleUpgradePlan}
                    className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                  >
                    {user?.subscription_plan === 'premium' ? 'Cambia Piano' : 'Upgrade Piano'}
                  </Button>

                  {(user?.subscription_status === 'active' || user?.subscription_status === 'trial') && !user?.cancellation_at_period_end && (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancella Abbonamento
                    </Button>
                  )}
                </div>

                {user?.cancellation_at_period_end && user?.subscription_period_end && (
                  <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <p className="text-sm text-orange-900">
                        {user.subscription_status === 'trial' 
                          ? `Il tuo trial è stato cancellato e terminerà il ${new Date(user.subscription_period_end).toLocaleDateString('it-IT')}`
                          : `Il tuo abbonamento è stato cancellato e terminerà il ${new Date(user.subscription_period_end).toLocaleDateString('it-IT')}`
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
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Dati di Fatturazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={billingInfo.billingType}
                  onValueChange={(value) => setBillingInfo({...billingInfo, billingType: value})}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="billing-private" />
                    <Label htmlFor="billing-private">Privato</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="company" id="billing-company" />
                    <Label htmlFor="billing-company">Azienda</Label>
                  </div>
                </RadioGroup>

                {billingInfo.billingType === 'company' && (
                  <div>
                    <Label>Nome Azienda</Label>
                    <Input
                      value={billingInfo.companyName}
                      onChange={(e) => setBillingInfo({...billingInfo, companyName: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                )}

                <div>
                  <Label>{billingInfo.billingType === 'company' ? 'Partita IVA' : 'Codice Fiscale'}</Label>
                  <Input
                    value={billingInfo.taxId}
                    onChange={(e) => setBillingInfo({...billingInfo, taxId: e.target.value})}
                    className="bg-white"
                    />
                </div>

                {billingInfo.billingType === 'company' && (
                  <div>
                    <Label>PEC / Codice SDI</Label>
                    <Input
                      value={billingInfo.pecSdi}
                      onChange={(e) => setBillingInfo({...billingInfo, pecSdi: e.target.value})}
                      className="bg-white"
                      />
                  </div>
                )}

                <div>
                  <Label>Indirizzo</Label>
                  <Input
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Città</Label>
                    <Input
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label>CAP</Label>
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
                  {isSaving ? 'Salvataggio...' : 'Salva Dati Fatturazione'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Storico Transazioni</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nessuna transazione</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div>
                          <p className="font-semibold">{t.description || 'Pagamento MyWellness'}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(t.payment_date).toLocaleDateString('it-IT')} - {t.plan} ({t.billing_period})
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-[#26847F]">€{t.amount.toFixed(2)}</p>
                          <Button
                            onClick={() => handleDownloadInvoice(t.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Fattura
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
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Preferenze Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing e Promozioni</p>
                    <p className="text-sm text-gray-500">Ricevi offerte e novità</p>
                  </div>
                  <Switch
                    checked={emailNotifications.marketing}
                    onCheckedChange={(checked) => setEmailNotifications({...emailNotifications, marketing: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Aggiornamenti Prodotto</p>
                    <p className="text-sm text-gray-500">Nuove funzionalità e miglioramenti</p>
                  </div>
                  <Switch
                    checked={emailNotifications.product_updates}
                    onCheckedChange={(checked) => setEmailNotifications({...emailNotifications, product_updates: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promemoria Rinnovo</p>
                    <p className="text-sm text-gray-500">Notifiche prima del rinnovo abbonamento</p>
                  </div>
                  <Switch
                    checked={emailNotifications.renewal_reminders}
                    onCheckedChange={(checked) => setEmailNotifications({...emailNotifications, renewal_reminders: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promemoria Allenamento</p>
                    <p className="text-sm text-gray-500">Motivazione per restare attivo</p>
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
                  {isSaving ? 'Salvataggio...' : 'Salva Preferenze'}
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
                    Programma Affiliazione
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    🎉 <strong>Guadagna il 10%</strong> su ogni pagamento degli utenti che inviti!
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✅ <strong>10% di commissione</strong> su tutti i pagamenti dei tuoi affiliati</li>
                    <li>✅ <strong>20% di sconto</strong> per chi si iscrive col tuo link</li>
                    <li>✅ <strong>Prelievi automatici</strong> su conto bancario tramite Stripe</li>
                    <li>✅ <strong>Usa i crediti</strong> per pagare la tua subscription</li>
                  </ul>
                  <Button
                    onClick={handleGenerateAffiliateLink}
                    disabled={isLoadingAffiliate}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isLoadingAffiliate ? 'Generazione...' : 'Genera il Tuo Link di Affiliazione'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Credito Disponibile</p>
                          <p className="text-3xl font-bold text-green-700">
                            €{affiliateStats.stats.available_balance.toFixed(2)}
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
                          <p className="text-sm text-gray-600">Totale Guadagnato</p>
                          <p className="text-3xl font-bold text-blue-700">
                            €{affiliateStats.stats.total_earned.toFixed(2)}
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
                          <p className="text-sm text-gray-600">Affiliati</p>
                          <p className="text-3xl font-bold text-purple-700">
                            {affiliateStats.stats.total_referrals}
                          </p>
                        </div>
                        <Users className="w-10 h-10 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Link di Affiliazione */}
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5" />
                      Il Tuo Link di Affiliazione
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
                        <strong>Come funziona:</strong> Condividi questo link. Chi si iscrive riceve <strong>20% di sconto</strong> sul primo mese, tu guadagni <strong>10% su ogni loro pagamento</strong>!
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Prelievi */}
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Preleva Crediti</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!affiliateStats.stats.onboarding_completed ? (
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <p className="text-sm text-amber-900 mb-3">
                            ⚠️ Per prelevare i tuoi crediti, devi prima connettere il tuo account Stripe Connect.
                          </p>
                        </div>
                        <Button
                          onClick={handleConnectStripe}
                          disabled={isLoadingAffiliate}
                          className="w-full bg-[#635BFF] hover:bg-[#5248E6] text-white"
                        >
                          {isLoadingAffiliate ? 'Connessione...' : 'Connetti Stripe e Inizia a Prelevare'}
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Stripe Connect Attivo</span>
                        </div>
                        <div>
                          <Label>Importo da Prelevare (min. €10)</Label>
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
                              {isWithdrawing ? 'Prelievo...' : 'Preleva'}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">
                          💡 I soldi arriveranno sul tuo conto bancario in 2-7 giorni lavorativi
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Crediti Recenti */}
                {affiliateStats.recent_credits?.length > 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Crediti Recenti</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {affiliateStats.recent_credits.map((credit) => (
                          <div key={credit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-semibold text-sm">
                                €{credit.commission_amount.toFixed(2)} da affiliato
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(credit.payment_date).toLocaleDateString('it-IT')}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              credit.commission_status === 'available' ? 'bg-green-100 text-green-700' :
                              credit.commission_status === 'withdrawn' ? 'bg-gray-100 text-gray-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {credit.commission_status === 'available' ? 'Disponibile' :
                               credit.commission_status === 'withdrawn' ? 'Prelevato' : 'Usato'}
                            </span>
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
                  Aggiorna Statistiche
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
                      <p className="font-bold text-purple-900">Supporto Prioritario Attivo</p>
                      <p className="text-sm text-purple-700">I tuoi ticket riceveranno risposta con priorità massima</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Invia un Ticket di Supporto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={ticketCategory} onValueChange={setTicketCategory}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">Problema Tecnico</SelectItem>
                      <SelectItem value="fatturazione">Fatturazione</SelectItem>
                      <SelectItem value="abbonamento">Abbonamento</SelectItem>
                      <SelectItem value="funzionalita">Richiesta Funzionalità</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Oggetto</Label>
                  <Input
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Descrivi il problema in poche parole"
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label>Messaggio</Label>
                  <Textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Descrivi il problema in dettaglio..."
                    className="bg-white h-32"
                  />
                </div>

                <Button
                  onClick={handleSubmitTicket}
                  disabled={isSaving}
                  className="bg-[#26847F] hover:bg-[#1f6b66] text-white w-full"
                >
                  {isSaving ? 'Invio...' : 'Invia Ticket'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>I Tuoi Ticket</CardTitle>
              </CardHeader>
              <CardContent>
                {supportTickets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nessun ticket aperto</p>
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
                                <Badge className="bg-green-100 text-green-700 text-xs">🤖 Risolto AI</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{ticket.message.split('\n\n---')[0]}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(ticket.created_date).toLocaleDateString('it-IT')} - {ticket.category}
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
                            {ticket.admin_response && <span>💬 Risposta ricevuta</span>}
                            {ticket.ai_response && !ticket.admin_response && <span>🤖 Risposta AI disponibile</span>}
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
              💬 Analizzando la tua richiesta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Ticket Info */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">{currentTicket?.subject}</p>
              <p className="text-sm text-gray-600 mb-3">{currentTicket?.message}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{currentTicket?.category}</Badge>
                <Badge className="bg-purple-100 text-purple-700 text-xs">{user?.subscription_plan}</Badge>
              </div>
            </div>

            {/* AI Response */}
            {isGeneratingAI ? (
              <div className="p-6 bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 rounded-xl border-2 border-[var(--brand-primary)]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-primary)]"></div>
                  <p className="font-bold text-gray-900">L'AI sta analizzando la tua richiesta...</p>
                </div>
                <p className="text-sm text-gray-600">Sto generando una risposta personalizzata per te</p>
              </div>
            ) : aiResponse ? (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 rounded-xl border-2 border-[var(--brand-primary)]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">🤖</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Assistente AI MyWellness</p>
                      <p className="text-xs text-gray-500">Risposta automatica</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <p className="font-semibold text-gray-900 mb-4 text-center">
                    Questa risposta ti è stata utile?
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={handleTicketResolved}
                      className="bg-green-600 hover:bg-green-700 text-white h-auto py-4 flex flex-col gap-1"
                    >
                      <span className="text-2xl">✅</span>
                      <span className="font-bold">Problema Risolto</span>
                      <span className="text-xs opacity-90">Chiudi il ticket</span>
                    </Button>
                    
                    <Button
                      onClick={handleNeedMoreHelp}
                      variant="outline"
                      className="border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] h-auto py-4 flex flex-col gap-1"
                    >
                      <span className="text-2xl">🙋</span>
                      <span className="font-bold">Serve Ancora Aiuto</span>
                      <span className="text-xs opacity-75">Contatta il team</span>
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    💡 Se hai ancora bisogno di supporto, un membro del team ti contatterà via email
                  </p>
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
    </div>
  );
}