import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { X, Camera, Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '../services/mediaService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedData: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl || '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<'avatar' | 'banner' | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({
      name: user.name,
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl || `https://picsum.photos/seed/${user.id}/1000/400`,
    });
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(formData);
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadingTarget(type);

    try {
        const url = await uploadToCloudinary(file);
        setFormData(prev => ({
            ...prev,
            [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: url
        }));
    } catch (error) {
        console.error(`Error uploading ${type}:`, error);
        alert(`Failed to upload ${type}. Please try again.`);
    } finally {
        setIsUploading(false);
        setUploadingTarget(null);
        // Reset input
        if (e.target) e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl m-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold">Edit Profile</h2>
          </div>
          <Button onClick={handleSave} disabled={isUploading} isLoading={isUploading}>Save</Button>
        </div>

        <div>
          {/* Hidden Inputs */}
          <input 
            type="file" 
            ref={bannerInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'banner')}
          />
          <input 
            type="file" 
            ref={avatarInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'avatar')}
          />

          <div className="relative h-40 bg-zinc-800 group">
            {formData.bannerUrl && <img src={formData.bannerUrl} alt="Banner" className={`w-full h-full object-cover transition-opacity ${uploadingTarget === 'banner' ? 'opacity-50' : ''}`} />}
            
            <button 
              onClick={() => !isUploading && bannerInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
              disabled={isUploading}
              aria-label="Change banner image"
            >
              {uploadingTarget === 'banner' ? (
                 <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                 <Camera className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          <div className="relative px-4 -mt-12">
            <div className="relative w-24 h-24 group">
              <img 
                src={formData.avatarUrl} 
                alt="Avatar" 
                className={`w-24 h-24 rounded-full border-4 border-zinc-900 object-cover bg-zinc-800 transition-opacity ${uploadingTarget === 'avatar' ? 'opacity-50' : ''}`} 
              />
              <button
                onClick={() => !isUploading && avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full disabled:cursor-not-allowed"
                disabled={isUploading}
                aria-label="Change avatar"
              >
                {uploadingTarget === 'avatar' ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                    <Camera className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Input label="Name" name="name" value={formData.name} onChange={handleChange} />
          <Textarea label="Bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} />
          <Input label="Location" name="location" value={formData.location} onChange={handleChange} />
          <Input label="Website" name="website" value={formData.website} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
};

// Helper components for form fields
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-zinc-400 ml-1">{label}</label>
    <input
      {...props}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
    />
  </div>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
   <div className="space-y-1">
    <label className="text-sm font-medium text-zinc-400 ml-1">{label}</label>
    <textarea
      {...props}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
    />
  </div>
);