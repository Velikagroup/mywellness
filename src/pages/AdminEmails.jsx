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
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  Heart,
  Shield,
  BarChart3,
  ShoppingCart
} from 'lucide-react';

export default function AdminEmails() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSegment, setBroadcastSegment] = useState('all');
  const [userCount, setUserCount] = useState(0);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(null);
  const [editingContent, setEditingContent] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

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
        { id: 'trial_expired_winback', name: 'Trial Scaduto Senza Conversione', trigger: 'Trial scaduto + nessun pagamento', function: 'sendTrialExpiredWinback' },
        { id: 'subscription_expired', name: 'Abbonamento Scaduto', trigger: 'Subscription status = expired', function: 'sendSubscriptionExpired' }
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
        { id: 'quiz_started_abandoned', name: 'Quiz Iniziato ma Non Completato', trigger: 'Cron - 2h dopo quiz iniziato', function: 'sendQuizStartedAbandoned', status: 'planned' },
        { id: 'quiz_completed_abandoned', name: 'Quiz Completato Senza Piano', trigger: 'Cron - 24h dopo quiz senza piano', function: 'sendQuizReminderNoPlan' },
        { id: 'trial_setup_abandoned', name: 'Trial Setup Abbandonato', trigger: 'Cron - 1h dopo apertura senza pagamento', function: 'sendTrialSetupAbandoned', status: 'planned' },
        { id: 'pricing_visited_abandoned', name: 'Pricing Visitato ma Non Acquistato', trigger: 'Cron - 24h dopo visita pricing', function: 'sendPricingVisitedAbandoned', status: 'planned' },
        { id: 'cart_checkout_abandoned', name: 'Checkout Abbandonato', trigger: 'Cron - 3h dopo inizio checkout', function: 'sendCartCheckoutAbandoned', status: 'planned' }
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
  const activeEmails = Object.values(emailCategories).reduce((sum, cat) => 
    sum + cat.emails.filter(e => e.status !== 'planned').length, 0
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Manager</h1>
          <p className="text-gray-600">Gestisci le email di sistema automatizzate e broadcast manuali</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{totalEmails}</p>
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
                  <p className="text-sm text-gray-500">Email Attive</p>
                  <p className="text-2xl font-bold text-gray-900">{activeEmails}</p>
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
                  <p className="text-sm text-gray-500">Categorie</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(emailCategories).length}</p>
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
              Broadcast
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
                        {category.emails.filter(e => e.status !== 'planned').length} attive
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {category.emails.map(email => (
                        <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{email.name}</h4>
                                <Badge className={email.status === 'planned' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                                  {email.status === 'planned' ? 'Da Implementare' : 'Attiva'}
                                </Badge>
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

          <TabsContent value="broadcast" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Invia Email Broadcast
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">Invia un email a tutti o a un segmento specifico di utenti</p>
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
        </Tabs>
      </div>

      {/* Preview Dialog - keep existing code */}
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
                  <Badge className="mt-1 bg-green-100 text-green-700">
                    {previewEmail.status === 'planned' ? 'Da Implementare' : 'Attiva'}
                  </Badge>
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
                      Variabili disponibili: {'{'}user_name{'}'}, {'{'}user_email{'}'}, {'{'}expiry_date{'}'}, {'{'}temp_password{'}'}, {'{'}app_url{'}'}
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
                      💡 <strong>Variabili disponibili:</strong> {'{'}user_name{'}'}, {'{'}user_email{'}'}, {'{'}expiry_date{'}'}, {'{'}temp_password{'}'}, {'{'}app_url{'}'}
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