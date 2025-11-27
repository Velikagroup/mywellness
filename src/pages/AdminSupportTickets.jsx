import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Crown, Clock, CheckCircle, Send, X, Minimize2, Maximize2, Paperclip, Search, BarChart3, TrendingUp, Zap, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Component per renderizzare messaggi admin con immagini inline
function AdminMessageContent({ content, onImageClick, isUserMessage = false }) {
  if (!content) return null;
  
  const parts = content.split(/(\!\[[^\]]*\]\([^)]+\)|\[📎[^\]]+\]\([^)]+\))/g);
  
  const textColorClass = isUserMessage ? 'text-[#0D47A1]' : 'text-white';
  
  return (
    <div className={`text-sm leading-relaxed font-medium ${textColorClass} space-y-2`}>
      {parts.map((part, idx) => {
        // Match immagine: ![alt](url)
        const imageMatch = part.match(/\!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
          const altText = imageMatch[1];
          const imageUrl = imageMatch[2];
          return (
            <div key={idx} className="my-2">
              <img 
                src={imageUrl} 
                alt={altText}
                className="max-w-full rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick?.(imageUrl);
                }}
              />
            </div>
          );
        }
        
        // Match file attachment: [📎 nome](url)
        const fileMatch = part.match(/\[📎 ([^\]]+)\]\(([^)]+)\)/);
        if (fileMatch) {
          const fileName = fileMatch[1];
          const fileUrl = fileMatch[2];
          return (
            <a
              key={idx}
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Paperclip className="w-3 h-3" />
              <span className="text-xs">{fileName}</span>
            </a>
          );
        }
        
        // Testo normale
        return part && part.trim() ? (
          <p key={idx} className="whitespace-pre-wrap">{part}</p>
        ) : null;
      })}
    </div>
  );
}

