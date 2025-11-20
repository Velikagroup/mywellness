import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { HelpCircle, Crown, Clock, CheckCircle, Send } from 'lucide-react';

export default function AdminSupportTickets() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [isSending, setIsSending] = useState(false);

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
      const allTickets = await base44.entities.SupportTicket.list('-created_date', 100);
      console.log('✅ Tickets caricati:', allTickets.length, allTickets);
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

  const handleSendResponse = async () => {
    if (!adminResponse.trim()) {
      alert('❌ Scrivi una risposta');
      return;
    }

    setIsSending(true);
    try {
      await base44.entities.SupportTicket.update(selectedTicket.id, {
        admin_response: adminResponse,
        status: 'in_lavorazione'
      });

      const fromEmail = 'info@projectmywellness.com';
      
      await base44.integrations.Core.SendEmail({
        from_name: `MyWellness Support <${fromEmail}>`,
        to: selectedTicket.user_email,
        subject: `✅ Risposta al tuo ticket: ${selectedTicket.subject}`,
        body: `
<!DOCTYPE html>
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
            <td class="logo-cell" style="background: white;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
              <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 28px;">✅ Risposta al Tuo Ticket</h1>
            </td>
          </tr>
          <tr>
            <td class="content-cell">
              <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao,</p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                Abbiamo risposto al tuo ticket di supporto:
              </p>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3 style="color: #111827; margin: 0 0 10px 0; font-size: 18px;">📋 Oggetto Ticket:</h3>
                <p style="color: #4b5563; margin: 0; font-size: 16px; font-weight: 600;">${selectedTicket.subject}</p>
              </div>

              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 25px; margin: 20px 0;">
                <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">💬 Risposta del Team:</h3>
                <p style="color: #047857; margin: 0; line-height: 1.8; white-space: pre-wrap;">${adminResponse}</p>
              </div>

              ${selectedTicket.priority === 'premium' ? `
              <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 2px solid #a855f7; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; color: #7e22ce; font-size: 16px; font-weight: bold;">
                  👑 Grazie per essere un utente Premium!
                </p>
                <p style="margin: 10px 0 0 0; color: #9333ea; font-size: 14px;">
                  La tua richiesta è stata gestita con priorità
                </p>
              </div>
              ` : ''}

              <p style="color: #6b7280; line-height: 1.6; margin: 30px 0 20px 0;">
                Se hai altre domande o hai bisogno di ulteriore assistenza, rispondi direttamente a questa email o apri un nuovo ticket dalla Dashboard.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://app.projectmywellness.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                  🎯 Vai alla Dashboard
                </a>
              </div>

              <p style="color: #6b7280; margin-top: 30px; text-align: center;">
                Grazie,<br>
                <strong style="color: #26847F;">Il Team MyWellness</strong>
              </p>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px; background-color: #fafafa;">
          <tr>
            <td align="center" style="padding: 20px; color: #999999; background-color: #fafafa;">
              <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">&copy; VELIKA GROUP LLC. All Rights Reserved.</p>
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
        `
      });

      alert('✅ Risposta inviata con successo!');
      setAdminResponse('');
      await loadTickets();
      
      // Aggiorna il ticket selezionato
      setSelectedTicket({
        ...selectedTicket,
        admin_response: adminResponse,
        status: 'in_lavorazione'
      });
    } catch (error) {
      console.error('Error sending response:', error);
      alert('❌ Errore nell\'invio della risposta');
    }
    setIsSending(false);
  };

  const handleCloseTicket = async () => {
    if (!confirm('Sei sicuro di voler chiudere questo ticket?')) {
      return;
    }

    try {
      await base44.entities.SupportTicket.update(selectedTicket.id, {
        status: 'risolto',
        resolved_at: new Date().toISOString()
      });

      alert('✅ Ticket chiuso con successo!');
      setShowResponseDialog(false);
      setSelectedTicket(null);
      setAdminResponse('');
      await loadTickets();
    } catch (error) {
      console.error('Error closing ticket:', error);
      alert('❌ Errore nella chiusura del ticket');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  const premiumTickets = tickets.filter(t => t.priority === 'premium' && !t.ai_resolved);
  const normalTickets = tickets.filter(t => t.priority === 'normale' && !t.ai_resolved);
  const allActiveTickets = tickets.filter(t => !t.ai_resolved);
  const aiResolvedTickets = tickets.filter(t => t.ai_resolved === true);

  const TicketCard = ({ ticket }) => (
    <div
      onClick={() => handleOpenResponse(ticket)}
      className="p-4 border rounded-xl bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base break-words">{ticket.subject}</h3>
            {ticket.priority === 'premium' && <Crown className="w-4 h-4 text-purple-600 flex-shrink-0" />}
            {ticket.ai_resolved && <Badge className="bg-green-100 text-green-700 text-xs">🤖 Risolto da AI</Badge>}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{ticket.message}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{ticket.user_email}</Badge>
            <Badge className="bg-purple-100 text-purple-700 text-xs">{ticket.user_plan}</Badge>
            <Badge className="text-xs">{ticket.category}</Badge>
          </div>
        </div>
        <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
          ticket.status === 'aperto' ? 'bg-blue-100 text-blue-700' :
          ticket.status === 'in_lavorazione' ? 'bg-yellow-100 text-yellow-700' :
          ticket.status === 'risolto' || ticket.ai_resolved ? 'bg-green-100 text-green-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {ticket.ai_resolved ? 'risolto (AI)' : ticket.status}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {new Date(ticket.created_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ticket di Supporto</h1>
          <p className="text-sm sm:text-base text-gray-600">Gestisci le richieste di assistenza clienti</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Totale</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{tickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Premium</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{premiumTickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Da Gestire</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{allActiveTickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Risolti AI</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{aiResolvedTickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="premium" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-4 gap-2 bg-gray-100/80 p-1 rounded-lg">
              <TabsTrigger value="premium" className="text-xs sm:text-sm whitespace-nowrap">
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Premium ({premiumTickets.length})
              </TabsTrigger>
              <TabsTrigger value="normal" className="text-xs sm:text-sm whitespace-nowrap">
                Normali ({normalTickets.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">
                Tutti ({allActiveTickets.length})
              </TabsTrigger>
              <TabsTrigger value="ai_resolved" className="text-xs sm:text-sm whitespace-nowrap">
                🤖 Risolti AI ({aiResolvedTickets.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="premium" className="space-y-3 mt-6">
            {premiumTickets.length === 0 ? (
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <Crown className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessun ticket premium in attesa</p>
              </div>
            ) : (
              premiumTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </TabsContent>

          <TabsContent value="normal" className="space-y-3 mt-6">
            {normalTickets.length === 0 ? (
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessun ticket normale in attesa</p>
              </div>
            ) : (
              normalTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-3 mt-6">
            {allActiveTickets.length === 0 ? (
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessun ticket da gestire</p>
              </div>
            ) : (
              allActiveTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </TabsContent>

          <TabsContent value="ai_resolved" className="space-y-3 mt-6">
            {aiResolvedTickets.length === 0 ? (
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessun ticket risolto dall'AI</p>
              </div>
            ) : (
              aiResolvedTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showResponseDialog} onOpenChange={(open) => {
        if (!open) {
          setShowResponseDialog(false);
          setSelectedTicket(null);
          setAdminResponse('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              Rispondi al Ticket
              {selectedTicket?.priority === 'premium' && (
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  PREMIUM
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base break-words">{selectedTicket.subject}</p>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <Badge variant="outline" className="text-xs">{selectedTicket.category}</Badge>
                      <Badge className="bg-purple-100 text-purple-700 text-xs">{selectedTicket.user_plan}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Messaggio Utente:</p>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {selectedTicket.ai_response && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🤖</span>
                      <p className="text-xs font-bold text-blue-900">Risposta Automatica AI</p>
                      {selectedTicket.ai_resolved && (
                        <Badge className="bg-green-600 text-white text-xs ml-auto">✅ Accettata</Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">{selectedTicket.ai_response}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                  <span>{selectedTicket.user_email}</span>
                  <span>•</span>
                  <span>{new Date(selectedTicket.created_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  La Tua Risposta
                  {selectedTicket.priority === 'premium' && (
                    <span className="ml-2 text-purple-600 text-xs">👑 Risposta prioritaria</span>
                  )}
                </Label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Scrivi una risposta dettagliata e professionale..."
                  className="h-40 sm:h-48 bg-white text-sm sm:text-base resize-none"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Questa risposta verrà inviata via email all'utente
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowResponseDialog(false);
                    setSelectedTicket(null);
                    setAdminResponse('');
                  }}
                  variant="outline"
                  className="flex-1 h-11 text-sm sm:text-base"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSendResponse}
                  disabled={isSending || !adminResponse.trim()}
                  className="flex-1 h-11 bg-[#26847F] hover:bg-[#1f6b66] text-white text-sm sm:text-base"
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Invio...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Invia Risposta
                    </div>
                  )}
                </Button>
                {selectedTicket?.status !== 'risolto' && selectedTicket?.status !== 'chiuso' && (
                  <Button
                    onClick={handleCloseTicket}
                    variant="outline"
                    className="flex-1 h-11 border-green-300 text-green-600 hover:bg-green-50 text-sm sm:text-base"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Chiudi Ticket
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}