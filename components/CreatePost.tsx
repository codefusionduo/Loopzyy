
import React, { useState, useRef } from 'react';
import { Sparkles, Camera, Send, X, Video, Image } from 'lucide-react';
import { enhancePostContent } from '../services/geminiService';
import { uploadToCloudinary } from '../services/mediaService';
import { Button } from './Button';
import { User } from '../types';

interface CreatePostProps {
  currentUser: User;
  onPostCreate: (content: string, media?: { url: string, type: 'image' | 'video' | 'gif' | 'document' }) => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPostCreate }) => {
  const [content, setContent] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // mediaPreview now holds the File object as well
  const [mediaPreview, setMediaPreview] = useState<{ url: string, type: 'image' | 'video', file?: File } | null>(null);
  
  // Separate refs for inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

        // Upload to Cloudinary if there's a file
        if (mediaPreview?.file) {
            finalMediaUrl = await uploadToCloudinary(mediaPreview.file);
        }

        onPostCreate(content, mediaPreview ? { 
            url: finalMediaUrl!, 
            type: mediaPreview.type 
        } : undefined);
        
        setContent('');
        setMediaPreview(null);
        setIsExpanded(false);
    } catch (error: any) {
        console.error("Failed to create post:", error);
        alert(error.message || "Failed to upload media. Please try again.");
    } finally {
        setIsPosting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
            setMediaPreview({ url: reader.result as string, type: 'image', file });
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
        const videoUrl = URL.createObjectURL(file);
        setMediaPreview({ url: videoUrl, type: 'video', file });
    }
    
    // Reset input value to allow selecting the same file again if needed
    if (event.target) event.target.value = '';
    setIsExpanded(true);
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-4 mb-8 shadow-2xl">
      {/* Gallery Input (No capture) */}
      <input 
        type="file" 
        ref={galleryInputRef} 
        onChange={handleFileSelect} 
        accept="image/*,video/*" 
        className="hidden" 
      />
      {/* Camera Capture Input */}
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
      />
      {/* Video Capture Input */}
      <input 
        type="file" 
        ref={videoInputRef} 
        onChange={handleFileSelect} 
        accept="video/*" 
        capture="environment"
        className="hidden" 
      />
      
      <div className="flex gap-4">
        <img 
          src={currentUser.avatarUrl} 
          alt="Profile" 
          className="w-10 h-10 rounded-full border-2 border-brand-500 p-0.5" 
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="What's buzzing, Loopzyy?"
            className="w-full bg-transparent text-lg text-white placeholder-zinc-500 resize-none focus:outline-none min-h-[60px]"
            rows={isExpanded || mediaPreview ? 4 : 1}
          />
          
          {mediaPreview && (
             <div className="relative mt-2 mb-4">
               {mediaPreview.type === 'image' ? (
                  <img src={mediaPreview.url} alt="Selected" className="rounded-xl max-h-64 w-full object-cover border border-zinc-700" />
               ) : (
                  <video src={mediaPreview.url} controls className="rounded-xl max-h-64 w-full object-cover border border-zinc-700 bg-black" />
               )}
               <button 
                 onClick={() => setMediaPreview(null)}
                 className="absolute top-2 right-2 bg-black/50 p-1 rounded-full hover:bg-black/70"
                 title="Remove Media"
               >
                 <X className="w-4 h-4 text-white" />
               </button>
             </div>
          )}

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50">
            <div className="flex gap-2">
              <button 
                onClick={() => galleryInputRef.current?.click()}
                className="p-2 text-brand-400 hover:bg-brand-400/10 rounded-full transition-colors"
                title="Upload from Gallery"
              >
                <Image className="w-5 h-5" />
              </button>
              <button 
                onClick={() => imageInputRef.current?.click()}
                className="p-2 text-brand-400 hover:bg-brand-400/10 rounded-full transition-colors"
                title="Take Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
                <button 
                onClick={() => videoInputRef.current?.click()}
                className="p-2 text-brand-400 hover:bg-brand-400/10 rounded-full transition-colors"
                title="Record Video"
              >
                <Video className="w-5 h-5" />
              </button>
              {(isExpanded || content.trim().length > 0) && (
                <Button 
                  variant="ghost" 
                  onClick={handleEnhance}
                  isLoading={isEnhancing}
                  className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  {isEnhancing ? 'Magic...' : 'Enhance'}
                </Button>
              )}
            </div>
            
            <Button 
              onClick={handleSubmit}
              disabled={(!content.trim() && !mediaPreview) || isPosting}
              isLoading={isPosting}
              icon={!isPosting ? <Send className="w-4 h-4" /> : undefined}
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
