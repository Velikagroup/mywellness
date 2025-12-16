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
import { Checkbox } from '@/components/ui/checkbox';
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
  Globe,
  Filter,
  Activity,
  Info
} from 'lucide-react';
import EmailLogsPanel from '@/components/admin/EmailLogsPanel';

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
  const [selectedLanguage, setSelectedLanguage] = useState('it');
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
    filters: {}, // Changed from 'segment: 'all'' to a filters object
    scheduled_for: ''
  });
  const [broadcasts, setBroadcasts] = useState([]);
  const [editingBroadcast, setEditingBroadcast] = useState(null);
  const [estimatedRecipients, setEstimatedRecipients] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  
  // Test Email states
  const [testSelectedTemplate, setTestSelectedTemplate] = useState('');
  const [testSelectedLanguage, setTestSelectedLanguage] = useState('it');
  const [testTargetEmail, setTestTargetEmail] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLogs, setTestLogs] = useState([]);
  const [testEmailLog, setTestEmailLog] = useState(null);
  const [testEmailPreview, setTestEmailPreview] = useState(null);
  const [isLoadingTestPreview, setIsLoadingTestPreview] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

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
      if (currentUser.role !== 'admin' && currentUser.custom_role !== 'customer_support') {
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

    const targetEmail = testEmailAddress.trim() || user?.email;
    
    if (!targetEmail) {
      alert('❌ Inserisci un indirizzo email per il test.');
      return;
    }

    if (!confirm(`Inviare email di test a ${targetEmail}?`)) {
      return;
    }

    try {
      const template = previewEmail.template;
      const fromEmail = template.from_email || 'info@projectmywellness.com';
      const replyToEmail = template.reply_to_email || 'no-reply@projectmywellness.com';
      const appUrl = 'https://projectmywellness.com';
      
      const variables = {
        user_name: user?.full_name || 'Mario Rossi',
        user_email: targetEmail,
        app_url: appUrl
      };

      const replaceVars = (text, vars) => {
        if (!text) return '';
        let result = text;
        Object.keys(vars).forEach(key => {
          const regex = new RegExp(`\\{${key}\\}`, 'g');
          result = result.replace(regex, vars[key] || '');
        });
        return result;
      };

      const replacedSubject = replaceVars(template.subject || 'Email di Test', variables);
      
      // Check if this is a cart abandoned email type
      const isCartAbandonedEmail = ['cart_checkout_abandoned', 'cart_abandoned_24h', 'cart_abandoned_72h'].includes(previewEmail.id);
      const isQuizCompletedEmail = previewEmail.id === 'quiz_completed_abandoned';
      
      let htmlBody;
      
      if (isCartAbandonedEmail) {
        // Generate full cart abandoned email HTML
        htmlBody = generateCartAbandonedTestEmail(template, variables, appUrl, previewEmail.id);
      } else if (isQuizCompletedEmail) {
        // Generate quiz completed abandoned email HTML
        htmlBody = generateQuizCompletedTestEmail(template, variables, appUrl);
      } else {
        // Standard email generation
        const replacedMainContent = replaceVars(template.main_content || '', variables);
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

        htmlBody = `<!DOCTYPE html>
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
      }

      await base44.functions.invoke('sendTestEmailDirect', {
        to: targetEmail,
        from_email: fromEmail,
        from_name: 'MyWellness',
        reply_to: replyToEmail,
        subject: `[TEST] ${replacedSubject}`,
        html: htmlBody
      });

      alert(`✅ Email di test inviata con successo a ${targetEmail}!`);
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('❌ Errore durante l\'invio dell\'email di test: ' + error.message);
    }
  };

  // Generate quiz completed abandoned email HTML for testing (matches sendQuizReminderNoPlan)
  const generateQuizCompletedTestEmail = (template, variables, appUrl) => {
    const userName = variables.user_name || 'Utente';
    const ctaText = template?.call_to_action_text || 'Attiva Piano Base - €19/mese';
    const ctaUrl = (template?.call_to_action_url || `${appUrl}/pricing`).replace('{app_url}', appUrl);
    const footerText = template?.footer_text || 'Il tuo piano personalizzato ti aspetta';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
@media only screen and (max-width: 600px) {
.container { width: 100% !important; border-radius: 0 !important; }
.outer-wrapper { padding: 0 !important; }
.feature-table td { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
}
</style>
</head>
<body style="margin: 0; padding: 0;">
<table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
<tr>
<td align="center">
<table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
<tr>
<td style="background: white; padding: 40px 30px 10px 30px;">
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
</td>
</tr>
<tr>
<td style="padding: 20px 30px 40px 30px;">
<!-- Hero Card -->
<div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%); border: 2px solid #26847F; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 25px;">
<p style="font-size: 48px; margin: 0 0 10px 0;">🎯</p>
<h1 style="color: #26847F; margin: 0 0 10px 0; font-size: 24px;">Quiz Completato!</h1>
<p style="color: #374151; margin: 0; font-size: 16px;">Il tuo piano personalizzato è pronto</p>
</div>

<p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Ciao ${userName},</p>

<p style="color: #374151; line-height: 1.6; font-size: 16px; margin: 0 0 25px 0;">
Complimenti per aver completato il quiz! 🎉 Abbiamo analizzato le tue risposte e calcolato il tuo profilo metabolico completo.
</p>

<!-- Stats Cards -->
<h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">📊 Cosa abbiamo calcolato per te:</h3>
<table class="feature-table" width="100%" cellpadding="0" cellspacing="8" border="0" style="table-layout: fixed; margin-bottom: 25px;">
<tr>
<td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
<p style="margin: 0; font-size: 28px;">🔥</p>
<p style="font-size: 16px; font-weight: bold; color: #374151; margin: 8px 0 0 0;">Fabbisogno Calorico</p>
</td>
<td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
<p style="margin: 0; font-size: 28px;">⚖️</p>
<p style="font-size: 16px; font-weight: bold; color: #374151; margin: 8px 0 0 0;">Macro Ottimali</p>
</td>
</tr>
<tr>
<td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
<p style="margin: 0; font-size: 28px;">🍽️</p>
<p style="font-size: 16px; font-weight: bold; color: #374151; margin: 8px 0 0 0;">Ricette Personalizzate</p>
</td>
<td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
<p style="margin: 0; font-size: 28px;">📈</p>
<p style="font-size: 16px; font-weight: bold; color: #374151; margin: 8px 0 0 0;">Proiezione Obiettivo</p>
</td>
</tr>
</table>

<!-- Plan Features -->
<div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
<h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; text-align: center;">💡 Piano Base - Solo €19/mese</h3>
<table width="100%" cellpadding="0" cellspacing="8" border="0">
<tr>
<td width="50%" style="color: #92400e; font-size: 16px;"><span style="color: #10b981; font-weight: bold;">✓</span> Piano nutrizionale AI</td>
<td width="50%" style="color: #92400e; font-size: 16px;"><span style="color: #10b981; font-weight: bold;">✓</span> Ricette settimanali</td>
</tr>
<tr>
<td style="color: #92400e; font-size: 16px;"><span style="color: #10b981; font-weight: bold;">✓</span> Lista della spesa</td>
<td style="color: #92400e; font-size: 16px;"><span style="color: #10b981; font-weight: bold;">✓</span> Dashboard progressi</td>
</tr>
</table>
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 15px 0;">
<tr>
<td align="center">
<a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">
${ctaText}
</a>
</td>
</tr>
</table>

<p style="color: #26847F; text-align: center; font-size: 16px; margin: 15px 0 0 0;">
${footerText}
</p>
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
  };

  // Generate full cart abandoned email HTML for testing
  const generateCartAbandonedTestEmail = (template, variables, appUrl, emailType) => {
    const userName = variables.user_name || 'Utente';
    const greeting = (template.greeting || 'Ciao {user_name},').replace('{user_name}', userName);
    const introText = template.intro_text || 'Hai fatto il primo passo verso la versione migliore di te stesso...';
    const secondParagraph = template.second_paragraph || 'Ogni giorno che passa è un giorno in meno verso i tuoi obiettivi.';

    const showFeatures = template.show_features_section !== false;
    const featuresTitle = template.features_section_title || '❌ Ecco cosa ti stai perdendo:';
    const feature1Emoji = template.feature_1_emoji || '🍽️';
    const feature1Title = template.feature_1_title || 'Piano Nutrizionale AI';
    const feature1Subtitle = template.feature_1_subtitle || 'Pasti personalizzati ogni giorno';
    const feature2Emoji = template.feature_2_emoji || '📊';
    const feature2Title = template.feature_2_title || 'Dashboard Scientifica';
    const feature2Subtitle = template.feature_2_subtitle || 'Monitora ogni progresso';
    const feature3Emoji = template.feature_3_emoji || '📸';
    const feature3Title = template.feature_3_title || 'Analisi Foto AI';
    const feature3Subtitle = template.feature_3_subtitle || 'Vedi la trasformazione';
    const feature4Emoji = template.feature_4_emoji || '🛒';
    const feature4Title = template.feature_4_title || 'Lista Spesa Smart';
    const feature4Subtitle = template.feature_4_subtitle || 'Mai più dubbi al supermercato';

    const closingText = template.closing_text || 'Il momento perfetto non esiste, ma il momento giusto è ADESSO.';

    const showUrgency = template.show_urgency_box !== false;
    const urgencyTitle = template.urgency_title || '⏰ Il momento è ADESSO';
    const urgencySubtitle = template.urgency_subtitle || 'Non rimandare a domani quello che può cambiarti la vita oggi.';

    const showTrustBadges = template.show_trust_badges !== false;
    const ctaText = template.call_to_action_text || '🚀 Riprendi il Tuo Percorso Ora';
    const ctaUrl = (template.call_to_action_url || `${appUrl}/TrialSetup`).replace('{app_url}', appUrl);
    const footerQuote = template.footer_quote || '"Il miglior momento per iniziare era ieri. Il secondo miglior momento è adesso."';

    // Determine colors based on email type
    let boxBg, boxBorder, boxTextColor, boxSubtitleColor, buttonGradient;
    if (emailType === 'cart_abandoned_72h') {
      boxBg = '#fef2f2';
      boxBorder = '#fecaca';
      boxTextColor = '#991b1b';
      boxSubtitleColor = '#b91c1c';
      buttonGradient = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
    } else if (emailType === 'cart_abandoned_24h') {
      boxBg = '#fffbeb';
      boxBorder = '#fcd34d';
      boxTextColor = '#92400e';
      boxSubtitleColor = '#b45309';
      buttonGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else {
      boxBg = '#fef2f2';
      boxBorder = '#fecaca';
      boxTextColor = '#991b1b';
      boxSubtitleColor = '#b91c1c';
      buttonGradient = 'linear-gradient(135deg, #26847F 0%, #1f6b66 100%)';
    }

    const featuresHtml = showFeatures ? `
      <h3 style="color: ${boxTextColor}; margin: 25px 0 15px 0; font-size: 18px;">${featuresTitle}</h3>
      <table width="100%" cellpadding="0" cellspacing="6" border="0" style="table-layout: fixed; margin-bottom: 25px;">
        <tr>
          <td width="48%" style="background: ${boxBg}; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid ${boxBorder}; vertical-align: top;">
            <p style="margin: 0; font-size: 28px;">${feature1Emoji}</p>
            <p style="font-size: 13px; font-weight: bold; color: ${boxTextColor}; margin: 8px 0 4px 0;">${feature1Title}</p>
            <p style="font-size: 11px; color: ${boxSubtitleColor}; margin: 0;">${feature1Subtitle}</p>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background: ${boxBg}; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid ${boxBorder}; vertical-align: top;">
            <p style="margin: 0; font-size: 28px;">${feature2Emoji}</p>
            <p style="font-size: 13px; font-weight: bold; color: ${boxTextColor}; margin: 8px 0 4px 0;">${feature2Title}</p>
            <p style="font-size: 11px; color: ${boxSubtitleColor}; margin: 0;">${feature2Subtitle}</p>
          </td>
        </tr>
        <tr><td colspan="3" style="height: 6px;"></td></tr>
        <tr>
          <td width="48%" style="background: ${boxBg}; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid ${boxBorder}; vertical-align: top;">
            <p style="margin: 0; font-size: 28px;">${feature3Emoji}</p>
            <p style="font-size: 13px; font-weight: bold; color: ${boxTextColor}; margin: 8px 0 4px 0;">${feature3Title}</p>
            <p style="font-size: 11px; color: ${boxSubtitleColor}; margin: 0;">${feature3Subtitle}</p>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background: ${boxBg}; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid ${boxBorder}; vertical-align: top;">
            <p style="margin: 0; font-size: 28px;">${feature4Emoji}</p>
            <p style="font-size: 13px; font-weight: bold; color: ${boxTextColor}; margin: 8px 0 4px 0;">${feature4Title}</p>
            <p style="font-size: 11px; color: ${boxSubtitleColor}; margin: 0;">${feature4Subtitle}</p>
          </td>
        </tr>
      </table>
    ` : '';

    const urgencyHtml = showUrgency ? `
      <div style="background: linear-gradient(135deg, ${boxBg} 0%, ${boxBorder} 100%); border: 2px solid ${boxTextColor}; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <p style="color: ${boxTextColor}; font-size: 18px; margin: 0; font-weight: bold;">${urgencyTitle}</p>
        <p style="color: ${boxSubtitleColor}; font-size: 14px; margin: 10px 0 0 0; line-height: 1.5;">${urgencySubtitle}</p>
      </div>
    ` : '';

    const trustBadgesHtml = showTrustBadges ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="15" border="0">
              <tr>
                <td style="text-align: center;"><p style="font-size: 20px; margin: 0;">🔒</p><p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">Pagamento<br>Sicuro</p></td>
                <td style="text-align: center;"><p style="font-size: 20px; margin: 0;">✅</p><p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">Garanzia<br>100%</p></td>
                <td style="text-align: center;"><p style="font-size: 20px; margin: 0;">🚀</p><p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">Attivazione<br>Istantanea</p></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    ` : '';

    return `<!DOCTYPE html>
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
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
</td>
</tr>
<tr>
<td class="content-cell">
<p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">${greeting}</p>
<p style="color: #374151; line-height: 1.7; font-size: 16px; margin: 0 0 20px 0;">${introText}</p>
<p style="color: #374151; line-height: 1.7; font-size: 16px; margin: 0 0 20px 0;">${secondParagraph}</p>
${featuresHtml}
<p style="color: #374151; line-height: 1.7; font-size: 16px; margin: 0 0 25px 0;">${closingText}</p>
${urgencyHtml}
${trustBadgesHtml}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 15px 0;">
<tr>
<td align="center">
<a href="${ctaUrl}" style="display: inline-block; background: ${buttonGradient}; color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">${ctaText}</a>
</td>
</tr>
</table>
<p style="color: #6b7280; text-align: center; font-size: 13px; margin: 15px 0 0 0; font-style: italic;">${footerQuote}</p>
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
      filters: {}, // Initialize with empty filters
      scheduled_for: ''
    });
    setEditingBroadcast(null);
    setEstimatedRecipients(null); // Reset estimated recipients
    setShowBroadcastDialog(true);
  };

  const handleEditBroadcast = (broadcast) => {
    setBroadcastData({
      ...broadcast,
      filters: broadcast.filters || {} // Ensure filters is an object
    });
    setEditingBroadcast(broadcast);
    setEstimatedRecipients(null); // Reset estimated recipients
    setShowBroadcastDialog(true);
  };

  const handleFilterChange = (filterKey, value) => {
    setBroadcastData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterKey]: value
      }
    }));
    setEstimatedRecipients(null); // Recalculate recipients after filter change
  };

  const handleCheckboxFilterChange = (filterKey, checked) => {
    setBroadcastData(prev => {
      const newFilters = { ...prev.filters };
      if (checked) {
        newFilters[filterKey] = true;
      } else {
        delete newFilters[filterKey]; // Remove filter if unchecked
      }
      return {
        ...prev,
        filters: newFilters
      };
    });
    setEstimatedRecipients(null); // Recalculate recipients after filter change
  };

  const toggleLanguage = (lang) => {
    setBroadcastData(prev => {
      const currentLangs = prev.filters.languages || [];
      const newLangs = currentLangs.includes(lang)
        ? currentLangs.filter(l => l !== lang)
        : [...currentLangs, lang];
      
      const newFilters = { ...prev.filters };
      if (newLangs.length > 0) {
        newFilters.languages = newLangs;
      } else {
        delete newFilters.languages; // Remove filter if no languages selected
      }
      
      return {
        ...prev,
        filters: newFilters
      };
    });
    setEstimatedRecipients(null); // Recalculate recipients after filter change
  };

  const toggleSubscriptionStatus = (status) => {
    setBroadcastData(prev => {
      const currentStatuses = prev.filters.subscription_status || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status];
      
      const newFilters = { ...prev.filters };
      if (newStatuses.length > 0) {
        newFilters.subscription_status = newStatuses;
      } else {
        delete newFilters.subscription_status; // Remove filter if no status selected
      }

      return {
        ...prev,
        filters: newFilters
      };
    });
    setEstimatedRecipients(null); // Recalculate recipients after filter change
  };

  const toggleSubscriptionPlan = (plan) => {
    setBroadcastData(prev => {
      const currentPlans = prev.filters.subscription_plan || [];
      const newPlans = currentPlans.includes(plan)
        ? currentPlans.filter(p => p !== plan)
        : [...currentPlans, plan];
      
      const newFilters = { ...prev.filters };
      if (newPlans.length > 0) {
        newFilters.subscription_plan = newPlans;
      } else {
        delete newFilters.subscription_plan; // Remove filter if no plans selected
      }

      return {
        ...prev,
        filters: newFilters
      };
    });
    setEstimatedRecipients(null); // Recalculate recipients after filter change
  };

  const calculateEstimatedRecipients = async () => {
    try {
      const response = await base44.functions.invoke('calculateBroadcastRecipients', {
        filters: broadcastData.filters
      });
      setEstimatedRecipients(response.count);
    } catch (error) {
      console.error('Error calculating recipients:', error);
      alert('Errore nel calcolo destinatari');
    }
  };

  const getFiltersSummary = (filters) => {
    const parts = [];
    const activeFilters = Object.keys(filters).filter(key => {
      const value = filters[key];
      return value !== undefined && value !== null && value !== '' &&
             !(Array.isArray(value) && value.length === 0);
    });

    if (activeFilters.length === 0) {
      return 'Tutti gli utenti';
    }
    
    if (filters.subscription_status?.length > 0) {
      const labels = {
        trial: 'Trial',
        active: 'Attivi',
        expired: 'Scaduti',
        cancelled: 'Cancellati'
      };
      parts.push(`Stato: ${filters.subscription_status.map(s => labels[s] || s).join(', ')}`);
    }
    
    if (filters.subscription_plan?.length > 0) {
      const labels = { base: 'Base', pro: 'Pro', premium: 'Premium' };
      parts.push(`Piano: ${filters.subscription_plan.map(p => labels[p] || p).join(', ')}`);
    }
    
    if (filters.languages?.length > 0) {
      const flags = { it: '🇮🇹', en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', pt: '🇵🇹' };
      parts.push(`Lingua: ${filters.languages.map(l => flags[l] || l.toUpperCase()).join(' ')}`);
    }
    
    if (filters.inactive_days) parts.push(`Inattivi da ${filters.inactive_days} giorni`);
    if (filters.quiz_abandoned) parts.push('Quiz Abbandonato');
    if (filters.trial_setup_abandoned) parts.push('Trial Setup Abbandonato');
    if (filters.pricing_visited) parts.push('Pricing Visitato');
    if (filters.checkout_abandoned) parts.push('Checkout Abbandonato');
    if (filters.trial_expired_no_conversion) parts.push('Trial Scaduto (no conv.)');
    if (filters.purchased_landing_offer) parts.push('Landing Offer Acquistata');

    if (filters.renewal_days) parts.push(`Rinnovo tra ${filters.renewal_days} giorni`);
    if (filters.milestone_days) parts.push(`Milestone: ${filters.milestone_days} giorni`);
    
    return parts.join(' • ');
  };

  const handleSaveBroadcast = async (action) => {
    // Validazione migliorata
    const name = broadcastData.name?.trim() || '';
    const subject = broadcastData.subject?.trim() || '';
    const mainContent = broadcastData.main_content?.trim() || '';
    
    if (!name) {
      alert('❌ Inserisci il nome della campagna');
      return;
    }
    
    if (!subject) {
      alert('❌ Inserisci l\'oggetto dell\'email');
      return;
    }
    
    if (!mainContent) {
      alert('❌ Inserisci il contenuto principale dell\'email');
      return;
    }

    try {
      const dataToSave = {
        name: name,
        subject: subject,
        greeting: broadcastData.greeting || 'Ciao {user_name},',
        main_content: mainContent,
        call_to_action_text: broadcastData.call_to_action_text || '',
        call_to_action_url: broadcastData.call_to_action_url || '',
        footer_text: broadcastData.footer_text || 'Il tuo percorso verso il benessere',
        from_email: broadcastData.from_email || 'info@projectmywellness.com',
        reply_to_email: broadcastData.reply_to_email || 'no-reply@projectmywellness.com',
        filters: broadcastData.filters || {},
        status: action === 'draft' ? 'draft' : (action === 'schedule' ? 'scheduled' : 'draft'),
        scheduled_for: broadcastData.scheduled_for || undefined
      };

      if (action === 'send_now') {
        const activeFilters = Object.keys(dataToSave.filters).filter(k => {
          const val = dataToSave.filters[k];
          return val !== undefined && val !== false && (!Array.isArray(val) || val.length > 0);
        }).length;

        const confirmMsg = activeFilters > 0 
          ? `Sei sicuro di voler inviare questa email?\n\nFiltri attivi: ${activeFilters}\n\nL'email verrà inviata a tutti gli utenti che corrispondono ai filtri selezionati.`
          : `Sei sicuro di voler inviare questa email a TUTTI gli utenti (${userCount})?`;

        if (!confirm(confirmMsg)) {
          return;
        }

        const response = await base44.functions.invoke('sendBroadcastNow', {
          broadcast_data: dataToSave
        });

        alert(`✅ Email inviata con successo!`);
        setShowBroadcastDialog(false);
        await loadBroadcasts();
        
      } else if (action === 'schedule') {
        if (!broadcastData.scheduled_for) {
          alert('❌ Seleziona data e ora per la programmazione');
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
      alert('❌ Errore durante l\'eliminazione: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  const languageOptions = [
    { code: 'it', flag: '🇮🇹', name: 'Italiano' },
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'pt', flag: '🇵🇹', name: 'Português' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'fr', flag: '🇫🇷', name: 'Français' }
  ];

  const emailCategories = {
    critical: {
        name: 'Critical',
        icon: AlertCircle,
        color: 'red',
        emails: [
          { id: `standard_free_welcome_${selectedLanguage}`, name: 'Benvenuto Standard Free', trigger: 'Registrazione piano gratuito', function: 'sendStandardFreeWelcome' },
          { id: `base_welcome_${selectedLanguage}`, name: 'Benvenuto Piano Base', trigger: 'Acquisto piano Base €19/mese', function: 'sendPlanWelcome' },
          { id: `pro_welcome_${selectedLanguage}`, name: 'Benvenuto Piano Pro', trigger: 'Acquisto piano Pro €29/mese', function: 'sendPlanWelcome' },
          { id: `premium_welcome_${selectedLanguage}`, name: 'Benvenuto Piano Premium', trigger: 'Acquisto piano Premium €39/mese', function: 'sendPlanWelcome' },
          { id: `landing_new_user_${selectedLanguage}`, name: 'Landing Offer - Nuovo Utente', trigger: 'Acquisto Landing Offer (nuovo utente)', function: 'stripeCreateOneTimePayment' },
          { id: `landing_existing_user_${selectedLanguage}`, name: 'Landing Offer - Utente Esistente', trigger: 'Acquisto Landing Offer (utente esistente)', function: 'stripeCreateOneTimePayment' },
          { id: `renewal_confirmation_${selectedLanguage}`, name: 'Conferma Rinnovo Automatico', trigger: 'Rinnovo automatico abbonamento (Stripe webhook)', function: 'sendRenewalConfirmation' }
        ]
      },
    renewal: {
      name: 'Renewal',
      icon: Clock,
      color: 'orange',
      emails: [
        { id: `renewal_7_days_${selectedLanguage}`, name: 'Reminder Rinnovo - 7 Giorni', trigger: 'Cron (7 giorni prima scadenza, con cancellazione)', function: 'sendRenewalReminders' },
        { id: `renewal_3_days_${selectedLanguage}`, name: 'Reminder Rinnovo - 3 Giorni', trigger: 'Cron (3 giorni prima scadenza, con cancellazione)', function: 'sendRenewalReminders' },
        { id: `renewal_1_day_${selectedLanguage}`, name: 'Reminder Rinnovo - 1 Giorno', trigger: 'Cron (1 giorno prima scadenza, con cancellazione)', function: 'sendRenewalReminders' }
      ]
    },
    winback: {
      name: 'Win-Back',
      icon: Heart,
      color: 'pink',
      emails: [
        { id: `subscription_expired_${selectedLanguage}`, name: 'Abbonamento Scaduto', trigger: 'Cron - Subscription status = expired', function: 'sendSubscriptionExpired' },
        { id: `standard_upgrade_invite_${selectedLanguage}`, name: 'Invito Upgrade da Standard', trigger: 'Cron - Utente Standard Free da 7+ giorni', function: 'sendStandardUpgradeInvite' },
        { id: `standard_limits_reached_${selectedLanguage}`, name: 'Limiti Piano Standard Raggiunti', trigger: 'Utente Standard raggiunge limiti funzionalità', function: 'sendStandardLimitsReached' }
      ]
    },
    engagement: {
      name: 'Engagement',
      icon: TrendingUp,
      color: 'green',
      emails: [
        { id: `goal_weight_achieved_${selectedLanguage}`, name: 'Obiettivo Peso Raggiunto', trigger: 'current_weight raggiunge target_weight', function: 'sendGoalWeightAchieved' },
        { id: `milestone_30_days_${selectedLanguage}`, name: 'Milestone - 30 Giorni', trigger: 'Cron - 30 giorni dall\'iscrizione', function: 'sendMilestones' },
        { id: `milestone_60_days_${selectedLanguage}`, name: 'Milestone - 60 Giorni', trigger: 'Cron - 60 giorni dall\'iscrizione', function: 'sendMilestones' },
        { id: `milestone_90_days_${selectedLanguage}`, name: 'Milestone - 90 Giorni (+ Reward)', trigger: 'Cron - 90 giorni dall\'iscrizione', function: 'sendMilestones' },
        { id: `workout_streak_7_days_${selectedLanguage}`, name: 'Streak Allenamenti 7 Giorni', trigger: '7 workout consecutivi', function: 'sendWorkoutStreak7Days' },
        { id: `no_workout_week_${selectedLanguage}`, name: 'Nessun Workout Questa Settimana', trigger: 'Cron Lunedì - 0 workout settimana', function: 'sendNoWorkoutWeek' }
      ]
    },
    motivational: {
      name: 'Motivational',
      icon: Zap,
      color: 'purple',
      emails: [
        { id: `inactive_user_7_days_${selectedLanguage}`, name: 'Utente Inattivo 7 Giorni', trigger: 'Cron - Nessun login per 7 giorni', function: 'sendInactiveUserReminder' },
        { id: `feedback_request_${selectedLanguage}`, name: 'Richiesta Feedback', trigger: 'Cron - 14 giorni di utilizzo', function: 'sendFeedbackRequest' }
      ]
    },
    technical: {
      name: 'Technical',
      icon: Shield,
      color: 'blue',
      emails: [
        { id: `password_reset_confirmed_${selectedLanguage}`, name: 'Password Reset Completato', trigger: 'Reset password completato', function: 'sendPasswordResetConfirmed' },
        { id: `plan_upgrade_${selectedLanguage}`, name: 'Upgrade Piano', trigger: 'Cambio piano a tier superiore', function: 'sendPlanChange' },
        { id: `plan_downgrade_${selectedLanguage}`, name: 'Downgrade Piano', trigger: 'Cambio piano a tier inferiore', function: 'sendPlanChange' },
        { id: `cancellation_confirmation_${selectedLanguage}`, name: 'Conferma Cancellazione', trigger: 'Utente cancella abbonamento', function: 'sendCancellationConfirmation' }
      ]
    },
    reporting: {
      name: 'Reporting',
      icon: BarChart3,
      color: 'indigo',
      emails: [
        { id: `weekly_report_${selectedLanguage}`, name: 'Report Settimanale Progressi', trigger: 'Cron settimanale (ogni Lunedì)', function: 'sendWeeklyReport' }
      ]
    },
    abandonment: {
        name: 'Abbandono',
        icon: ShoppingCart,
        color: 'amber',
        emails: [
          { id: `quiz_completed_abandoned_${selectedLanguage}`, name: 'Promo Piano Base - Quiz Completato', trigger: 'Cron - 24h dopo quiz completato senza acquisto', function: 'sendQuizReminderNoPlan' },
          { id: `cart_checkout_abandoned_${selectedLanguage}`, name: 'Checkout Abbandonato (30 min)', trigger: 'Cron - 30 min dopo inizio checkout', function: 'sendCartCheckoutAbandoned', hasFullEditor: true },
          { id: `cart_abandoned_24h_${selectedLanguage}`, name: 'Checkout Abbandonato (24h)', trigger: 'Cron - 24h dopo inizio checkout', function: 'sendCartAbandoned24h', hasFullEditor: true },
          { id: `cart_abandoned_72h_${selectedLanguage}`, name: 'Checkout Abbandonato - ULTIMA (72h)', trigger: 'Cron - 72h dopo inizio checkout (ultima email)', function: 'sendCartAbandoned72h', hasFullEditor: true }
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
          <Card className="water-glass-effect border-gray-200/30">
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

          <Card className="water-glass-effect border-gray-200/30">
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

          <Card className="water-glass-effect border-gray-200/30">
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

          <Card className="water-glass-effect border-gray-200/30">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Email di Sistema
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Broadcast Campagne
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Test Email
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Log Invii
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Automatizzate per Categoria
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="bg-transparent border-none text-sm font-semibold text-blue-900 focus:outline-none cursor-pointer"
                      >
                        {languageOptions.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Nuova Campagna Broadcast
              </Button>
            </div>

            {/* Bozze */}
            {draftBroadcasts.length > 0 && (
              <Card className="water-glass-effect border-gray-200/30">
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
                          <Badge className="bg-gray-100 text-gray-700">{getFiltersSummary(broadcast.filters)}</Badge>
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
              <Card className="water-glass-effect border-gray-200/30">
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
                            <Badge className="bg-blue-100 text-blue-700">{getFiltersSummary(broadcast.filters)}</Badge>
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
              <Card className="water-glass-effect border-gray-200/30">
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
              <Card className="water-glass-effect border-gray-200/30">
                <CardContent className="p-12 text-center">
                  <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna campagna broadcast ancora</h3>
                  <p className="text-gray-600 mb-6">Crea la tua prima campagna email per iniziare</p>
                  <Button
                    onClick={handleNewBroadcast}
                    className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Crea Prima Campagna
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#26847F]" />
                  🧪 Test Email Localizzate
                </CardTitle>
                <p className="text-sm text-gray-600">Testa tutte le email in tutte le lingue</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Template Email</Label>
                  <select
                    value={testSelectedTemplate}
                    onChange={(e) => setTestSelectedTemplate(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="">Seleziona template...</option>
                    
                    <optgroup label="🚨 Critical">
                      <option value="standard_free_welcome">Standard Free - Benvenuto</option>
                      <option value="base_welcome">Base - Benvenuto</option>
                      <option value="pro_welcome">Pro - Benvenuto</option>
                      <option value="premium_welcome">Premium - Benvenuto</option>
                      <option value="renewal_confirmation">Conferma Rinnovo</option>
                      <option value="landing_new_user">Landing Offer - Nuovo Utente</option>
                      <option value="landing_existing_user">Landing Offer - Utente Esistente</option>
                    </optgroup>
                    
                    <optgroup label="⏰ Renewal">
                      <option value="renewal_7_days">Reminder Rinnovo - 7 Giorni</option>
                      <option value="renewal_3_days">Reminder Rinnovo - 3 Giorni</option>
                      <option value="renewal_1_day">Reminder Rinnovo - 1 Giorno</option>
                    </optgroup>
                    
                    <optgroup label="💖 Win-Back">
                      <option value="subscription_expired">Abbonamento Scaduto</option>
                      <option value="standard_upgrade_invite">Invito Upgrade da Standard</option>
                      <option value="standard_limits_reached">Limiti Piano Standard</option>
                    </optgroup>
                    
                    <optgroup label="📈 Engagement">
                      <option value="goal_weight_achieved">Obiettivo Peso Raggiunto</option>
                      <option value="milestone_30_days">Milestone 30 Giorni</option>
                      <option value="milestone_60_days">Milestone 60 Giorni</option>
                      <option value="milestone_90_days">Milestone 90 Giorni + Reward</option>
                      <option value="workout_streak_7_days">Streak Allenamenti 7 Giorni</option>
                      <option value="no_workout_week">Nessun Workout Settimana</option>
                    </optgroup>
                    
                    <optgroup label="⚡ Motivational">
                      <option value="inactive_user_7_days">Utente Inattivo 7 Giorni</option>
                      <option value="feedback_request">Richiesta Feedback</option>
                    </optgroup>
                    
                    <optgroup label="🛡️ Technical">
                      <option value="password_reset_confirmed">Password Reset Completato</option>
                      <option value="plan_upgrade">Upgrade Piano</option>
                      <option value="plan_downgrade">Downgrade Piano</option>
                      <option value="cancellation_confirmation">Conferma Cancellazione</option>
                    </optgroup>
                    
                    <optgroup label="📊 Reporting">
                      <option value="weekly_report">Report Settimanale</option>
                    </optgroup>
                    
                    <optgroup label="🛒 Abandonment">
                      <option value="quiz_completed_abandoned">Quiz Completato - Promo Base</option>
                      <option value="cart_checkout_abandoned">Checkout Abbandonato 30min</option>
                      <option value="cart_abandoned_24h">Checkout Abbandonato 24h</option>
                      <option value="cart_abandoned_72h">Checkout Abbandonato 72h - ULTIMA</option>
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Lingua</Label>
                  <select
                    value={testSelectedLanguage}
                    onChange={(e) => setTestSelectedLanguage(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="it">Italiano 🇮🇹</option>
                    <option value="en">English 🇬🇧</option>
                    <option value="es">Español 🇪🇸</option>
                    <option value="pt">Português 🇵🇹</option>
                    <option value="de">Deutsch 🇩🇪</option>
                    <option value="fr">Français 🇫🇷</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Email Destinatario</Label>
                  <Input
                    type="email"
                    value={testTargetEmail}
                    onChange={(e) => setTestTargetEmail(e.target.value)}
                    placeholder={user?.email || "tua@email.com"}
                  />
                </div>

                {testSelectedTemplate && testSelectedLanguage && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Template finale:</strong> {testSelectedTemplate}_{testSelectedLanguage}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      if (!testSelectedTemplate || !testTargetEmail || !testSelectedLanguage) {
                        setTestResult({ success: false, message: 'Seleziona template, lingua e inserisci email' });
                        return;
                      }

                      setIsSendingTest(true);
                      setTestResult(null);
                      setTestLogs([]);
                      setTestEmailLog(null);

                      const addLog = (message, type = 'info') => {
                        setTestLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
                      };

                      try {
                        const templateId = `${testSelectedTemplate}_${testSelectedLanguage}`;
                        addLog(`🔍 Verifica template: ${templateId}`, 'info');
                        
                        const templates = await base44.entities.EmailTemplate.filter({ 
                          template_id: templateId,
                          is_active: true 
                        });
                        
                        if (templates.length === 0) {
                          addLog(`❌ Template ${templateId} NON TROVATO nel database`, 'error');
                          setTestResult({
                            success: false,
                            message: `Template ${templateId} non esiste o non è attivo`
                          });
                          setIsSendingTest(false);
                          return;
                        }
                        
                        addLog(`✅ Template trovato: ${templates[0].name}`, 'success');
                        addLog(`📧 Invio email a ${testTargetEmail}...`, 'info');
                        
                        const response = await base44.functions.invoke('testLocalizedEmail', {
                          templateId: templateId,
                          testEmail: testTargetEmail,
                          language: testSelectedLanguage
                        });

                        addLog(`📬 Risposta ricevuta dalla funzione`, 'info');

                        if (response.data?.success) {
                          addLog(`✅ Email inviata con successo!`, 'success');
                          
                          addLog(`🔍 Verifica nel log email...`, 'info');
                          await new Promise(resolve => setTimeout(resolve, 2000));
                          
                          const emailLogs = await base44.entities.EmailLog.filter({ 
                            user_email: testTargetEmail 
                          }, '-created_date', 1);
                          
                          if (emailLogs.length > 0) {
                            const latestLog = emailLogs[0];
                            setTestEmailLog(latestLog);
                            addLog(`✅ Email registrata nel log (ID: ${latestLog.id})`, 'success');
                            addLog(`📊 Status: ${latestLog.status}`, latestLog.status === 'sent' ? 'success' : 'error');
                          } else {
                            addLog(`⚠️ Nessun log trovato`, 'warning');
                          }
                          
                          setTestResult({
                            success: true,
                            message: `✅ Email inviata a ${testTargetEmail}`
                          });
                        } else {
                          addLog(`❌ Invio fallito: ${response.data?.error}`, 'error');
                          setTestResult({
                            success: false,
                            message: response.data?.error || 'Errore sconosciuto'
                          });
                        }
                      } catch (error) {
                        addLog(`❌ Errore: ${error.message}`, 'error');
                        setTestResult({ success: false, message: error.message });
                      }

                      setIsSendingTest(false);
                    }}
                    disabled={isSendingTest || !testSelectedTemplate || !testTargetEmail || !testSelectedLanguage}
                    className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                  >
                    {isSendingTest ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Invio...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        <span>Invia Test</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setTestTargetEmail(user?.email || '');
                      setTimeout(() => {
                        if (testSelectedTemplate && testSelectedLanguage && user?.email) {
                          document.querySelector('[value="test"] ~ div button[class*="bg-\\[\\#26847F\\]"]')?.click();
                        }
                      }, 100);
                    }}
                    disabled={isSendingTest || !testSelectedTemplate || !testSelectedLanguage}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>A Me Stesso</span>
                    </div>
                  </Button>

                  <Button
                    onClick={async () => {
                      if (!testSelectedTemplate || !testSelectedLanguage) {
                        alert('Seleziona template e lingua prima di vedere anteprima');
                        return;
                      }

                      setIsLoadingTestPreview(true);
                      try {
                        const templateId = `${testSelectedTemplate}_${testSelectedLanguage}`;
                        const templates = await base44.entities.EmailTemplate.filter({ 
                          template_id: templateId,
                          is_active: true 
                        });

                        if (templates.length === 0) {
                          alert(`Template ${templateId} non trovato`);
                          setIsLoadingTestPreview(false);
                          return;
                        }

                        const template = templates[0];
                        
                        const previewData = {
                          user_name: 'Mario Rossi',
                          user_email: 'mario.rossi@example.com',
                          dashboard_url: 'https://app.base44.com/dashboard',
                          support_email: 'support@mywellness.com',
                          current_plan: 'Base',
                          renewal_date: '15/01/2025',
                          amount: '€19.00',
                          invoice_url: '#'
                        };

                        let htmlContent = template.main_content || template.greeting || 'Preview non disponibile';
                        Object.keys(previewData).forEach(key => {
                          const regex = new RegExp(`{${key}}`, 'g');
                          htmlContent = htmlContent.replace(regex, previewData[key]);
                        });

                        setTestEmailPreview({
                          subject: template.subject || 'Nessun oggetto',
                          html: htmlContent,
                          templateName: template.name
                        });
                      } catch (error) {
                        console.error('Error loading preview:', error);
                        alert('Errore nel caricamento anteprima');
                      }
                      setIsLoadingTestPreview(false);
                    }}
                    disabled={isLoadingTestPreview || !testSelectedTemplate || !testSelectedLanguage}
                    variant="outline"
                    className="flex-1"
                  >
                    {isLoadingTestPreview ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Anteprima</span>
                      </div>
                    )}
                  </Button>
                </div>

                {testEmailPreview && (
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-blue-900">📧 Anteprima Email</p>
                      <Button
                        onClick={() => setTestEmailPreview(null)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-600">Template:</span>
                        <p className="font-semibold text-gray-900">{testEmailPreview.templateName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Oggetto:</span>
                        <p className="font-semibold text-gray-900">{testEmailPreview.subject}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600 block mb-2">Contenuto HTML:</span>
                        <div className="bg-white rounded border border-gray-200 p-4 max-h-80 overflow-auto">
                          <div dangerouslySetInnerHTML={{ __html: testEmailPreview.html }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {testLogs.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2 max-h-60 overflow-y-auto">
                    <p className="font-semibold text-sm text-gray-700 mb-2">📋 Log Esecuzione:</p>
                    {testLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`${
                          log.type === 'success' ? 'text-green-600' : 
                          log.type === 'error' ? 'text-red-600' : 
                          log.type === 'warning' ? 'text-amber-600' : 
                          'text-gray-600'
                        }`}>{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {testEmailLog && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <p className="font-semibold text-green-900 mb-3">✅ Prova di Invio dal Database (EmailLog)</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID Log:</span>
                        <span className="font-mono text-xs text-gray-900">{testEmailLog.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email Destinatario:</span>
                        <span className="font-semibold text-gray-900">{testEmailLog.user_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Template:</span>
                        <span className="font-semibold text-gray-900">{testEmailLog.template_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lingua:</span>
                        <span className="font-semibold text-gray-900">{testEmailLog.language}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-bold ${testEmailLog.status === 'sent' ? 'text-green-600' : 'text-red-600'}`}>
                          {testEmailLog.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Provider:</span>
                        <span className="font-semibold text-gray-900">{testEmailLog.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Inviata il:</span>
                        <span className="text-gray-900">{new Date(testEmailLog.sent_at || testEmailLog.created_date).toLocaleString('it-IT')}</span>
                      </div>
                      {testEmailLog.sendgrid_message_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">SendGrid ID:</span>
                          <span className="font-mono text-xs text-gray-900">{testEmailLog.sendgrid_message_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {testResult && (
                  <div className={`border rounded-lg p-4 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <p className={`font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-2">⚠️ Note Importanti:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                          <li>Le email "Critical" vengono inviate automaticamente in base alla lingua dell'utente</li>
                          <li>Il nome template deve essere: <code className="bg-blue-100 px-1 rounded">nome_template_lingua</code></li>
                          <li>Esempio: <code className="bg-blue-100 px-1 rounded">renewal_confirmation_it</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-900">
                        <p className="font-semibold mb-2">✅ Come Verificare:</p>
                        <ol className="list-decimal list-inside space-y-1 text-green-800">
                          <li><strong>Usa "A Me Stesso"</strong> - ricevi email nella tua casella</li>
                          <li><strong>Controlla EmailLog</strong> - verifica status "sent"</li>
                          <li><strong>SendGrid</strong> - <a href="https://app.sendgrid.com/email_activity" target="_blank" rel="noopener" className="underline">SendGrid Activity</a></li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <EmailLogsPanel />
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
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Preview Text</Label>
                    <Input
                      value={editingContent.preview_text || ''}
                      onChange={(e) => setEditingContent({...editingContent, preview_text: e.target.value})}
                      placeholder="Testo visibile sotto l'oggetto nella inbox..."
                      className="h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1">Appare sotto l'oggetto prima di aprire l'email</p>
                  </div>

                  <div>
                                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Titolo Header (nell'email)</Label>
                                    <Input
                                      value={editingContent.header_title || ''}
                                      onChange={(e) => setEditingContent({...editingContent, header_title: e.target.value})}
                                      placeholder="Es: 📊 Report Settimanale"
                                      className="h-12"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Titolo grande visibile sotto il logo</p>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Sottotitolo Header</Label>
                                    <Input
                                      value={editingContent.header_subtitle || ''}
                                      onChange={(e) => setEditingContent({...editingContent, header_subtitle: e.target.value})}
                                      placeholder="Es: {week_range}"
                                      className="h-12"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Sottotitolo sotto il titolo principale</p>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Saluto Iniziale</Label>
                                    <Input
                                      value={editingContent.greeting || ''}
                                      onChange={(e) => setEditingContent({...editingContent, greeting: e.target.value})}
                                      placeholder="Es: Ciao {user_name},"
                                      className="h-12"
                                    />
                                  </div>

                                  {/* Sezione Grafici/Statistiche - Solo per weekly_report */}
                                  {previewEmail?.id === 'weekly_report' && (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
                                      <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                                        📊 Configurazione Grafici Email
                                      </h4>
                                      
                                      {/* Card Peso */}
                                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                        <div className="flex items-center gap-3">
                                          <Checkbox
                                            id="show_weight_card"
                                            checked={editingContent.show_weight_card !== false}
                                            onCheckedChange={(checked) => setEditingContent({...editingContent, show_weight_card: checked})}
                                          />
                                          <Label htmlFor="show_weight_card" className="font-medium cursor-pointer">Card Variazione Peso</Label>
                                        </div>
                                        <Input
                                          value={editingContent.weight_card_title || ''}
                                          onChange={(e) => setEditingContent({...editingContent, weight_card_title: e.target.value})}
                                          placeholder="Variazione Peso"
                                          className="w-48 h-9"
                                          disabled={editingContent.show_weight_card === false}
                                        />
                                      </div>

                                      {/* Sezione Statistiche */}
                                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                        <div className="flex items-center gap-3">
                                          <Checkbox
                                            id="show_stats_section"
                                            checked={editingContent.show_stats_section !== false}
                                            onCheckedChange={(checked) => setEditingContent({...editingContent, show_stats_section: checked})}
                                          />
                                          <Label htmlFor="show_stats_section" className="font-medium cursor-pointer">Sezione Statistiche</Label>
                                        </div>
                                        <Input
                                          value={editingContent.stats_section_title || ''}
                                          onChange={(e) => setEditingContent({...editingContent, stats_section_title: e.target.value})}
                                          placeholder="📈 Le tue statistiche"
                                          className="w-48 h-9"
                                          disabled={editingContent.show_stats_section === false}
                                        />
                                      </div>

                                      {/* Statistiche individuali */}
                                      {editingContent.show_stats_section !== false && (
                                        <div className="ml-6 space-y-2">
                                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                id="show_calories_stat"
                                                checked={editingContent.show_calories_stat !== false}
                                                onCheckedChange={(checked) => setEditingContent({...editingContent, show_calories_stat: checked})}
                                              />
                                              <Label htmlFor="show_calories_stat" className="text-sm cursor-pointer">🍽️ Calorie</Label>
                                            </div>
                                            <Input
                                              value={editingContent.calories_stat_label || ''}
                                              onChange={(e) => setEditingContent({...editingContent, calories_stat_label: e.target.value})}
                                              placeholder="Calorie medie/giorno"
                                              className="w-40 h-8 text-xs"
                                            />
                                          </div>
                                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                id="show_workouts_stat"
                                                checked={editingContent.show_workouts_stat !== false}
                                                onCheckedChange={(checked) => setEditingContent({...editingContent, show_workouts_stat: checked})}
                                              />
                                              <Label htmlFor="show_workouts_stat" className="text-sm cursor-pointer">💪 Allenamenti</Label>
                                            </div>
                                            <Input
                                              value={editingContent.workouts_stat_label || ''}
                                              onChange={(e) => setEditingContent({...editingContent, workouts_stat_label: e.target.value})}
                                              placeholder="Allenamenti completati"
                                              className="w-40 h-8 text-xs"
                                            />
                                          </div>
                                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                id="show_adherence_stat"
                                                checked={editingContent.show_adherence_stat !== false}
                                                onCheckedChange={(checked) => setEditingContent({...editingContent, show_adherence_stat: checked})}
                                              />
                                              <Label htmlFor="show_adherence_stat" className="text-sm cursor-pointer">✓ Aderenza</Label>
                                            </div>
                                            <Input
                                              value={editingContent.adherence_stat_label || ''}
                                              onChange={(e) => setEditingContent({...editingContent, adherence_stat_label: e.target.value})}
                                              placeholder="Aderenza al piano"
                                              className="w-40 h-8 text-xs"
                                            />
                                          </div>
                                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                id="show_progress_stat"
                                                checked={editingContent.show_progress_stat !== false}
                                                onCheckedChange={(checked) => setEditingContent({...editingContent, show_progress_stat: checked})}
                                              />
                                              <Label htmlFor="show_progress_stat" className="text-sm cursor-pointer">🎯 Progresso</Label>
                                            </div>
                                            <Input
                                              value={editingContent.progress_stat_label || ''}
                                              onChange={(e) => setEditingContent({...editingContent, progress_stat_label: e.target.value})}
                                              placeholder="Progresso obiettivo"
                                              className="w-40 h-8 text-xs"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Barra Progresso */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                          <div className="flex items-center gap-3">
                                            <Checkbox
                                              id="show_progress_bar"
                                              checked={editingContent.show_progress_bar !== false}
                                              onCheckedChange={(checked) => setEditingContent({...editingContent, show_progress_bar: checked})}
                                            />
                                            <Label htmlFor="show_progress_bar" className="font-medium cursor-pointer">Barra Progresso Obiettivo</Label>
                                          </div>
                                        </div>
                                        {editingContent.show_progress_bar !== false && (
                                          <div className="ml-6 space-y-2">
                                            <Input
                                              value={editingContent.progress_bar_title || ''}
                                              onChange={(e) => setEditingContent({...editingContent, progress_bar_title: e.target.value})}
                                              placeholder="🎯 Progresso verso l'obiettivo"
                                              className="h-9"
                                            />
                                            <Input
                                              value={editingContent.progress_bar_subtitle || ''}
                                              onChange={(e) => setEditingContent({...editingContent, progress_bar_subtitle: e.target.value})}
                                              placeholder="Rimangono {distance_remaining} kg al tuo obiettivo!"
                                              className="h-9"
                                            />
                                          </div>
                                        )}
                                      </div>

                                      {/* Messaggio Motivazionale */}
                                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                        <Checkbox
                                          id="show_motivational_message"
                                          checked={editingContent.show_motivational_message !== false}
                                          onCheckedChange={(checked) => setEditingContent({...editingContent, show_motivational_message: checked})}
                                        />
                                        <Label htmlFor="show_motivational_message" className="font-medium cursor-pointer">💡 Messaggio Motivazionale Automatico</Label>
                                      </div>
                                      </div>
                                      )}

                                      {/* Sezione Funzionalità - Per cart_checkout_abandoned e simili */}
                                      {(previewEmail?.id === 'cart_checkout_abandoned' || previewEmail?.id === 'cart_abandoned_24h' || previewEmail?.id === 'cart_abandoned_72h') && (
                                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-4">
                                      <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                                        🛒 Configurazione Email Carrello Abbandonato
                                      </h4>

                                      {/* Intro Text */}
                                      <div>
                                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Testo Introduttivo</Label>
                                        <Textarea
                                          value={editingContent.intro_text || ''}
                                          onChange={(e) => setEditingContent({...editingContent, intro_text: e.target.value})}
                                          placeholder="Hai fatto il primo passo verso la versione migliore di te stesso..."
                                          rows={2}
                                        />
                                      </div>

                                      <div>
                                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Secondo Paragrafo</Label>
                                        <Textarea
                                          value={editingContent.second_paragraph || ''}
                                          onChange={(e) => setEditingContent({...editingContent, second_paragraph: e.target.value})}
                                          placeholder="Ogni giorno che passa è un giorno in meno..."
                                          rows={3}
                                        />
                                      </div>

                                      {/* Sezione Features */}
                                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                        <Checkbox
                                          id="show_features_section"
                                          checked={editingContent.show_features_section !== false}
                                          onCheckedChange={(checked) => setEditingContent({...editingContent, show_features_section: checked})}
                                        />
                                        <Label htmlFor="show_features_section" className="font-medium cursor-pointer">Mostra Sezione Funzionalità (4 box)</Label>
                                      </div>

                                      {editingContent.show_features_section !== false && (
                                        <div className="ml-4 space-y-3">
                                          <Input
                                            value={editingContent.features_section_title || ''}
                                            onChange={(e) => setEditingContent({...editingContent, features_section_title: e.target.value})}
                                            placeholder="❌ Ecco cosa ti stai perdendo:"
                                            className="h-10"
                                          />

                                          {/* Feature 1 */}
                                          <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                                            <Input
                                              value={editingContent.feature_1_emoji || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_1_emoji: e.target.value})}
                                              placeholder="🍽️"
                                              className="h-9"
                                            />
                                            <Input
                                              value={editingContent.feature_1_title || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_1_title: e.target.value})}
                                              placeholder="Piano Nutrizionale AI"
                                              className="h-9"
                                            />
                                            <Input
                                              value={editingContent.feature_1_subtitle || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_1_subtitle: e.target.value})}
                                              placeholder="Pasti personalizzati"
                                              className="h-9"
                                            />
                                          </div>

                                          {/* Feature 2 */}
                                          <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                                            <Input
                                              value={editingContent.feature_2_emoji || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_2_emoji: e.target.value})}
                                              placeholder="📊"
                                              className="h-9"
                                            />
                                            <Input
                                              value={editingContent.feature_2_title || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_2_title: e.target.value})}
                                              placeholder="Dashboard Scientifica"
                                              className="h-9"
                                            />
                                            <Input
                                              value={editingContent.feature_2_subtitle || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_2_subtitle: e.target.value})}
                                              placeholder="Monitora ogni progresso"
                                              className="h-9"
                                            />
                                          </div>

                                          {/* Feature 3 */}
                                          <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                                            <Input
                                              value={editingContent.feature_3_emoji || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_3_emoji: e.target.value})}
                                              placeholder="📸"
                                              className="h-9"
                                            />
                                            <Input
                                              value={editingContent.feature_3_title || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_3_title: e.target.value})}
                                              placeholder="Analisi Foto AI"
                                              className="h-9"
                                            />
                                            <Input
                                              value={editingContent.feature_3_subtitle || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_3_subtitle: e.target.value})}
                                              placeholder="Vedi la trasformazione"
                                              className="h-9"
                                            />
                                          </div>

                                          {/* Feature 4 */}
                                          <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                                            <Input
                                              value={editingContent.feature_4_emoji || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_4_emoji: e.target.value})}
                                              placeholder="🛒"
                                              className="h-9"
                                            />
                                            <Input
                                              value={editingContent.feature_4_title || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_4_title: e.target.value})}
                                              placeholder="Lista Spesa Smart"
                                              className="h-9"
                                            />
                                            <Input
                                              value={editingContent.feature_4_subtitle || ''}
                                              onChange={(e) => setEditingContent({...editingContent, feature_4_subtitle: e.target.value})}
                                              placeholder="Mai più dubbi al supermercato"
                                              className="h-9"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Closing Text */}
                                      <div>
                                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Testo di Chiusura</Label>
                                        <Textarea
                                          value={editingContent.closing_text || ''}
                                          onChange={(e) => setEditingContent({...editingContent, closing_text: e.target.value})}
                                          placeholder="Immagina tra 30 giorni: guardarti allo specchio..."
                                          rows={3}
                                        />
                                      </div>

                                      {/* Urgency Box */}
                                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                        <Checkbox
                                          id="show_urgency_box"
                                          checked={editingContent.show_urgency_box !== false}
                                          onCheckedChange={(checked) => setEditingContent({...editingContent, show_urgency_box: checked})}
                                        />
                                        <Label htmlFor="show_urgency_box" className="font-medium cursor-pointer">Mostra Box Urgenza</Label>
                                      </div>

                                      {editingContent.show_urgency_box !== false && (
                                        <div className="ml-4 space-y-2">
                                          <Input
                                            value={editingContent.urgency_title || ''}
                                            onChange={(e) => setEditingContent({...editingContent, urgency_title: e.target.value})}
                                            placeholder="⏰ Il momento è ADESSO"
                                            className="h-10"
                                          />
                                          <Textarea
                                            value={editingContent.urgency_subtitle || ''}
                                            onChange={(e) => setEditingContent({...editingContent, urgency_subtitle: e.target.value})}
                                            placeholder="Non rimandare a domani quello che può cambiarti la vita oggi."
                                            rows={2}
                                          />
                                        </div>
                                      )}

                                      {/* Trust Badges */}
                                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                        <Checkbox
                                          id="show_trust_badges"
                                          checked={editingContent.show_trust_badges !== false}
                                          onCheckedChange={(checked) => setEditingContent({...editingContent, show_trust_badges: checked})}
                                        />
                                        <Label htmlFor="show_trust_badges" className="font-medium cursor-pointer">Mostra Badge Fiducia (Pagamento Sicuro, Garanzia, Attivazione)</Label>
                                      </div>

                                      {/* Footer Quote */}
                                      <div>
                                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Citazione Finale (in corsivo)</Label>
                                        <Input
                                          value={editingContent.footer_quote || ''}
                                          onChange={(e) => setEditingContent({...editingContent, footer_quote: e.target.value})}
                                          placeholder="Il miglior momento per iniziare era ieri. Il secondo miglior momento è adesso."
                                          className="h-10"
                                        />
                                      </div>
                                      </div>
                                      )}

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
                      className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
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
                                      {previewEmail.template.preview_text && (
                                        <div className="pt-3 border-t border-gray-300">
                                          <p className="text-xs text-gray-500 mb-1">Preview Text:</p>
                                          <p className="text-sm text-gray-600 italic">{previewEmail.template.preview_text}</p>
                                        </div>
                                      )}
                                      {previewEmail.template.header_title && (
                                        <div className="pt-3 border-t border-gray-300">
                                          <p className="text-xs text-gray-500 mb-1">Titolo Header:</p>
                                          <p className="text-sm font-bold text-[var(--brand-primary)]">{previewEmail.template.header_title}</p>
                                        </div>
                                      )}
                                      {previewEmail.template.header_subtitle && (
                                        <div className="pt-3 border-t border-gray-300">
                                          <p className="text-xs text-gray-500 mb-1">Sottotitolo Header:</p>
                                          <p className="text-sm text-gray-600">{previewEmail.template.header_subtitle}</p>
                                        </div>
                                      )}
                                      {previewEmail.template.greeting && (
                                        <div className="pt-3 border-t border-gray-300">
                                          <p className="text-xs text-gray-500 mb-1">Saluto:</p>
                                          <p className="text-sm text-gray-900">{previewEmail.template.greeting}</p>
                                        </div>
                                      )}
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

                  <div className="space-y-3 pt-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Email di Test</Label>
                      <Input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder={user?.email || 'Inserisci email...'}
                        className="h-12"
                      />
                    </div>
                    <Button
                      onClick={handleSendTestEmail}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                    className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingBroadcast ? '✏️ Modifica Campagna' : '✨ Nuova Campagna Broadcast'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Nome Campagna */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Nome Campagna <span className="text-red-500">*</span>
              </Label>
              <Input
                value={broadcastData.name}
                onChange={(e) => setBroadcastData({...broadcastData, name: e.target.value})}
                placeholder="Es: Newsletter Gennaio 2025"
                className="h-12"
              />
            </div>

            {/* FILTRI COMBINABILI */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  🎯 Filtri Destinatari (Combinabili)
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Seleziona più filtri per restringere il pubblico. I filtri si combinano con logica AND.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Stato Abbonamento */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">📊 Stato Abbonamento</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'trial', label: 'Trial', icon: '🔬' },
                      { value: 'active', label: 'Attivo', icon: '✅' },
                      { value: 'expired', label: 'Scaduto', icon: '⏰' },
                      { value: 'cancelled', label: 'Cancellato', icon: '❌' }
                    ].map(status => (
                      <div
                        key={status.value}
                        onClick={() => toggleSubscriptionStatus(status.value)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          broadcastData.filters.subscription_status?.includes(status.value)
                            ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[var(--brand-primary)]'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{status.icon}</div>
                          <div className="text-sm font-semibold">{status.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Piano Abbonamento */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">💼 Piano Abbonamento</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'base', label: 'Base', icon: '🥉' },
                      { value: 'pro', label: 'Pro', icon: '🥈' },
                      { value: 'premium', label: 'Premium', icon: '🥇' }
                    ].map(plan => (
                      <div
                        key={plan.value}
                        onClick={() => toggleSubscriptionPlan(plan.value)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          broadcastData.filters.subscription_plan?.includes(plan.value)
                            ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[var(--brand-primary)]'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{plan.icon}</div>
                          <div className="text-sm font-semibold">{plan.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lingua */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">🌍 Lingua Utente</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                      { value: 'it', label: 'Italiano', flag: '🇮🇹' },
                      { value: 'en', label: 'Inglese', flag: '🇬🇧' },
                      { value: 'es', label: 'Spagnolo', flag: '🇪🇸' },
                      { value: 'fr', label: 'Francese', flag: '🇫🇷' },
                      { value: 'de', label: 'Tedesco', flag: '🇩🇪' },
                      { value: 'pt', label: 'Portoghese', flag: '🇵🇹' }
                    ].map(lang => (
                      <div
                        key={lang.value}
                        onClick={() => toggleLanguage(lang.value)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          broadcastData.filters.languages?.includes(lang.value)
                            ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[var(--brand-primary)]'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{lang.flag}</div>
                          <div className="text-xs font-semibold">{lang.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filtri Boolean */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">🛒 Comportamenti</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'quiz_abandoned', label: 'Quiz Abbandonato' },
                      { key: 'trial_setup_abandoned', label: 'Trial Setup Abbandonato' },
                      { key: 'pricing_visited', label: 'Pricing Visitato' },
                      { key: 'checkout_abandoned', label: 'Checkout Abbandonato' },
                      { key: 'trial_expired_no_conversion', label: 'Trial Scaduto Senza Conversione' },
                      { key: 'purchased_landing_offer', label: 'Ha Acquistato Landing Offer' }
                    ].map(filter => (
                      <div key={filter.key} className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
                        <Checkbox
                          id={filter.key}
                          checked={!!broadcastData.filters[filter.key]}
                          onCheckedChange={(checked) => handleCheckboxFilterChange(filter.key, checked)}
                        />
                        <Label htmlFor={filter.key} className="text-sm font-medium cursor-pointer">
                          {filter.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filtri Numerici */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      ⏰ Inattivi da X giorni
                    </Label>
                    <Input
                      type="number"
                      placeholder="Es: 7"
                      value={broadcastData.filters.inactive_days || ''}
                      onChange={(e) => handleFilterChange('inactive_days', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="h-10"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      🔄 Giorni al Rinnovo
                    </Label>
                    <select
                      value={broadcastData.filters.renewal_days || ''}
                      onChange={(e) => handleFilterChange('renewal_days', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Nessun filtro</option>
                      <option value="1">1 giorno</option>
                      <option value="3">3 giorni</option>
                      <option value="7">7 giorni</option>
                    </select>
                  </div>
                </div>

                {/* Stima Destinatari */}
                <div className="pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">👥 Destinatari Stimati</p>
                      {estimatedRecipients !== null && (
                        <p className="text-3xl font-bold text-[var(--brand-primary)]">
                          {estimatedRecipients} utenti
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={calculateEstimatedRecipients}
                      variant="outline"
                      size="sm"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Calcola
                    </Button>
                  </div>
                  
                  {Object.keys(broadcastData.filters).filter(k => {
                    const val = broadcastData.filters[k];
                    return val !== undefined && val !== false && (!Array.isArray(val) || val.length > 0);
                  }).length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Filtri Attivi:</p>
                      <p className="text-sm text-gray-800">{getFiltersSummary(broadcastData.filters)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email Settings */}
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
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Oggetto Email <span className="text-red-500">*</span>
              </Label>
              <Input
                value={broadcastData.subject}
                onChange={(e) => setBroadcastData({...broadcastData, subject: e.target.value})}
                placeholder="Es: 🎉 Novità MyWellness - Nuove Funzionalità!"
                className="h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Preview Text</Label>
              <Input
                value={broadcastData.preview_text || ''}
                onChange={(e) => setBroadcastData({...broadcastData, preview_text: e.target.value})}
                placeholder="Testo visibile sotto l'oggetto nella inbox..."
                className="h-12"
              />
              <p className="text-xs text-gray-500 mt-1">Appare sotto l'oggetto prima di aprire l'email</p>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Contenuto Principale <span className="text-red-500">*</span>
              </Label>
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
                className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
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