
import React, { useState, useEffect, useRef } from 'react';
import { User, Post, NavigationItem } from '../types';
import { PostCard } from './PostCard';
import { EditProfileModal } from './EditProfileModal';
import { MapPin, Link as LinkIcon, Calendar, Settings as SettingsIcon, Eye, MessageSquare, Loader2, BadgeCheck, MoreHorizontal, Flag, Ban } from 'lucide-react';
import { Button } from './Button';
import { sendReport } from '../services/reportService';

interface ProfileProps {
  user: User;
  posts: Post[];
  onLike: (id: string) => void;
  onAddComment: (postId: string, content: string) => void;
  currentUser: User;
  onNavigate: (item: NavigationItem) => void;
  onNavigateToProfile: (userId: string) => void;
  isFollowing: boolean;
  onFollow: (id: string) => void;
  onUpdateUser: (updatedData: Partial<User>) => void;
  onShowFollowing: (userId: string) => void;
  onShowFollowers: (userId: string) => void;
  onStartChat: (user: User) => void;
  onDelete?: (postId: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, posts, onLike, onAddComment, currentUser, onNavigate, onNavigateToProfile, isFollowing, onFollow, onUpdateUser, onShowFollowing, onShowFollowers, onStartChat, onDelete }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isOwnProfile = user.id === currentUser.id;
  
    // Infinite Scroll State
  const [displayCount, setDisplayCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  const joinDate = user.joinDate 
    ? new Date(user.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  // Reset display count when viewing a different user
  useEffect(() => {
    setDisplayCount(5);
  }, [user.id]);

  const displayedPosts = posts.slice(0, displayCount);
  const hasMore = displayCount < posts.length;

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        // Simulate network delay for realistic feel
        setTimeout(() => {
          setDisplayCount((prev) => prev + 5);
          setIsLoadingMore(false);
        }, 800);
      }
    }, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isLoadingMore]);

  const handleReportUser = async () => {
    const reason = window.prompt(`Please state the reason for reporting @${user.handle}:`, "Spam or Harassment");
    if (reason) {
        try {
            await sendReport(currentUser.id, user.id, 'user', reason);
            alert(`User @${user.handle} has been reported. Thank you for keeping Loopzyy safe.`);
        } catch (error) {
            console.error("Failed to report user:", error);
            alert("Failed to submit report. Please try again.");
        }
    }
    setShowMenu(false);
  };

  const handleBlockUser = () => {
    if (window.confirm(`Are you sure you want to block @${user.handle}?`)) {
       alert(`@${user.handle} has been blocked.`);
    }
    setShowMenu(false);
  };


  return (
    <>
      <div className="pb-20 md:pb-0">
        <div className="relative mb-16">
          <div className="h-48 bg-zinc-900 rounded-3xl overflow-hidden">
             {user.bannerUrl && <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
          </div>
          <div className="absolute -bottom-16 left-6 flex items-end gap-4">
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-32 h-32 rounded-full border-4 border-black object-cover bg-zinc-800"
            />
          </div>
          <div className="absolute -bottom-14 right-6 flex items-center gap-2">
             {isOwnProfile ? (
               <>
                 <Button 
                   variant="secondary" 
                   onClick={() => setIsEditModalOpen(true)}
                 >
                   Edit Profile
                 </Button>
                 <Button 
                   variant="secondary" 
                   className="p-2.5 aspect-square"
                   onClick={() => onNavigate(NavigationItem.SETTINGS)}
                   aria-label="Settings"
                 >
                   <SettingsIcon className="w-5 h-5" />
                 </Button>
               </>
             ) : (
              <div className="flex items-center gap-2">
                 <Button 
                   variant="secondary"
                   onClick={() => onStartChat(user)}
                   className="p-2.5 aspect-square"
                 >
                   <MessageSquare className="w-5 h-5" />
                 </Button>
                 <Button 
                   variant={isFollowing ? 'secondary' : 'primary'}
                   onClick={() => onFollow(user.id)}
                 >
                   {isFollowing ? 'Vibing' : 'Vibe'}
                 </Button>
                 
                 <div className="relative">
                    <Button 
                        variant="secondary"
                        className="p-2.5 aspect-square"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                    
                    {showMenu && (
                        <>
                         <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                         <div className="absolute right-0 top-12 z-20 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                            <button 
                                onClick={handleReportUser}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                            >
                                <Flag className="w-4 h-4" />
                                Report User
                            </button>
                             <button 
                                onClick={handleBlockUser}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-zinc-800"
                            >
                                <Ban className="w-4 h-4" />
                                Block User
                            </button>
                         </div>
                        </>
                    )}
                 </div>
              </div>
             )}
          </div>
        </div>
        
        <div className="pt-4 px-2 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              {user.isBot && <BadgeCheck className="w-6 h-6 text-red-500 fill-red-500/10" />}
              {user.verified && !user.isBot && <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500/10" />}
            </div>
            <p className="text-zinc-400">@{user.handle}</p>
          </div>

          {user.bio && (
            <p className="text-zinc-200 mt-4 mb-4 max-w-lg">
              {user.bio}
            </p>
          )}
          
          <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-zinc-500 mb-6 mt-4">
            {user.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {user.location}
              </div>
            )}
            {user.website && (
              <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-brand-400 hover:underline">
                <LinkIcon className="w-4 h-4" /> {user.website}
              </a>
            )}
            {user.joinDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Joined {joinDate}
              </div>
            )}
             <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> {new Intl.NumberFormat().format(user.profileViews || 0)} views
              </div>
          </div>
          
           <div className="border border-zinc-800 rounded-2xl flex divide-x divide-zinc-800 my-6">
             <button onClick={() => onShowFollowing(user.id)} className="flex-1 flex items-center justify-center gap-2 text-sm p-3 hover:bg-zinc-900 rounded-l-2xl">
               <span className="font-bold text-white">{user.followingCount || 0}</span>
               <span className="text-zinc-500">Vibing</span>
             </button>
             <button onClick={() => onShowFollowers(user.id)} className="flex-1 flex items-center justify-center gap-2 text-sm p-3 hover:bg-zinc-900 rounded-r-2xl">
               <span className="font-bold text-white">{user.followersCount || 0}</span>
               <span className="text-zinc-500">Vibers</span>
             </button>
           </div>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <h2 className="font-bold text-xl mb-6 px-2">Posts</h2>
          {displayedPosts.length > 0 ? (
            <>
              {displayedPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={currentUser} 
                  onLike={onLike} 
                  onAddComment={onAddComment}
                  onNavigateToProfile={onNavigateToProfile}
                  onDelete={onDelete}
                />
              ))}
              {hasMore && (
                <div ref={loaderRef} className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-zinc-500">
              <p className="font-semibold text-lg">No posts yet</p>
              <p className="text-sm">When {user.name} posts, you'll see them here.</p>
            </div>
          )}
        </div>
      </div>
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onSave={(updatedData) => {
            onUpdateUser(updatedData);
            setIsEditModalOpen(false);
          }}
        />
      )}
    </>
  );
};
