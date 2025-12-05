

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X, Search, Check, Users, Loader2, BadgeCheck, Globe, Lock } from 'lucide-react';
import { Button } from './Button';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onCreateGroup: (name: string, participants: string[], isPrivate: boolean) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, currentUser, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
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
        const users = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as User))
            .filter(u => u.id !== currentUser.id); // Exclude self
        setSearchResults(users);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser.id]);

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
    setSearchQuery(''); // Clear search after selection for better flow
    setSearchResults([]);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length < 1) return;
    setIsCreating(true);
    await onCreateGroup(groupName, selectedUsers.map(u => u.id), isPrivate);
    setIsCreating(false);
    
    // Reset state
    setGroupName('');
    setSelectedUsers([]);
    setSearchQuery('');
    setIsPrivate(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            Create Group
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* Group Name Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-400 ml-1">Group Name</label>
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. The Vibe Tribe"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="space-y-2">
             <label className="text-sm font-medium text-zinc-400 ml-1">Privacy</label>
             <div className="flex gap-2">
                <button 
                   onClick={() => setIsPrivate(false)}
                   className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${!isPrivate ? 'bg-brand-500/10 border-brand-500 text-brand-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                >
                   <Globe className="w-4 h-4" />
                   <span className="text-sm font-medium">Public</span>
                </button>
                <button 
                   onClick={() => setIsPrivate(true)}
                   className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${isPrivate ? 'bg-brand-500/10 border-brand-500 text-brand-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                >
                   <Lock className="w-4 h-4" />
                   <span className="text-sm font-medium">Private</span>
                </button>
             </div>
             <p className="text-xs text-zinc-500 px-1">
                {isPrivate 
                   ? "Only members can send messages. People must be added by admin." 
                   : "Anyone can find and join this group."}
             </p>
          </div>

          {/* User Search */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-400 ml-1">Add Members</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by handle..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(u => (
                <div key={u.id} className="flex items-center gap-1 bg-brand-500/20 text-brand-300 px-3 py-1 rounded-full text-sm border border-brand-500/30">
                  <span>{u.name}</span>
                  <button onClick={() => toggleUserSelection(u)} className="hover:text-white"><X className="w-3 h-3"/></button>
                </div>
              ))}
            </div>
          )}

          {/* Search Results or Info */}
          <div className="space-y-2 mt-2">
             {isSearching ? (
               <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
             ) : searchResults.length > 0 ? (
               searchResults.map(user => (
                 <button
                   key={user.id}
                   onClick={() => toggleUserSelection(user)}
                   className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                     selectedUsers.some(u => u.id === user.id) ? 'bg-brand-500/20 border border-brand-500/30' : 'hover:bg-zinc-800 border border-transparent'
                   }`}
                 >
                   <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                   <div className="flex-1">
                     <div className="flex items-center gap-1">
                       <p className="font-bold text-white text-sm">{user.name}</p>
                       {user.isBot && <BadgeCheck className="w-3 h-3 text-red-500 fill-red-500/10" />}
                       {user.verified && !user.isBot && <BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-500/10" />}
                     </div>
                     <p className="text-xs text-zinc-400">@{user.handle}</p>
                   </div>
                   {selectedUsers.some(u => u.id === user.id) && <Check className="w-5 h-5 text-brand-400" />}
                 </button>
               ))
             ) : searchQuery && (
               <p className="text-center text-zinc-500 text-sm py-4">No users found.</p>
             )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <Button 
            onClick={handleCreate} 
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
            isLoading={isCreating}
            className="w-full py-3"
          >
            Create Group
          </Button>
        </div>
      </div>
    </div>
  );
};