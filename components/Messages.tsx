
import React, { useState } from 'react';
import { Search, BadgeCheck, MoreHorizontal, Pin, BellOff, PhoneOff, Trash2, CheckCircle, Bell, Phone, PinOff, Users, Plus, ArrowRightLeft } from 'lucide-react';
import { Chat, User } from '../types';
import { CreateGroupModal } from './CreateGroupModal';

interface MessagesProps {
  chats: Chat[];
  onSelectChat: (partner: User) => void;
  onChatAction?: (action: string, chatId: string, partnerName: string) => void;
  currentUser?: User;
  onCreateGroup?: (name: string, participants: string[], isPrivate: boolean) => void;
}

export const Messages: React.FC<MessagesProps> = ({ chats, onSelectChat, onChatAction, currentUser, onCreateGroup }) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'primary' | 'general' | 'groups'>('primary');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  
  const timeSince = (date: number) => {
    const seconds = Math.floor((new Date().getTime() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  }

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  // Filter chats based on tab
  // Primary: 1-on-1 chats NOT in general
  // General: 1-on-1 chats IN general
  // Groups: Group chats
  const displayedChats = chats.filter(chat => {
    if (activeTab === 'groups') return chat.isGroup;
    if (activeTab === 'primary') return !chat.isGroup && !chat.isGeneral;
    if (activeTab === 'general') return !chat.isGroup && chat.isGeneral;
    return true;
  });
  
  return (
    <div className="pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-2xl font-bold text-white">Messages</h2>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-2 rounded-full transition-colors ${isSearchOpen ? 'bg-brand-500/20 text-brand-400' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                title="Search Messages"
            >
                <Search className="w-5 h-5" />
            </button>
            <button 
            className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors group relative"
            title="Create Group"
            onClick={() => setIsGroupModalOpen(true)}
            >
                <Users className="w-5 h-5 text-white" />
                <div className="absolute -bottom-1 -right-1 bg-brand-500 rounded-full border-2 border-black p-0.5">
                    <Plus className="w-2 h-2 text-white" />
                </div>
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6 px-2 border-b border-zinc-800/50 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('primary')}
          className={`pb-3 text-lg font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'primary' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Primary
          {activeTab === 'primary' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-t-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-lg font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'general' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          General
          {activeTab === 'general' && (
             <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-t-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`pb-3 text-lg font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'groups' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Groups
          {activeTab === 'groups' && (
             <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-t-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          )}
        </button>
      </div>

      {isSearchOpen && (
        <div className="relative mb-6 animate-in slide-in-from-top-2 fade-in">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
            type="text" 
            placeholder="Search Direct Messages" 
            autoFocus
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
        </div>
      )}

      <div className="space-y-1 min-h-[50vh]">
        {displayedChats.length === 0 ? (
           <div className="text-center text-zinc-500 py-10">
               <p>
                 {activeTab === 'primary' && "No messages yet."}
                 {activeTab === 'general' && "No general messages."}
                 {activeTab === 'groups' && "No group chats yet."}
               </p>
           </div>
        ) : (
            displayedChats.map((chat) => (
            <div 
                key={chat.id} 
                onClick={() => onSelectChat(chat.partner)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-900/50 transition-colors cursor-pointer group text-left relative ${chat.isPinned ? 'bg-zinc-900/30' : ''}`}
            >
                <div className="relative shrink-0">
                 {chat.isGroup ? (
                   <div className="w-12 h-12 rounded-full bg-brand-900 flex items-center justify-center border border-zinc-700">
                     <Users className="w-6 h-6 text-brand-300" />
                   </div>
                 ) : (
                   <img src={chat.partner.avatarUrl} alt={chat.partner.name} className="w-12 h-12 rounded-full object-cover" />
                 )}
                </div>
                
                <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1">
                    <h3 className="font-bold text-white truncate">
                        {chat.isGroup ? chat.groupName : chat.partner.name}
                    </h3>
                    {!chat.isGroup && (
                        <>
                            {chat.partner.isBot && <BadgeCheck className="w-3.5 h-3.5 text-red-500 fill-red-500/10" />}
                            {chat.partner.verified && !chat.partner.isBot && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />}
                        </>
                    )}
                    {chat.isPinned && <Pin className="w-3 h-3 text-brand-400 rotate-45 ml-1" fill="currentColor" />}
                    {(chat.isMuted || chat.isCallMuted) && <BellOff className="w-3 h-3 text-zinc-500 ml-1" />}
                    </div>
                    <span className="text-xs text-zinc-500">{timeSince(chat.lastMessage.timestamp)}</span>
                </div>
                <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'text-white font-medium' : 'text-zinc-500'}`}>
                    {chat.lastMessage.text}
                </p>
                </div>

                <div className="flex items-center gap-2">
                    {chat.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{chat.unreadCount}</span>
                    </div>
                    )}
                    
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
                            }}
                            className={`p-2 rounded-full transition-colors z-10 relative ${activeMenuId === chat.id ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white hover:bg-zinc-800 opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                            title="More options"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        {activeMenuId === chat.id && onChatAction && (
                            <div className="absolute right-0 top-10 z-50 w-52 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                                <button 
                                    onClick={() => { onChatAction('pin', chat.id, chat.isGroup ? chat.groupName! : chat.partner.name); setActiveMenuId(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                                >
                                    {chat.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                    {chat.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                                </button>
                                <button 
                                    onClick={() => { onChatAction('read', chat.id, chat.isGroup ? chat.groupName! : chat.partner.name); setActiveMenuId(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark as read
                                </button>
                                <button 
                                    onClick={() => { onChatAction('mute', chat.id, chat.isGroup ? chat.groupName! : chat.partner.name); setActiveMenuId(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                                >
                                    {chat.isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                    {chat.isMuted ? 'Unmute Messages' : 'Mute Messages'}
                                </button>
                                 <button 
                                    onClick={() => { onChatAction('muteCall', chat.id, chat.isGroup ? chat.groupName! : chat.partner.name); setActiveMenuId(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                                >
                                    {chat.isCallMuted ? <Phone className="w-4 h-4" /> : <PhoneOff className="w-4 h-4" />}
                                    {chat.isCallMuted ? 'Unmute Calls' : 'Mute Calls'}
                                </button>
                                
                                {!chat.isGroup && (
                                   <button 
                                      onClick={() => { onChatAction(chat.isGeneral ? 'moveToPrimary' : 'moveToGeneral', chat.id, chat.partner.name); setActiveMenuId(null); }}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                                   >
                                      <ArrowRightLeft className="w-4 h-4" />
                                      {chat.isGeneral ? 'Move to Primary' : 'Move to General'}
                                   </button>
                                )}

                                <button 
                                    onClick={() => { onChatAction('delete', chat.id, chat.isGroup ? chat.groupName! : chat.partner.name); setActiveMenuId(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-zinc-800"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            ))
        )}
      </div>
      
      {currentUser && onCreateGroup && (
        <CreateGroupModal 
            isOpen={isGroupModalOpen}
            onClose={() => setIsGroupModalOpen(false)}
            currentUser={currentUser}
            onCreateGroup={onCreateGroup}
        />
      )}
    </div>
  );
};
