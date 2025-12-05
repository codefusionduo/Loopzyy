





import React, { useState, useEffect, useRef } from 'react';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { StoriesBar } from './components/StoriesBar';
import { CreatePost } from './components/CreatePost';
import { PostCard } from './components/PostCard';
import { Explore } from './components/Explore';
import { Notifications } from './components/Notifications';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { Messages } from './components/Messages';
import { ChatView } from './components/ChatView';
import { UserPosts } from './components/UserPosts';
import { CreatePostModal } from './components/CreatePostModal';
import { UserListModal } from './components/UserListModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CallModal } from './components/CallModal';
import { RadarView } from './components/RadarView';
import { Toast, ToastMessage } from './components/Toast';
import { Post, User, NavigationItem, Comment, Story, Chat, ChatMessage, Notification as AppNotification, CallSession } from './types';
import { Search, UserPlus, Check, Bell, Radio } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, runTransaction, increment, query, where, documentId, deleteDoc } from "firebase/firestore";
import { Logo } from './components/Logo';
import { getChatId, subscribeToChat, sendMessage, subscribeToUserChats, initializeBotChat, deleteChat, toggleChatPin, toggleChatMute, toggleChatCallMute, markChatRead, createGroupChat, toggleChatCategory } from './services/chatService';
import { createPost, subscribeToPosts, toggleLikePost, addCommentToPost, deletePost } from './services/postService';
import { markAllNotificationsAsRead } from './services/notificationService';


// Initial Dummy Data (used for seeding or fallback)
const INITIAL_STORIES: Story[] = [];

const INITIAL_NOTIFICATIONS: AppNotification[] = [];


