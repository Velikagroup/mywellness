
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
  Settings,
  Zap,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  Heart,
  Shield,
  BarChart3,
  ShoppingCart,
  Calendar,
  Save,
  FileText,
  X,
  Globe
} from 'lucide-react';

export default function AdminEmails() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(null);
  const [editingContent, setEditingContent] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userCount, setUserCount] = useState(0);
  
  // Broadcast states
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    name: '',
    subject: '',
    greeting: 'Ciao {user_name},',
    main_content: '',
    call_to_action_text: '',
    call_to_action_url: '',
    footer_text: 'Il tuo percorso verso il benessere',
    from_email: 'info@projectmywellness.com',
    reply_to_email: 'no-reply@projectmywellness.com',
    segment: 'all',
    scheduled_for: ''
  });
  const [broadcasts, setBroadcasts] = useState([]);
  const [editingBroadcast, setEditingBroadcast] = useState(null);

  const loadEmailTemplates = async () => {
    try {
      const templates = await base44.entities.EmailTemplate.list();
      setEmailTemplates(templates);
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  };

  const loadBroadcasts = async () => {
    try {
      const allBroadcasts = await base44.entities.BroadcastEmail.list(['-created_date']);
      setBroadcasts(allBroadcasts);
    } catch (error) {
      console.error('Error loading broadcasts:', error);
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
      await loadBroadcasts();
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
        const newTemplateData = {
          template_id: previewEmail.id,
          name: previewEmail.name,
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

  const handleDeleteTemplate = async () => {
    if (!previewEmail?.template?.id) {
      alert('❌ Nessun template da eliminare.');
      return;
    }

    if (!confirm(`Sei sicuro di voler eliminare il template "${previewEmail.name}"?\n\nQuesta azione non può essere annullata.`)) {
      return;
    }

    try {
      await base44.entities.EmailTemplate.delete(previewEmail.template.id);
      alert('✅ Template eliminato con successo!');
      await loadEmailTemplates();
      setShowEmailPreview(false);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('❌ Errore durante l\'eliminazione: ' + error.message);
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
      
      const variables = {
        user_name: user.full_name || 'Mario Rossi',
        user_email: user.email,
        app_url: window.location.origin
      };

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

      const ctaHtml = template.call_to_action_text && template.call_to_action_url ? 
        `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
            <tr>
                <td align="center">
                    <a href="${replacedCtaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                        ${template.call_to_action_text}
                    </a>
                </td>
            </tr>
        </table>` : '';

      const htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
.logo-cell { padding: 60px 30px 24px 30px; }
.content-cell { padding: 40px 30px; }
@media only screen and (min-width: 600px) {
.logo-cell { padding: 60px 60px 24px 60px !important; }
.content-cell { padding: 60px 60px 40px 60px !important; }
}
@media only screen and (max-width: 600px) {
.container { width: 100% !important; border-radius: 0 !important; }
.outer-wrapper { padding: 0 !important; }
}
</style>
</head>
<body style="margin: 0; padding: 0;">
<table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
<tr>
<td align="center">
<table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
<tr>
<td class="logo-cell">
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px;">
</td>
</tr>
<tr>
<td class="content-cell">
<p style="color: #111827; font-size: 16px;">${replacedGreeting}</p>
<div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${replacedMainContent}</div>
${ctaHtml}
</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px; background-color: #fafafa;">
<tr>
<td align="center" style="padding: 20px; color: #999999; background-color: #fafafa;">
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
</html>`;

      await base44.functions.invoke('sendTestEmailDirect', {
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

  const handleNewBroadcast = () => {
    setBroadcastData({
      name: '',
      subject: '',
      greeting: 'Ciao {user_name},',
      main_content: '',
      call_to_action_text: '',
      call_to_action_url: '',
      footer_text: 'Il tuo percorso verso il benessere',
      from_email: 'info@projectmywellness.com',
      reply_to_email: 'no-reply@projectmywellness.com',
      segment: 'all',
      scheduled_for: ''
    });
    setEditingBroadcast(null);
    setShowBroadcastDialog(true);
  };

  const handleEditBroadcast = (broadcast) => {
    setBroadcastData(broadcast);
    setEditingBroadcast(broadcast);
    setShowBroadcastDialog(true);
  };

  const handleSaveBroadcast = async (action) => {
    if (!broadcastData.name.trim() || !broadcastData.subject.trim() || !broadcastData.main_content.trim()) {
      alert('Compila almeno nome, oggetto e contenuto');
      return;
    }

    try {
      const dataToSave = {
        ...broadcastData,
        status: action === 'draft' ? 'draft' : (action === 'schedule' ? 'scheduled' : 'draft')
      };

      if (action === 'send_now') {
        // Invia immediatamente
        if (!confirm(`Sei sicuro di voler inviare questa email al segmento "${getSegmentName(broadcastData.segment)}"?`)) {
          return;
        }

        const response = await base44.functions.invoke('sendScheduledBroadcasts', {
          broadcast_id: editingBroadcast?.id || 'immediate',
          broadcast_data: dataToSave
        });

        alert(`✅ Email inviata con successo!`);
        setShowBroadcastDialog(false);
        await loadBroadcasts();
        
      } else if (action === 'schedule') {
        if (!broadcastData.scheduled_for) {
          alert('Seleziona data e ora per la programmazione');
          return;
        }

        if (editingBroadcast) {
          await base44.entities.BroadcastEmail.update(editingBroadcast.id, dataToSave);
          alert('✅ Broadcast programmato aggiornato!');
        } else {
          await base44.entities.BroadcastEmail.create(dataToSave);
          alert('✅ Broadcast programmato con successo!');
        }
        
        setShowBroadcastDialog(false);
        await loadBroadcasts();
        
      } else {
        // Salva come bozza
        if (editingBroadcast) {
          await base44.entities.BroadcastEmail.update(editingBroadcast.id, dataToSave);
          alert('✅ Bozza aggiornata!');
        } else {
          await base44.entities.BroadcastEmail.create(dataToSave);
          alert('✅ Bozza salvata!');
        }
        
        setShowBroadcastDialog(false);
        await loadBroadcasts();
      }
    } catch (error) {
      console.error('Error saving broadcast:', error);
      alert('❌ Errore: ' + error.message);
    }
  };

  const handleDeleteBroadcast = async (broadcast) => {
    if (!confirm(`Eliminare "${broadcast.name}"?`)) return;

    try {
      await base44.entities.BroadcastEmail.delete(broadcast.id);
      alert('✅ Broadcast eliminato!');
      await loadBroadcasts();
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      alert('❌ Errore: ' + error.message);
    }
  };

  const getSegmentName = (segment) => {
    const segments = {
      all: 'Tutti gli utenti',
      active_subscribers: 'Abbonamenti attivi',
      trial_users: 'Utenti in trial',
      expired_subscribers: 'Abbonamenti scaduti',
      trial_expired_no_conversion: 'Trial scaduti senza conversione',
      inactive_7_days: 'Inattivi da 7+ giorni',
      goal_achievers: 'Obiettivi raggiunti',
      workout_streak: 'Streak allenamento',
      no_workout_week: 'Nessun workout questa settimana',
      renewal_7_days: 'Rinnovo tra 7 giorni',
      renewal_3_days: 'Rinnovo tra 3 giorni',
      renewal_1_day: 'Rinnovo domani',
      milestone_30_days: '30 giorni di utilizzo',
      milestone_60_days: '60 giorni di utilizzo',
      milestone_90_days: '90 giorni di utilizzo',
      quiz_abandoned: 'Quiz abbandonati',
      trial_setup_abandoned: 'Trial setup abbandonati',
      pricing_visited: 'Pricing visitato senza acquisto',
      checkout_abandoned: 'Checkout abbandonati',
      base_plan: 'Piano Base',
      pro_plan: 'Piano Pro',
      premium_plan: 'Piano Premium',
      language_it: '🇮🇹 Utenti Italiani',
      language_en: '🇬🇧 Utenti Inglesi',
      language_es: '🇪🇸 Utenti Spagnoli',
      language_fr: '🇫🇷 Utenti Francesi',
      language_de: '🇩🇪 Utenti Tedeschi',
      language_pt: '🇵🇹 Utenti Portoghesi'
    };
    return segments[segment] || segment;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  const emailCategories = {
    critical: {
      name: 'Critical',
      icon: AlertCircle,
      color: 'red',
      emails: [
        { id: 'trial_welcome', name: 'Trial Setup - Benvenuto', trigger: 'Completamento Trial Setup', function: 'sendTrialWelcomeEmail' },
        { id: 'landing_new_user', name: 'Landing Offer - Nuovo Utente', trigger: 'Acquisto Landing Offer (nuovo utente)', function: 'stripeCreateOneTimePayment' },
        { id: 'landing_existing_user', name: 'Landing Offer - Utente Esistente', trigger: 'Acquisto Landing Offer (utente esistente)', function: 'stripeCreateOneTimePayment' },
        { id: 'standard_subscription_welcome', name: 'Benvenuto Abbonamento Standard', trigger: 'Acquisto abbonamento standard', function: 'stripeCreateTrialSubscription' },
        { id: 'renewal_confirmation', name: 'Conferma Rinnovo Automatico', trigger: 'Rinnovo automatico abbonamento (Stripe webhook)', function: 'sendRenewalConfirmation' }
      ]
    },
    renewal: {
      name: 'Renewal',
      icon: Clock,
      color: 'orange',
      emails: [
        { id: 'renewal_7_days', name: 'Reminder Rinnovo - 7 Giorni', trigger: 'Cron (7 giorni prima scadenza, con cancellazione)', function: 'sendRenewalReminders' },
        { id: 'renewal_3_days', name: 'Reminder Rinnovo - 3 Giorni', trigger: 'Cron (3 giorni prima scadenza, con cancellazione)', function: 'sendRenewalReminders' },
        { id: 'renewal_1_day', name: 'Reminder Rinnovo - 1 Giorno', trigger: 'Cron (1 giorno prima scadenza, con cancellazione)', function: 'sendRenewalReminders' }
      ]
    },
    winback: {
      name: 'Win-Back',
      icon: Heart,
      color: 'pink',
      emails: [
        { id: 'trial_expired_winback', name: 'Trial Scaduto Senza Conversione', trigger: 'Cron - Trial scaduto + nessun pagamento', function: 'sendTrialExpiredWinback' },
        { id: 'subscription_expired', name: 'Abbonamento Scaduto', trigger: 'Cron - Subscription status = expired', function: 'sendSubscriptionExpired' }
      ]
    },
    engagement: {
      name: 'Engagement',
      icon: TrendingUp,
      color: 'green',
      emails: [
        { id: 'goal_weight_achieved', name: 'Obiettivo Peso Raggiunto', trigger: 'current_weight raggiunge target_weight', function: 'sendGoalWeightAchieved' },
        { id: 'milestone_30_days', name: 'Milestone - 30 Giorni', trigger: 'Cron - 30 giorni dall\'iscrizione', function: 'sendMilestones' },
        { id: 'milestone_60_days', name: 'Milestone - 60 Giorni', trigger: 'Cron - 60 giorni dall\'iscrizione', function: 'sendMilestones' },
        { id: 'milestone_90_days', name: 'Milestone - 90 Giorni (+ Reward)', trigger: 'Cron - 90 giorni dall\'iscrizione', function: 'sendMilestones' },
        { id: 'workout_streak_7_days', name: 'Streak Allenamenti 7 Giorni', trigger: '7 workout consecutivi', function: 'sendWorkoutStreak7Days' },
        { id: 'no_workout_week', name: 'Nessun Workout Questa Settimana', trigger: 'Cron Lunedì - 0 workout settimana', function: 'sendNoWorkoutWeek' }
      ]
    },
    motivational: {
      name: 'Motivational',
      icon: Zap,
      color: 'purple',
      emails: [
        { id: 'inactive_user_7_days', name: 'Utente Inattivo 7 Giorni', trigger: 'Cron - Nessun login per 7 giorni', function: 'sendInactiveUserReminder' },
        { id: 'feedback_request', name: 'Richiesta Feedback', trigger: 'Cron - 14 giorni di utilizzo', function: 'sendFeedbackRequest' }
      ]
    },
    technical: {
      name: 'Technical',
      icon: Shield,
      color: 'blue',
      emails: [
        { id: 'password_reset_confirmed', name: 'Password Reset Completato', trigger: 'Reset password completato', function: 'sendPasswordResetConfirmed' },
        { id: 'plan_upgrade', name: 'Upgrade Piano', trigger: 'Cambio piano a tier superiore', function: 'sendPlanChange' },
        { id: 'plan_downgrade', name: 'Downgrade Piano', trigger: 'Cambio piano a tier inferiore', function: 'sendPlanChange' }
      ]
    },
    reporting: {
      name: 'Reporting',
      icon: BarChart3,
      color: 'indigo',
      emails: [
        { id: 'weekly_report', name: 'Report Settimanale Progressi', trigger: 'Cron settimanale (ogni Lunedì)', function: 'sendWeeklyReport' }
      ]
    },
    abandonment: {
      name: 'Abbandono',
      icon: ShoppingCart,
      color: 'amber',
      emails: [
        { id: 'quiz_started_abandoned', name: 'Quiz Iniziato ma Non Completato', trigger: 'Cron - 2h dopo quiz iniziato', function: 'sendQuizStartedAbandoned' },
        { id: 'quiz_completed_abandoned', name: 'Quiz Completato Senza Piano', trigger: 'Cron - 24h dopo quiz senza piano', function: 'sendQuizReminderNoPlan' },
        { id: 'trial_setup_abandoned', name: 'Trial Setup Abbandonato', trigger: 'Cron - 1h dopo apertura senza pagamento', function: 'sendTrialSetupAbandoned' },
        { id: 'pricing_visited_abandoned', name: 'Pricing Visitato ma Non Acquistato', trigger: 'Cron - 24h dopo visita pricing', function: 'sendPricingVisitedAbandoned' },
        { id: 'cart_checkout_abandoned', name: 'Checkout Abbandonato', trigger: 'Cron - 3h dopo inizio checkout', function: 'sendCartCheckoutAbandoned' }
      ]
    }
  };

  const getCategoryColor = (color) => {
    const colors = {
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      amber: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    return colors[color] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const filteredCategories = selectedCategory === 'all' 
    ? emailCategories 
    : { [selectedCategory]: emailCategories[selectedCategory] };

  const totalEmails = Object.values(emailCategories).reduce((sum, cat) => sum + cat.emails.length, 0);
  const activeEmails = totalEmails;

  const draftBroadcasts = broadcasts.filter(b => b.status === 'draft');
  const scheduledBroadcasts = broadcasts.filter(b => b.status === 'scheduled');
  const sentBroadcasts = broadcasts.filter(b => b.status === 'sent');

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Manager</h1>
          <p className="text-gray-600">Gestisci email di sistema automatizzate e campagne broadcast</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Sistema</p>
                  <p className="text-2xl font-bold text-gray-900">{totalEmails}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bozze</p>
                  <p className="text-2xl font-bold text-gray-900">{draftBroadcasts.length}</p>
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
                  <p className="text-sm text-gray-500">Programmate</p>
                  <p className="text-2xl font-bold text-gray-900">{scheduledBroadcasts.length}</p>
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
                  <p className="text-sm text-gray-500">Inviate</p>
                  <p className="text-2xl font-bold text-gray-900">{sentBroadcasts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Email di Sistema
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Broadcast Campagne
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Automatizzate per Categoria
                  </CardTitle>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  >
                    <option value="all">Tutte le Categorie</option>
                    {Object.entries(emailCategories).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {Object.entries(filteredCategories).map(([categoryKey, category]) => (
                  <div key={categoryKey}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 ${getCategoryColor(category.color)} rounded-lg flex items-center justify-center border-2`}>
                        <category.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.emails.length} email configurate</p>
                      </div>
                      <Badge className={getCategoryColor(category.color)}>
                        {category.emails.length} attive
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {category.emails.map(email => (
                        <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{email.name}</h4>
                                <Badge className="bg-green-100 text-green-700">Attiva</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {email.trigger}
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
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={handleNewBroadcast}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Nuova Campagna Broadcast
              </Button>
            </div>

            {/* Bozze */}
            {draftBroadcasts.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Bozze ({draftBroadcasts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {draftBroadcasts.map(broadcast => (
                    <div key={broadcast.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{broadcast.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{broadcast.subject}</p>
                          <Badge className="bg-gray-100 text-gray-700">{getSegmentName(broadcast.segment)}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditBroadcast(broadcast)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBroadcast(broadcast)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Programmate */}
            {scheduledBroadcasts.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Programmate ({scheduledBroadcasts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scheduledBroadcasts.map(broadcast => (
                    <div key={broadcast.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{broadcast.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{broadcast.subject}</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-100 text-orange-700">
                              📅 {new Date(broadcast.scheduled_for).toLocaleString('it-IT')}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700">{getSegmentName(broadcast.segment)}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditBroadcast(broadcast)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBroadcast(broadcast)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Inviate */}
            {sentBroadcasts.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Inviate ({sentBroadcasts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sentBroadcasts.map(broadcast => (
                    <div key={broadcast.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{broadcast.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{broadcast.subject}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-green-100 text-green-700">
                              ✅ Inviata il {new Date(broadcast.sent_at).toLocaleDateString('it-IT')}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700">
                              {broadcast.sent_count}/{broadcast.recipients_count} destinatari
                            </Badge>
                            {broadcast.error_count > 0 && (
                              <Badge className="bg-red-100 text-red-700">
                                {broadcast.error_count} errori
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteBroadcast(broadcast)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {broadcasts.length === 0 && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna campagna broadcast ancora</h3>
                  <p className="text-gray-600 mb-6">Crea la tua prima campagna email per iniziare</p>
                  <Button
                    onClick={handleNewBroadcast}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Crea Prima Campagna
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* System Email Preview Dialog */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span>Email: {previewEmail?.name}</span>
              <div className="flex items-center gap-2">
                {!isEditMode && previewEmail?.template && (
                  <>
                    <Button
                      onClick={handleDeleteTemplate}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Elimina
                    </Button>
                    <Button
                      onClick={handleStartEdit}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifica
                    </Button>
                  </>
                )}
                {!isEditMode && !previewEmail?.template && (
                  <Button
                    onClick={handleStartEdit}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Crea Template
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          {previewEmail && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Stato</Label>
                  <Badge className="mt-1 bg-green-100 text-green-700">Attiva</Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">ID Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{previewEmail.id}</p>
                </div>
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
                      Variabili: {'{'}user_name{'}'}, {'{'}user_email{'}'}, {'{'}app_url{'}'}
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

      {/* Broadcast Editor Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingBroadcast ? '✏️ Modifica Campagna' : '✨ Nuova Campagna Broadcast'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Nome Campagna</Label>
                <Input
                  value={broadcastData.name}
                  onChange={(e) => setBroadcastData({...broadcastData, name: e.target.value})}
                  placeholder="Es: Newsletter Gennaio 2025"
                  className="h-12"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Segmento Destinatari</Label>
                <select
                  value={broadcastData.segment}
                  onChange={(e) => setBroadcastData({...broadcastData, segment: e.target.value})}
                  className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                >
                  <optgroup label="📊 Generali">
                    <option value="all">Tutti gli utenti ({userCount})</option>
                    <option value="active_subscribers">Abbonamenti attivi</option>
                    <option value="trial_users">Utenti in trial</option>
                    <option value="expired_subscribers">Abbonamenti scaduti</option>
                  </optgroup>
                  
                  <optgroup label="🌍 Per Lingua">
                    <option value="language_it">🇮🇹 Utenti Italiani</option>
                    <option value="language_en">🇬🇧 Utenti Inglesi</option>
                    <option value="language_es">🇪🇸 Utenti Spagnoli</option>
                    <option value="language_fr">🇫🇷 Utenti Francesi</option>
                    <option value="language_de">🇩🇪 Utenti Tedeschi</option>
                    <option value="language_pt">🇵🇹 Utenti Portoghesi</option>
                  </optgroup>

                  <optgroup label="💼 Per Piano">
                    <option value="base_plan">Piano Base</option>
                    <option value="pro_plan">Piano Pro</option>
                    <option value="premium_plan">Piano Premium</option>
                  </optgroup>
                  
                  <optgroup label="🛒 Abbandono">
                    <option value="quiz_abandoned">Quiz abbandonati</option>
                    <option value="trial_setup_abandoned">Trial setup abbandonati</option>
                    <option value="pricing_visited">Pricing visitato senza acquisto</option>
                    <option value="checkout_abandoned">Checkout abbandonati</option>
                  </optgroup>
                  
                  <optgroup label="💔 Win-Back">
                    <option value="trial_expired_no_conversion">Trial scaduti senza conversione</option>
                    <option value="inactive_7_days">Inattivi da 7+ giorni</option>
                  </optgroup>
                  
                  <optgroup label="🔄 Rinnovi">
                    <option value="renewal_7_days">Rinnovo tra 7 giorni</option>
                    <option value="renewal_3_days">Rinnovo tra 3 giorni</option>
                    <option value="renewal_1_day">Rinnovo domani</option>
                  </optgroup>
                  
                  <optgroup label="🎯 Milestone">
                    <option value="milestone_30_days">30 giorni di utilizzo</option>
                    <option value="milestone_60_days">60 giorni di utilizzo</option>
                    <option value="milestone_90_days">90 giorni di utilizzo</option>
                  </optgroup>
                  
                  <optgroup label="💪 Fitness">
                    <option value="goal_achievers">Obiettivi raggiunti</option>
                    <option value="workout_streak">Streak allenamento</option>
                    <option value="no_workout_week">Nessun workout questa settimana</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Da (Email)</Label>
                <Input
                  value={broadcastData.from_email}
                  onChange={(e) => setBroadcastData({...broadcastData, from_email: e.target.value})}
                  placeholder="info@projectmywellness.com"
                  className="h-12"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Reply-To</Label>
                <Input
                  value={broadcastData.reply_to_email}
                  onChange={(e) => setBroadcastData({...broadcastData, reply_to_email: e.target.value})}
                  placeholder="no-reply@projectmywellness.com"
                  className="h-12"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Oggetto Email</Label>
              <Input
                value={broadcastData.subject}
                onChange={(e) => setBroadcastData({...broadcastData, subject: e.target.value})}
                placeholder="Es: 🎉 Novità MyWellness - Nuove Funzionalità!"
                className="h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Saluto Iniziale</Label>
              <Input
                value={broadcastData.greeting}
                onChange={(e) => setBroadcastData({...broadcastData, greeting: e.target.value})}
                placeholder="Ciao {user_name},"
                className="h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Contenuto Principale</Label>
              <Textarea
                value={broadcastData.main_content}
                onChange={(e) => setBroadcastData({...broadcastData, main_content: e.target.value})}
                rows={12}
                placeholder="Scrivi il contenuto dell'email qui..."
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Variabili disponibili: {'{'}user_name{'}'}, {'{'}user_email{'}'}, {'{'}app_url{'}'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Testo Pulsante CTA (Opzionale)</Label>
                <Input
                  value={broadcastData.call_to_action_text}
                  onChange={(e) => setBroadcastData({...broadcastData, call_to_action_text: e.target.value})}
                  placeholder="Es: Vai alla Dashboard"
                  className="h-12"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">URL Pulsante CTA</Label>
                <Input
                  value={broadcastData.call_to_action_url}
                  onChange={(e) => setBroadcastData({...broadcastData, call_to_action_url: e.target.value})}
                  placeholder="{app_url}/Dashboard"
                  className="h-12"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Footer (Opzionale)</Label>
              <Input
                value={broadcastData.footer_text}
                onChange={(e) => setBroadcastData({...broadcastData, footer_text: e.target.value})}
                placeholder="Il tuo percorso verso il benessere"
                className="h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                📅 Programma Invio (Opzionale)
              </Label>
              <Input
                type="datetime-local"
                value={broadcastData.scheduled_for}
                onChange={(e) => setBroadcastData({...broadcastData, scheduled_for: e.target.value})}
                className="h-12"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lascia vuoto per salvare come bozza
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={() => handleSaveBroadcast('draft')}
                variant="outline"
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Salva Bozza
              </Button>
              
              {broadcastData.scheduled_for && (
                <Button
                  onClick={() => handleSaveBroadcast('schedule')}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Programma Invio
                </Button>
              )}
              
              <Button
                onClick={() => handleSaveBroadcast('send_now')}
                className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Invia Subito
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
