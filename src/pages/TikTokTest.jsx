import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TikTokTest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    event: 'Purchase',
    email: '',
    external_id: '',
    value: 19.00,
    currency: 'EUR',
    test_event_code: 'TEST78881'
  });

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl('Dashboard'));
          return;
        }
        setUser(currentUser);
        setFormData(prev => ({
          ...prev,
          email: currentUser.email,
          external_id: currentUser.id
        }));
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    loadUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('sendTikTokEvent', formData);
      console.log('TikTok Response:', response);
      setResult({
        success: response.success || false,
        message: response.success 
          ? `✅ Evento inviato con successo! Event ID: ${response.event_id}` 
          : `❌ Errore: ${response.error || JSON.stringify(response)}`,
        data: response
      });
    } catch (error) {
      console.error('Error:', error);
      setResult({
        success: false,
        message: `❌ Errore: ${error.message}`,
        data: null
      });
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">TikTok Events Test</h1>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            ← Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invia Evento di Test</CardTitle>
            <p className="text-sm text-gray-600">
              Test Code: <span className="font-mono font-semibold">TEST78881</span>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="event">Event Type</Label>
                <Select
                  value={formData.event}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, event: value }))}
                >
                  <SelectTrigger id="event">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ViewContent">ViewContent</SelectItem>
                    <SelectItem value="ClickButton">ClickButton</SelectItem>
                    <SelectItem value="AddToCart">AddToCart</SelectItem>
                    <SelectItem value="InitiateCheckout">InitiateCheckout</SelectItem>
                    <SelectItem value="CompletePayment">CompletePayment</SelectItem>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <Label htmlFor="external_id">External ID</Label>
                <Input
                  id="external_id"
                  value={formData.external_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, external_id: e.target.value }))}
                  placeholder="user_123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    placeholder="EUR"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#26847F] hover:bg-[#1f6b66]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  'Invia Evento Test'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600">Successo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-600">Errore</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{result.message}</p>
              
              {result.data && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Dettagli Risposta:</p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-semibold mb-2">📊 Verifica nel Dashboard TikTok:</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Vai su Events Manager → Test events</li>
                  <li>Cerca eventi con test_code: <span className="font-mono font-bold">TEST78881</span></li>
                  <li>Controlla che l'evento sia stato ricevuto correttamente</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informazioni Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pixel ID:</span>
              <span className="font-mono font-semibold">D50ASNBC77UDC9ALLB2G</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Test Event Code:</span>
              <span className="font-mono font-semibold">TEST78881</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">API Endpoint:</span>
              <span className="font-mono text-xs">business-api.tiktok.com/open_api/v1.3/event/track/</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}