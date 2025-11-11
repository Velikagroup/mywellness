
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
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  
  // Dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
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

      const userTransactions = await base44.entities.Transaction.filter({ user_id: currentUser.id }, ['-payment_date']);
      setTransactions(userTransactions);

      const userTickets = await base44.entities.SupportTicket.filter({ user_id: currentUser.id }, ['-created_date']);
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
    if (!ticketSubject || !ticketMessage) {
      alert('❌ Compila tutti i campi');
      return;
    }

    setIsSaving(true);
    try {
      const priority = user.subscription_plan === 'premium' ? 'premium' : 'normale';
      
      await base44.entities.SupportTicket.create({
        user_id: user.id,
        user_email: user.email,
        user_plan: user.subscription_plan,
        subject: ticketSubject,
        message: ticketMessage,
        category: ticketCategory,
        priority: priority
      });

      alert(`✅ Ticket inviato con successo! ${priority === 'premium' ? '⚡ Priorità PREMIUM attiva' : ''}`);
      setTicketSubject('');
      setTicketMessage('');
      setTicketCategory('tecnico');
      await loadUserData();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('❌ Errore nell\'invio del ticket');
    }
    setIsSaving(false);
  };

  const handleUpgradePlan = async () => {
    if (!selectedNewPlan) {
      alert('❌ Seleziona un piano');
      return;
    }

    setIsSaving(true);
    try {
      const response = await base44.functions.invoke('upgradeDowngradeSubscription', {
        newPlan: selectedNewPlan,
        newBillingPeriod: 'monthly'
      });

      const data = response.data || response;

      if (data.success) {
        alert('✅ Piano aggiornato con successo!');
        setShowUpgradeDialog(false);
        await loadUserData();
      } else {
        alert('❌ Errore: ' + data.error);
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('❌ Errore nell\'upgrade');
    }
    setIsSaving(false);
  };

  const handleCancelSubscription = async () => {
    setIsSaving(true);
    try {
      const response = await base44.functions.invoke('cancelMySubscription');

      const data = response.data || response;

      if (data.success) {
        alert('✅ Abbonamento cancellato. Resterà attivo fino alla scadenza del periodo corrente.');
        setShowCancelDialog(false);
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
      const response = await base44.functions.invoke('generateInvoicePDF', {
        transactionId: transactionId
      });

      const data = response.data || response;

      if (data.success && data.invoiceHTML) {
        const blob = new Blob([data.invoiceHTML], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        alert('✅ Fattura scaricata!');
      } else {
        alert('❌ Errore nella generazione fattura');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('❌ Errore nel download');
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
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

        <Tabs defaultValue="account" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-gray-100/80 p-1 rounded-lg">
              <TabsTrigger value="account" className="text-xs sm:text-sm whitespace-nowrap">Account</TabsTrigger>
              <TabsTrigger value="subscription" className="text-xs sm:text-sm whitespace-nowrap">Abbonamento</TabsTrigger>
              <TabsTrigger value="billing" className="text-xs sm:text-sm whitespace-nowrap">Fatturazione</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm whitespace-nowrap">Notifiche</TabsTrigger>
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
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
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
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Piano Attuale</p>
                    <p className="text-2xl font-bold text-gray-900">{planLabels[user?.subscription_plan] || 'N/D'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Stato: <span className="font-semibold">{statusLabels[user?.subscription_status] || 'N/D'}</span>
                    </p>
                  </div>
                  <Crown className="w-12 h-12 text-[var(--brand-primary)]" />
                </div>

                {user?.subscription_status === 'active' && user?.subscription_period_end && (
                  <p className="text-sm text-gray-600">
                    Prossimo rinnovo: <strong>{new Date(user.subscription_period_end).toLocaleDateString('it-IT')}</strong>
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowUpgradeDialog(true)}
                    className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                  >
                    {user?.subscription_plan === 'premium' ? 'Cambia Piano' : 'Upgrade Piano'}
                  </Button>
                  
                  {user?.subscription_status === 'active' && !user?.cancellation_at_period_end && (
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

                {user?.cancellation_at_period_end && (
                  <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <p className="text-sm text-orange-900">
                        Il tuo abbonamento è stato cancellato e terminerà il {new Date(user.subscription_period_end).toLocaleDateString('it-IT')}
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
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
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
                          <p className="text-lg font-bold text-[var(--brand-primary)]">€{t.amount.toFixed(2)}</p>
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
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                >
                  {isSaving ? 'Salvataggio...' : 'Salva Preferenze'}
                </Button>
              </CardContent>
            </Card>
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
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] w-full"
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
                      <div key={ticket.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{ticket.subject}</p>
                              {ticket.priority === 'premium' && (
                                <Crown className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{ticket.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(ticket.created_date).toLocaleDateString('it-IT')} - {ticket.category}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ticket.status === 'aperto' ? 'bg-blue-100 text-blue-700' :
                            ticket.status === 'in_lavorazione' ? 'bg-yellow-100 text-yellow-700' :
                            ticket.status === 'risolto' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.status}
                          </div>
                        </div>
                        {ticket.admin_response && (
                          <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                            <p className="text-sm font-semibold text-green-900 mb-1">Risposta Admin:</p>
                            <p className="text-sm text-green-800">{ticket.admin_response}</p>
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
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambia Piano</DialogTitle>
            <DialogDescription>Seleziona il nuovo piano da attivare</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <button
              onClick={() => setSelectedNewPlan('base')}
              className={`w-full p-4 border-2 rounded-xl transition-all ${
                selectedNewPlan === 'base' ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]' : 'border-gray-200'
              }`}
            >
              <p className="font-bold">Base - €19/mese</p>
              <p className="text-sm text-gray-600">Piano nutrizionale completo</p>
            </button>
            <button
              onClick={() => setSelectedNewPlan('pro')}
              className={`w-full p-4 border-2 rounded-xl transition-all ${
                selectedNewPlan === 'pro' ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]' : 'border-gray-200'
              }`}
            >
              <p className="font-bold">Pro - €29/mese</p>
              <p className="text-sm text-gray-600">Nutrizionale + Allenamento + AI</p>
            </button>
            <button
              onClick={() => setSelectedNewPlan('premium')}
              className={`w-full p-4 border-2 rounded-xl transition-all ${
                selectedNewPlan === 'premium' ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]' : 'border-gray-200'
              }`}
            >
              <p className="font-bold">Premium - €39/mese</p>
              <p className="text-sm text-gray-600">Accesso completo + Supporto prioritario</p>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>Annulla</Button>
            <Button 
              onClick={handleUpgradePlan}
              disabled={!selectedNewPlan || isSaving}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              {isSaving ? 'Aggiornamento...' : 'Conferma Cambio Piano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG CANCEL */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancella Abbonamento</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler cancellare il tuo abbonamento? Potrai continuare a usare MyWellness fino alla fine del periodo già pagato.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Annulla</Button>
            <Button 
              onClick={handleCancelSubscription}
              disabled={isSaving}
              variant="destructive"
            >
              {isSaving ? 'Cancellazione...' : 'Conferma Cancellazione'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
