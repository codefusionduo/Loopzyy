
import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage } from '../types';
import { ArrowLeft, Send, Sparkles, Loader2, BadgeCheck, Check, CheckCheck, Image as ImageIcon, X, Phone, Video, Paperclip, FileText, Download, Smile, Reply, MoreVertical, Lock } from 'lucide-react';
import { generateChatReply } from '../services/geminiService';
import { getChatId, sendMessage, markMessageAsRead, addMessageReaction } from '../services/chatService';
import { uploadToCloudinary } from '../services/mediaService';
import { GroupDetailsModal } from './GroupDetailsModal';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ChatViewProps {
  partner: User;
  messages: ChatMessage[];
  currentUser: User;
  onBack: () => void;
  onSendMessage: (text: string, media?: { url: string; type: 'image' | 'video' | 'gif' | 'document'; fileName?: string }, replyTo?: { id: string, text: string, senderId: string }) => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export const ChatView: React.FC<ChatViewProps> = ({ partner, messages, currentUser, onBack, onSendMessage, onVoiceCall, onVideoCall }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastProcessedMessageId = useRef<string | null>(null);

  // Media State
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video' | 'gif' | 'document'; file?: File; fileName?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  // Reaction State
  const [reactionMenu, setReactionMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Group Details Modal State
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
  const isGroupChat = partner.isBot && partner.handle === 'group_chat_placeholder';
  const [groupMetadata, setGroupMetadata] = useState<{ adminIds: string[], onlyAdminsCanPost: boolean } | null>(null);
  
  // Subscribe to Group Metadata for Real-time Permissions
  useEffect(() => {
      if (!isGroupChat) return;
      
      const chatRef = doc(db, "chats", partner.id); // partner.id is chat.id for groups
      const unsubscribe = onSnapshot(chatRef, (doc) => {
          if (doc.exists()) {
              const data = doc.data();
              setGroupMetadata({
                  adminIds: data.adminIds || [],
                  onlyAdminsCanPost: data.onlyAdminsCanPost || false
              });
          }
      });
      return () => unsubscribe();
  }, [isGroupChat, partner.id]);

  const canSendMessage = !isGroupChat || !groupMetadata?.onlyAdminsCanPost || (groupMetadata?.onlyAdminsCanPost && groupMetadata?.adminIds.includes(currentUser.id));

  // Scroll to bottom on new message or when typing starts
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, mediaPreview, replyingTo]);

  // Bot Auto-Reply Logic & Typing Indicator Simulation
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (
      partner.isBot &&
      !isGroupChat && // Don't auto-reply in group chats unless specifically designed
      lastMessage &&
      lastMessage.senderId === currentUser.id &&
      lastMessage.id !== lastProcessedMessageId.current
    ) {
      lastProcessedMessageId.current = lastMessage.id;
      
      const simulateBotResponse = async () => {
        // 1. Short delay before "typing" starts
        await new Promise(resolve => setTimeout(resolve, 600));
        setIsTyping(true);

        try {
          // 2. Generate AI reply
          const textForAI = lastMessage.text || (lastMessage.mediaUrl ? "[User sent an attachment]" : "");
          const aiReply = await generateChatReply(textForAI);
          
          // 3. Variable delay based on reply length to simulate reading/writing time
          const typingDelay = Math.min(Math.max(aiReply.length * 30, 1500), 4000);
          await new Promise(resolve => setTimeout(resolve, typingDelay));

          // 4. Stop typing and send message
          setIsTyping(false);
          
          const chatId = getChatId(currentUser.id, partner.id);
          await sendMessage(chatId, partner.id, aiReply);
          
          // 5. Bot automatically reads user's message
          await markMessageAsRead(chatId, lastMessage.id);
          
        } catch (error) {
          console.error("Bot failed to reply:", error);
          setIsTyping(false);
        }
      };

      simulateBotResponse();
    }
  }, [messages, partner.isBot, currentUser.id, partner.id, isGroupChat]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const handleSend = async () => {
    if ((newMessage.trim() || mediaPreview) && !isUploading) {
      
      let finalMedia: { url: string; type: 'image' | 'video' | 'gif' | 'document'; fileName?: string } | undefined = undefined;

      // Case 1: File needs uploading (Images/Videos/Docs from device)
      if (mediaPreview?.file) {
        setIsUploading(true);
        try {
          const uploadedUrl = await uploadToCloudinary(mediaPreview.file);
          finalMedia = {
            url: uploadedUrl,
            type: mediaPreview.type,
            fileName: mediaPreview.fileName
          };
        } catch (error) {
          console.error("Failed to upload media:", error);
          alert("Failed to upload media. Please try again.");
          setIsUploading(false);
          return;
        }
      } 
      // Case 2: Pre-existing URL (e.g. if we add sticker support later)
      else if (mediaPreview?.url) {
        finalMedia = {
            url: mediaPreview.url,
            type: mediaPreview.type
        };
      }

      const replyContext = replyingTo ? {
          id: replyingTo.id,
          text: replyingTo.text || (replyingTo.mediaUrl ? 'Attachment' : 'Message'),
          senderId: replyingTo.senderId
      } : undefined;

      onSendMessage(newMessage, finalMedia, replyContext);
      
      setNewMessage('');
      setMediaPreview(null);
      setReplyingTo(null);
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMagicReply = async () => {
    const lastMessageFromPartner = [...messages].reverse().find(m => m.senderId !== currentUser.id);
    if (!lastMessageFromPartner) return;

    setIsGeneratingReply(true);
    const textForAI = lastMessageFromPartner.text || (lastMessageFromPartner.mediaUrl ? "[Sent an attachment]" : "");
    const reply = await generateChatReply(textForAI);
    
    if (reply) {
        setNewMessage(reply);
        if (textareaRef.current) {
             setTimeout(() => {
                 if (textareaRef.current) {
                     textareaRef.current.style.height = 'auto';
                     textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                     textareaRef.current.focus();
                 }
             }, 0);
        }
    }
    setIsGeneratingReply(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      setMediaPreview({ url: fileUrl, type: 'image', file });
    } else if (file.type.startsWith('video/')) {
      setMediaPreview({ url: fileUrl, type: 'video', file });
    }
    
    if (event.target) event.target.value = '';
  };

  const handleDocSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setMediaPreview({ 
        url: fileUrl, 
        type: 'document', 
        file, 
        fileName: file.name 
    });
    
    if (event.target) event.target.value = '';
  };

  const handleMessageClick = (msg: ChatMessage) => {
    if (msg.senderId !== currentUser.id && !msg.read) {
        const chatId = isGroupChat ? partner.id : getChatId(currentUser.id, partner.id);
        markMessageAsRead(chatId, msg.id);
    }
  };

  const handleHeaderClick = () => {
      if (isGroupChat) {
          setIsGroupDetailsOpen(true);
      }
  };

  const handleReply = (msg: ChatMessage) => {
      setReplyingTo(msg);
      textareaRef.current?.focus();
  };

  // --- Reaction Handling ---

  const handleTouchStart = (e: React.TouchEvent, msgId: string) => {
    const touch = e.touches[0];
    const { clientX, clientY } = touch;
    
    longPressTimer.current = setTimeout(() => {
      setReactionMenu({ id: msgId, x: clientX, y: clientY });
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); 
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault(); 
    setReactionMenu({ id: msgId, x: e.clientX, y: e.clientY });
  };

  const onSelectReaction = async (emoji: string) => {
    if (!reactionMenu) return;
    const chatId = isGroupChat ? partner.id : getChatId(currentUser.id, partner.id);
    await addMessageReaction(chatId, reactionMenu.id, emoji);
    setReactionMenu(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-50px)] bg-black relative rounded-3xl overflow-hidden border border-zinc-800/50">
       <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-black to-black opacity-50"></div>
      
      {/* Reaction Menu Overlay */}
      {reactionMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setReactionMenu(null)} />
          <div 
            className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-full shadow-2xl p-2 flex gap-2 animate-in fade-in zoom-in-95"
            style={{ 
              top: Math.min(reactionMenu.y - 60, window.innerHeight - 80), 
              left: Math.min(Math.max(10, reactionMenu.x - 100), window.innerWidth - 250) 
            }}
          >
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => onSelectReaction(emoji)}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-zinc-700 rounded-full transition-transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-zinc-800/50 bg-black/50 backdrop-blur-lg z-10 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div 
            className={`flex-1 flex items-center gap-4 ${isGroupChat ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={handleHeaderClick}
        >
            <img src={partner.avatarUrl} alt={partner.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1">
                <div className="flex items-center gap-1">
                    <h2 className="font-bold text-white">{partner.name}</h2>
                    {partner.isBot && <BadgeCheck className="w-4 h-4 text-red-500 fill-red-500/10" />}
                    {partner.verified && !partner.isBot && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                </div>
                <p className="text-sm text-zinc-400 truncate max-w-[200px]">
                    {isGroupChat ? 'Tap for group details' : `@${partner.handle}`}
                </p>
            </div>
        </div>

        {/* Call Buttons */}
        <div className="flex items-center gap-1">
           <button 
             onClick={onVoiceCall}
             className="p-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
             title="Voice Call"
           >
             <Phone className="w-5 h-5" />
           </button>
           <button 
             onClick={onVideoCall}
             className="p-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
             title="Video Call"
           >
             <Video className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar relative">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-50">
                <p>No messages yet.</p>
                <p className="text-sm">Start the vibe!</p>
            </div>
        )}
        {messages.map((msg, index) => {
          const isCurrentUser = msg.senderId === currentUser.id;
          const showAvatar = !isCurrentUser && (index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId);

          return (
            <div key={msg.id} className={`flex items-end gap-2 group/message ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              {showAvatar && <img src={partner.avatarUrl} className="w-6 h-6 rounded-full mb-1" alt="partner avatar"/>}
              {!showAvatar && !isCurrentUser && <div className="w-6"></div>}
              
              <div className={`flex items-center gap-1 max-w-[85%] flex-row`}>
                  {/* Message Bubble */}
                  <div 
                    onClick={() => handleMessageClick(msg)}
                    onTouchStart={(e) => handleTouchStart(e, msg.id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd} 
                    onContextMenu={(e) => handleContextMenu(e, msg.id)}
                    className={`p-3 rounded-2xl relative cursor-pointer transition-transform active:scale-95 select-none w-full ${
                      isCurrentUser
                        ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-br-none shadow-md shadow-brand-900/20'
                        : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
                    }`}
                  >
                    {msg.replyToText && (
                      <div className={`border-l-2 pl-2 opacity-70 mb-1.5 text-xs ${isCurrentUser ? 'border-white/50' : 'border-brand-500/50'}`}>
                        <p className="font-bold">{msg.replyToSender === currentUser.id ? "You" : (partner.handle === 'group_chat_placeholder' ? 'Someone' : partner.name)}</p>
                        <p className="line-clamp-1">{msg.replyToText}</p>
                      </div>
                    )}
                    
                    {/* Media Rendering */}
                    {msg.mediaUrl && (
                      <div className={`mb-2 rounded-lg overflow-hidden ${msg.text ? '' : 'mb-0'}`}>
                        {msg.mediaType === 'image' || msg.mediaType === 'gif' ? (
                          <img src={msg.mediaUrl} alt="attachment" className="w-full h-auto max-h-60 object-cover" />
                        ) : msg.mediaType === 'video' ? (
                          <video src={msg.mediaUrl} controls className="w-full h-auto max-h-60 bg-black" />
                        ) : msg.mediaType === 'document' ? (
                          <a 
                            href={msg.mediaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-zinc-600/50 hover:bg-black/40 transition-colors"
                            onClick={(e) => e.stopPropagation()} // Prevent message click handler
                          >
                              <div className="bg-brand-500/20 p-2 rounded-lg">
                                <FileText className="w-6 h-6 text-brand-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{msg.fileName || 'Document'}</p>
                                <p className="text-xs text-zinc-400">Tap to view</p>
                              </div>
                              <Download className="w-4 h-4 text-zinc-400" />
                          </a>
                        ) : null}
                      </div>
                    )}

                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                    
                    {/* Visual Indicators */}
                    <div className="flex justify-end items-center gap-1 mt-1">
                        {isCurrentUser && (
                            <span className="opacity-80">
                                {msg.read ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-blue-200" strokeWidth={2.5} />
                                ) : (
                                    <Check className="w-3.5 h-3.5 text-zinc-300" />
                                )}
                            </span>
                        )}
                    </div>

                    {/* Reaction Display */}
                    {msg.reaction && (
                      <div className={`absolute -bottom-3 ${isCurrentUser ? '-left-2' : '-right-2'} bg-zinc-800 border border-zinc-700 p-1 rounded-full text-xs shadow-sm shadow-black/50 z-10 animate-in zoom-in spin-in-12`}>
                        {msg.reaction}
                      </div>
                    )}
                    
                    {!isCurrentUser && !msg.read && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-brand-500 rounded-full border-2 border-black animate-pulse"></span>
                    )}
                  </div>

                  {/* Inline Actions */}
                  <div className={`flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity px-1`}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setReactionMenu({ id: msg.id, x: e.clientX, y: e.clientY }); }} 
                        className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800 rounded-full transition-colors"
                        title="React"
                      >
                          <Smile className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleReply(msg); }} 
                        className="p-1.5 text-zinc-400 hover:text-brand-400 hover:bg-zinc-800 rounded-full transition-colors"
                        title="Reply"
                      >
                          <Reply className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                        title="More"
                      >
                          <MoreVertical className="w-4 h-4" />
                      </button>
                  </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-end gap-2 justify-start animate-in fade-in slide-in-from-bottom-1">
             <img src={partner.avatarUrl} className="w-6 h-6 rounded-full mb-1" alt="partner avatar" />
             <div className="bg-zinc-800 p-3 rounded-2xl rounded-bl-none text-zinc-400 flex items-center gap-1 h-10 min-w-[3rem]">
               <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
               <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
             </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 border-t border-zinc-800/50 bg-black/50 backdrop-blur-lg shrink-0 relative">
         
         {!canSendMessage && (
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-t-2xl">
                 <div className="flex items-center gap-2 text-zinc-400 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                     <Lock className="w-4 h-4" />
                     <span className="text-sm font-medium">Only admins can send messages</span>
                 </div>
             </div>
         )}

         {/* Reply Banner */}
         {replyingTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-t border-x border-zinc-800 rounded-t-2xl mx-2 -mb-2 z-0 relative top-2 shadow-lg">
                <div className="flex flex-col text-sm border-l-2 border-brand-500 pl-3">
                    <span className="text-brand-400 font-bold text-xs mb-0.5">
                        Replying to {replyingTo.senderId === currentUser.id ? 'Yourself' : (isGroupChat ? 'Someone' : partner.name)}
                    </span>
                    <span className="text-zinc-400 line-clamp-1 text-xs">
                        {replyingTo.text || (replyingTo.mediaUrl ? 'Attachment' : '')}
                    </span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-zinc-800 rounded-full">
                    <X className="w-4 h-4 text-zinc-500" />
                </button>
            </div>
         )}

         {/* Media Preview Above Input */}
         {mediaPreview && (
           <div className="px-2 pb-2 flex items-center gap-2">
              <div className="relative group max-w-full">
                {mediaPreview.type === 'video' ? (
                  <video src={mediaPreview.url} className="h-20 w-auto rounded-lg border border-zinc-700 bg-black" />
                ) : mediaPreview.type === 'image' || mediaPreview.type === 'gif' ? (
                  <img src={mediaPreview.url} alt="preview" className="h-20 w-auto rounded-lg border border-zinc-700 object-cover" />
                ) : (
                  <div className="h-20 w-auto min-w-[150px] p-2 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center gap-2">
                     <FileText className="w-8 h-8 text-brand-400" />
                     <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate max-w-[120px]">{mediaPreview.fileName || 'Document'}</p>
                        <p className="text-[10px] text-zinc-400">Ready to send</p>
                     </div>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setMediaPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    if (docInputRef.current) docInputRef.current.value = '';
                  }}
                  className="absolute -top-1 -right-1 bg-black/70 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
           </div>
         )}

        <div className="flex items-end gap-2 bg-zinc-900 rounded-2xl p-2 border border-zinc-700/50 focus-within:border-brand-500 transition-colors relative z-10">
          {/* Gallery Button */}
          <button 
             className="p-2 text-zinc-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all"
             onClick={() => fileInputRef.current?.click()}
             title="Add Image/Video"
             disabled={!canSendMessage}
          >
             <ImageIcon className="w-6 h-6" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*"
            onChange={handleFileSelect}
          />

           {/* Document Button */}
          <button 
             className="p-2 text-zinc-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all"
             onClick={() => docInputRef.current?.click()}
             title="Add Document"
             disabled={!canSendMessage}
          >
             <Paperclip className="w-6 h-6" />
          </button>
          <input 
            type="file" 
            ref={docInputRef} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.txt,.zip,.xls,.xlsx"
            onChange={handleDocSelect}
          />
          
          <button 
            className="flex items-center gap-2 px-2 py-2 text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all disabled:opacity-50 shrink-0"
            onClick={handleMagicReply}
            disabled={isGeneratingReply || messages.length === 0 || !canSendMessage}
            title="Generate AI Reply"
          >
             {isGeneratingReply ? (
                <Loader2 className="w-5 h-5 animate-spin"/>
             ) : (
                <Sparkles className="w-5 h-5" />
             )}
          </button>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mediaPreview ? "Add a caption..." : "Message..."}
            className="w-full bg-transparent text-white placeholder-zinc-500 resize-none focus:outline-none max-h-32 no-scrollbar py-2"
            disabled={!canSendMessage}
          />
          <div className="flex items-center gap-1">
             <button 
               onClick={handleSend} 
               disabled={(!newMessage.trim() && !mediaPreview) || isUploading || !canSendMessage} 
               className="p-2 text-zinc-400 hover:text-brand-400 disabled:opacity-50"
             >
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
             </button>
          </div>
        </div>
      </div>
      
      {/* Group Details Modal */}
      {isGroupChat && (
          <GroupDetailsModal 
            isOpen={isGroupDetailsOpen} 
            onClose={() => setIsGroupDetailsOpen(false)} 
            chatId={partner.id} 
            currentUser={currentUser}
          />
      )}
    </div>
  );
};
