import React from 'react';
import { Home, Search, MessageSquare, User, Plus } from 'lucide-react';
import { NavigationItem } from '../types';

interface BottomNavProps {
  activeItem: NavigationItem;
  onNavigate: (item: NavigationItem) => void;
  onCreatePost: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeItem, onNavigate, onCreatePost }) => {
  const navItems = [
    { id: NavigationItem.HOME, icon: Home },
    { id: NavigationItem.EXPLORE, icon: Search },
    { id: 'CREATE_POST', icon: Plus },
    { id: NavigationItem.MESSAGES, icon: MessageSquare },
    { id: NavigationItem.PROFILE, icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-zinc-800/50 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          if (item.id === 'CREATE_POST') {
            return (
              <button
                key={item.id}
                onClick={onCreatePost}
                className="p-3 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-900/40 -translate-y-4 hover:bg-brand-500 transition-all"
              >
                <Icon className="w-6 h-6" strokeWidth={3} />
              </button>
            )
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as NavigationItem)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                isActive ? 'text-brand-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-brand-400/20' : ''}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};