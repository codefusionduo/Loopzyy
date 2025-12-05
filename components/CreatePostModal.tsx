
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { X, Camera, Sparkles, Send, Video } from 'lucide-react';
import { enhancePostContent } from '../services/geminiService';
import { uploadToCloudinary } from '../services/mediaService';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPostCreate: (content: string, media?: { url: string; type: 'image' | 'video' | 'gif' | 'document' }) => void;
  initialMedia?: { url: string; type: 'image' | 'video', file?: File } | null;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, currentUser, onPostCreate, initialMedia }) => {
  const [content, setContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video'; file?: File } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Sync with initialMedia when modal opens
  useEffect(() => {
    if (isOpen) {
        if (initialMedia) {
            setMediaPreview(initialMedia);
        } else {
            setMediaPreview(null);
            setContent('');
        }
    }
  }, [isOpen, initialMedia]);

  useEffect(() => {
    // Clean up object URL to prevent memory leaks for internal state changes
    return () => {
      // Only revoke if it's a locally created URL (not the one passed in, although initialMedia urls are also local usually)
      if (mediaPreview && mediaPreview.url !== initialMedia?.url && !mediaPreview.url.startsWith('http')) {
        URL.revokeObjectURL(mediaPreview.url);
      }
    };
  }, [mediaPreview, initialMedia]);


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      setMediaPreview({ url: fileUrl, type: 'image', file });
    } else if (file.type.startsWith('video/')) {
      setMediaPreview({ url: fileUrl, type: 'video', file });
    }
    
    if (event.target) event.target.value = '';
  };
  
  const handleEnhance = async () => {
    if (!content.trim()) return;
    setIsEnhancing(true);
    const enhanced = await enhancePostContent(content);
    setContent(enhanced);
    setIsEnhancing(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaPreview) return;
    
    setIsPosting(true);
    try {
        let finalMediaUrl = mediaPreview?.url;

        if (mediaPreview?.file) {
             finalMediaUrl = await uploadToCloudinary(mediaPreview.file);
        }

        onPostCreate(content, mediaPreview ? { 
            url: finalMediaUrl!, 
            type: mediaPreview.type 
        } : undefined);

        setContent('');
        setMediaPreview(null);
        onClose();
    } catch (error: any) {
        console.error("Failed to create post:", error);
        alert(error.message || "Failed to upload media. Please try again.");
    } finally {
        setIsPosting(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-10 md:pt-20 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl m-4 animate-in fade-in slide-in-from-top-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
          <Button 
            onClick={handleSubmit} 
            disabled={(!content.trim() && !mediaPreview) || isPosting} 
            isLoading={isPosting}
            icon={!isPosting ? <Send className="w-4 h-4"/> : undefined}
          >
            Post
          </Button>
        </div>

        <div className="p-4 flex gap-4">
           <img src={currentUser.avatarUrl} alt="Your Avatar" className="w-10 h-10 rounded-full"/>
           <div className="flex-1">
             <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent text-lg text-white placeholder-zinc-500 resize-none focus:outline-none min-h-[120px]"
             />
             
             {mediaPreview && (
               <div className="relative mt-4 mb-2">
                 {mediaPreview.type === 'image' ? (
                    <img src={mediaPreview.url} alt="Preview" className="rounded-xl max-h-72 w-full object-contain border border-zinc-700" />
                 ) : (
                    <video src={mediaPreview.url} controls className="rounded-xl max-h-72 w-full object-contain border border-zinc-700 bg-black" />
                 )}
                 <button 
                   onClick={() => {
                     if (mediaPreview.url !== initialMedia?.url && !mediaPreview.url.startsWith('http')) {
                        URL.revokeObjectURL(mediaPreview.url);
                     }
                     setMediaPreview(null);
                   }}
                   className="absolute top-2 right-2 bg-black/50 p-1 rounded-full hover:bg-black/70"
                   title="Remove Media"
                 >
                   <X className="w-4 h-4 text-white" />
                 </button>
               </div>
            )}
           </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
           <input type="file" ref={imageInputRef} onChange={handleFileSelect} accept="image/*" className="hidden"/>
           <input type="file" ref={videoInputRef} onChange={handleFileSelect} accept="video/*" className="hidden"/>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={() => imageInputRef.current?.click()}
                className="p-2 text-brand-400 hover:bg-brand-400/10 rounded-full transition-colors"
                title="Add Image"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button 
                onClick={() => videoInputRef.current?.click()}
                className="p-2 text-brand-400 hover:bg-brand-400/10 rounded-full transition-colors"
                title="Add Video"
              >
                <Video className="w-5 h-5" />
              </button>
           </div>
            <Button 
              variant="ghost" 
              onClick={handleEnhance}
              isLoading={isEnhancing}
              className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
              icon={<Sparkles className="w-4 h-4" />}
            >
              {isEnhancing ? 'Improving...' : 'Enhance with AI'}
            </Button>
        </div>
      </div>
    </div>
  );
};