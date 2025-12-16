import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, CheckCircle, AlertCircle, X, Info, FileText } from 'lucide-react';

export default function AdminEmailTest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('it');
  const [testEmail, setTestEmail] = useState('');
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [emailLog, setEmailLog] = useState(null);
  const [emailPreview, setEmailPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          navigate(createPageUrl('Dashboard'));
          return;
        }
        setUser(currentUser);
        setTestEmail(currentUser.email);
      } catch (error) {
        console.error('Error loading user:', error);
        navigate(createPageUrl('Dashboard'));
      }
      setIsLoading(false);
    };
    loadUser();
  }, [navigate]);

  const templates = [
    { id: 'standard_free_welcome', name: 'Standard Free - Benvenuto', category: 'Critical' },
    { id: 'base_welcome', name: 'Base - Benvenuto', category: 'Critical' },
    { id: 'pro_welcome', name: 'Pro - Benvenuto', category: 'Critical' },
    { id: 'premium_welcome', name: 'Premium - Benvenuto', category: 'Critical' },
    { id: 'renewal_confirmation', name: 'Conferma Rinnovo', category: 'Critical' },
    { id: 'landing_new_user', name: 'Landing Offer - Nuovo Utente', category: 'Critical' },
    { id: 'landing_existing_user', name: 'Landing Offer - Utente Esistente', category: 'Critical' }
  ];

  const languages = [
    { code: 'it', name: 'Italiano 🇮🇹' },
    { code: 'en', name: 'English 🇬🇧' },
    { code: 'es', name: 'Español 🇪🇸' },
    { code: 'pt', name: 'Português 🇵🇹' },
    { code: 'de', name: 'Deutsch 🇩🇪' },
    { code: 'fr', name: 'Français 🇫🇷' }
  ];

  const handleSendToMyself = async () => {
    if (!user?.email) return;
    setTestEmail(user.email);
    // Trigger send after setting email
    setTimeout(() => handleSendTest(), 100);
  };

  const handleLoadPreview = async () => {
    if (!selectedTemplate || !selectedLanguage) {
      alert('Seleziona template e lingua prima di vedere anteprima');
      return;
    }

    setIsLoadingPreview(true);
    try {
      const templateId = `${selectedTemplate}_${selectedLanguage}`;
      const templates = await base44.entities.EmailTemplate.filter({ 
        template_id: templateId,
        is_active: true 
      });

      if (templates.length === 0) {
        alert(`Template ${templateId} non trovato`);
        setIsLoadingPreview(false);
        return;
      }

      const template = templates[0];
      
      // Generate preview HTML with placeholder data
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

      // Simple template variable replacement
      let htmlContent = template.main_content || template.greeting || 'Preview non disponibile';
      Object.keys(previewData).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        htmlContent = htmlContent.replace(regex, previewData[key]);
      });

      setEmailPreview({
        subject: template.subject || 'Nessun oggetto',
        html: htmlContent,
        templateName: template.name
      });
    } catch (error) {
      console.error('Error loading preview:', error);
      alert('Errore nel caricamento anteprima');
    }
    setIsLoadingPreview(false);
  };

  const handleSendTest = async () => {
    if (!selectedTemplate || !testEmail || !selectedLanguage) {
      setResult({
        success: false,
        message: 'Seleziona template, lingua e inserisci email'
      });
      return;
    }

    setIsSending(true);
    setResult(null);
    setLogs([]);
    setEmailLog(null);

    const addLog = (message, type = 'info') => {
      setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
    };

    try {
      const templateId = `${selectedTemplate}_${selectedLanguage}`;
      
      addLog(`🔍 Verifica template: ${templateId}`, 'info');
      
      // Verifica template prima di inviare
      const templates = await base44.entities.EmailTemplate.filter({ 
        template_id: templateId,
        is_active: true 
      });
      
      if (templates.length === 0) {
        addLog(`❌ Template ${templateId} NON TROVATO nel database`, 'error');
        setResult({
          success: false,
          message: `Template ${templateId} non esiste o non è attivo`,
          details: { templateId, language: selectedLanguage }
        });
        setIsSending(false);
        return;
      }
      
      addLog(`✅ Template trovato: ${templates[0].name}`, 'success');
      addLog(`📧 Invio email a ${testEmail}...`, 'info');
      
      const response = await base44.functions.invoke('testLocalizedEmail', {
        templateId: templateId,
        testEmail: testEmail,
        language: selectedLanguage
      });

      addLog(`📬 Risposta ricevuta dalla funzione`, 'info');

      if (response.data?.success) {
        addLog(`✅ Email inviata con successo!`, 'success');
        
        // Verifica nell'EmailLog
        addLog(`🔍 Verifica nel log email...`, 'info');
        
        // Aspetta 2 secondi per dare tempo al log di essere salvato
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const emailLogs = await base44.entities.EmailLog.filter({ 
          user_email: testEmail 
        }, '-created_date', 1);
        
        if (emailLogs.length > 0) {
          const latestLog = emailLogs[0];
          setEmailLog(latestLog);
          addLog(`✅ Email registrata nel log (ID: ${latestLog.id})`, 'success');
          addLog(`📊 Provider: ${latestLog.provider}`, 'info');
          addLog(`📊 Status: ${latestLog.status}`, latestLog.status === 'sent' ? 'success' : 'error');
        } else {
          addLog(`⚠️ Nessun log trovato (potrebbe essere in ritardo)`, 'warning');
        }
        
        setResult({
          success: true,
          message: `✅ Email inviata a ${testEmail}`,
          details: response.data
        });
      } else {
        addLog(`❌ Invio fallito: ${response.data?.error}`, 'error');
        setResult({
          success: false,
          message: response.data?.error || 'Errore sconosciuto',
          details: response.data
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addLog(`❌ Errore: ${error.message}`, 'error');
      setResult({
        success: false,
        message: error.message,
        details: error
      });
    }

    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Test Email Localizzate</h1>
          <p className="text-gray-600">Testa le email Critical in tutte le lingue</p>
        </div>

        <Card className="water-glass-effect border border-white/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#26847F]" />
              Invia Email di Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Template Email</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lingua</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(l => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email Destinatario</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="tua@email.com"
              />
            </div>

            {selectedTemplate && selectedLanguage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Template finale:</strong> {selectedTemplate}_{selectedLanguage}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSendTest}
                disabled={isSending || !selectedTemplate || !testEmail || !selectedLanguage}
                className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                {isSending ? (
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
                onClick={handleSendToMyself}
                disabled={isSending || !selectedTemplate || !selectedLanguage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>A Me Stesso</span>
                </div>
              </Button>

              <Button
                onClick={handleLoadPreview}
                disabled={isLoadingPreview || !selectedTemplate || !selectedLanguage}
                variant="outline"
                className="flex-1"
              >
                {isLoadingPreview ? (
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

            {emailPreview && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-blue-900">📧 Anteprima Email</p>
                  <Button
                    onClick={() => setEmailPreview(null)}
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
                    <p className="font-semibold text-gray-900">{emailPreview.templateName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Oggetto:</span>
                    <p className="font-semibold text-gray-900">{emailPreview.subject}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600 block mb-2">Contenuto HTML:</span>
                    <div className="bg-white rounded border border-gray-200 p-4 max-h-80 overflow-auto">
                      <div dangerouslySetInnerHTML={{ __html: emailPreview.html }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2 max-h-60 overflow-y-auto">
                <p className="font-semibold text-sm text-gray-700 mb-2">📋 Log Esecuzione:</p>
                {logs.map((log, idx) => (
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

            {emailLog && (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <p className="font-semibold text-green-900 mb-3">✅ Prova di Invio dal Database (EmailLog)</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Log:</span>
                    <span className="font-mono text-xs text-gray-900">{emailLog.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email Destinatario:</span>
                    <span className="font-semibold text-gray-900">{emailLog.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Template:</span>
                    <span className="font-semibold text-gray-900">{emailLog.template_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lingua:</span>
                    <span className="font-semibold text-gray-900">{emailLog.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-bold ${emailLog.status === 'sent' ? 'text-green-600' : 'text-red-600'}`}>
                      {emailLog.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-semibold text-gray-900">{emailLog.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inviata il:</span>
                    <span className="text-gray-900">{new Date(emailLog.sent_at || emailLog.created_date).toLocaleString('it-IT')}</span>
                  </div>
                  {emailLog.sendgrid_message_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">SendGrid ID:</span>
                      <span className="font-mono text-xs text-gray-900">{emailLog.sendgrid_message_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && (
              <div className={`border rounded-lg p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer">Dettagli Tecnici</summary>
                        <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
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
                      <li>Il nome template deve essere esattamente: <code className="bg-blue-100 px-1 rounded">nome_template_lingua</code></li>
                      <li>Esempio: <code className="bg-blue-100 px-1 rounded">standard_free_welcome_it</code>, <code className="bg-blue-100 px-1 rounded">standard_free_welcome_en</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-900">
                    <p className="font-semibold mb-2">✅ Come Verificare che Funziona Davvero:</p>
                    <ol className="list-decimal list-inside space-y-1 text-green-800">
                      <li><strong>Usa "A Me Stesso"</strong> - riceverai l'email nella tua casella reale</li>
                      <li><strong>Controlla EmailLog</strong> - verifica status "sent" e provider "sendgrid"</li>
                      <li><strong>Verifica SendGrid</strong> - apri <a href="https://app.sendgrid.com/email_activity" target="_blank" rel="noopener" className="underline text-green-700 hover:text-green-900">SendGrid Activity</a> per vedere delivery status</li>
                      <li><strong>Test con utente reale</strong> - fai registrare un utente di test per vedere il flusso completo</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}