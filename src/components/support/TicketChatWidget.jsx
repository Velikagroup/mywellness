import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TicketChatWidget({ ticket, onClose, onUpdate }) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      // Aggiungi il nuovo messaggio alla conversation del ticket
      const updatedMessage = `${ticket.message}\n\n--- Risposta Utente (${new Date().toLocaleString('it-IT')}) ---\n${newMessage}`;
      
      await base44.entities.SupportTicket.update(ticket.id, {
        message: updatedMessage,
        status: 'in_lavorazione'
      });

      alert('✅ Messaggio inviato! Il team ti risponderà al più presto.');
      setNewMessage('');
      onUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('❌ Errore nell\'invio del messaggio');
    }
    setIsSending(false);
  };

  return (
    <div className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>

      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-[#26847F] to-teal-600 text-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">💬 Ticket di Supporto</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-white/80">{ticket.subject}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge className="bg-white/20 text-white border-white/30 text-xs">
            {ticket.category}
          </Badge>
          <Badge className={`text-xs ${
            ticket.status === 'aperto' ? 'bg-blue-500' :
            ticket.status === 'in_lavorazione' ? 'bg-yellow-500' :
            'bg-green-500'
          } text-white`}>
            {ticket.status}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* Messaggio originale utente */}
        <div className="flex justify-end">
          <div className="max-w-[85%] bg-[#26847F] text-white rounded-2xl px-4 py-3">
            <p className="text-xs opacity-80 mb-1">Tu - {new Date(ticket.created_date).toLocaleString('it-IT')}</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.message.split('\n\n---')[0]}</p>
          </div>
        </div>

        {/* Risposta AI */}
        {ticket.ai_response && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-white border-2 border-blue-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Assistente AI</p>
                  <p className="text-xs text-gray-500">Risposta automatica</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.ai_response}</p>
            </div>
          </div>
        )}

        {/* Risposte successive dell'utente */}
        {ticket.message.includes('--- Risposta Utente') && (
          ticket.message.split('\n\n---').slice(1).map((msg, idx) => {
            if (msg.includes('Risposta Utente')) {
              const content = msg.split('---\n')[1];
              return (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-[85%] bg-[#26847F] text-white rounded-2xl px-4 py-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                  </div>
                </div>
              );
            }
            return null;
          })
        )}

        {/* Risposta Admin */}
        {ticket.admin_response && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-white border-2 border-green-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">👨‍💼</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Team MyWellness</p>
                  <p className="text-xs text-gray-500">Risposta ufficiale</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.admin_response}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Solo se ticket non è chiuso */}
      {ticket.status !== 'risolto' && ticket.status !== 'chiuso' && !ticket.ai_resolved && (
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi la tua risposta..."
              className="flex-1 resize-none h-20"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              className="bg-[#26847F] hover:bg-[#1f6b66] text-white px-4"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {(ticket.status === 'risolto' || ticket.status === 'chiuso' || ticket.ai_resolved) && (
        <div className="p-4 border-t bg-green-50">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-xl">✅</span>
            <p className="text-sm font-semibold">Ticket chiuso</p>
          </div>
        </div>
      )}
    </div>
  );
}