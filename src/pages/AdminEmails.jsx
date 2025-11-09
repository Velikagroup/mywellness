
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
    setPreviewEmail(email);
    setShowEmailPreview(true);
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
      function: 'sendTrialWelcomeEmail',
      subject: '🎉 Benvenuto in MyWellness! I tuoi 3 giorni di prova iniziano ora!',
      preview: `
        <strong>Oggetto:</strong> 🎉 Benvenuto in MyWellness! I tuoi 3 giorni di prova iniziano ora!<br/><br/>
        
        <strong>Da:</strong> MyWellness Team &lt;info@projectmywellness.com&gt;<br/>
        <strong>Risposta a:</strong> no-reply@projectmywellness.com<br/><br/>
        
        <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb;">
          <h2 style="color: #26847F; margin-top: 0;">🎉 Benvenuto in MyWellness!</h2>
          <p><strong>Ciao {user_name},</strong></p>
          <p>Grazie per aver scelto MyWellness! Sei a un passo dal trasformare il tuo corpo e la tua vita con l'intelligenza artificiale.</p>
          
          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ Il tuo periodo di prova termina tra: 3 GIORNI</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 13px;">Dopo la prova: €39/mese (puoi cancellare quando vuoi)</p>
          </div>
          
          <h3>🚀 Cosa ti aspetta:</h3>
          <ul>
            <li>🍽️ Piano Nutrizionale AI Personalizzato</li>
            <li>💪 Allenamenti Scientifici</li>
            <li>📸 Analisi Foto con AI</li>
            <li>📊 Tracciamento Progressi</li>
          </ul>
          
          <h3>📝 I tuoi prossimi passi:</h3>
          <ol>
            <li>Completa il Quiz</li>
            <li>Genera il tuo Piano</li>
            <li>Inizia Subito</li>
            <li>Analizza i Risultati</li>
          </ol>
          
          <p style="margin-top: 20px;"><strong>💡 Consiglio Pro:</strong> I primi 3 giorni sono cruciali! Dedica 10 minuti oggi per completare il quiz e generare il tuo piano.</p>
        </div>
      `
    },
    {
      id: 'landing_new_user',
      name: 'Landing Offer - Nuovo Utente',
      description: 'Email inviata ai nuovi utenti dopo l\'acquisto della Landing Offer con password temporanea',
      trigger: 'Acquisto Landing Offer (nuovo utente)',
      status: 'active',
      function: 'stripeCreateOneTimePayment',
      subject: '🎉 Benvenuto in MyWellness - Il Tuo Accesso',
      preview: `
        <strong>Oggetto:</strong> 🎉 Benvenuto in MyWellness - Il Tuo Accesso<br/><br/>
        
        <strong>Da:</strong> MyWellness Team &lt;info@projectmywellness.com&gt;<br/>
        <strong>Risposta a:</strong> no-reply@projectmywellness.com<br/><br/>
        
        <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb;">
          <h2 style="color: #26847F; margin-top: 0;">Benvenuto in MyWellness!</h2>
          <p><strong>Ciao {user_name},</strong></p>
          <p>Grazie per aver scelto MyWellness! Il tuo acquisto è stato completato con successo.</p>
          
          <div style="background: #f0f9f8; border-left: 4px solid #26847F; padding: 20px; margin: 20px 0;">
            <p style="margin: 0;"><strong>La tua password temporanea:</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #26847F;">{temp_password}</p>
          </div>
          
          <p>Per iniziare, clicca sul pulsante qui sotto e crea la tua password personale.</p>
          <p style="margin-top: 20px;">Se hai bisogno di aiuto, contattaci a <strong>support@projectmywellness.com</strong></p>
        </div>
      `
    },
    {
      id: 'landing_existing_user',
      name: 'Landing Offer - Utente Esistente',
      description: 'Email di conferma per utenti esistenti che acquistano la Landing Offer',
      trigger: 'Acquisto Landing Offer (utente esistente)',
      status: 'active',
      function: 'stripeCreateOneTimePayment',
      subject: '🎉 Grazie per il tuo acquisto - MyWellness Premium Attivato',
      preview: `
        <strong>Oggetto:</strong> 🎉 Grazie per il tuo acquisto - MyWellness Premium Attivato<br/><br/>
        
        <strong>Da:</strong> MyWellness Team &lt;info@projectmywellness.com&gt;<br/>
        <strong>Risposta a:</strong> no-reply@projectmywellness.com<br/><br/>
        
        <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb;">
          <h2 style="color: #26847F; margin-top: 0;">Il Tuo Piano Premium è Attivo!</h2>
          <p><strong>Ciao {user_name},</strong></p>
          <p>Grazie per aver acquistato il piano Premium di MyWellness! Il tuo pagamento è stato completato con successo.</p>
          
          <div style="background: #f0f9f8; border-left: 4px solid #26847F; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #26847F;">✅ Piano Premium Attivato</p>
            <p style="margin: 10px 0 0 0;">Durata: 3 mesi</p>
          </div>
          
          <p>Accedi subito alla tua dashboard per iniziare il tuo percorso di trasformazione.</p>
          <p style="margin-top: 20px;">Se hai bisogno di aiuto, contattaci a <strong>support@projectmywellness.com</strong></p>
        </div>
      `
    },
    {
      id: 'renewal_7_days',
      name: 'Reminder Rinnovo - 7 Giorni',
      description: 'Email automatica inviata 7 giorni prima della scadenza abbonamento',
      trigger: 'Cron giornaliero (7 giorni prima scadenza)',
      status: 'active',
      function: 'sendRenewalReminders',
      subject: '⏰ Il tuo abbonamento MyWellness scade tra 7 giorni',
      preview: `
        <strong>Oggetto:</strong> ⏰ Il tuo abbonamento MyWellness scade tra 7 giorni<br/><br/>
        
        <strong>Da:</strong> MyWellness Team &lt;info@projectmywellness.com&gt;<br/>
        <strong>Risposta a:</strong> no-reply@projectmywellness.com<br/><br/>
        
        <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb;">
          <h2 style="color: #26847F; margin-top: 0;">⏰ Promemoria Rinnovo</h2>
          <p><strong>Ciao {user_name},</strong></p>
          
          <div style="background: #eff6ff; border: 3px solid #3b82f6; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <h3 style="color: #3b82f6; font-size: 24px; margin: 0 0 10px 0;">📅 Promemoria</h3>
            <p style="margin: 0; font-size: 18px;">Il tuo abbonamento MyWellness scade tra 7 giorni</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Data scadenza: {expiry_date}</p>
          </div>
          
          <p>Non perdere l'accesso a tutte le funzionalità Premium che ti aiutano a raggiungere i tuoi obiettivi:</p>
          <ul>
            <li>Piano nutrizionale personalizzato con AI</li>
            <li>Allenamenti adattivi basati sui tuoi progressi</li>
            <li>Analisi foto pasti automatica</li>
            <li>Tracciamento completo dei progressi</li>
            <li>Supporto prioritario</li>
          </ul>
        </div>
      `
    },
    {
      id: 'renewal_3_days',
      name: 'Reminder Rinnovo - 3 Giorni',
      description: 'Email automatica inviata 3 giorni prima della scadenza abbonamento',
      trigger: 'Cron giornaliero (3 giorni prima scadenza)',
      status: 'active',
      function: 'sendRenewalReminders',
      subject: '🔔 Ultimi 3 giorni - Non perdere MyWellness!',
      preview: `
        <strong>Oggetto:</strong> 🔔 Ultimi 3 giorni - Non perdere MyWellness!<br/><br/>
        
        <strong>Da:</strong> MyWellness Team &lt;info@projectmywellness.com&gt;<br/>
        <strong>Risposta a:</strong> no-reply@projectmywellness.com<br/><br/>
        
        <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb;">
          <h2 style="color: #26847F; margin-top: 0;">⏰ Promemoria Rinnovo</h2>
          <p><strong>Ciao {user_name},</strong></p>
          
          <div style="background: #fef3c7; border: 3px solid #f59e0b; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <h3 style="color: #f59e0b; font-size: 24px; margin: 0 0 10px 0;">⏰ Ultimi 3 giorni</h3>
            <p style="margin: 0; font-size: 18px;">Il tuo abbonamento MyWellness scade tra 3 giorni</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Data scadenza: {expiry_date}</p>
          </div>
          
          <p>Rinnova ora per continuare senza interruzioni!</p>
        </div>
      `
    },
    {
      id: 'renewal_1_day',
      name: 'Reminder Rinnovo - 1 Giorno',
      description: 'Email urgente inviata 1 giorno prima della scadenza abbonamento',
      trigger: 'Cron giornaliero (1 giorno prima scadenza)',
      status: 'active',
      function: 'sendRenewalReminders',
      subject: '🚨 Ultimo giorno! Il tuo abbonamento MyWellness scade domani',
      preview: `
        <strong>Oggetto:</strong> 🚨 Ultimo giorno! Il tuo abbonamento MyWellness scade domani<br/><br/>
        
        <strong>Da:</strong> MyWellness Team &lt;info@projectmywellness.com&gt;<br/>
        <strong>Risposta a:</strong> no-reply@projectmywellness.com<br/><br/>
        
        <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb;">
          <h2 style="color: #26847F; margin-top: 0;">⏰ Promemoria Rinnovo</h2>
          <p><strong>Ciao {user_name},</strong></p>
          
          <div style="background: #fef2f2; border: 3px solid #ef4444; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <h3 style="color: #ef4444; font-size: 28px; margin: 0 0 10px 0;">🚨 ULTIMO GIORNO!</h3>
            <p style="margin: 0; font-size: 18px;">Il tuo abbonamento MyWellness scade domani</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Data scadenza: {expiry_date}</p>
          </div>
          
          <p><strong>⚡ Ultimo giorno per rinnovare senza interruzioni!</strong></p>
        </div>
      `
    },
    {
      id: 'weekly_report',
      name: 'Report Settimanale Progressi',
      description: 'Report automatico con statistiche settimanali (peso, calorie, allenamenti, aderenza)',
      trigger: 'Cron settimanale (ogni Lunedì)',
      status: 'active',
      function: 'sendWeeklyReport',
      subject: '📊 Il tuo Report Settimanale MyWellness',
      preview: `
        <strong>Oggetto:</strong> 📊 Il tuo Report Settimanale MyWellness - {week_range}<br/><br/>
        
        <strong>Da:</strong> MyWellness Team &lt;info@projectmywellness.com&gt;<br/>
        <strong>Risposta a:</strong> no-reply@projectmywellness.com<br/><br/>
        
        <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb;">
          <h2 style="color: #26847F; margin-top: 0;">📊 Report Settimanale</h2>
          <p><strong>Ciao {user_name},</strong></p>
          <p>Ecco il riassunto dei tuoi progressi questa settimana! 💪</p>
          
          <div style="background: #e9f6f5; border: 2px solid #26847F; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <h3 style="color: #26847F; margin: 0 0 10px 0;">📉 Variazione Peso</h3>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #10b981;">{weight_change} kg</p>
            <p style="margin: 10px 0 0 0; color: #666;">Peso attuale: {current_weight} kg · Target: {target_weight} kg</p>
          </div>
          
          <h3>📈 Le tue statistiche</h3>
          <ul>
            <li>🍽️ Calorie medie: {avg_calories} kcal/giorno</li>
            <li>💪 Allenamenti completati: {workouts_completed}/{planned_workouts}</li>
            <li>✓ Aderenza al piano: {adherence}%</li>
            <li>🎯 Progresso obiettivo: {progress}%</li>
          </ul>
          
          <p><strong>Continua così! La costanza è la chiave del successo 🌟</strong></p>
        </div>
      `
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Anteprima Email: {previewEmail?.name}
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

              {previewEmail.subject && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Oggetto Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{previewEmail.subject}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-semibold text-gray-700">Trigger Automatico</Label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-blue-50 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-900">{previewEmail.trigger}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Backend Function</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-900">
                  {previewEmail.function}
                </div>
              </div>

              {previewEmail.preview && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Contenuto Email (Anteprima)</Label>
                  <div
                    className="mt-1 p-4 border rounded-lg bg-gray-50 overflow-auto"
                    style={{ maxHeight: '400px' }} // Added max-height for better preview experience
                    dangerouslySetInnerHTML={{ __html: previewEmail.preview }}
                  />
                </div>
              )}


              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-900">
                  ℹ️ <strong>Nota:</strong> Per modificare il contenuto di questa email, edita la backend function{' '}
                  <code className="bg-amber-100 px-1 py-0.5 rounded">{previewEmail.function}</code> nella sezione Code del dashboard.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setShowEmailPreview(false)}
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                >
                  Chiudi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
