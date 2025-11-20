import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Crown, Clock, CheckCircle, Send, X, Minimize2, Maximize2, Paperclip } from 'lucide-react';

export default function AdminSupportTickets() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [openChats, setOpenChats] = useState([]);
  const [sendingStates, setSendingStates] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

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

  const handleOpenChat = (ticket) => {
    // Controlla se il ticket è già aperto
    if (openChats.find(chat => chat.id === ticket.id)) {
      return;
    }
    
    // Aggiungi il ticket alle chat aperte
    setOpenChats(prev => [...prev, {
      ...ticket,
      newMessage: '',
      isMinimized: false
    }]);
  };

  const handleCloseChat = (ticketId) => {
    setOpenChats(prev => prev.filter(chat => chat.id !== ticketId));
  };

  const handleMinimizeChat = (ticketId) => {
    setOpenChats(prev => prev.map(chat => 
      chat.id === ticketId ? { ...chat, isMinimized: !chat.isMinimized } : chat
    ));
  };

  const updateChatMessage = (ticketId, newMessage) => {
    setOpenChats(prev => prev.map(chat =>
      chat.id === ticketId ? { ...chat, newMessage } : chat
    ));
  };

  const handleSendResponse = async (ticketId, messageOverride = null) => {
    const chat = openChats.find(c => c.id === ticketId);
    const finalMessage = messageOverride || chat.newMessage;
    if (!chat || !finalMessage.trim()) {
      return;
    }

    setSendingStates(prev => ({ ...prev, [ticketId]: true }));
    try {
      const updatedMessage = chat.message + (chat.admin_response ? '' : '') + `\n\n--- Risposta Admin ---\n${finalMessage}`;
      
      await base44.entities.SupportTicket.update(ticketId, {
        admin_response: finalMessage,
        message: updatedMessage,
        status: 'in_lavorazione'
      });

      const fromEmail = 'info@projectmywellness.com';
      
      await base44.integrations.Core.SendEmail({
        from_name: `MyWellness Support <${fromEmail}>`,
        to: chat.user_email,
        subject: `✅ Risposta al tuo ticket: ${chat.subject}`,
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
                <p style="color: #047857; margin: 0; line-height: 1.8; white-space: pre-wrap;">${chat.newMessage}</p>
              </div>

              ${chat.priority === 'premium' ? `
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

      // Aggiorna la chat locale
      setOpenChats(prev => prev.map(c => 
        c.id === ticketId 
          ? { 
              ...c, 
              admin_response: finalMessage, 
              message: updatedMessage,
              status: 'in_lavorazione',
              newMessage: '' 
            }
          : c
      ));
      
      await loadTickets();
    } catch (error) {
      console.error('Error sending response:', error);
      alert('❌ Errore nell\'invio della risposta');
    }
    setSendingStates(prev => ({ ...prev, [ticketId]: false }));
  };

  const handleCloseTicketFromChat = async (ticketId) => {
    if (!confirm('Sei sicuro di voler chiudere questo ticket?')) {
      return;
    }

    try {
      await base44.entities.SupportTicket.update(ticketId, {
        status: 'risolto',
        resolved_at: new Date().toISOString()
      });

      handleCloseChat(ticketId);
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

  // Filtra per stato prima
  const filterByStatus = (ticketList) => {
    if (statusFilter === 'all') return ticketList;
    return ticketList.filter(t => t.status === statusFilter);
  };

  const premiumTickets = filterByStatus(tickets.filter(t => t.priority === 'premium' && !t.ai_resolved));
  const normalTickets = filterByStatus(tickets.filter(t => t.priority === 'normale' && !t.ai_resolved));
  const allActiveTickets = filterByStatus(tickets.filter(t => !t.ai_resolved));
  const aiResolvedTickets = filterByStatus(tickets.filter(t => t.ai_resolved === true));

  const TicketCard = ({ ticket }) => (
    <div
      onClick={() => handleOpenChat(ticket)}
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

          {/* Filtri per Stato */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setStatusFilter('aperto')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === 'aperto'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Aperti
            </button>
            <button
              onClick={() => setStatusFilter('in_lavorazione')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === 'in_lavorazione'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              In Lavorazione
            </button>
            <button
              onClick={() => setStatusFilter('risolto')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === 'risolto'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Risolti
            </button>
            <button
              onClick={() => setStatusFilter('chiuso')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === 'chiuso'
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chiusi
            </button>
          </div>
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

      {/* Chat Windows - Multiple side by side */}
      <div className="fixed bottom-32 right-6 flex gap-3 z-50" style={{ maxWidth: 'calc(100vw - 48px)' }}>
        {openChats.map((chat, index) => (
          <ChatWindow
            key={chat.id}
            chat={chat}
            onClose={() => handleCloseChat(chat.id)}
            onMinimize={() => handleMinimizeChat(chat.id)}
            onSendMessage={(msgOverride) => handleSendResponse(chat.id, msgOverride)}
            onUpdateMessage={(msg) => updateChatMessage(chat.id, msg)}
            onCloseTicket={() => handleCloseTicketFromChat(chat.id)}
            isSending={sendingStates[chat.id] || false}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function ChatWindow({ chat, onClose, onMinimize, onSendMessage, onUpdateMessage, onCloseTicket, isSending, index }) {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.message, chat.newMessage]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        console.log('📤 Admin uploading file:', file.name);
        
        const response = await base44.integrations.Core.UploadFile({ file });
        console.log('📥 Admin upload response:', JSON.stringify(response));
        
        // Estrai URL in tutti i formati
        let fileUrl = null;
        if (typeof response === 'string') {
          fileUrl = response;
        } else if (response) {
          fileUrl = response.file_url || 
                    response.url || 
                    response.data?.file_url || 
                    response.data?.url;
        }
        
        if (!fileUrl) {
          console.error('❌ File URL not found:', response);
          throw new Error('URL file non ricevuto');
        }
        
        console.log('✅ Admin file uploaded:', fileUrl);
        uploadedUrls.push({ name: file.name, url: fileUrl });
      }
      setAttachedFiles(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('❌ Admin upload error:', error);
      alert('❌ Errore caricamento: ' + error.message);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (url) => {
    setAttachedFiles(prev => prev.filter(f => f.url !== url));
  };

  const handleSendWithAttachments = async () => {
    if (attachedFiles.length > 0) {
      const fileLinks = attachedFiles.map(f => {
        // Controlla se il file è un'immagine dall'estensione
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(f.url);
        // Se è un'immagine, usa il formato markdown immagine, altrimenti link normale
        return isImage ? `![${f.name}](${f.url})` : `[📎 ${f.name}](${f.url})`;
      }).join('\n');
      const messageWithFiles = chat.newMessage.trim() 
        ? `${chat.newMessage}\n\n${fileLinks}` 
        : fileLinks;
      setAttachedFiles([]);
      onUpdateMessage('');
      await onSendMessage(messageWithFiles);
    } else {
      await onSendMessage();
    }
  };

  // Parse messages
  const messageParts = chat.message.split('\n\n---');
  const userMessages = [];
  const adminResponses = [];

  messageParts.forEach((part, idx) => {
    if (idx === 0) {
      userMessages.push({ content: part, timestamp: chat.created_date });
    } else if (part.includes('Risposta Utente')) {
      const content = part.split('---\n')[1];
      userMessages.push({ content, timestamp: null });
    } else if (part.includes('Risposta Admin')) {
      const content = part.split('---\n')[1];
      adminResponses.push({ content, timestamp: null });
    }
  });

  return (
    <div 
      className={`luxury-chat-widget ${chat.isMinimized ? 'w-80 h-16' : 'w-[450px] h-[600px]'} flex flex-col animate-slide-in`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .luxury-chat-widget {
          backdrop-filter: blur(24px) saturate(200%);
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.98) 0%,
            rgba(252, 252, 254, 0.95) 25%,
            rgba(250, 250, 253, 0.92) 50%,
            rgba(252, 252, 254, 0.95) 75%,
            rgba(255, 255, 255, 0.98) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 20px 60px -15px rgba(38, 132, 127, 0.25),
            0 10px 40px -10px rgba(38, 132, 127, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.5) inset,
            0 2px 4px 0 rgba(255, 255, 255, 0.8) inset;
        }
        
        .message-bubble {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .message-bubble:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
        }
        
        .user-message {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #E3F2FD 100%);
          border: 1px solid rgba(100, 181, 246, 0.3);
          color: #0D47A1;
          box-shadow: 
            0 8px 24px -8px rgba(33, 150, 243, 0.3),
            0 4px 12px -4px rgba(33, 150, 243, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        
        .admin-message {
          background: linear-gradient(135deg, #26847F 0%, #1a9e96 50%, #26847F 100%);
          box-shadow: 
            0 8px 24px -8px rgba(38, 132, 127, 0.4),
            0 4px 12px -4px rgba(38, 132, 127, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .ai-message {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(252, 252, 254, 0.9) 50%,
            rgba(255, 255, 255, 0.95) 100%
          );
          border: 1px solid rgba(200, 200, 220, 0.3);
          box-shadow: 
            0 8px 20px -6px rgba(0, 0, 0, 0.08),
            0 4px 12px -4px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        
        .chat-input {
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(200, 200, 220, 0.3);
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 2px rgba(255, 255, 255, 0.9);
          transition: all 0.3s ease;
        }
        
        .chat-input:focus {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(38, 132, 127, 0.4);
          box-shadow: 
            0 4px 16px rgba(38, 132, 127, 0.15),
            inset 0 1px 2px rgba(255, 255, 255, 0.9);
        }
      `}</style>

      {/* Navbar */}
      <div className="relative p-4 border-b border-white/40 bg-gradient-to-r from-white/60 via-white/50 to-white/60 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#26847F]/5 via-transparent to-teal-500/5 opacity-50"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-10 h-10 bg-gradient-to-br from-[#26847F] via-teal-500 to-[#26847F] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#26847F]/30">
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
              <span className="relative text-white text-lg">💬</span>
            </div>
            {!chat.isMinimized && (
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate mb-0.5">{chat.subject}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">{chat.user_email}</span>
                  <Badge className={`text-xs px-2 py-0 font-semibold shadow-sm ${
                    chat.status === 'aperto' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0' :
                    chat.status === 'in_lavorazione' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0' :
                    'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0'
                  }`}>
                    {chat.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              onClick={onMinimize}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-gray-600 hover:text-[#26847F] hover:bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
            >
              {chat.isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-gray-600 hover:text-red-600 hover:bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {!chat.isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent via-white/5 to-transparent">
          {/* User messages and admin responses in order */}
          {userMessages.map((msg, idx) => (
            <div key={`user-${idx}`} className="flex justify-end">
              <div className="message-bubble user-message max-w-[85%] rounded-3xl rounded-tr-md px-5 py-3.5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
              </div>
            </div>
          ))}

          {chat.ai_response && (
            <div className="flex justify-start">
              <div className="message-bubble ai-message max-w-[85%] rounded-3xl rounded-tl-md px-5 py-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <span className="text-white text-base">🤖</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">AI</p>
                  </div>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">{chat.ai_response}</p>
              </div>
            </div>
          )}

          {adminResponses.map((msg, idx) => (
            <div key={`admin-${idx}`} className="flex justify-start">
              <div className="message-bubble admin-message max-w-[85%] text-white rounded-3xl rounded-tl-md px-5 py-3.5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area */}
      {!chat.isMinimized && chat.status !== 'risolto' && chat.status !== 'chiuso' && (
        <div className="relative p-4 border-t border-white/40 bg-gradient-to-t from-white/70 via-white/60 to-white/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#26847F]/3 to-transparent opacity-50"></div>
          <div className="relative space-y-2">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-xl">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border text-sm">
                    <span className="text-gray-700">📎 {file.name}</span>
                    <button
                      onClick={() => removeAttachment(file.url)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Textarea
                  value={chat.newMessage}
                  onChange={(e) => onUpdateMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendWithAttachments();
                    }
                  }}
                  placeholder="Scrivi risposta..."
                  className="chat-input w-full resize-none h-20 rounded-2xl border-2 px-4 py-3 text-sm font-medium placeholder:text-gray-400"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  variant="outline"
                  className="w-full rounded-xl text-xs h-8"
                >
                  {uploadingFile ? 'Caricamento...' : '📎 Allega file'}
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSendWithAttachments}
                  disabled={isSending || (!chat.newMessage.trim() && attachedFiles.length === 0)}
                  className="bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white px-4 rounded-2xl shadow-lg shadow-[#26847F]/30 hover:shadow-xl hover:shadow-[#26847F]/40 transition-all duration-300 disabled:opacity-50 h-10"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={onCloseTicket}
                  variant="outline"
                  className="px-4 h-10 rounded-2xl text-xs border-green-300 text-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Chiudi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}