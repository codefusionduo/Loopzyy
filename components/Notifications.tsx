import React, { useState } from 'react';
import { Notification } from '../types';
import { Heart, MessageCircle, UserPlus, AtSign, Bell, BadgeCheck, CheckCheck, MoreHorizontal } from 'lucide-react';

interface NotificationsProps {
  notifications: Notification[];
  onMarkAllRead?: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkAllRead }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-brand-400 fill-brand-400/20" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />;
      case 'mention': return <AtSign className="w-5 h-5 text-green-400" />;
    }
  };

  const hasUnread = notifications.some(n => !n.read);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
        <Bell className="w-12 h-12 mb-4 opacity-20" />
        <p>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-6 px-2 relative">
        <h2 className="text-xl font-bold">Notifications</h2>
        
        <div className="relative">
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                title="More options"
            >
                <MoreHorizontal className="w-6 h-6" />
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-10 z-20 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                        {hasUnread && onMarkAllRead ? (
                            <button 
                                onClick={() => {
                                    onMarkAllRead();
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                            >
                                <CheckCheck className="w-4 h-4 text-brand-400" />
                                Mark all as read
                            </button>
                        ) : (
                            <div className="px-4 py-3 text-sm text-zinc-500 italic text-center">
                                All caught up!
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>

      {notifications.map((notif) => (
        <div key={notif.id} className={`flex items-start gap-4 p-4 rounded-2xl transition-colors ${notif.read ? 'bg-transparent hover:bg-zinc-900/30' : 'bg-zinc-900/50 border border-zinc-800'}`}>
          <div className="mt-1">{getIcon(notif.type)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <img src={notif.user.avatarUrl} alt={notif.user.name} className="w-8 h-8 rounded-full object-cover" />
              <p className="text-sm flex items-center gap-1 flex-wrap">
                <span className="font-bold text-white flex items-center gap-1">
                    {notif.user.name}
                    {notif.user.isBot && <BadgeCheck className="w-3.5 h-3.5 text-red-500 fill-red-500/10" />}
                    {notif.user.verified && !notif.user.isBot && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />}
                </span>
                <span className="text-zinc-400">
                  {notif.type === 'like' && 'liked your post'}
                  {notif.type === 'comment' && 'commented on your post'}
                  {notif.type === 'follow' && 'started vibing with you'}
                  {notif.type === 'mention' && 'mentioned you'}
                </span>
              </p>
              <span className="text-xs text-zinc-600 ml-auto">{new Date(notif.timestamp).toLocaleDateString()}</span>
            </div>
            {notif.postContent && (
              <p className="text-zinc-500 text-sm line-clamp-2 pl-10 border-l-2 border-zinc-800">
                {notif.postContent}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};