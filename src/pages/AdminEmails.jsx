
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  Users,
  Filter,
  Settings,
  Zap,
  Eye,
  Edit
} from 'lucide-react';

export default function AdminEmails() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Broadcast state
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSegment, setBroadcastSegment] = useState('all');
  const [userCount, setUserCount] = useState(0);

  // NEW: Preview state
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(null);

  // NEW: Edit state for preview dialog
  const [editingContent, setEditingContent] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  const [emailTemplates, setEmailTemplates] = useState([]);

  const loadEmailTemplates = async () => {
    try {
      const templates = await base44.entities.EmailTemplate.list();
      setEmailTemplates(templates);
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      setUser(currentUser);
      await loadUserCount();
      await loadEmailTemplates();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
    setIsLoading(false);
  };

  const loadUserCount = async () => {
    try {
      const users = await base44.entities.User.list();
      setUserCount(users.length);
    } catch (error) {
      console.error('Error loading user count:', error);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      alert('Inserisci subject e body dell\'email');
      return;
    }

    if (!confirm(`Sei sicuro di voler inviare questa email a ${getSegmentDescription()}?`)) {
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const response = await base44.functions.invoke('sendBroadcastEmail', {
        subject: broadcastSubject,
        body: broadcastBody,
        segment: broadcastSegment
      });

      alert(`✅ Email inviata con successo a ${response.sent_count} utenti!`);
      setBroadcastSubject('');
      setBroadcastBody('');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      alert('Errore durante l\'invio: ' + error.message);
    }
    setIsSendingBroadcast(false);
  };

  const getSegmentDescription = () => {
    switch(broadcastSegment) {
      case 'all': return 'tutti gli utenti';
      case 'active': return 'utenti con abbonamento attivo';
      case 'trial': return 'utenti in trial';
      case 'expired': return 'utenti con abbonamento scaduto';
      default: return 'gli utenti selezionati';
    }
  };

  const handleOpenPreview = (email) => {
    const template = emailTemplates.find(t => t.template_id === email.id);
    setPreviewEmail({ ...email, template });
    setShowEmailPreview(true);
    setIsEditMode(false);
    setEditingContent(template || {});
  };

  const handleStartEdit = () => {
    setIsEditMode(true);
    setEditingContent(previewEmail?.template || {});
  };

  const handleSaveEdit = async () => {
    try {
      if (previewEmail?.template?.id) {
        await base44.entities.EmailTemplate.update(previewEmail.template.id, editingContent);
        alert('✅ Email modificata con successo!');
        await loadEmailTemplates();
        setIsEditMode(false);
        setShowEmailPreview(false);
      } else if (previewEmail?.id && !previewEmail?.template?.id) {
        // If systemEmail exists but no template for it, create a new template
        const newTemplateData = {
          template_id: previewEmail.id,
          from_email: editingContent.from_email || 'info@projectmywellness.com',
          reply_to_email: editingContent.reply_to_email || 'no-reply@projectmywellness.com',
          subject: editingContent.subject || 'Oggetto predefinito',
          greeting: editingContent.greeting || 'Ciao {user_name},',
          main_content: editingContent.main_content || 'Contenuto predefinito dell\'email.',
          call_to_action_text: editingContent.call_to_action_text || '',
          call_to_action_url: editingContent.call_to_action_url || '',
          footer_text: editingContent.footer_text || 'Il tuo percorso verso il benessere'
        };
        await base44.entities.EmailTemplate.create(newTemplateData);
        alert('✅ Nuovo template creato e salvato con successo!');
        await loadEmailTemplates();
        setIsEditMode(false);
        setShowEmailPreview(false);
      }
    } catch (error) {
      console.error('Error updating/creating template:', error);
      alert('❌ Errore durante il salvataggio: ' + error.message);
    }
  };

  const handleSendTestEmail = async () => {
    if (!previewEmail?.template) {
      alert('❌ Template non trovato. Impossibile inviare email di test.');
      return;
    }

    if (!user?.email) {
      alert('❌ Impossibile determinare l\'indirizzo email dell\'utente corrente per inviare il test.');
      return;
    }

    if (!confirm(`Inviare email di test a ${user.email}?`)) {
      return;
    }

    try {
      const template = previewEmail.template;
      const fromEmail = template.from_email || 'info@projectmywellness.com';
      const replyToEmail = template.reply_to_email || 'no-reply@projectmywellness.com';
      
      // Prepara variabili di esempio realistiche
      const variables = {
        user_name: user.full_name || 'Mario Rossi',
        user_email: user.email,
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
        temp_password: 'TestPass123!',
        app_url: window.location.origin,
        weight_change: '-2.5',
        current_weight: '72.5',
        target_weight: '70',
        avg_calories: '1850',
        workouts_completed: '4',
        planned_workouts: '5',
        adherence: '80',
        progress: '65',
        distance_remaining: '2.5',
        week_range: '1-7 Gen 2025',
        motivational_message: 'Ottimo lavoro questa settimana! Continua così 💪'
      };

      // Helper function to replace variables
      const replaceVars = (text, vars) => {
        let result = text;
        Object.keys(vars).forEach(key => {
          const regex = new RegExp(`\\{${key}\\}`, 'g');
          result = result.replace(regex, vars[key]);
        });
        return result;
      };

      const replacedGreeting = replaceVars(template.greeting, variables);
      const replacedMainContent = replaceVars(template.main_content, variables);
      const replacedSubject = replaceVars(template.subject, variables);
      const replacedCtaUrl = replaceVars(template.call_to_action_url || '', variables);

      // Costruisci HTML email professionale con tabelle per compatibilità Gmail
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <tr>
                        <td style="padding: 24px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">${replacedGreeting}</p>
                            <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${replacedMainContent}</div>
                            ${template.call_to_action_text && template.call_to_action_url ? `
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${replacedCtaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            ${template.call_to_action_text}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                        </td>
                    </tr>
                </table>
                
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999;">
                            <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
                            <p style="margin: 5px 0; font-size: 11px;">EIN: 36-5141800 - velika.03@outlook.it</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
      `;

      // Chiama la function sendTestEmailDirect che userà SendGrid API direttamente
      const response = await base44.functions.invoke('sendTestEmailDirect', {
        to: user.email,
        from_email: fromEmail,
        from_name: 'MyWellness',
        reply_to: replyToEmail,
        subject: `[TEST] ${replacedSubject}`,
        html: htmlBody
      });

      alert(`✅ Email di test inviata con successo a ${user.email}!`);
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('❌ Errore durante l\'invio dell\'email di test: ' + error.message);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  // Email di sistema configurate
  const systemEmails = [
    {
      id: 'trial_welcome',
      name: 'Trial Setup - Benvenuto',
      description: 'Email di benvenuto inviata dopo il setup del trial con guida ai prossimi passi',
      trigger: 'Completamento Trial Setup',
      status: 'active',
      function: 'sendTrialWelcomeEmail'
    },
    {
      id: 'landing_new_user',
      name: 'Landing Offer - Nuovo Utente',
      description: 'Email inviata ai nuovi utenti dopo l\'acquisto della Landing Offer con password temporanea',
      trigger: 'Acquisto Landing Offer (nuovo utente)',
      status: 'active',
      function: 'stripeCreateOneTimePayment'
    },
    {
      id: 'landing_existing_user',
      name: 'Landing Offer - Utente Esistente',
      description: 'Email di conferma per utenti esistenti che acquistano la Landing Offer',
      trigger: 'Acquisto Landing Offer (utente esistente)',
      status: 'active',
      function: 'stripeCreateOneTimePayment'
    },
    {
      id: 'renewal_7_days',
      name: 'Reminder Rinnovo - 7 Giorni',
      description: 'Email automatica inviata 7 giorni prima della scadenza abbonamento',
      trigger: 'Cron giornaliero (7 giorni prima scadenza)',
      status: 'active',
      function: 'sendRenewalReminders'
    },
    {
      id: 'renewal_3_days',
      name: 'Reminder Rinnovo - 3 Giorni',
      description: 'Email automatica inviata 3 giorni prima della scadenza abbonamento',
      trigger: 'Cron giornaliero (3 giorni prima scadenza)',
      status: 'active',
      function: 'sendRenewalReminders'
    },
    {
      id: 'renewal_1_day',
      name: 'Reminder Rinnovo - 1 Giorno',
      description: 'Email urgente inviata 1 giorno prima della scadenza abbonamento',
      trigger: 'Cron giornaliero (1 giorno prima scadenza)',
      status: 'active',
      function: 'sendRenewalReminders'
    },
    {
      id: 'weekly_report',
      name: 'Report Settimanale Progressi',
      description: 'Report automatico con statistiche settimanali (peso, calorie, allenamenti, aderenza)',
      trigger: 'Cron settimanale (ogni Lunedì)',
      status: 'active',
      function: 'sendWeeklyReport'
    }
  ];

  // Sequenze da implementare
  const emailSequences = [
    {
      id: 'welcome_sequence',
      name: 'Sequenza di Benvenuto (Trial)',
      description: 'Serie di email per guidare l\'utente nei primi giorni di trial',
      emails: [
        { day: 0, subject: 'Benvenuto in MyWellness! Inizia qui 🎯', status: 'planned' },
        { day: 1, subject: 'Come generare il tuo piano nutrizionale personalizzato', status: 'planned' },
        { day: 2, subject: 'Ultimo giorno di trial - Non perdere il tuo piano! ⏰', status: 'planned' }
      ],
      status: 'planned'
    },
    {
      id: 'renewal_reminder',
      name: 'Reminder Rinnovo',
      description: 'Email di promemoria prima della scadenza dell\'abbonamento',
      emails: [
        { day: -7, subject: 'Il tuo abbonamento scade tra 7 giorni', status: 'planned' },
        { day: -3, subject: 'Ultimi 3 giorni - Rinnova ora e continua il tuo percorso', status: 'planned' },
        { day: -1, subject: 'Ultimo giorno! Non perdere i tuoi progressi', status: 'planned' }
      ],
      status: 'planned'
    },
    {
      id: 'engagement_sequence',
      name: 'Sequenza Engagement',
      description: 'Email per mantenere gli utenti attivi e motivati',
      emails: [
        { week: 1, subject: 'I tuoi primi progressi! 📊', status: 'planned' },
        { week: 2, subject: 'Consigli per massimizzare i risultati', status: 'planned' },
        { week: 4, subject: 'Report mensile dei tuoi progressi', status: 'planned' }
      ],
      status: 'planned'
    },
    {
      id: 'win_back',
      name: 'Win-Back Sequence',
      description: 'Recupera utenti che hanno cancellato l\'abbonamento',
      emails: [
        { day: 7, subject: 'Ci manchi! Torna con un\'offerta speciale', status: 'planned' },
        { day: 14, subject: 'Il tuo piano ti sta aspettando', status: 'planned' },
        { day: 30, subject: 'Ultima possibilità: 50% di sconto per te', status: 'planned' }
      ],
      status: 'planned'
    }
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Manager</h1>
          <p className="text-gray-600">Gestisci le email di sistema, broadcast e sequenze automatiche</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:// ... keep existing code (rest of the component) ...
grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Sistema</p>
                  <p className="text-2xl font-bold text-gray-900">{systemEmails.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sequenze Attive</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Utenti Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{userCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sequenze Pianificate</p>
                  <p className="text-2xl font-bold text-gray-900">{emailSequences.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Tabs */}
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Email di Sistema
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="sequences" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Sequenze
            </TabsTrigger>
          </TabsList>

          {/* EMAIL DI SISTEMA */}
          <TabsContent value="system" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email di Sistema Configurate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemEmails.map(email => (
                  <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{email.name}</h3>
                          <Badge className="bg-green-100 text-green-700">
                            {email.status === 'active' ? 'Attiva' : 'Inattiva'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{email.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Trigger: {email.trigger}
                          </span>
                          <span>Function: {email.function}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPreview(email)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Info:</strong> Le email di sistema sono automaticamente inviate quando si verificano determinati eventi (acquisti, trial, ecc.).
                    Per modificarle, edita le backend functions corrispondenti.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BROADCAST */}
          <TabsContent value="broadcast" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Invia Email Broadcast
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">Invia un'email a tutti o a un segmento specifico di utenti</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="segment" className="text-sm font-semibold mb-2 block">
                    Destinatari
                  </Label>
                  <select
                    id="segment"
                    value={broadcastSegment}
                    onChange={(e) => setBroadcastSegment(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  >
                    <option value="all">Tutti gli utenti ({userCount})</option>
                    <option value="active">Solo abbonamenti attivi</option>
                    <option value="trial">Solo utenti in trial</option>
                    <option value="expired">Solo abbonamenti scaduti</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-sm font-semibold mb-2 block">
                    Oggetto Email
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Es: Novità MyWellness - Nuove funzionalità disponibili!"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="body" className="text-sm font-semibold mb-2 block">
                    Corpo Email (HTML supportato)
                  </Label>
                  <Textarea
                    id="body"
                    placeholder="Scrivi il contenuto dell'email qui... Puoi usare HTML per formattare il testo."
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Puoi usare variabili: {'{'}user_name{'}'}, {'{'}user_email{'}'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSendBroadcast}
                    disabled={isSendingBroadcast || !broadcastSubject.trim() || !broadcastBody.trim()}
                    className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white h-12"
                  >
                    {isSendingBroadcast ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Invia Email a {getSegmentDescription()}
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-900">
                    ⚠️ <strong>Attenzione:</strong> L'invio di email broadcast è irreversibile. Controlla attentamente il contenuto prima di inviare.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEQUENZE */}
          <TabsContent value="sequences" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Sequenze Email Automatiche
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Email automation per engagement e retention</p>
                  </div>
                  <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">
                    <Zap className="w-4 h-4 mr-2" />
                    Nuova Sequenza
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailSequences.map(sequence => (
                  <div key={sequence.id} className="border rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{sequence.name}</h3>
                          <Badge className="bg-orange-100 text-orange-700">
                            {sequence.status === 'planned' ? 'Da Implementare' : 'Attiva'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{sequence.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Email nella sequenza:</p>
                      {sequence.emails.map((email, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-[var(--brand-primary-light)] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[var(--brand-primary)]">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{email.subject}</p>
                            <p className="text-xs text-gray-500">
                              {email.day !== undefined && `Giorno ${email.day >= 0 ? '+' + email.day : email.day}`}
                              {email.week !== undefined && `Settimana ${email.week}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {email.status === 'planned' ? 'Pianificata' : 'Attiva'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Implementazione Sequenze
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Le sequenze email automatiche richiedono l'implementazione di backend functions con trigger temporali.
                  </p>
                  <p className="text-sm text-gray-600">
                    📝 Per attivare una sequenza, contatta il team di sviluppo per implementare i trigger e le condizioni necessarie.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* NEW: Email Preview Dialog */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span>Email: {previewEmail?.name}</span>
              {!isEditMode && previewEmail?.template && (
                <Button
                  onClick={handleStartEdit}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifica Contenuto
                </Button>
              )}
               {!isEditMode && !previewEmail?.template && (
                <Button
                  onClick={handleStartEdit}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Crea Template
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewEmail && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Stato</Label>
                  <Badge className="mt-1 bg-green-100 text-green-700">
                    {previewEmail.status === 'active' ? 'Attiva' : 'Inattiva'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">ID Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{previewEmail.id}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Descrizione</Label>
                <p className="text-sm text-gray-600 mt-1">{previewEmail.description}</p>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Trigger Automatico</Label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-blue-50 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-900">{previewEmail.trigger}</span>
                </div>
              </div>

              {isEditMode ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Mittente</Label>
                    <Input
                      value={editingContent.from_email || ''}
                      onChange={(e) => setEditingContent({...editingContent, from_email: e.target.value})}
                      placeholder="info@projectmywellness.com"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Reply-To</Label>
                    <Input
                      value={editingContent.reply_to_email || ''}
                      onChange={(e) => setEditingContent({...editingContent, reply_to_email: e.target.value})}
                      placeholder="no-reply@projectmywellness.com"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Oggetto</Label>
                    <Input
                      value={editingContent.subject || ''}
                      onChange={(e) => setEditingContent({...editingContent, subject: e.target.value})}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Saluto</Label>
                    <Input
                      value={editingContent.greeting || ''}
                      onChange={(e) => setEditingContent({...editingContent, greeting: e.target.value})}
                      placeholder="Ciao {user_name},"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Contenuto Principale</Label>
                    <Textarea
                      value={editingContent.main_content || ''}
                      onChange={(e) => setEditingContent({...editingContent, main_content: e.target.value})}
                      rows={15}
                      className="text-sm"
                      placeholder="Contenuto email..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Variabili disponibili: {'{'}user_name{'}'}, {'{'}user_email{'}'}, {'{'}expiry_date{'}'}, {'{'}temp_password{'}'}, {'{'}app_url{'}'}, {'{'}weight_change{'}'}, {'{'}current_weight{'}'}, {'{'}target_weight{'}'}, {'{'}avg_calories{'}'}, {'{'}workouts_completed{'}'}, {'{'}planned_workouts{'}'}, {'{'}adherence{'}'}, {'{'}progress{'}'}, {'{'}distance_remaining{'}'}, {'{'}week_range{'}'}, {'{'}motivational_message{'}'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Testo Pulsante CTA</Label>
                    <Input
                      value={editingContent.call_to_action_text || ''}
                      onChange={(e) => setEditingContent({...editingContent, call_to_action_text: e.target.value})}
                      placeholder="Vai alla Dashboard"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">URL Pulsante CTA</Label>
                    <Input
                      value={editingContent.call_to_action_url || ''}
                      onChange={(e) => setEditingContent({...editingContent, call_to_action_url: e.target.value})}
                      placeholder="{app_url}/Dashboard"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Footer</Label>
                    <Input
                      value={editingContent.footer_text || ''}
                      onChange={(e) => setEditingContent({...editingContent, footer_text: e.target.value})}
                      placeholder="Il tuo percorso verso il benessere"
                      className="h-12"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSaveEdit}
                      className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                    >
                      💾 Salva Modifiche
                    </Button>
                    <Button
                      onClick={() => setIsEditMode(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Annulla
                    </Button>
                  </div>
                </div>
              ) : previewEmail?.template ? (
                <div className="space-y-4">
                  <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Da:</p>
                        <p className="text-sm font-semibold text-gray-900">{previewEmail.template.from_email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Reply-To:</p>
                        <p className="text-sm font-semibold text-gray-900">{previewEmail.template.reply_to_email}</p>
                      </div>
                      <div className="pt-3 border-t border-gray-300">
                        <p className="text-xs text-gray-500 mb-1">Oggetto:</p>
                        <p className="text-sm font-bold text-gray-900">{previewEmail.template.subject}</p>
                      </div>
                      <div className="pt-3 border-t border-gray-300">
                        <p className="text-xs text-gray-500 mb-2">Saluto:</p>
                        <p className="text-sm text-gray-900">{previewEmail.template.greeting}</p>
                      </div>
                      <div className="pt-3 border-t border-gray-300">
                        <p className="text-xs text-gray-500 mb-2">Contenuto:</p>
                        <div className="text-sm text-gray-900 whitespace-pre-wrap bg-white p-4 rounded border border-gray-200">
                          {previewEmail.template.main_content}
                        </div>
                      </div>
                      {previewEmail.template.call_to_action_text && (
                        <div className="pt-3 border-t border-gray-300">
                          <p className="text-xs text-gray-500 mb-2">Pulsante CTA:</p>
                          <div className="bg-white p-4 rounded border border-gray-200">
                            <p className="text-sm font-semibold text-[var(--brand-primary)] mb-1">
                              📍 {previewEmail.template.call_to_action_text}
                            </p>
                            <p className="text-xs text-gray-500">→ {previewEmail.template.call_to_action_url}</p>
                          </div>
                        </div>
                      )}
                      <div className="pt-3 border-t border-gray-300">
                        <p className="text-xs text-gray-500 mb-2">Footer:</p>
                        <p className="text-sm text-gray-600 italic">{previewEmail.template.footer_text}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      💡 <strong>Variabili disponibili:</strong> {'{'}user_name{'}'}, {'{'}user_email{'}'}, {'{'}expiry_date{'}'}, {'{'}temp_password{'}'}, {'{'}app_url{'}'}, {'{'}weight_change{'}'}, {'{'}current_weight{'}'}, {'{'}target_weight{'}'}, {'{'}avg_calories{'}'}, {'{'}workouts_completed{'}'}, {'{'}planned_workouts{'}'}, {'{'}adherence{'}'}, {'{'}progress{'}'}, {'{'}distance_remaining{'}'}, {'{'}week_range{'}'}, {'{'}motivational_message{'}'}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSendTestEmail}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      📧 Invia Email di Test
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-900">
                    ⚠️ Template non trovato per questa email. Puoi crearne uno modificandola.
                  </p>
                </div>
              )}

              {!isEditMode && (
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setShowEmailPreview(false)}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                  >
                    Chiudi
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
