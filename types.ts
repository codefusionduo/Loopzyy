

export interface User {
  id: string;
  name: string;
  handle: string;
  email?: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate?: number;
  followingCount?: number;
  followersCount?: number;
  profileViews?: number;
  isBot?: boolean;
  verified?: boolean;
  isAdmin?: boolean;
  isBanned?: boolean;
  isPrivate?: boolean;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: number;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  image?: string;
  videoUrl?: string;
  type?: 'text' | 'image' | 'video';
  likes: number;
  comments: Comment[];
  timestamp: number;
  isLiked?: boolean;
}

export interface Story {
  id: string;
  user: User;
  imageUrl: string;
  timestamp: number;
  viewed?: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  user: User;
  postContent?: string;
  timestamp: number;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  replyToText?: string;
  replyToSender?: string;
  reaction?: string;
  read?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif' | 'document';
  fileName?: string;
}


export interface Chat {
  id: string;
  partner: User; // In group chats, this represents the Group Identity
  messages: ChatMessage[];
  lastMessage: {
    text: string;
    timestamp: number;
  };
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isCallMuted?: boolean;
  isGeneral?: boolean;
  isGroup?: boolean;
  groupName?: string;
  adminIds?: string[];
  isPrivateGroup?: boolean;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  reason: string;
  uploadedIdUrl: string;
  uploadedSelfieUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'post' | 'user' | 'comment';
  reason: string;
  additionalInfo?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: number;
}

export interface CallSession {
  isActive: boolean;
  partner: User;
  type: 'voice' | 'video';
  status: 'outgoing' | 'incoming' | 'connected';
  startTime?: number;
}

export interface RadarSession {
  userId: string;
  mood: string;
  isActive: boolean;
  lastPing: number;
}

export enum NavigationItem {
  HOME = 'Home',
  EXPLORE = 'Explore',
  MESSAGES = 'Messages',
  NOTIFICATIONS = 'Notifications',
  PROFILE = 'Profile',
  POSTS = 'Posts',
  SETTINGS = 'Settings',
  ADMIN = 'Admin',
  RADAR = 'Radar'
}