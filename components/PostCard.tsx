import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Sparkles, Send, Check, BadgeCheck, MoreHorizontal, Trash2, Flag } from 'lucide-react';
import { Post, User } from '../types';
import { generateSmartComment } from '../services/geminiService';
import { Button } from './Button';
import { sendReport } from '../services/reportService';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onLike: (id: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onNavigateToProfile: (userId: string) => void;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onLike, onAddComment, onNavigateToProfile, onDelete }) => {
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = currentUser.id === post.user.id;

  const handleSmartComment = async () => {
    setIsGeneratingComment(true);
    const suggested = await generateSmartComment(post.content);
    setCommentDraft(suggested);
    setIsGeneratingComment(false);
    setShowComments(true);
  };

  const handleSubmitComment = () => {
    if (!commentDraft.trim()) return;
    onAddComment(post.id, commentDraft);
    setCommentDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`https://loppzyy.app/post/${post.id}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = () => {
    if (onDelete) {
      if (window.confirm("Are you sure you want to delete this post?")) {
        onDelete(post.id);
      }
    }
    setShowMenu(false);
  };

  const handleReport = async () => {
    const reason = window.prompt("Please state the reason for reporting this post:", "Inappropriate Content");
    if (reason) {
      try {
        await sendReport(currentUser.id, post.id, 'post', reason);
        alert("Post reported. Thanks for helping keep the community safe.");
      } catch (error) {
        console.error("Report failed:", error);
        alert("Failed to submit report. Please try again.");
      }
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-5 mb-6 transition-all hover:border-zinc-700 relative">
      <div className="flex gap-4">
        <button onClick={() => onNavigateToProfile(post.user.id)} className="flex-shrink-0">
            <img 
              src={post.user.avatarUrl} 
              alt={post.user.name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-zinc-800"
            />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <button onClick={() => onNavigateToProfile(post.user.id)} className="text-left group truncate max-w-[80%]">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-white text-lg leading-tight group-hover:underline truncate">{post.user.name}</h3>
                {post.user.isBot && <BadgeCheck className="w-4 h-4 text-red-500 fill-red-500/10 flex-shrink-0" />}
                {post.user.verified && !post.user.isBot && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10 flex-shrink-0" />}
              </div>
              <p className="text-zinc-400 text-sm truncate">@{post.user.handle} • {new Date(post.timestamp).toLocaleDateString()}</p>
            </button>
            
            {/* Three Dot Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)} 
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 z-20 w-40 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                    {isOwner && onDelete ? (
                      <button 
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Post
                      </button>
                    ) : (
                      <button 
                        onClick={handleReport}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                      >
                        <Flag className="w-4 h-4" />
                        Report Post
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <p className="mt-3 text-zinc-100 text-base whitespace-pre-wrap leading-relaxed break-words">
            {post.content}
          </p>

          {post.type === 'image' && post.image && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-800/50">
              <img src={post.image} alt="Post content" className="w-full h-auto max-h-96 object-cover" />
            </div>
          )}
          {post.type === 'video' && post.videoUrl && (
             <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-800/50">
               <video src={post.videoUrl} controls className="w-full h-auto max-h-96 object-cover bg-black" />
             </div>
          )}


          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
            <div className="flex gap-6">
              <button 
                onClick={() => onLike(post.id)}
                className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-pink-500' : 'text-zinc-400 hover:text-pink-500'}`}
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-pink-500' : ''}`} />
                <span className="text-sm font-medium">{post.likes}</span>
              </button>
              
              <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 transition-colors ${showComments ? 'text-brand-400' : 'text-zinc-400 hover:text-brand-400'}`}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{post.comments.length}</span>
              </button>

              <button 
                onClick={handleShare}
                className={`flex items-center gap-2 transition-colors ${isCopied ? 'text-green-400' : 'text-zinc-400 hover:text-green-400'}`}
              >
                {isCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              </button>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleSmartComment}
              isLoading={isGeneratingComment}
              className="text-xs px-3 py-1 h-8"
              icon={<Sparkles className="w-3 h-3" />}
            >
              AI Reply
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-2 mb-4">
                 <button onClick={() => onNavigateToProfile(currentUser.id)} className="flex-shrink-0">
                    <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                 </button>
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a comment..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
                <Button variant="primary" className="w-10 h-10 p-0" onClick={handleSubmitComment} disabled={!commentDraft.trim()}>
                   <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {post.comments.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <button onClick={() => onNavigateToProfile(comment.user.id)} className="flex-shrink-0">
                        <img src={comment.user.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                      </button>
                      <div className="bg-zinc-900 rounded-2xl rounded-tl-none p-3 text-sm">
                        <div className="flex items-center gap-1 mb-0.5">
                          <button onClick={() => onNavigateToProfile(comment.user.id)} className="font-bold text-zinc-300 hover:underline">{comment.user.name}</button>
                          {comment.user.isBot && <BadgeCheck className="w-3 h-3 text-red-500 fill-red-500/10" />}
                          {comment.user.verified && !comment.user.isBot && <BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-500/10" />}
                        </div>
                        <span className="text-zinc-400">{comment.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm text-center italic">No comments yet. Be the first!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};