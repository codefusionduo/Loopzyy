import React from 'react';
import { User } from '../types';
import { X, Loader2, BadgeCheck } from 'lucide-react';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  isLoading: boolean;
  onNavigateToProfile: (userId: string) => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({ isOpen, onClose, title, users, isLoading, onNavigateToProfile }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md h-[70vh] shadow-2xl m-4 flex flex-col animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : users.length > 0 ? (
            <div className="p-2">
              {users.map(user => (
                <button 
                  key={user.id}
                  onClick={() => onNavigateToProfile(user.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-800 transition-colors text-left"
                >
                  <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="flex items-center gap-1">
                       <p className="font-bold text-white">{user.name}</p>
                       {user.isBot && <BadgeCheck className="w-4 h-4 text-red-500 fill-red-500/10" />}
                       {user.verified && !user.isBot && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                    </div>
                    <p className="text-sm text-zinc-400">@{user.handle}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-zinc-500">
              <p>No users to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};