export default function AdminSupportTickets() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [openChats, setOpenChats] = useState([]);
  const [sendingStates, setSendingStates] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showStats, setShowStats] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [topTopics, setTopTopics] = useState(null);
  const [isAnalyzingTopics, setIsAnalyzingTopics] = useState(false);
  const [newResponseTickets, setNewResponseTickets] = useState(new Set());
  const [operators, setOperators] = useState([]);
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [ticketToAssign, setTicketToAssign] = useState(null);
  const ticketsPerPage = 20;

  useEffect(() => {
    checkAccess();
    loadOperators();
  }, []);

  const loadOperators = async () => {
    try {
      const allUsers = await base44.entities.User.list();
      const supportUsers = allUsers.filter(u => 
        u.role === 'admin' || u.custom_role === 'customer_support'
      );
      setOperators(supportUsers);
    } catch (error) {
      console.error('Error loading operators:', error);
    }
  };

  // 🔥 POLLING REAL-TIME per aggiornamenti ticket ogni 2 secondi
  useEffect(() => {
    if (!user) return;

    const pollTickets = async () => {
      try {
        const updatedTickets = await base44.entities.SupportTicket.list('-created_date', 100);
        
        // Identifica ticket con nuove risposte utente
        updatedTickets.forEach(ticket => {
          const oldTicket = tickets.find(t => t.id === ticket.id);
          
          if (oldTicket && ticket.message !== oldTicket.message) {
            // Marca come nuova risposta se è in lavorazione
            if (ticket.status === 'in_lavorazione') {
              setNewResponseTickets(prev => new Set([...prev, ticket.id]));
            }
            
            // 🔥 AGGIORNA ANCHE LE CHAT APERTE IN REAL-TIME
            setOpenChats(prevChats => 
              prevChats.map(chat => 
                chat.id === ticket.id 
                  ? { 
                      ...chat, 
                      message: ticket.message, 
                      status: ticket.status, 
                      admin_response: ticket.admin_response 
                    }
                  : chat
              )
            );
            
            console.log('🔄 Ticket aggiornato in real-time (admin):', ticket.id);
          }
        });
        
        setTickets(updatedTickets);
      } catch (error) {
        console.error('Error polling tickets:', error);
      }
    };

    // Prima chiamata immediata
    pollTickets();
    
    // Poi polling ogni 2 secondi
    const interval = setInterval(pollTickets, 2000);
    return () => clearInterval(interval);
  }, [user]);

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
    // Rimuovi SUBITO dalla lista di nuove risposte (anche se già aperta)
    setNewResponseTickets(prev => {
      const newSet = new Set(prev);
      newSet.delete(ticket.id);
      return newSet;
    });
    
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
    // 🔥 RIMUOVI BADGE APPENA SI SCRIVE (anche al primo carattere)
    setNewResponseTickets(prev => {
      if (prev.has(ticketId)) {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      }
      return prev;
    });
    
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
      
      // Cambia stato in "in_lavorazione" solo se è la prima risposta dell'admin
      const newStatus = chat.status === 'aperto' ? 'in_lavorazione' : chat.status;
      const isFirstResponse = !chat.admin_response && !chat.ai_response;
      
      await base44.entities.SupportTicket.update(ticketId, {
        admin_response: finalMessage,
        message: updatedMessage,
        status: newStatus,
        ...(isFirstResponse && { first_response_at: new Date().toISOString() })
      });

      const fromEmail = 'info@projectmywellness.com';
      
      // Converti markdown immagini in HTML per email
      const emailMessage = finalMessage.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; display: block;" />'
      ).replace(
        /\[📎 ([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" style="color: #26847F; text-decoration: none; font-weight: 600;">📎 $1</a>'
      );

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
                <p style="color: #4b5563; margin: 0; font-size: 16px; font-weight: 600;">${chat.subject}</p>
              </div>

              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 25px; margin: 20px 0;">
                <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">💬 Risposta del Team:</h3>
                <div style="color: #047857; margin: 0; line-height: 1.8;">${emailMessage}</div>
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

      // Non serve più loadTickets - il real-time lo aggiorna automaticamente
      // Aggiorna solo la chat locale
      setOpenChats(prev => prev.map(c => 
        c.id === ticketId 
          ? { 
              ...c, 
              admin_response: finalMessage, 
              message: updatedMessage,
              status: newStatus,
              newMessage: '' 
            }
          : c
      ));
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
        status: 'chiuso',
        resolved_at: new Date().toISOString()
      });

      handleCloseChat(ticketId);
      // Real-time aggiornerà automaticamente
    } catch (error) {
      console.error('Error closing ticket:', error);
      alert('❌ Errore nella chiusura del ticket');
    }
  };

  const handleReopenTicket = async (ticketId) => {
    try {
      await base44.entities.SupportTicket.update(ticketId, {
        status: 'in_lavorazione',
        resolved_at: null
      });
      alert('✅ Ticket riaperto con successo');
    } catch (error) {
      console.error('Error reopening ticket:', error);
      alert('❌ Errore nella riapertura del ticket');
    }
  };

  const handleAssignTicket = async (operatorEmail) => {
    if (!ticketToAssign) return;

    try {
      await base44.entities.SupportTicket.update(ticketToAssign.id, {
        assigned_to: operatorEmail,
        status: ticketToAssign.status === 'aperto' ? 'in_lavorazione' : ticketToAssign.status
      });
      
      setShowAssignModal(false);
      setTicketToAssign(null);
      alert('✅ Ticket assegnato con successo');
    } catch (error) {
      console.error('Error assigning ticket:', error);
      alert('❌ Errore nell\'assegnazione');
    }
  };

  const openAssignModal = (ticket) => {
    setTicketToAssign(ticket);
    setShowAssignModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  // Filtra per stato, operatore assegnato e ricerca
  const filterTickets = (ticketList) => {
    let filtered = ticketList;
    
    // Filtra per stato
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    // Filtra per operatore assegnato
    if (assignedToFilter !== 'all') {
      if (assignedToFilter === 'unassigned') {
        filtered = filtered.filter(t => !t.assigned_to);
      } else if (assignedToFilter === 'me') {
        filtered = filtered.filter(t => t.assigned_to === user?.email);
      } else {
        filtered = filtered.filter(t => t.assigned_to === assignedToFilter);
      }
    }
    
    // Filtra per ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.subject?.toLowerCase().includes(query) ||
        t.message?.toLowerCase().includes(query) ||
        t.user_email?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const premiumTickets = filterTickets(tickets.filter(t => t.priority === 'premium' && !t.ai_resolved));
  const normalTickets = filterTickets(tickets.filter(t => t.priority === 'normale' && !t.ai_resolved));
  const allActiveTickets = filterTickets(tickets.filter(t => !t.ai_resolved));
  const aiResolvedTickets = filterTickets(tickets.filter(t => t.ai_resolved === true));

  // Statistiche mensili/annuali
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const historicalYears = tickets.length > 0 
      ? tickets.map(t => new Date(t.created_date).getFullYear())
      : [];
    
    // Combina anni storici con anni futuri fino al 2030
    const allYears = [
      ...new Set([...historicalYears, currentYear, 2026, 2027, 2028, 2029, 2030])
    ];
    
    return allYears.sort((a, b) => b - a);
  };

  const getMonthlyStats = () => {
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const monthTickets = tickets.filter(t => {
        const date = new Date(t.created_date);
        return date.getFullYear() === selectedYear && date.getMonth() === month;
      });

      const closedTickets = monthTickets.filter(t => t.status === 'chiuso' || t.ai_resolved);
      const aiClosed = monthTickets.filter(t => t.ai_resolved);
      const adminClosed = monthTickets.filter(t => t.status === 'chiuso' && !t.ai_resolved);

      // Calcola tempo medio risposta per il mese (solo ticket con first_response_at)
      const respondedTickets = monthTickets.filter(t => t.first_response_at);
      let avgResponseTime = 0;
      if (respondedTickets.length > 0) {
        const totalSeconds = respondedTickets.reduce((sum, t) => {
          const created = new Date(t.created_date).getTime();
          const responded = new Date(t.first_response_at).getTime();
          return sum + Math.floor((responded - created) / 1000);
        }, 0);
        avgResponseTime = Math.floor(totalSeconds / respondedTickets.length);
      }

      monthlyData.push({
        month: months[month],
        totale: monthTickets.length,
        chiusi: closedTickets.length,
        chiusiAI: aiClosed.length,
        chiusiAdmin: adminClosed.length,
        aperti: monthTickets.filter(t => t.status === 'aperto').length,
        inLavorazione: monthTickets.filter(t => t.status === 'in_lavorazione').length,
        tempoMedio: avgResponseTime
      });
    }

    return monthlyData;
  };

  const monthlyStats = getMonthlyStats();
  const availableYears = getAvailableYears();

  // Analisi AI argomenti più richiesti
  const analyzeTopTopics = async () => {
    setIsAnalyzingTopics(true);
    try {
      const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                          'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
      
      const monthTickets = tickets.filter(t => {
        const date = new Date(t.created_date);
        return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
      });

      if (monthTickets.length === 0) {
        alert('Nessun ticket in questo mese');
        setIsAnalyzingTopics(false);
        return;
      }

      // Prepara i dati per l'AI
      const ticketsSummary = monthTickets.map(t => ({
        subject: t.subject,
        category: t.category,
        message: t.message.split('\n\n---')[0] // Solo il primo messaggio
      }));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analizza questi ${ticketsSummary.length} ticket di supporto del mese di ${monthNames[selectedMonth]} ${selectedYear}.

Ticket:
${JSON.stringify(ticketsSummary, null, 2)}

Identifica i 10 argomenti/problemi più ricorrenti. Per ogni argomento indica:
1. Nome breve dell'argomento (max 5 parole)
2. Descrizione chiara del problema (1-2 frasi)
3. Numero stimato di ticket relativi a questo argomento
4. Categoria prevalente
5. Livello di priorità (bassa/media/alta) in base alla gravità

Rispondi SOLO con un JSON array, nessun altro testo.`,
        response_json_schema: {
          type: "object",
          properties: {
            topics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  count: { type: "number" },
                  category: { type: "string" },
                  priority: { type: "string", enum: ["bassa", "media", "alta"] }
                }
              }
            }
          }
        }
      });

      const data = response.data || response;
      setTopTopics(data.topics || []);
    } catch (error) {
      console.error('Error analyzing topics:', error);
      alert('❌ Errore nell\'analisi AI');
    }
    setIsAnalyzingTopics(false);
  };

  // Paginazione
  const getPaginatedTickets = (ticketList) => {
    const startIndex = (currentPage - 1) * ticketsPerPage;
    const endIndex = startIndex + ticketsPerPage;
    return ticketList.slice(startIndex, endIndex);
  };

  const getTotalPages = (ticketList) => {
    return Math.ceil(ticketList.length / ticketsPerPage);
  };

  const PaginationControls = ({ ticketList }) => {
    const totalPages = getTotalPages(ticketList);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="h-9"
        >
          ← Precedente
        </Button>
        <span className="text-sm text-gray-600 px-3">
          Pagina {currentPage} di {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="h-9"
        >
          Successiva →
        </Button>
      </div>
    );
  };

  const TicketCard = ({ ticket }) => {
  // Estrai le prime immagini dal messaggio
  const imageMatches = ticket.message.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
  const firstImages = imageMatches.slice(0, 2).map(match => {
  const urlMatch = match.match(/\(([^)]+)\)/);
  return urlMatch ? urlMatch[1] : null;
  }).filter(Boolean);

  const isUnopened = ticket.status === 'aperto';
  const isInProgress = ticket.status === 'in_lavorazione';
  const isChatOpen = openChats.some(chat => chat.id === ticket.id);
  const hasNewResponse = newResponseTickets.has(ticket.id) && !isChatOpen;
  const assignedOperator = operators.find(op => op.email === ticket.assigned_to);

  return (
  <div
  className={`p-4 border rounded-xl hover:shadow-lg transition-all cursor-pointer ${
    isUnopened ? 'ticket-unopened' : 
    isInProgress && hasNewResponse ? 'ticket-in-progress ticket-pulsing' : 
    isInProgress ? 'ticket-in-progress' : 
    'water-glass-effect border-gray-200/30'
  }`}
  >
  <div className="flex items-start justify-between gap-3 mb-3">
    <div className="flex-1 min-w-0" onClick={() => handleOpenChat(ticket)}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h3 className="font-bold text-gray-900 text-sm sm:text-base break-words">{ticket.subject}</h3>
        {ticket.priority === 'premium' && <Crown className="w-4 h-4 text-purple-600 flex-shrink-0" />}
        {ticket.ai_resolved && <Badge className="bg-green-100 text-green-700 text-xs">🤖 Chiuso da AI</Badge>}
        {assignedOperator && (
          <Badge className="bg-indigo-100 text-indigo-700 text-xs">
            👤 {assignedOperator.full_name || assignedOperator.email.split('@')[0]}
          </Badge>
        )}
      </div>
            
            {/* Mostra le immagini se presenti */}
            {firstImages.length > 0 && (
              <div className="flex gap-2 mb-3">
                {firstImages.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img 
                      src={url} 
                      alt="Allegato"
                      className="w-full h-full object-cover"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(url, '_blank');
                      }}
                    />
                  </div>
                ))}
                {imageMatches.length > 2 && (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-600 font-semibold">+{imageMatches.length - 2}</span>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
              {ticket.message.split('\n\n---')[0].replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/\[📎[^\]]+\]\([^)]+\)/g, '').trim()}
            </p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{ticket.user_email}</Badge>
              <Badge className="bg-purple-100 text-purple-700 text-xs">{ticket.user_plan}</Badge>
              <Badge className="text-xs">{ticket.category}</Badge>
              {ticket.customer_language && ticket.customer_language !== 'it' && (
                <Badge className="bg-blue-50 text-blue-700 text-xs">
                  🌍 {ticket.customer_language.toUpperCase()}
                </Badge>
              )}
              {hasNewResponse && (
                <Badge className="bg-red-500 text-white text-xs animate-pulse">
                  🔴 Nuova Risposta
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
              ticket.status === 'aperto' ? 'bg-blue-100 text-blue-700' :
              ticket.status === 'in_lavorazione' ? 'bg-yellow-100 text-yellow-700' :
              ticket.status === 'chiuso' || ticket.ai_resolved ? 'bg-transparent text-gray-400 border border-gray-300' :
              'bg-gray-100 text-gray-700'
            }`}>
              {ticket.ai_resolved ? 'chiuso (AI)' : ticket.status}
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                openAssignModal(ticket);
              }}
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2"
            >
              {ticket.assigned_to ? '↻ Riassegna' : '+ Assegna'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {new Date(ticket.created_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <style>{`
        .ticket-unopened {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(191, 219, 254, 0.8) 0%,
            rgba(147, 197, 253, 0.7) 50%,
            rgba(191, 219, 254, 0.8) 100%
          ) !important;
          border: 1px solid rgba(96, 165, 250, 0.6) !important;
          box-shadow: 
            0 8px 32px 0 rgba(59, 130, 246, 0.2),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05) !important;
        }
        
        .ticket-in-progress {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(254, 249, 195, 0.7) 0%,
            rgba(253, 224, 71, 0.5) 50%,
            rgba(254, 249, 195, 0.7) 100%
          ) !important;
          border: 1px solid rgba(250, 204, 21, 0.5) !important;
          box-shadow: 
            0 8px 32px 0 rgba(234, 179, 8, 0.15),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05) !important;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 
              0 8px 32px 0 rgba(234, 179, 8, 0.15),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05),
              0 0 0 0 rgba(250, 204, 21, 0.7);
          }
          50% {
            box-shadow: 
              0 8px 32px 0 rgba(234, 179, 8, 0.3),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05),
              0 0 20px 4px rgba(250, 204, 21, 0.5);
          }
        }

        .ticket-pulsing {
          animation: pulse-glow 2s ease-in-out infinite;
          border: 2px solid rgba(250, 204, 21, 0.8) !important;
        }
      `}</style>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ticket di Supporto</h1>
          <p className="text-sm sm:text-base text-gray-600">Gestisci le richieste di assistenza clienti</p>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per oggetto, messaggio, email o categoria..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#26847F] focus:border-transparent"
            />
          </div>

          {/* Filtri per Stato e Operatore */}
          <div className="space-y-3 mt-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => {
                  setStatusFilter('aperto');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === 'aperto'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Aperti
              </button>
              <button
                onClick={() => {
                  setStatusFilter('in_lavorazione');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === 'in_lavorazione'
                    ? 'bg-yellow-600 text-white shadow-md'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                In Lavorazione
              </button>
              <button
                onClick={() => {
                  setStatusFilter('chiuso');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === 'chiuso'
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Chiusi
              </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-600 font-semibold">Operatore:</span>
              <button
                onClick={() => {
                  setAssignedToFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  assignedToFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => {
                  setAssignedToFilter('me');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  assignedToFilter === 'me'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                I Miei
              </button>
              <button
                onClick={() => {
                  setAssignedToFilter('unassigned');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  assignedToFilter === 'unassigned'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                Non Assegnati
              </button>
              {operators.map(op => (
                <button
                  key={op.email}
                  onClick={() => {
                    setAssignedToFilter(op.email);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    assignedToFilter === op.email
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {op.full_name || op.email.split('@')[0]}
                  {op.languages && op.languages.length > 0 && (
                    <span className="ml-1 opacity-75">({op.languages.join(', ')})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Totale */}
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Totale Ticket</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{tickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Da Gestire */}
          <Card className="water-glass-effect border-gray-200/30">
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

          {/* Chiusi */}
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 truncate">Chiusi</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {tickets.filter(t => t.status === 'chiuso' || t.ai_resolved).length}
                  </p>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-green-600 font-semibold">
                      🤖 {Math.round((aiResolvedTickets.length / Math.max(tickets.filter(t => t.status === 'chiuso' || t.ai_resolved).length, 1)) * 100)}%
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 font-semibold">
                      👤 {Math.round(((tickets.filter(t => t.status === 'chiuso' && !t.ai_resolved).length) / Math.max(tickets.filter(t => t.status === 'chiuso' || t.ai_resolved).length, 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chiusi AI */}
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 truncate">Chiusi AI</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{aiResolvedTickets.length}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    {tickets.length > 0 ? Math.round((aiResolvedTickets.length / tickets.length) * 100) : 0}% del totale
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tempo Medio Risposta */}
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 truncate">Tempo Medio</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {(() => {
                      const respondedTickets = tickets.filter(t => t.first_response_at);
                      if (respondedTickets.length === 0) return '0s';
                      
                      const totalSeconds = respondedTickets.reduce((sum, t) => {
                        const created = new Date(t.created_date).getTime();
                        const responded = new Date(t.first_response_at).getTime();
                        return sum + Math.floor((responded - created) / 1000);
                      }, 0);
                      
                      const avgSeconds = Math.floor(totalSeconds / respondedTickets.length);
                      
                      const hours = Math.floor(avgSeconds / 3600);
                      const mins = Math.floor((avgSeconds % 3600) / 60);
                      const secs = avgSeconds % 60;
                      
                      if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
                      if (mins > 0) return `${mins}m ${secs}s`;
                      return `${secs}s`;
                    })()}
                  </p>
                  <p className="text-xs text-purple-600 font-semibold mt-1">
                    di risposta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiche Mensili/Annuali */}
        <Card className="water-glass-effect border-gray-200/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Statistiche Temporali</h2>
                  <p className="text-xs text-gray-500">Andamento ticket nel tempo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setTopTopics(null);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#26847F]"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <Button
                  onClick={() => setShowStats(!showStats)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {showStats ? 'Nascondi' : 'Mostra'}
                </Button>
              </div>
            </div>

            {showStats && (
              <div className="space-y-6">
                {/* Riepilogo Anno */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 font-semibold mb-1">Totale {selectedYear}</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {monthlyStats.reduce((sum, m) => sum + m.totale, 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-green-600 font-semibold mb-1">Chiusi Totali</p>
                    <p className="text-2xl font-bold text-green-900">
                      {monthlyStats.reduce((sum, m) => sum + m.chiusi, 0)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-semibold mb-1">Chiusi AI</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {monthlyStats.reduce((sum, m) => sum + m.chiusiAI, 0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Chiusi Admin</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {monthlyStats.reduce((sum, m) => sum + m.chiusiAdmin, 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-purple-600 font-semibold mb-1">Tempo Medio</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {(() => {
                        const totalTickets = monthlyStats.reduce((sum, m) => sum + m.totale, 0);
                        if (totalTickets === 0) return '0s';
                        const totalTime = monthlyStats.reduce((sum, m) => sum + (m.tempoMedio * m.totale), 0);
                        const avgSeconds = Math.floor(totalTime / totalTickets);
                        const hours = Math.floor(avgSeconds / 3600);
                        const mins = Math.floor((avgSeconds % 3600) / 60);
                        const secs = avgSeconds % 60;
                        if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
                        if (mins > 0) return `${mins}m ${secs}s`;
                        return `${secs}s`;
                      })()}
                    </p>
                  </div>
                </div>

                {/* Grafico Ticket per Mese */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Ticket per Mese</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="totale" fill="#3b82f6" name="Totale" />
                      <Bar dataKey="chiusiAI" fill="#10b981" name="Chiusi AI" />
                      <Bar dataKey="chiusiAdmin" fill="#6b7280" name="Chiusi Admin" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Grafico Tempo Medio Risposta */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Tempo Medio Risposta</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value) => {
                          const hours = Math.floor(value / 3600);
                          const mins = Math.floor((value % 3600) / 60);
                          const secs = value % 60;
                          if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
                          if (mins > 0) return `${mins}m ${secs}s`;
                          return `${secs}s`;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="tempoMedio" 
                        stroke="#a855f7" 
                        strokeWidth={2}
                        name="Tempo Medio (sec)"
                        dot={{ fill: '#a855f7', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabella Dettagliata */}
                <div className="overflow-x-auto">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Dettaglio Mensile</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="text-left p-2 font-semibold text-gray-700">Mese</th>
                        <th className="text-center p-2 font-semibold text-gray-700">Totale</th>
                        <th className="text-center p-2 font-semibold text-gray-700">Aperti</th>
                        <th className="text-center p-2 font-semibold text-gray-700">In Lav.</th>
                        <th className="text-center p-2 font-semibold text-gray-700">Chiusi</th>
                        <th className="text-center p-2 font-semibold text-gray-700">AI</th>
                        <th className="text-center p-2 font-semibold text-gray-700">Admin</th>
                        <th className="text-center p-2 font-semibold text-gray-700">% AI</th>
                        <th className="text-center p-2 font-semibold text-gray-700">Tempo Medio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyStats.map((stat, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2 font-medium text-gray-900">{stat.month}</td>
                          <td className="p-2 text-center font-semibold text-blue-600">{stat.totale}</td>
                          <td className="p-2 text-center text-orange-600">{stat.aperti}</td>
                          <td className="p-2 text-center text-yellow-600">{stat.inLavorazione}</td>
                          <td className="p-2 text-center font-semibold text-gray-900">{stat.chiusi}</td>
                          <td className="p-2 text-center text-green-600">{stat.chiusiAI}</td>
                          <td className="p-2 text-center text-gray-600">{stat.chiusiAdmin}</td>
                          <td className="p-2 text-center font-semibold text-emerald-600">
                            {stat.chiusi > 0 ? Math.round((stat.chiusiAI / stat.chiusi) * 100) : 0}%
                          </td>
                          <td className="p-2 text-center text-purple-600">
                            {(() => {
                              const hours = Math.floor(stat.tempoMedio / 3600);
                              const mins = Math.floor((stat.tempoMedio % 3600) / 60);
                              const secs = stat.tempoMedio % 60;
                              if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
                              if (mins > 0) return `${mins}m ${secs}s`;
                              return `${secs}s`;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Analisi AI Argomenti Più Richiesti */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">🤖 Analisi AI - Top 10 Argomenti</h3>
                        <p className="text-xs text-gray-500">Argomenti più richiesti nel mese selezionato</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(Number(e.target.value));
                          setTopTopics(null);
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#26847F]"
                      >
                        {['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                          'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'].map((month, idx) => (
                          <option key={idx} value={idx}>{month}</option>
                        ))}
                      </select>
                      <Button
                        onClick={analyzeTopTopics}
                        disabled={isAnalyzingTopics}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs"
                      >
                        {isAnalyzingTopics ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                            Analisi...
                          </>
                        ) : (
                          '🔍 Analizza con AI'
                        )}
                      </Button>
                    </div>
                  </div>

                  {topTopics && topTopics.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {topTopics.map((topic, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {idx + 1}
                              </div>
                              <h4 className="font-bold text-gray-900 text-sm">{topic.name}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                topic.priority === 'alta' ? 'bg-red-100 text-red-700' :
                                topic.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {topic.priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-3 leading-relaxed">{topic.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              📊 <strong className="text-gray-900">{topic.count}</strong> ticket
                            </span>
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-semibold">
                              {topic.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {topTopics && topTopics.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">Nessun argomento identificato per questo mese</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="premium" className="w-full" onValueChange={() => setCurrentPage(1)}>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-3 gap-2 bg-gray-100/80 p-1 rounded-lg">
              <TabsTrigger value="premium" className="text-xs sm:text-sm whitespace-nowrap">
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Premium ({premiumTickets.length})
              </TabsTrigger>
              <TabsTrigger value="normal" className="text-xs sm:text-sm whitespace-nowrap">
                Normali ({normalTickets.length})
              </TabsTrigger>
              <TabsTrigger value="ai_resolved" className="text-xs sm:text-sm whitespace-nowrap">
                🤖 Chiusi AI ({aiResolvedTickets.length})
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
              <>
                {getPaginatedTickets(premiumTickets).map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
                <PaginationControls ticketList={premiumTickets} />
              </>
            )}
          </TabsContent>

          <TabsContent value="normal" className="space-y-3 mt-6">
            {normalTickets.length === 0 ? (
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessun ticket normale in attesa</p>
              </div>
            ) : (
              <>
                {getPaginatedTickets(normalTickets).map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
                <PaginationControls ticketList={normalTickets} />
              </>
            )}
          </TabsContent>

          <TabsContent value="ai_resolved" className="space-y-3 mt-6">
            {aiResolvedTickets.length === 0 ? (
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessun ticket chiuso dall'AI</p>
              </div>
            ) : (
              <>
                {getPaginatedTickets(aiResolvedTickets).map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
                <PaginationControls ticketList={aiResolvedTickets} />
              </>
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
            onReopenTicket={() => handleReopenTicket(chat.id)}
            isSending={sendingStates[chat.id] || false}
            index={index}
            onImageClick={setFullscreenImage}
          />
        ))}
      </div>

      {/* Assign Ticket Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assegna Ticket a Operatore</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {ticketToAssign && (
              <>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-bold text-gray-900 mb-1">{ticketToAssign.subject}</p>
                  <p className="text-xs text-gray-600">{ticketToAssign.user_email}</p>
                  {ticketToAssign.customer_language && (
                    <Badge className="mt-2 bg-blue-50 text-blue-700 text-xs">
                      🌍 Lingua: {ticketToAssign.customer_language.toUpperCase()}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Seleziona operatore:</p>
                  {operators.length === 0 ? (
                    <p className="text-xs text-gray-500">Nessun operatore disponibile</p>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleAssignTicket(null)}
                        variant="outline"
                        className="w-full justify-start text-sm"
                      >
                        ❌ Non assegnato
                      </Button>
                      {operators.map(op => {
                        const languageMatch = ticketToAssign.customer_language && 
                          op.languages?.includes(ticketToAssign.customer_language);
                        
                        return (
                          <Button
                            key={op.email}
                            onClick={() => handleAssignTicket(op.email)}
                            variant="outline"
                            className={`w-full justify-start text-sm ${
                              languageMatch ? 'border-green-300 bg-green-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>
                                👤 {op.full_name || op.email.split('@')[0]}
                                {op.role === 'admin' && <span className="ml-2 text-xs text-purple-600">(Admin)</span>}
                              </span>
                              {op.languages && op.languages.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {op.languages.join(', ')}
                                  {languageMatch && ' ✓'}
                                </span>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Preview */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={fullscreenImage} 
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      </div>
      );
      }

      function ChatWindow({ chat, onClose, onMinimize, onSendMessage, onUpdateMessage, onCloseTicket, onReopenTicket, isSending, index, onImageClick }) {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [quickResponses, setQuickResponses] = useState([]);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);
  const [newResponseTitle, setNewResponseTitle] = useState('');
  const [newResponseContent, setNewResponseContent] = useState('');
  const [newResponseCategory, setNewResponseCategory] = useState('generale');
  const [isImprovingWithAI, setIsImprovingWithAI] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.message, chat.newMessage]);

  // 🔥 NESSUNA subscription locale necessaria - aggiornamenti gestiti dal parent

  useEffect(() => {
    loadQuickResponses();
  }, []);

  const loadQuickResponses = async () => {
    try {
      const responses = await base44.entities.QuickResponse.list('-usage_count', 50);
      setQuickResponses(responses);
    } catch (error) {
      console.error('Error loading quick responses:', error);
    }
  };

  const handleUseQuickResponse = async (response) => {
    onUpdateMessage(response.content);
    setShowQuickResponses(false);
    
    // Incrementa usage_count
    try {
      await base44.entities.QuickResponse.update(response.id, {
        usage_count: (response.usage_count || 0) + 1
      });
      await loadQuickResponses();
    } catch (error) {
      console.error('Error updating usage count:', error);
    }
  };

  const handleSaveQuickResponse = async () => {
    if (!newResponseTitle.trim() || !newResponseContent.trim()) {
      alert('Compila tutti i campi');
      return;
    }

    try {
      if (editingResponse) {
        await base44.entities.QuickResponse.update(editingResponse.id, {
          title: newResponseTitle,
          content: newResponseContent,
          category: newResponseCategory
        });
      } else {
        await base44.entities.QuickResponse.create({
          title: newResponseTitle,
          content: newResponseContent,
          category: newResponseCategory,
          usage_count: 0
        });
      }
      
      await loadQuickResponses();
      setNewResponseTitle('');
      setNewResponseContent('');
      setNewResponseCategory('generale');
      setEditingResponse(null);
      setShowManageDialog(false);
    } catch (error) {
      console.error('Error saving quick response:', error);
      alert('❌ Errore nel salvataggio');
    }
  };

  const handleDeleteQuickResponse = async (id) => {
    if (!confirm('Eliminare questa risposta veloce?')) return;
    
    try {
      await base44.entities.QuickResponse.delete(id);
      await loadQuickResponses();
    } catch (error) {
      console.error('Error deleting quick response:', error);
      alert('❌ Errore nell\'eliminazione');
    }
  };

  const openEditDialog = (response) => {
    setEditingResponse(response);
    setNewResponseTitle(response.title);
    setNewResponseContent(response.content);
    setNewResponseCategory(response.category);
    setShowManageDialog(true);
  };

  const openNewDialog = () => {
    setEditingResponse(null);
    setNewResponseTitle('');
    setNewResponseContent('');
    setNewResponseCategory('generale');
    setShowManageDialog(true);
  };

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

  const handleImproveWithAI = async () => {
    if (!chat.newMessage.trim()) {
      alert('Scrivi prima un messaggio da migliorare');
      return;
    }

    setIsImprovingWithAI(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Sei un assistente clienti professionale di MyWellness, un'app di fitness e nutrizione AI.

CRITICAL RULE: You MUST detect the language of the original message and respond in THE EXACT SAME LANGUAGE.
If the message is in Italian, respond in Italian.
If the message is in English, respond in English.
If the message is in Spanish, respond in Spanish.
If the message is in French, respond in French.
If the message is in German, respond in German.
And so on for ANY language.

Migliora il seguente messaggio di risposta al cliente rendendolo:
- Formale ma cordiale e empatico
- Educato e professionale
- Conciso e chiaro
- Strutturato bene con paragrafi se necessario
- Mantieni TUTTE le informazioni tecniche e i dettagli del messaggio originale
- RISPONDI NELLA STESSA LINGUA DEL MESSAGGIO ORIGINALE

Messaggio originale da migliorare:
"${chat.newMessage}"

Rispondi SOLO con il messaggio migliorato, senza introduzioni o spiegazioni. NELLA STESSA LINGUA DEL MESSAGGIO ORIGINALE.`,
        response_json_schema: {
          type: "object",
          properties: {
            improved_message: { type: "string" }
          }
        }
      });

      const improved = response?.improved_message || response?.data?.improved_message;
      if (improved) {
        onUpdateMessage(improved);
      }
    } catch (error) {
      console.error('Error improving message:', error);
      alert('❌ Errore nel miglioramento AI');
    }
    setIsImprovingWithAI(false);
  };

  const handleSendWithAttachments = async () => {
    let finalMsg = chat.newMessage;
    
    if (attachedFiles.length > 0) {
      const fileLinks = attachedFiles.map(f => {
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(f.url);
        return isImage ? `![${f.name}](${f.url})` : `[📎 ${f.name}](${f.url})`;
      }).join('\n');
      finalMsg = chat.newMessage.trim() 
        ? `${chat.newMessage}\n\n${fileLinks}` 
        : fileLinks;
    }
    
    // Invia prima, poi pulisci
    await onSendMessage(finalMsg);
    setAttachedFiles([]);
    onUpdateMessage('');
  };

  // Parse TUTTI i messaggi dal campo message in ordine cronologico
  const allMessages = [];
  const messageParts = chat.message.split('\n\n---');
  
  messageParts.forEach((part, idx) => {
    if (idx === 0) {
      // Primo messaggio del cliente
      allMessages.push({ 
        type: 'user', 
        content: part, 
        timestamp: chat.created_date 
      });
    } else if (part.includes('Risposta Admin')) {
      // Risposta admin
      const content = part.split('---\n')[1];
      if (content && content.trim()) {
        allMessages.push({ 
          type: 'admin', 
          content, 
          timestamp: null 
        });
      }
    } else if (part.includes('Risposta Utente')) {
      // Risposta successiva cliente
      const content = part.split('---\n')[1];
      if (content && content.trim()) {
        allMessages.push({ 
          type: 'user', 
          content, 
          timestamp: null 
        });
      }
    }
  });
  
  // Aggiungi risposta AI se presente (dopo il primo messaggio utente)
  if (chat.ai_response && allMessages.length === 1) {
    allMessages.splice(1, 0, {
      type: 'ai',
      content: chat.ai_response,
      timestamp: null
    });
  }

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
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 251, 0.75) 100%
          );
          border: 1px solid rgba(156, 163, 175, 0.3);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
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
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(156, 163, 175, 0.3);
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 2px rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
        }

        .chat-input:focus {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(38, 132, 127, 0.4);
          box-shadow: 
            0 4px 16px rgba(38, 132, 127, 0.12),
            inset 0 1px 2px rgba(255, 255, 255, 0.8);
        }
      `}</style>

      {/* Navbar */}
      <div className="relative p-4 border-b border-gray-200/30 backdrop-blur-sm bg-white/30">
        <div className="absolute inset-0 bg-gradient-to-r from-[#26847F]/3 via-transparent to-teal-500/3 opacity-50"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-10 h-10 bg-gradient-to-br from-[#26847F] via-teal-500 to-[#26847F] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#26847F]/30">
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
              <span className="relative text-white text-lg">💬</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate mb-0.5">{chat.subject}</p>
              {!chat.isMinimized && (
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
              )}
            </div>
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

      {/* Messages - Cronologia completa */}
      {!chat.isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
          {allMessages.map((msg, idx) => {
            if (msg.type === 'user') {
              return (
                <div key={idx} className="flex justify-start">
                  <div className="message-bubble user-message max-w-[85%] rounded-3xl rounded-tl-md px-5 py-3.5">
                    {idx === 0 && (
                      <p className="text-xs opacity-75 mb-1.5 font-medium">Cliente - {new Date(chat.created_date).toLocaleString('it-IT')}</p>
                    )}
                    <AdminMessageContent content={msg.content} onImageClick={onImageClick} isUserMessage={true} />
                  </div>
                </div>
              );
            } else if (msg.type === 'ai') {
              return (
                <div key={idx} className="flex justify-start">
                  <div className="message-bubble ai-message max-w-[85%] rounded-3xl rounded-tl-md px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-white text-base">🤖</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">AI</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                  </div>
                </div>
              );
            } else if (msg.type === 'admin') {
              return (
                <div key={idx} className="flex justify-end">
                  <div className="message-bubble admin-message max-w-[85%] text-white rounded-3xl rounded-tr-md px-5 py-3.5">
                    <p className="text-xs opacity-75 mb-1.5 font-medium">Tu (Admin)</p>
                    <AdminMessageContent content={msg.content} onImageClick={onImageClick} isUserMessage={false} />
                  </div>
                </div>
              );
            }
            return null;
          })}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area */}
      {!chat.isMinimized && (
        <div className="relative p-4 border-t border-gray-200/30 backdrop-blur-sm bg-white/30">
          <div className="absolute inset-0 bg-gradient-to-t from-[#26847F]/3 to-transparent opacity-30"></div>
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
                  placeholder="Scrivi risposta... (o usa risposte veloci)"
                  className="chat-input w-full resize-none h-20 rounded-2xl border-2 px-4 py-3 text-sm font-medium placeholder:text-gray-400"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    variant="outline"
                    className="rounded-xl text-xs h-8"
                  >
                    {uploadingFile ? 'Caricamento...' : '📎 Allega'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowQuickResponses(!showQuickResponses)}
                    variant="outline"
                    className="rounded-xl text-xs h-8 bg-purple-50 hover:bg-purple-100 border-purple-200"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Veloci
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImproveWithAI}
                    disabled={isImprovingWithAI || !chat.newMessage.trim()}
                    variant="outline"
                    className="rounded-xl text-xs h-8 bg-blue-50 hover:bg-blue-100 border-blue-200"
                  >
                    {isImprovingWithAI ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                    ) : (
                      <>✨ AI</>
                    )}
                  </Button>
                </div>
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
                {chat.status === 'chiuso' ? (
                  <Button
                    onClick={onReopenTicket}
                    variant="outline"
                    className="px-4 h-10 rounded-2xl text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Riapri
                  </Button>
                ) : (
                  <Button
                    onClick={onCloseTicket}
                    variant="outline"
                    className="px-4 h-10 rounded-2xl text-xs border-green-300 text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Chiudi
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Responses Panel */}
            {showQuickResponses && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-bold text-gray-900">Risposte Veloci</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={openNewDialog}
                      size="sm"
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Nuova
                    </Button>
                    <button
                      onClick={() => setShowQuickResponses(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  {quickResponses.length === 0 ? (
                    <p className="text-center text-gray-500 text-xs py-8">
                      Nessuna risposta veloce salvata
                    </p>
                  ) : (
                    quickResponses.map((response) => (
                      <div
                        key={response.id}
                        className="group p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-purple-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div 
                            onClick={() => handleUseQuickResponse(response)}
                            className="flex-1"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-gray-900">{response.title}</h4>
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                {response.category}
                              </span>
                              {response.usage_count > 0 && (
                                <span className="text-xs text-gray-500">
                                  🔥 {response.usage_count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{response.content}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(response);
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuickResponse(response.id);
                              }}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog Gestione Risposta Veloce */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              {editingResponse ? 'Modifica Risposta Veloce' : 'Nuova Risposta Veloce'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Titolo</Label>
              <Input
                value={newResponseTitle}
                onChange={(e) => setNewResponseTitle(e.target.value)}
                placeholder="Es: Problema login account"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={newResponseCategory} onValueChange={setNewResponseCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Tecnico</SelectItem>
                  <SelectItem value="abbonamento">Abbonamento</SelectItem>
                  <SelectItem value="generale">Generale</SelectItem>
                  <SelectItem value="fatturazione">Fatturazione</SelectItem>
                  <SelectItem value="funzionalita">Funzionalità</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contenuto Risposta</Label>
              <Textarea
                value={newResponseContent}
                onChange={(e) => setNewResponseContent(e.target.value)}
                placeholder="Scrivi la risposta completa..."
                className="mt-1 h-48 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowManageDialog(false);
                  setEditingResponse(null);
                  setNewResponseTitle('');
                  setNewResponseContent('');
                  setNewResponseCategory('generale');
                }}
                variant="outline"
                className="flex-1"
              >
                Annulla
              </Button>
              <Button
                onClick={handleSaveQuickResponse}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {editingResponse ? 'Salva Modifiche' : 'Crea Risposta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}