

import React, { useState, useEffect, useRef } from 'react';
import { User, Chat } from '../types';
import { X, Bell, BellOff, Trash2, LogOut, Shield, UserMinus, Plus, Search, Loader2, MoreVertical, BadgeCheck, Check, Camera, MessageSquare, Lock, Globe, UserPlus } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, collection, query, where, documentId, getDocs, limit } from 'firebase/firestore';
import { updateGroupName, leaveGroup, addMembersToGroup, removeMemberFromGroup, toggleGroupAdmin, toggleChatMute, deleteChat, updateGroupAvatar, updateGroupPermissions, joinGroup } from '../services/chatService';
import { uploadToCloudinary } from '../services/mediaService';
import { Button } from './Button';

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUser: User;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ isOpen, onClose, chatId, currentUser }) => {
  const [chatData, setChatData] = useState<any>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // Add Member State
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !chatId) return;

    const chatRef = doc(db, "chats", chatId);
    const unsubscribe = onSnapshot(chatRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setChatData({ id: snap.id, ...data });
        setNewGroupName(data.groupName || '');
        
        // Fetch Members
        if (data.participants && data.participants.length > 0) {
            try {
                const usersRef = collection(db, "users");
                const memberPromises = data.participants.map((uid: string) => getDoc(doc(db, "users", uid)));
                const memberSnaps = await Promise.all(memberPromises);
                const membersList = memberSnaps
                    .filter(s => s.exists())
                    .map(s => ({ id: s.id, ...s.data() } as User));
                setMembers(membersList);
            } catch (err) {
                console.error("Error fetching group members", err);
            }
        }
      } else {
          onClose(); // Chat deleted
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, chatId]);

  // Search logic for adding members
  useEffect(() => {
    if (!isAddingMembers || searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("handle", ">=", searchQuery.toLowerCase()),
          where("handle", "<=", searchQuery.toLowerCase() + '\uf8ff'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const currentParticipantIds = new Set(chatData?.participants || []);
        const users = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as User))
            .filter(u => !currentParticipantIds.has(u.id)); // Exclude existing members
        setSearchResults(users);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isAddingMembers, chatData]);


  const handleUpdateName = async () => {
      if (!newGroupName.trim()) return;
      await updateGroupName(chatId, newGroupName);
      setIsEditingName(false);
  };

  const handleMuteToggle = async () => {
      const isMuted = chatData?.mutedBy?.includes(currentUser.id);
      await toggleChatMute(chatId, currentUser.id, !isMuted);
  };

  const handleAddMembers = async () => {
      if (selectedUsers.length === 0) return;
      await addMembersToGroup(chatId, selectedUsers.map(u => u.id));
      setIsAddingMembers(false);
      setSelectedUsers([]);
      setSearchQuery('');
  };

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleLeaveGroup = async () => {
      if (window.confirm("Are you sure you want to leave this group?")) {
          await leaveGroup(chatId, currentUser.id);
          onClose();
      }
  };

  const handleDeleteGroup = async () => {
      if (window.confirm("Are you sure you want to delete this group? This cannot be undone.")) {
          await deleteChat(chatId);
          onClose();
      }
  };

  const handleRemoveMember = async (memberId: string) => {
      if (window.confirm("Remove this user?")) {
          await removeMemberFromGroup(chatId, memberId);
      }
      setActiveMenuMemberId(null);
  };

  const handleToggleAdmin = async (memberId: string, isAdmin: boolean) => {
      await toggleGroupAdmin(chatId, memberId, !isAdmin);
      setActiveMenuMemberId(null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploadingAvatar(true);
      try {
          const url = await uploadToCloudinary(file);
          await updateGroupAvatar(chatId, url);
      } catch (error) {
          console.error("Failed to upload group avatar", error);
          alert("Failed to upload image.");
      } finally {
          setIsUploadingAvatar(false);
          if (e.target) e.target.value = '';
      }
  };

  const handleTogglePermissions = async () => {
      const currentSetting = chatData?.onlyAdminsCanPost || false;
      await updateGroupPermissions(chatId, !currentSetting);
  };

  const handleJoinGroup = async () => {
      await joinGroup(chatId, currentUser.id);
  };

  if (!isOpen) return null;

  const isMember = chatData?.participants?.includes(currentUser.id);
  const isAdmin = chatData?.adminIds?.includes(currentUser.id);
  const isMuted = chatData?.mutedBy?.includes(currentUser.id);
  const groupAvatar = chatData?.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatData?.groupName || 'G')}&background=random`;
  const isPrivate = chatData?.isPrivateGroup;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl md:rounded-3xl w-full max-w-md h-[85vh] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 md:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            
            {/* Group Info & Avatar */}
            <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                    <img src={groupAvatar} alt="Group" className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700" />
                    {isAdmin && (
                        <button 
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isUploadingAvatar}
                        >
                            {isUploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
                        </button>
                    )}
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>

                <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between">
                        {isEditingName ? (
                            <div className="flex-1 flex gap-2">
                                <input 
                                    type="text" 
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand-500"
                                    autoFocus
                                />
                                <button onClick={handleUpdateName} className="p-2 bg-brand-600 rounded-lg text-white"><Check className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <h1 className="text-xl font-bold truncate pr-2">{chatData?.groupName}</h1>
                        )}
                        
                        {!isEditingName && isAdmin && (
                            <button 
                                onClick={() => setIsEditingName(true)}
                                className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
                            >
                                Change
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        <span>{isPrivate ? 'Private Group' : 'Public Group'}</span>
                        <span>•</span>
                        <span>{members.length} members</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-zinc-800" />

            {!isMember ? (
                <div className="py-8 text-center space-y-4">
                    {isPrivate ? (
                        <div className="text-zinc-500">
                            <Lock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-semibold">This group is private</p>
                            <p className="text-sm">You must be added by an admin to join.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Globe className="w-12 h-12 mx-auto mb-2 text-brand-500/50" />
                            <p className="text-white">This is a public group.</p>
                            <Button onClick={handleJoinGroup} className="w-full" icon={<UserPlus className="w-4 h-4"/>}>
                                Join Group
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Settings */}
                    <div className="space-y-4">
                        {/* Mute Toggle */}
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3">
                                <BellOff className="w-5 h-5 text-zinc-400" />
                                <span className="font-medium">Mute messages</span>
                            </div>
                            <button 
                                onClick={handleMuteToggle}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isMuted ? 'bg-brand-500' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isMuted ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Only Admins Post Toggle */}
                        {isAdmin && (
                            <div className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-zinc-400" />
                                    <div>
                                        <span className="font-medium block">Restrict messaging</span>
                                        <span className="text-xs text-zinc-500">Only admins can send messages</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleTogglePermissions}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${chatData?.onlyAdminsCanPost ? 'bg-brand-500' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${chatData?.onlyAdminsCanPost ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-zinc-800" />

                    {/* Members Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Members</h3>
                            {isAdmin && (
                                <button 
                                    onClick={() => setIsAddingMembers(!isAddingMembers)}
                                    className="text-brand-400 text-sm font-medium hover:underline"
                                >
                                    {isAddingMembers ? 'Cancel' : 'Add people'}
                                </button>
                            )}
                        </div>

                        {/* Add Member UI */}
                        {isAddingMembers && (
                            <div className="bg-zinc-950/50 rounded-xl p-3 mb-4 border border-zinc-800">
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search to add..."
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>
                                {selectedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedUsers.map(u => (
                                            <div key={u.id} className="flex items-center gap-1 bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full text-xs">
                                                {u.name} <button onClick={() => toggleUserSelection(u)}><X className="w-3 h-3"/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchResults.length > 0 && (
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                        {searchResults.map(u => (
                                            <button 
                                                key={u.id}
                                                onClick={() => toggleUserSelection(u)}
                                                className="w-full flex items-center gap-2 p-2 hover:bg-zinc-800 rounded-lg text-left"
                                            >
                                                <img src={u.avatarUrl} className="w-6 h-6 rounded-full" />
                                                <span className="text-sm truncate flex-1">{u.name}</span>
                                                {selectedUsers.some(sel => sel.id === u.id) && <Check className="w-4 h-4 text-brand-400" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <Button 
                                    onClick={handleAddMembers} 
                                    disabled={selectedUsers.length === 0} 
                                    className="w-full mt-2 py-2 text-sm"
                                >
                                    Add Selected
                                </Button>
                            </div>
                        )}

                        {/* Member List */}
                        <div className="space-y-4 relative">
                            {activeMenuMemberId && <div className="fixed inset-0 z-0 bg-transparent" onClick={() => setActiveMenuMemberId(null)} />}
                            {members.map(member => {
                                const isMemberAdmin = chatData?.adminIds?.includes(member.id);
                                return (
                                    <div key={member.id} className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <p className="font-bold text-sm text-white">{member.name}</p>
                                                    {member.verified && <BadgeCheck className="w-3 h-3 text-blue-500" />}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isMemberAdmin && <span className="text-xs text-brand-400 font-medium">Admin</span>}
                                                    <p className="text-xs text-zinc-500">@{member.handle}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && member.id !== currentUser.id && (
                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuMemberId(activeMenuMemberId === member.id ? null : member.id); }}
                                                    className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                
                                                {activeMenuMemberId === member.id && (
                                                    <div className="absolute right-0 top-8 z-20 w-40 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                                                        <button 
                                                            onClick={() => handleToggleAdmin(member.id, isMemberAdmin)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 text-left"
                                                        >
                                                            <Shield className="w-3 h-3" />
                                                            {isMemberAdmin ? 'Dismiss as Admin' : 'Make Group Admin'}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRemoveMember(member.id)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 text-left"
                                                        >
                                                            <UserMinus className="w-3 h-3" />
                                                            Remove from group
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-zinc-800" />

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        <button 
                            onClick={handleLeaveGroup}
                            className="w-full flex items-center gap-3 text-red-500 hover:text-red-400 transition-colors font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            Leave Chat
                        </button>
                        <p className="text-xs text-zinc-500">
                            You won't be able to send or receive messages unless someone adds you back to the chat. No one will be notified that you left the chat.
                        </p>
                        
                        {isAdmin && (
                            <button 
                                onClick={handleDeleteGroup}
                                className="w-full flex items-center gap-3 text-red-500 hover:text-red-400 transition-colors font-medium mt-4"
                            >
                                <Trash2 className="w-5 h-5" />
                                Delete Chat
                            </button>
                        )}
                    </div>
                </>
            )}

        </div>
      </div>
    </div>
    </>
  );
};