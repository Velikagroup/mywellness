import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Send, Minimize2, Maximize2, Paperclip } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Component per renderizzare i messaggi con immagini inline
function MessageContent({ content, isAI = false, isAdmin = false }) {
  if (!content) return null;

  const textColor = isAI || isAdmin ? 'text-gray-800' : 'text-white';
  
  // Split del contenuto per gestire TUTTI i tipi di link markdown
  // Cattura [qualsiasi testo](url) oppure ![alt](url)
  const parts = content.split(/(\[📎[^\]]+\]\([^)]+\)|\!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  
  return (
    <div className={`text-sm leading-relaxed font-medium ${textColor} space-y-2`}>
      {parts.map((part, idx) => {
        // Controlla markdown image: ![alt](url)
        const imageMatch = part.match(/\!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
          const altText = imageMatch[1];
          const imageUrl = imageMatch[2];
          
          return (
            <div key={idx} className="my-2">
              <img 
                src={imageUrl} 
                alt={altText || 'Immagine'}
                className="max-w-full rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(imageUrl, '_blank')}
              />
            </div>
          );
        }
        
        // Controlla link markdown con paperclip: [📎nome](url)
        const paperclipMatch = part.match(/\[📎([^\]]+)\]\(([^)]+)\)/);
        if (paperclipMatch) {
          const fileName = paperclipMatch[1].trim();
          const fileUrl = paperclipMatch[2];
          
          // Controlla se è un'immagine dall'estensione
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileUrl);
          
          if (isImage) {
            return (
              <div key={idx} className="my-2">
                <img 
                  src={fileUrl} 
                  alt={fileName}
                  className="max-w-full rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(fileUrl, '_blank')}
                />
              </div>
            );
          } else {
            // File non immagine - mostra link download
            return (
              <a
                key={idx}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                  isAI || isAdmin ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30'
                } transition-colors`}
              >
                <Paperclip className="w-3 h-3" />
                <span className="text-xs">{fileName}</span>
              </a>
            );
          }
        }
        
        // Controlla link markdown generico: [testo](http...)
        const linkMatch = part.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
        if (linkMatch) {
          const linkText = linkMatch[1];
          const url = linkMatch[2];
          
          // Se l'URL è un'immagine, renderizza come immagine
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
          
          if (isImage) {
            return (
              <div key={idx} className="my-2">
                <img 
                  src={url} 
                  alt={linkText}
                  className="max-w-full rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                />
              </div>
            );
          } else {
            return (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                  isAI || isAdmin ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30'
                } transition-colors underline`}
              >
                <span className="text-xs">{linkText}</span>
              </a>
            );
          }
        }
        
        // Testo normale
        return part && part.trim() ? (
          <p key={idx} className="whitespace-pre-wrap">{part}</p>
        ) : null;
      })}
    </div>
  );
}

