import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminEmailTest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('it');
  const [testEmail, setTestEmail] = useState('');
  const [result, setResult] = useState(null);

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

    try {
      const templateId = `${selectedTemplate}_${selectedLanguage}`;
      
      const response = await base44.functions.invoke('testLocalizedEmail', {
        templateId: templateId,
        testEmail: testEmail,
        language: selectedLanguage
      });

      console.log('Response:', response);

      if (response.data?.success) {
        setResult({
          success: true,
          message: `✅ Email inviata a ${testEmail}`,
          details: response.data
        });
      } else {
        setResult({
          success: false,
          message: response.data?.error || 'Errore sconosciuto',
          details: response.data
        });
      }
    } catch (error) {
      console.error('Error:', error);
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

            <Button
              onClick={handleSendTest}
              disabled={isSending || !selectedTemplate || !testEmail}
              className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Invio in corso...' : 'Invia Email di Test'}
            </Button>

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
                      <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-amber-900">
                <strong>ℹ️ Info:</strong> Questa funzione testa solo le email della categoria "Critical". 
                Verifica che i template esistano nel database con il suffisso della lingua (es: standard_free_welcome_it, base_welcome_en).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}