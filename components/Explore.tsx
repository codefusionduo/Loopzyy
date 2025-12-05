
import React, { useState, useEffect } from 'react';
import { Search, Heart, Loader2, BadgeCheck, UserPlus, UserCheck } from 'lucide-react';
import { Post, User } from '../types';
import { db } from '../firebase';
import { collection, query as firestoreQuery, where, limit, getDocs } from 'firebase/firestore';

interface ExploreProps {
  posts: Post[];
  onNavigateToProfile: (userId: string) => void;
  currentUser: User;
  onFollow: (userId: string) => void;
  following: Set<string>;
}

export const Explore: React.FC<ExploreProps> = ({ posts, onNavigateToProfile, currentUser, onFollow, following }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Default to 'Trending' since buttons are removed
  const [activeCategory] = useState('Trending');
  
  // Suggested Users State
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Fetch suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
        setIsLoadingSuggestions(true);
        try {
            // Fetch a batch of users
            // Note: In a real app, this would use a more complex recommendation query
            const usersRef = collection(db, "users");
            const q = firestoreQuery(usersRef, limit(10));
            const snapshot = await getDocs(q);
            
            const users = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as User))
                .filter(u => u.id !== currentUser.id && !following.has(u.id)); // Filter self and already following
            
            setSuggestedUsers(users.slice(0, 5)); // Limit to 5 suggestions
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    fetchSuggestions();
  }, [currentUser.id, following]); // Re-fetch if following changes (optional, but good for immediate update)

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const debounceTimer = setTimeout(async () => {
      try {
        const usersRef = collection(db, "users");
        const q = firestoreQuery(
            usersRef,
            where("handle", ">=", query.toLowerCase()),
            where("handle", "<=", query.toLowerCase() + '\uf8ff'),
            limit(10)
        );

        const querySnapshot = await getDocs(q);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() } as User);
        });
        setResults(users);
      } catch (error) {
        console.error("Error searching users:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);
  
  // Generate different images based on the active category to simulate filtering
  const getCategoryImages = (category: string) => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: `explore-${category}-${i}`,
      url: `https://picsum.photos/seed/${category}${i + 1}/400/${i % 2 === 0 ? 600 : 400}`,
      likes: 100 + (i * 42) + (category.length * 10)
    }));
  };

  const displayImages = getCategoryImages(activeCategory);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for people by @handle..." 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-xl"
        />
      </div>

      {query.trim() === '' ? (
        <>
          {/* Suggested For You Section */}
          {suggestedUsers.length > 0 && (
             <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                <h3 className="font-bold text-lg px-1">Suggested for you</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                   {suggestedUsers.map(user => (
                      <div key={user.id} className="min-w-[150px] w-[150px] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center shrink-0 hover:border-zinc-700 transition-colors">
                         <button onClick={() => onNavigateToProfile(user.id)} className="relative mb-3">
                            <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-800" />
                            {user.isBot && <BadgeCheck className="w-5 h-5 text-red-500 fill-red-500/10 absolute -bottom-1 -right-1 bg-zinc-900 rounded-full" />}
                            {user.verified && !user.isBot && <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/10 absolute -bottom-1 -right-1 bg-zinc-900 rounded-full" />}
                         </button>
                         <h4 className="font-bold text-sm text-white truncate w-full">{user.name}</h4>
                         <p className="text-xs text-zinc-400 truncate w-full mb-3">@{user.handle}</p>
                         <button 
                            onClick={() => onFollow(user.id)}
                            className="w-full py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
                         >
                            <UserPlus className="w-3 h-3" /> Vibe
                         </button>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* Post Grid */}
          <div className="columns-2 md:columns-3 gap-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {displayImages.map((img, i) => (
              <div key={img.id} className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer bg-zinc-900">
                <img src={img.url} alt={activeCategory} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                   <div className="flex items-center gap-2 text-white">
                     <Heart className="w-4 h-4 fill-white" />
                     <span className="text-sm font-medium">{img.likes}</span>
                   </div>
                </div>
              </div>
            ))}
            
            {/* Mix in actual user posts if on Trending tab */}
            {activeCategory === 'Trending' && posts.filter(p => p.image).map((post) => (
               <div key={post.id} className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer bg-zinc-900">
                 <img src={post.image} alt="Post" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white text-xs line-clamp-2 mb-2">{post.content}</p>
                   <div className="flex items-center gap-2 text-white">
                     <Heart className="w-4 h-4 fill-white" />
                     <span className="text-sm font-medium">{post.likes}</span>
                   </div>
                </div>
               </div>
            ))}
          </div>
        </>
      ) : (
        <div className="animate-in fade-in">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map(userResult => (
                <button
                  key={userResult.id}
                  onClick={() => onNavigateToProfile(userResult.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-900/50 transition-colors text-left group"
                >
                  <img src={userResult.avatarUrl} alt={userResult.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                       <p className="font-bold text-white">{userResult.name}</p>
                       {userResult.isBot && <BadgeCheck className="w-4 h-4 text-red-500 fill-red-500/10" />}
                       {userResult.verified && !userResult.isBot && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                    </div>
                    <p className="text-sm text-zinc-400">@{userResult.handle}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-zinc-500 py-8">No results found for "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
};
