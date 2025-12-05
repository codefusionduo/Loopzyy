import React from 'react';
import { Post, User } from '../types';
import { PostCard } from './PostCard';
import { FileText } from 'lucide-react';

interface UserPostsProps {
  posts: Post[];
  currentUser: User;
  onLike: (id: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onNavigateToProfile: (userId: string) => void;
  onDelete?: (postId: string) => void;
}

export const UserPosts: React.FC<UserPostsProps> = ({ posts, currentUser, onLike, onAddComment, onNavigateToProfile, onDelete }) => {
  return (
    <div className="pb-20 md:pb-0">
      <h2 className="text-2xl font-bold mb-6 px-2">My Posts</h2>
      
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map(post => (
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
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-3xl">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-lg">You haven't posted anything yet</p>
          <p className="text-sm">Your posts will appear here.</p>
        </div>
      )}
    </div>
  );
};