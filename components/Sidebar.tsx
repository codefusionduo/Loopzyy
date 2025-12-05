

import React from 'react';
import { Home, Hash, Bell, User as UserIcon, Settings, LogOut, MessageSquare, FileText, Shield, Radio } from 'lucide-react';
import { NavigationItem } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  activeItem: NavigationItem;
  onNavigate: (item: NavigationItem) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate, onLogout, isAdmin }) => {
  const navItems = [
    { id: NavigationItem.HOME, icon: Home, label: 'Home' },
    { id: NavigationItem.EXPLORE, icon: Hash, label: 'Explore' },
    { id: NavigationItem.RADAR, icon: Radio, label: 'Friend Radar' },
    { id: NavigationItem.MESSAGES, icon: MessageSquare, label: 'Messages' },
    { id: NavigationItem.NOTIFICATIONS, icon: Bell, label: 'Notifications' },
    { id: NavigationItem.PROFILE, icon: UserIcon, label: 'Profile' },
  ];
  
  const bottomNavItems = [
     { id: NavigationItem.POSTS, icon: FileText, label: 'My Posts' },
     { id: NavigationItem.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 p-6 border-r border-zinc-800/50 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Logo size="sm" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-tight">
          Loopzyy
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-brand-600/10 text-brand-400 font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
              }`}
            >
              <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? 'fill-brand-400/20' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {isAdmin && (
           <button
            onClick={() => onNavigate(NavigationItem.ADMIN)}
            className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all duration-200 group mt-4 border border-zinc-800/50 ${
                activeItem === NavigationItem.ADMIN
                ? 'bg-brand-600/10 text-brand-400 font-semibold' 
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
            }`}
          >
            <Shield className={`w-6 h-6 transition-transform group-hover:scale-110 ${activeItem === NavigationItem.ADMIN ? 'fill-brand-400/20' : ''}`} />
            <span>Dashboard</span>
          </button>
        )}
      </nav>

      <div className="pt-6 border-t border-zinc-800/50 space-y-2">
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
             <button 
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-brand-600/10 text-brand-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
       
        <button 
          onClick={onLogout}
          className="flex items-center gap-4 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};