export default function TicketChatWidget({ ticket, onClose, onUpdate }) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [localTicket, setLocalTicket] = useState(ticket);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localTicket]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        console.log('📤 Uploading file:', file.name);
        
        let response;
        try {
          response = await base44.integrations.Core.UploadFile({ file });
        } catch (uploadError) {
          console.error('❌ Upload failed:', uploadError);
          throw new Error('Upload fallito: ' + (uploadError.message || 'Errore sconosciuto'));
        }
        
        console.log('📥 Raw response:', JSON.stringify(response));
        
        // Estrai l'URL provando tutti i formati
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
          console.error('❌ File URL not found in response:', response);
          throw new Error('URL file non ricevuto dal server');
        }
        
        console.log('✅ File URL extracted:', fileUrl);
        uploadedUrls.push({ name: file.name, url: fileUrl });
      }
      
      setAttachedFiles(prev => [...prev, ...uploadedUrls]);
      console.log('✅ All files uploaded successfully');
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('❌ Errore caricamento: ' + error.message);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (url) => {
    setAttachedFiles(prev => prev.filter(f => f.url !== url));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachedFiles.length === 0) return;

    setIsSending(true);
    try {
      let messageContent = newMessage.trim();
      
      if (attachedFiles.length > 0) {
        const fileLinks = attachedFiles.map(f => `[📎 ${f.name}](${f.url})`).join('\n');
        messageContent = messageContent 
          ? `${messageContent}\n\n${fileLinks}` 
          : fileLinks;
      }

      const updatedMessage = `${localTicket.message}\n\n--- Risposta Utente (${new Date().toLocaleString('it-IT')}) ---\n${messageContent}`;
      
      await base44.entities.SupportTicket.update(localTicket.id, {
        message: updatedMessage,
        status: 'in_lavorazione'
      });

      setLocalTicket({ ...localTicket, message: updatedMessage });
      setNewMessage('');
      setAttachedFiles([]);
      onUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('❌ Errore nell\'invio del messaggio');
    }
    setIsSending(false);
  };

  return (
    <div className={`fixed ${isMinimized ? 'bottom-32 right-6 w-80 h-16' : 'bottom-32 right-6 w-full sm:w-[450px] h-[600px]'} luxury-chat-widget z-50 flex flex-col animate-slide-in transition-all duration-500`}>
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
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
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
        
        .luxury-chat-widget::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, 
            rgba(38, 132, 127, 0.1) 0%,
            rgba(20, 184, 166, 0.1) 25%,
            rgba(16, 185, 129, 0.1) 50%,
            rgba(20, 184, 166, 0.1) 75%,
            rgba(38, 132, 127, 0.1) 100%
          );
          background-size: 200% 200%;
          animation: shimmer 8s linear infinite;
          border-radius: 24px;
          z-index: -1;
          opacity: 0.5;
        }
        
        .message-bubble {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .message-bubble:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
        }
        
        .user-message {
          background: linear-gradient(135deg, #26847F 0%, #1a9e96 50%, #26847F 100%);
          box-shadow: 
            0 8px 24px -8px rgba(38, 132, 127, 0.4),
            0 4px 12px -4px rgba(38, 132, 127, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .ai-message, .admin-message {
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

      {/* Navbar interna luxury */}
      <div className="relative p-4 border-b border-white/40 bg-gradient-to-r from-white/60 via-white/50 to-white/60 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#26847F]/5 via-transparent to-teal-500/5 opacity-50"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-10 h-10 bg-gradient-to-br from-[#26847F] via-teal-500 to-[#26847F] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#26847F]/30">
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
              <span className="relative text-white text-lg">💬</span>
            </div>
            {!isMinimized && (
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-gray-900 truncate mb-0.5">{localTicket.subject}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">{localTicket.category}</span>
                  <span className="text-xs text-gray-300">•</span>
                  <Badge className={`text-xs px-2.5 py-0.5 font-semibold shadow-sm ${
                    localTicket.status === 'aperto' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0' :
                    localTicket.status === 'in_lavorazione' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0' :
                    'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0'
                  }`}>
                    {localTicket.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-gray-600 hover:text-[#26847F] hover:bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
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

      {/* Messages - Ordine cronologico: dall'alto (più vecchio) al basso (più recente) */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent via-white/5 to-transparent">
          {/* Info Banner 24h */}
          <div className="relative px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white text-sm">⏱️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-1">Riceverai risposta entro 24 ore</p>
                <p className="text-xs text-gray-600 leading-relaxed">Il nostro team sta esaminando la tua richiesta. Nel frattempo, puoi continuare a scrivere qui sotto per aggiungere dettagli.</p>
              </div>
            </div>
          </div>

          {/* 1. Messaggio originale utente (primo cronologicamente) */}
          <div className="flex justify-end">
            <div className="message-bubble user-message max-w-[85%] text-white rounded-3xl rounded-tr-md px-5 py-3.5">
              <p className="text-xs opacity-75 mb-1.5 font-medium">Tu - {new Date(localTicket.created_date).toLocaleString('it-IT')}</p>
              <MessageContent content={localTicket.message.split('\n\n---')[0]} />
            </div>
          </div>

          {/* 2. Risposta Admin (seconda cronologicamente - PRIMA delle risposte successive utente) */}
          {localTicket.admin_response && (
            <div className="flex justify-start">
              <div className="message-bubble admin-message max-w-[85%] rounded-3xl rounded-tl-md px-5 py-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                    <span className="text-white text-base">👨‍💼</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Team MyWellness</p>
                    <p className="text-xs text-gray-500 font-medium">Risposta ufficiale</p>
                  </div>
                </div>
                <MessageContent content={localTicket.admin_response} isAdmin />
              </div>
            </div>
          )}

          {/* 4. Risposte successive dell'utente (ultime cronologicamente - DOPO admin response) */}
          {localTicket.message.includes('--- Risposta Utente') && (
            localTicket.message.split('\n\n---').slice(1).map((msg, idx) => {
              if (msg.includes('Risposta Utente')) {
                const content = msg.split('---\n')[1];
                return (
                  <div key={idx} className="flex justify-end">
                    <div className="message-bubble user-message max-w-[85%] text-white rounded-3xl rounded-tr-md px-5 py-3.5">
                      <MessageContent content={content} />
                    </div>
                  </div>
                );
              }
              return null;
            })
          )}
          
          {/* Ref per scroll automatico all'ultimo messaggio */}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area luxury - Solo se ticket non è chiuso */}
      {!isMinimized && localTicket.status !== 'risolto' && localTicket.status !== 'chiuso' && !localTicket.ai_resolved && (
        <div className="relative p-4 border-t border-white/40 bg-gradient-to-t from-white/70 via-white/60 to-white/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#26847F]/3 to-transparent opacity-50"></div>
          <div className="relative space-y-2">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-white/80 rounded-xl border border-gray-200">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border text-xs">
                    <span className="text-gray-700 font-medium">📎 {file.name}</span>
                    <button
                      onClick={() => removeAttachment(file.url)}
                      className="text-red-500 hover:text-red-700 transition-colors"
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
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Scrivi la tua risposta..."
                  className="chat-input w-full resize-none h-20 rounded-2xl border-2 px-4 py-3 text-sm font-medium placeholder:text-gray-400"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  variant="outline"
                  className="w-full rounded-xl text-xs h-9 font-semibold hover:bg-gray-50 transition-all"
                >
                  {uploadingFile ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-600 border-t-transparent"></div>
                      Caricamento...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5" />
                      Allega file
                    </div>
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isSending || (!newMessage.trim() && attachedFiles.length === 0)}
                className="bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white px-6 rounded-2xl shadow-lg shadow-[#26847F]/30 hover:shadow-xl hover:shadow-[#26847F]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isMinimized && (localTicket.status === 'risolto' || localTicket.status === 'chiuso' || localTicket.ai_resolved) && (
        <div className="relative p-4 border-t border-white/40 bg-gradient-to-t from-green-50/90 via-green-50/70 to-white/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent"></div>
          <div className="relative flex items-center gap-3 text-green-700">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <span className="text-white text-xl">✅</span>
            </div>
            <div>
              <p className="text-sm font-bold">Ticket chiuso</p>
              <p className="text-xs text-green-600">Conversazione conclusa con successo</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}