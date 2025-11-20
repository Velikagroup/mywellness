import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TicketChatWidget({ ticket, onClose, onUpdate }) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [localTicket, setLocalTicket] = useState(ticket);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localTicket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const updatedMessage = `${localTicket.message}\n\n--- Risposta Utente (${new Date().toLocaleString('it-IT')}) ---\n${newMessage}`;
      
      await base44.entities.SupportTicket.update(localTicket.id, {
        message: updatedMessage,
        status: 'in_lavorazione'
      });

      // Aggiorna lo stato locale immediatamente per mostrare il messaggio
      setLocalTicket({ ...localTicket, message: updatedMessage });
      setNewMessage('');
      onUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('❌ Errore nell\'invio del messaggio');
    }
    setIsSending(false);
  };

  return (
    <div className={`fixed ${isMinimized ? 'bottom-6 right-6 w-80 h-16' : 'bottom-6 right-6 w-full sm:w-[450px] h-[600px]'} liquid-glass-widget shadow-2xl z-50 flex flex-col animate-slide-in transition-all duration-300 rounded-2xl overflow-hidden`}>
      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .liquid-glass-widget {
          backdrop-filter: blur(16px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%,
            rgba(249, 250, 251, 0.9) 50%,
            rgba(255, 255, 255, 0.95) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.15),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-[#26847F] to-teal-600 text-white rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold">💬 Ticket di Supporto</h2>
            {!isMinimized && (
              <>
                <p className="text-xs text-white/80 mt-1">{localTicket.subject}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {localTicket.category}
                  </Badge>
                  <Badge className={`text-xs ${
                    localTicket.status === 'aperto' ? 'bg-blue-500' :
                    localTicket.status === 'in_lavorazione' ? 'bg-yellow-500' :
                    'bg-green-500'
                  } text-white`}>
                    {localTicket.status}
                  </Badge>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
          {/* Messaggio originale utente */}
          <div className="flex justify-end">
            <div className="max-w-[85%] bg-[#26847F] text-white rounded-2xl px-4 py-3 shadow-md">
              <p className="text-xs opacity-80 mb-1">Tu - {new Date(localTicket.created_date).toLocaleString('it-IT')}</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{localTicket.message.split('\n\n---')[0]}</p>
            </div>
          </div>

          {/* Risposta AI */}
          {localTicket.ai_response && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white/90 backdrop-blur-sm border border-blue-200/50 rounded-2xl px-4 py-3 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Assistente AI</p>
                    <p className="text-xs text-gray-500">Risposta automatica</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{localTicket.ai_response}</p>
              </div>
            </div>
          )}

          {/* Risposte successive dell'utente */}
          {localTicket.message.includes('--- Risposta Utente') && (
            localTicket.message.split('\n\n---').slice(1).map((msg, idx) => {
              if (msg.includes('Risposta Utente')) {
                const content = msg.split('---\n')[1];
                return (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[85%] bg-[#26847F] text-white rounded-2xl px-4 py-3 shadow-md">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })
          )}

          {/* Risposta Admin - Viene sempre DOPO le risposte utente */}
          {localTicket.admin_response && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white/90 backdrop-blur-sm border border-green-200/50 rounded-2xl px-4 py-3 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👨‍💼</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Team MyWellness</p>
                    <p className="text-xs text-gray-500">Risposta ufficiale</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{localTicket.admin_response}</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area - Solo se ticket non è chiuso */}
      {!isMinimized && localTicket.status !== 'risolto' && localTicket.status !== 'chiuso' && !localTicket.ai_resolved && (
        <div className="p-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm rounded-b-2xl">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Scrivi la tua risposta..."
              className="flex-1 resize-none h-20 bg-white/80 backdrop-blur-sm"
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

      {!isMinimized && (localTicket.status === 'risolto' || localTicket.status === 'chiuso' || localTicket.ai_resolved) && (
        <div className="p-4 border-t border-gray-200/50 bg-green-50/80 backdrop-blur-sm rounded-b-2xl">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-xl">✅</span>
            <p className="text-sm font-semibold">Ticket chiuso</p>
          </div>
        </div>
      )}
    </div>
  );
}