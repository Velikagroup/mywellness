import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { HelpCircle, Crown, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminSupportTickets() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      await loadTickets();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
    setIsLoading(false);
  };

  const loadTickets = async () => {
    try {
      const allTickets = await base44.entities.SupportTicket.list(['-created_date']);
      setTickets(allTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const handleOpenResponse = (ticket) => {
    setSelectedTicket(ticket);
    setAdminResponse(ticket.admin_response || '');
    setShowResponseDialog(true);
  };

  const handleSaveResponse = async () => {
    if (!adminResponse.trim()) {
      alert('❌ Scrivi una risposta');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.SupportTicket.update(selectedTicket.id, {
        admin_response: adminResponse,
        status: 'risolto',
        resolved_at: new Date().toISOString()
      });

      // Invia email all'utente
      await base44.integrations.Core.SendEmail({
        to: selectedTicket.user_email,
        subject: `✅ Risposta al tuo ticket: ${selectedTicket.subject}`,
        body: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px;">
    <h1 style="color: #26847F;">✅ Risposta al tuo Ticket</h1>
    <p>Ciao,</p>
    <p>Abbiamo risposto al tuo ticket di supporto:</p>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Oggetto:</strong> ${selectedTicket.subject}
    </div>
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
      <strong style="color: #065f46;">Risposta del Team:</strong>
      <p style="color: #047857; margin-top: 10px;">${adminResponse}</p>
    </div>
    <p>Se hai altre domande, rispondi direttamente a questa email.</p>
    <p style="color: #6b7280; margin-top: 30px;">Grazie,<br>Il Team MyWellness</p>
  </div>
</body>
</html>
        `
      });

      alert('✅ Risposta inviata con successo!');
      setShowResponseDialog(false);
      await loadTickets();
    } catch (error) {
      console.error('Error saving response:', error);
      alert('❌ Errore nel salvataggio');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  const premiumTickets = tickets.filter(t => t.priority === 'premium');
  const normalTickets = tickets.filter(t => t.priority === 'normale');
  const openTickets = tickets.filter(t => t.status === 'aperto' || t.status === 'in_lavorazione');
  const resolvedTickets = tickets.filter(t => t.status === 'risolto' || t.status === 'chiuso');

  const TicketCard = ({ ticket }) => (
    <div
      onClick={() => handleOpenResponse(ticket)}
      className="p-4 border rounded-lg bg-white hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
            {ticket.priority === 'premium' && <Crown className="w-4 h-4 text-purple-600" />}
          </div>
          <p className="text-sm text-gray-600 mb-2">{ticket.message}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{ticket.user_email}</Badge>
            <Badge className="bg-purple-100 text-purple-700">{ticket.user_plan}</Badge>
            <Badge>{ticket.category}</Badge>
          </div>
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
      <p className="text-xs text-gray-500 mt-2">
        {new Date(ticket.created_date).toLocaleDateString('it-IT')}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ticket di Supporto</h1>
          <p className="text-gray-600">Gestisci le richieste di assistenza clienti</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Totale Ticket</p>
                  <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Premium Priority</p>
                  <p className="text-2xl font-bold text-gray-900">{premiumTickets.length}</p>
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
                  <p className="text-sm text-gray-500">Da Gestire</p>
                  <p className="text-2xl font-bold text-gray-900">{openTickets.length}</p>
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
                  <p className="text-sm text-gray-500">Risolti</p>
                  <p className="text-2xl font-bold text-gray-900">{resolvedTickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="premium" className="w-full">
          <TabsList>
            <TabsTrigger value="premium">
              <Crown className="w-4 h-4 mr-2" />
              Premium Priority ({premiumTickets.length})
            </TabsTrigger>
            <TabsTrigger value="normal">
              Normali ({normalTickets.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Tutti ({tickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="premium" className="space-y-3 mt-6">
            {premiumTickets.length === 0 ? (
              <p className="text-center text-gray-500 py-12">Nessun ticket premium</p>
            ) : (
              premiumTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </TabsContent>

          <TabsContent value="normal" className="space-y-3 mt-6">
            {normalTickets.length === 0 ? (
              <p className="text-center text-gray-500 py-12">Nessun ticket normale</p>
            ) : (
              normalTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-3 mt-6">
            {tickets.length === 0 ? (
              <p className="text-center text-gray-500 py-12">Nessun ticket</p>
            ) : (
              tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Rispondi al Ticket
              {selectedTicket?.priority === 'premium' && <Crown className="w-5 h-5 text-purple-600" />}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">{selectedTicket.subject}</p>
                <p className="text-sm text-gray-700 mb-3">{selectedTicket.message}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{selectedTicket.user_email}</span>
                  <span>•</span>
                  <span>{new Date(selectedTicket.created_date).toLocaleDateString('it-IT')}</span>
                </div>
              </div>

              <div>
                <Label>Risposta Admin</Label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Scrivi la tua risposta..."
                  className="h-32 bg-white"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowResponseDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSaveResponse}
                  disabled={isSaving}
                  className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                >
                  {isSaving ? 'Invio...' : 'Invia Risposta'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}