const DUMMY_USERS_TO_SEED: User[] = [
  {
    id: 'u2',
    name: 'Loopzyy Bot',
    handle: 'loopzyy_bot',
    avatarUrl: 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Crect%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22%232563eb%22%2F%3E%3Cpath%20d%3D%22M12%2012C10%209.33%207%208%205%208C2.79%208%201%209.79%201%2012C1%2014.21%202.79%2016%205%2016C7%2016%2010%2014.67%2012%2012ZM12%2012C14%2014.67%2017%2016%2019%2016C21.21%2016%2023%2014.21%2023%2012C23%209.79%2021.21%208%2019%208C17%208%2014%209.33%2012%2012Z%22%20stroke%3D%22white%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',
    bannerUrl: `https://picsum.photos/seed/loopzyy-banner/1000/400`,
    bio: 'I am the official AI assistant of Loppzyy. Here to help and vibe! 🤖✨',
    location: 'Cloud 9',
    website: 'Loopzyy.vercel.app',
    joinDate: new Date('2025-11-01').getTime(),
    followingCount: 0,
    followersCount: 0,
    profileViews: 0,
    isBot: true,
    verified: true
  }
];


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeNav, setActiveNav] = useState<NavigationItem>(NavigationItem.HOME);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [viewedProfile, setViewedProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [activeChatPartner, setActiveChatPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  
  // Call Session State
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);

  // Camera/Media Upload State
  const [initialPostMedia, setInitialPostMedia] = useState<{ url: string, type: 'image' | 'video', file?: File } | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // State for User List Modal
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [userList, setUserList] = useState<User[]>([]);
  const [userListTitle, setUserListTitle] = useState('');
  const [isUserListLoading, setIsUserListLoading] = useState(false);
  
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestNotificationPermission = async () => {
    if ('Notification' in window && notificationPermission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };


  useEffect(() => {
    const seedDatabase = async () => {
      // CLEANUP: Delete unwanted users if they exist in DB
      try {
        await deleteDoc(doc(db, "users", "u3")); // Nature Lover
        await deleteDoc(doc(db, "users", "u4")); // Alex Design
      } catch (e) {
        console.log("Cleanup: users already deleted or permission denied", e);
      }

      for (const userData of DUMMY_USERS_TO_SEED) {
        const userDocRef = doc(db, "users", userData.id);
        try {
          // ALWAYS update the bot user to ensure latest metadata (name, handle, isBot flag)
          // This fixes the issue where Sarah Tech persisted if she was already in the DB
          await setDoc(userDocRef, userData, { merge: true });
        } catch (error) {
          console.error("Error seeding user:", userData.id, error);
        }
      }
    };

    seedDatabase();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        const isSuperAdmin = firebaseUser.email === 'codefusionduo@gmail.com';

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as Omit<User, 'id'>;
          
          // AUTO-VERIFY logic for Admin or 'loopzyy' handle
          if ((isSuperAdmin || userData.handle === 'loopzyy') && !userData.verified) {
             try {
                await updateDoc(userDocRef, { verified: true });
                userData.verified = true;
             } catch (err) {
                console.error("Error auto-verifying user", err);
             }
          }
          
          // SELF-HEALING: Backfill email if missing in Firestore (for old accounts)
          if (!userData.email && firebaseUser.email) {
             try {
                await updateDoc(userDocRef, { email: firebaseUser.email });
                userData.email = firebaseUser.email;
             } catch (err) {
                console.error("Error backfilling email", err);
             }
          }

          setUser({ 
            id: firebaseUser.uid, 
            email: firebaseUser.email || '',
            ...userData,
            isAdmin: isSuperAdmin // Enforce admin status based on email
          });
          
          const followingRef = collection(db, "users", firebaseUser.uid, "following");
          const followingSnap = await getDocs(followingRef);
          const followingIds = new Set<string>();
          followingSnap.forEach(doc => followingIds.add(doc.id));
          setFollowing(followingIds);
          
          requestNotificationPermission();
          
          // Initialize Chat with Bot for new or existing users
          initializeBotChat(firebaseUser.uid);

        } else {
          console.warn("User document not found in Firestore. Creating one from auth details.");
          const displayName = firebaseUser.displayName || firebaseUser.email || '';
          const [namePart, handlePart] = displayName.split('|');
          const newUserDocData = {
              name: namePart || 'Anonymous',
              handle: handlePart || namePart?.toLowerCase().replace(/\s+/g, '_').replace('@', '') || firebaseUser.email?.split('@')[0] || 'user',
              email: firebaseUser.email || '',
              avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/200/200`,
              bannerUrl: `https://picsum.photos/seed/${firebaseUser.uid}/1000/400`,
              bio: '',
              location: '',
              website: '',
              joinDate: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now(),
              followingCount: 0,
              followersCount: 0,
              profileViews: 0,
              verified: isSuperAdmin // Auto verify if creating admin account
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newUserDocData);
          setUser({ 
            id: firebaseUser.uid, 
            email: firebaseUser.email || '',
            ...newUserDocData,
            isAdmin: isSuperAdmin 
          });
          requestNotificationPermission();
          
          // Initialize Chat with Bot
          initializeBotChat(firebaseUser.uid);
        }
      } else {
        setUser(null);
        setFollowing(new Set());
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);
  
  // Real-time Chat Subscription (Active Chat)
  useEffect(() => {
    let unsubscribe: () => void;

    if (activeChatPartner && user) {
       // If it's a group, the chatId IS the activeChatPartner.id (we used a hack in Messages component)
       // OR we assume activeChatPartner ID is valid.
       let chatId;
       if (activeChatPartner.isBot && activeChatPartner.handle === 'group_chat_placeholder') {
          chatId = activeChatPartner.id;
       } else {
          chatId = getChatId(user.id, activeChatPartner.id);
       }
       
       unsubscribe = subscribeToChat(chatId, (newMessages) => {
         setMessages(newMessages);
       });
    } else {
        setMessages([]);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeChatPartner, user]);

  // Global Chat Listener (Notifications & Chat List)
  useEffect(() => {
    if (!user) return;

    // Subscribe to all chats to update list and send notifications
    const unsubscribe = subscribeToUserChats(user.id, async (changeType, chatData, chatId) => {
      // If removed (deleted), remove from state
      if (changeType === 'removed') {
          setUserChats(prev => prev.filter(c => c.id !== chatId));
          return;
      }
      
      let partner: User;
      
      if (chatData.isGroup) {
          // For groups, construct a dummy User object to represent the group
          partner = {
             id: chatId, // Use chat ID as user ID for groups
             name: chatData.groupName || 'Group Chat',
             handle: 'group_chat_placeholder', // Flag to identify group in activeChatPartner check
             avatarUrl: chatData.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatData.groupName || 'G')}&background=random`,
             isBot: true // Hack to allow special handling if needed
          } as User;
      } else {
          // 1-on-1 Chat logic
          const otherUserId = chatData.participants.find((id: string) => id !== user.id);
          if (!otherUserId) return;
          
          try {
             const userDoc = await getDoc(doc(db, "users", otherUserId));
             if (userDoc.exists()) {
                 partner = { id: userDoc.id, ...userDoc.data() } as User;
             } else {
                 return; // Partner not found
             }
          } catch(err) {
              console.error("Error fetching chat partner", err);
              return;
          }
      }

      // Handle updating the chat list in state
      if (changeType === 'added' || changeType === 'modified') {
          const newChat: Chat = {
              id: chatId,
              partner: partner,
              messages: [], // We don't need full history here, just metadata
              lastMessage: {
                  text: chatData.lastMessage?.text || 'Started a conversation',
                  timestamp: chatData.lastMessage?.timestamp?.toMillis ? chatData.lastMessage.timestamp.toMillis() : Date.now()
              },
              unreadCount: 0, // In a real app we'd query unread count from subcollection
              isPinned: chatData.pinnedBy?.includes(user.id),
              isMuted: chatData.mutedBy?.includes(user.id),
              isCallMuted: chatData.callMutedBy?.includes(user.id),
              isGeneral: chatData.generalBy?.includes(user.id),
              isGroup: chatData.isGroup,
              groupName: chatData.groupName,
              adminIds: chatData.adminIds,
              isPrivateGroup: chatData.isPrivateGroup
          };

          setUserChats(prev => {
              const existingIndex = prev.findIndex(c => c.id === chatId);
              let updated = [...prev];
              if (existingIndex >= 0) {
                  updated[existingIndex] = newChat;
              } else {
                  updated = [newChat, ...prev];
              }
              
              // Sort: Pinned first, then by date
              return updated.sort((a, b) => {
                  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                  return b.lastMessage.timestamp - a.lastMessage.timestamp;
              });
          });

          // Notification Logic (only for modified/new messages)
          const isMuted = chatData.mutedBy?.includes(user.id);
          if (changeType === 'modified' && !isMuted) {
                const now = Date.now();
                const msgTime = chatData.lastMessage.timestamp?.toMillis ? chatData.lastMessage.timestamp.toMillis() : Date.now();
                const isRecent = (now - msgTime) < 5000;
                
                if (isRecent) {
                    // Check if we are currently looking at this chat
                    const isChattingWithSender = activeChatPartner?.id === (chatData.isGroup ? chatId : partner.id);
                    
                    if (!isChattingWithSender || document.hidden) {
                        showToast(partner.name, chatData.lastMessage?.text, 'message');
                        
                        if (notificationPermission === 'granted' && document.hidden) {
                            new Notification(`Message from ${partner.name}`, {
                                body: chatData.lastMessage?.text,
                                icon: partner.avatarUrl
                            });
                        }
                    }
                }
          }
      }
    });

    return () => unsubscribe();
  }, [user, activeChatPartner, notificationPermission]);

  
  // Real-time Posts Subscription
  useEffect(() => {
    const unsubscribe = subscribeToPosts((newPosts) => {
      if (user) {
        const postsWithLikes = newPosts.map(post => {
           const data = post as any;
           return {
             ...post,
             isLiked: data.likedBy?.includes(user.id) || false
           };
        });
        setPosts(postsWithLikes);
      } else {
        setPosts(newPosts);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveNav(NavigationItem.HOME);
      setViewedProfile(null);
      setToasts([]);
      setUserChats([]);
      setCurrentCall(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const handleNavigateToProfile = async (userId: string) => {
    if (!user) return;

    if (isUserListModalOpen) setIsUserListModalOpen(false);

    if (userId === user.id) {
      setViewedProfile(null);
      setActiveNav(NavigationItem.PROFILE);
      return;
    }
    setIsLoadingProfile(true);
    setActiveNav(NavigationItem.PROFILE);
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const profileData = userDocSnap.data();
        
        const newViews = (profileData.profileViews || 0) + 1;
        setViewedProfile({ id: userId, ...profileData, profileViews: newViews } as User);

        await updateDoc(userDocRef, {
          profileViews: increment(1)
        });
        
      } else {
        console.error("Profile not found for user:", userId);
        setActiveNav(NavigationItem.HOME);
      }
    } catch (error) {
       console.error("Error fetching profile:", error);
       setActiveNav(NavigationItem.HOME);
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  const handleNavigation = (item: NavigationItem) => {
    if (item !== NavigationItem.PROFILE) {
      setViewedProfile(null);
    } else {
      setViewedProfile(null);
    }
     if(item !== NavigationItem.MESSAGES) {
      setActiveChatPartner(null);
    }
    setActiveNav(item);
  };
  
  const handleShowFollowing = async (userId: string) => {
    setUserListTitle('Vibing');
    setIsUserListModalOpen(true);
    setIsUserListLoading(true);

    try {
        const followingRef = collection(db, "users", userId, "following");
        const followingSnap = await getDocs(followingRef);
        const followingIds = followingSnap.docs.map(doc => doc.id);
        
        if (followingIds.length === 0) {
            setUserList([]);
            return;
        }
        
        const usersRef = collection(db, "users");
        const q = query(usersRef, where(documentId(), "in", followingIds));
        const usersSnap = await getDocs(q);
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUserList(users);
        
    } catch(error) {
        console.error("Error fetching following list:", error);
    } finally {
        setIsUserListLoading(false);
    }
  };

  const handleShowFollowers = async (userId: string) => {
    setUserListTitle('Vibers');
    setIsUserListModalOpen(true);
    setIsUserListLoading(true);

    try {
        const followersRef = collection(db, "users", userId, "followers");
        const followersSnap = await getDocs(followersRef);
        const followerIds = followersSnap.docs.map(doc => doc.id);
        
        if (followerIds.length === 0) {
            setUserList([]);
            return;
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where(documentId(), "in", followerIds));
        const usersSnap = await getDocs(q);
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUserList(users);
        
    } catch(error) {
        console.error("Error fetching followers list:", error);
    } finally {
        setIsUserListLoading(false);
    }
  };


  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!user || !auth.currentUser) return;

    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser); 

    try {
      await updateProfile(auth.currentUser, {
        displayName: `${updatedUser.name}|${updatedUser.handle}`,
        photoURL: updatedUser.avatarUrl,
      });

      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, updatedData);
      showToast('Profile Updated', 'Your profile changes have been saved.', 'success');

    } catch (error) {
      console.error("Error updating profile:", error);
      setUser(user); 
      showToast('Error', 'Failed to update profile.', 'error');
    }
  };

  const handleCreatePost = async (content: string, media?: { url: string, type: 'image' | 'video' }) => {
    if (!user) return;
    
    // Optimistic update (optional, but subscribtion handles it)
    setIsCreatePostModalOpen(false);
    setInitialPostMedia(null);

    const newPostData: any = {
      user: user, // Store denormalized user data
      content,
      type: media?.type || 'text',
    };
    
    if (media?.type === 'image') {
        newPostData.image = media.url;
    }
    if (media?.type === 'video') {
        newPostData.videoUrl = media.url;
    }

    try {
        await createPost(newPostData);
        showToast('Posted!', 'Your vibe has been shared.', 'success');
    } catch (error) {
        console.error("Failed to save post", error);
        showToast('Error', 'Failed to share post.', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      showToast('Deleted', 'Post deleted successfully.', 'info');
    } catch (error) {
      console.error("Failed to delete post", error);
      showToast('Error', 'Failed to delete post.', 'error');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (post) {
        await toggleLikePost(postId, user.id, post.isLiked || false);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!user) return;
    const newComment: Comment = { 
        id: `c-${Date.now()}`, 
        user, 
        content, 
        timestamp: Date.now() 
    };
    await addCommentToPost(postId, newComment);
    showToast('Commented', 'Your comment has been added.', 'success');
  };
  
  const handleSelectChat = (partner: User) => {
    setActiveChatPartner(partner);
    setActiveNav(NavigationItem.MESSAGES);
  };

  const handleSendMessage = async (text: string, media?: { url: string, type: 'image' | 'video' | 'gif' | 'document', fileName?: string }, replyTo?: { id: string, text: string, senderId: string }) => {
    if (!user || !activeChatPartner) return;
    try {
        // Determine chatId based on if it's a group (using the placeholder handle) or direct
        let chatId;
        if (activeChatPartner.isBot && activeChatPartner.handle === 'group_chat_placeholder') {
             chatId = activeChatPartner.id;
        } else {
             chatId = getChatId(user.id, activeChatPartner.id);
        }

        await sendMessage(chatId, user.id, text, media, replyTo);
    } catch (error) {
        console.error("Failed to send message", error);
        showToast('Error', 'Failed to send message.', 'error');
    }
  };
  
  const handleMarkAllNotificationsRead = async () => {
    if (!user) return;
    
    // Optimistically update UI
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    try {
        await markAllNotificationsAsRead(user.id);
    } catch (error) {
        console.error("Failed to mark all as read:", error);
    }
  };

  const handleCreateGroup = async (name: string, participantIds: string[], isPrivate: boolean) => {
    if (!user) return;
    try {
        const chatId = await createGroupChat(user.id, name, participantIds, isPrivate);
        showToast('Group Created', `"${name}" is ready for vibes!`, 'success');
        // Optionally navigate to the new chat immediately
    } catch (error) {
        console.error("Failed to create group:", error);
        showToast('Error', 'Failed to create group.', 'error');
    }
  };

  const handleChatAction = async (action: string, chatId: string, partnerName: string) => {
      if (!user) return;
      try {
          switch (action) {
              case 'delete':
                  if (window.confirm(`Delete chat with ${partnerName}?`)) {
                      await deleteChat(chatId);
                      showToast('Chat Deleted', 'Conversation removed.');
                  }
                  break;
              case 'pin':
                  const chatToPin = userChats.find(c => c.id === chatId);
                  await toggleChatPin(chatId, user.id, !!chatToPin?.isPinned);
                  break;
              case 'mute':
                   const chatToMute = userChats.find(c => c.id === chatId);
                   await toggleChatMute(chatId, user.id, !!chatToMute?.isMuted);
                   showToast(chatToMute?.isMuted ? 'Unmuted' : 'Muted', `Notifications for ${partnerName} updated.`);
                   break;
              case 'muteCall':
                   const chatToMuteCall = userChats.find(c => c.id === chatId);
                   await toggleChatCallMute(chatId, user.id, !!chatToMuteCall?.isCallMuted);
                   showToast(chatToMuteCall?.isCallMuted ? 'Calls Unmuted' : 'Calls Muted', `Call settings for ${partnerName} updated.`);
                   break;
              case 'read':
                   await markChatRead(chatId, user.id);
                   showToast('Marked as Read', 'Messages marked as read.');
                   break;
              case 'moveToGeneral':
                    await toggleChatCategory(chatId, user.id, true);
                    showToast('Moved', 'Chat moved to General.');
                    break;
              case 'moveToPrimary':
                    await toggleChatCategory(chatId, user.id, false);
                    showToast('Moved', 'Chat moved to Primary.');
                    break;
          }
      } catch (error) {
          console.error(`Error performing ${action}:`, error);
          showToast('Error', 'Action failed.', 'error');
      }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;
    
    // Optimistic UI update
    const isFollowing = following.has(targetUserId);
    setFollowing(prev => {
      const next = new Set(prev);
      if (isFollowing) next.delete(targetUserId);
      else next.add(targetUserId);
      return next;
    });

    const currentUserRef = doc(db, "users", user.id);
    const targetUserRef = doc(db, "users", targetUserId);

    try {
      await runTransaction(db, async (transaction) => {
        const currentUserDoc = await transaction.get(currentUserRef);
        const targetUserDoc = await transaction.get(targetUserRef);

        if (!currentUserDoc.exists() || !targetUserDoc.exists()) throw "Document does not exist!";

        if (isFollowing) {
           transaction.update(currentUserRef, { followingCount: increment(-1) });
           transaction.update(targetUserRef, { followersCount: increment(-1) });
           transaction.delete(doc(db, "users", user.id, "following", targetUserId));
           transaction.delete(doc(db, "users", targetUserId, "followers", user.id));
        } else {
           transaction.update(currentUserRef, { followingCount: increment(1) });
           transaction.update(targetUserRef, { followersCount: increment(1) });
           transaction.set(doc(db, "users", user.id, "following", targetUserId), { timestamp: Date.now() });
           transaction.set(doc(db, "users", targetUserId, "followers", user.id), { timestamp: Date.now() });
           
           // Create Notification
           const notifRef = collection(db, "users", targetUserId, "notifications");
           transaction.set(doc(notifRef), {
             type: 'follow',
             user: { 
                 id: user.id, 
                 name: user.name, 
                 handle: user.handle, 
                 avatarUrl: user.avatarUrl,
                 isBot: user.isBot,
                 verified: user.verified
             },
             timestamp: Date.now(),
             read: false
           });
        }
      });
    } catch (error) {
      console.error("Follow transaction failed: ", error);
      // Revert optimistic update on failure
      setFollowing(prev => {
        const next = new Set(prev);
        if (isFollowing) next.add(targetUserId);
        else next.delete(targetUserId);
        return next;
      });
      showToast('Error', 'Failed to update follow status.', 'error');
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setInitialPostMedia({
         url: URL.createObjectURL(file),
         type: mediaType,
         file: file 
      });
      setIsCreatePostModalOpen(true);
    }
    // Reset input
    if (event.target) event.target.value = '';
  };

  // Call Handlers
  const handleStartVoiceCall = () => {
      if (!activeChatPartner) return;
      setCurrentCall({
          isActive: true,
          partner: activeChatPartner,
          type: 'voice',
          status: 'outgoing'
      });
      
      // Simulate connection
      setTimeout(() => {
          setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
      }, 3000);
  };

  const handleStartVideoCall = () => {
      if (!activeChatPartner) return;
      setCurrentCall({
          isActive: true,
          partner: activeChatPartner,
          type: 'video',
          status: 'outgoing'
      });
      
      // Simulate connection
      setTimeout(() => {
          setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
      }, 3000);
  };

  const handleAcceptCall = () => {
      setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
  };

  const handleEndCall = () => {
      setCurrentCall(null);
      showToast('Call Ended', `Call with ${activeChatPartner?.name} ended.`);
  };


  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Logo size="xl" className="animate-bounce" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }
  
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const renderContent = () => {
    if (activeNav === NavigationItem.ADMIN) {
        if (!user.isAdmin) return <div className="text-white p-8">Access Denied</div>;
        return <AdminDashboard />;
    }

    if (activeChatPartner && activeNav === NavigationItem.MESSAGES) {
      return (
        <ChatView 
          partner={activeChatPartner} 
          messages={messages} 
          currentUser={user}
          onBack={() => setActiveChatPartner(null)}
          onSendMessage={handleSendMessage}
          onVoiceCall={handleStartVoiceCall}
          onVideoCall={handleStartVideoCall}
        />
      );
    }

    switch (activeNav) {
      case NavigationItem.HOME:
        return (
          <>
             {/* Mobile Header with Logo and Notifications */}
             <div className="md:hidden flex items-center justify-between p-4 bg-black/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-800">
               <div className="flex items-center gap-2">
                 <Logo size="sm" />
                 <span className="font-bold text-lg bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Loopzyy</span>
               </div>
               <div className="flex items-center gap-1">
                 <button
                    onClick={() => setActiveNav(NavigationItem.RADAR)}
                    className="relative p-2"
                  >
                    <Radio className="w-6 h-6 text-zinc-300" />
                 </button>
                 <button 
                    onClick={() => setActiveNav(NavigationItem.NOTIFICATIONS)}
                    className="relative p-2"
                  >
                    <Bell className="w-6 h-6 text-zinc-300" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
                    )}
                 </button>
               </div>
             </div>

            <StoriesBar 
                stories={stories} 
                currentUser={user} 
                onAddStory={handleCameraClick}
            />
            <CreatePost currentUser={user} onPostCreate={handleCreatePost} />
            <div className="space-y-6 pb-20 md:pb-0">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={user} 
                  onLike={handleLike}
                  onAddComment={handleAddComment}
                  onNavigateToProfile={handleNavigateToProfile}
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
          </>
        );
      case NavigationItem.EXPLORE:
        return (
            <Explore 
                posts={posts} 
                onNavigateToProfile={handleNavigateToProfile}
                currentUser={user}
                onFollow={handleFollow}
                following={following}
            />
        );
      case NavigationItem.MESSAGES:
        return (
          <Messages 
            chats={userChats} 
            onSelectChat={handleSelectChat} 
            onChatAction={handleChatAction}
            currentUser={user}
            onCreateGroup={handleCreateGroup}
          />
        );
      case NavigationItem.RADAR:
        return <RadarView currentUser={user} />;
      case NavigationItem.NOTIFICATIONS:
        return <Notifications notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} />;
      case NavigationItem.PROFILE:
        return (
          <Profile 
            user={viewedProfile || user} 
            posts={posts.filter(p => p.user.id === (viewedProfile?.id || user.id))}
            currentUser={user}
            // FIX: Corrected typo from onLike to handleLike
            onLike={handleLike}
            onAddComment={handleAddComment}
            onNavigate={(item) => setActiveNav(item)}
            onNavigateToProfile={handleNavigateToProfile}
            isFollowing={viewedProfile ? following.has(viewedProfile.id) : false}
            onFollow={handleFollow}
            onUpdateUser={handleUpdateUser}
            onShowFollowers={handleShowFollowers}
            onShowFollowing={handleShowFollowing}
            onStartChat={handleSelectChat}
            onDelete={handleDeletePost}
          />
        );
      case NavigationItem.POSTS:
        return (
           <UserPosts 
             posts={posts.filter(p => p.user.id === user.id)}
             currentUser={user}
             onLike={handleLike}
             onAddComment={handleAddComment}
             onNavigateToProfile={handleNavigateToProfile}
             onDelete={handleDeletePost}
           />
        );
      case NavigationItem.SETTINGS:
        return <Settings onLogout={handleLogout} currentUser={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans selection:bg-brand-500/30">
      <Sidebar 
        activeItem={activeNav} 
        onNavigate={handleNavigation} 
        onLogout={handleLogout}
        isAdmin={user.isAdmin}
      />
      
      <main className="flex-1 w-full max-w-2xl mx-auto border-x border-zinc-800/50 min-h-screen relative">
        <div className="p-4 md:p-6 pb-24 md:pb-6">
          {renderContent()}
        </div>
      </main>

      {/* Right Sidebar (Hidden on Mobile) */}
      <div className="hidden xl:block w-80 p-6 sticky top-0 h-screen overflow-y-auto no-scrollbar">
         {/* Widgets removed as per request */}
      </div>

      <BottomNav 
        activeItem={activeNav} 
        onNavigate={handleNavigation} 
        onCreatePost={() => setIsCreatePostModalOpen(true)}
      />

      {/* Hidden File Input for Mobile Camera Button in Navbar/Stories */}
      <input 
        type="file" 
        ref={cameraInputRef} 
        className="hidden" 
        accept="image/*,video/*" 
        capture="user" // Selfie camera
        onChange={handleCameraCapture} 
      />
      
      <CreatePostModal 
        isOpen={isCreatePostModalOpen}
        onClose={() => {
            setIsCreatePostModalOpen(false);
            setInitialPostMedia(null);
        }}
        currentUser={user}
        onPostCreate={handleCreatePost}
        initialMedia={initialPostMedia}
      />
      
      <UserListModal 
         isOpen={isUserListModalOpen}
         onClose={() => setIsUserListModalOpen(false)}
         title={userListTitle}
         users={userList}
         isLoading={isUserListLoading}
         onNavigateToProfile={handleNavigateToProfile}
      />

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
      
      {/* Call Modal Overlay */}
      {currentCall && (
         <CallModal 
            session={currentCall} 
            onEndCall={handleEndCall}
            onAcceptCall={handleAcceptCall}
            currentUser={user}
         />
      )}
    </div>
  );
}
