import React from 'react';
import { Plus } from 'lucide-react';
import { Story, User } from '../types';

interface StoriesBarProps {
  stories: Story[];
  currentUser: User;
  onAddStory: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ stories, currentUser, onAddStory }) => {
  return (
    <div className="mb-6">
      <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-3">
        {/* Add Your Story */}
        <div 
          onClick={onAddStory}
          className="flex-shrink-0 w-20 flex flex-col items-center gap-2 cursor-pointer group"
        >
          <div className="relative w-16 h-16">
            <img 
              src={currentUser.avatarUrl} 
              alt="Your Story" 
              className="w-full h-full rounded-full object-cover border-2 border-dashed border-zinc-600 group-hover:border-brand-500 transition-colors"
            />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center border-2 border-black group-hover:bg-brand-400 transition-colors">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xs text-zinc-400">Your Story</p>
        </div>

        {/* Other Stories */}
        {stories.map(story => {
          const borderColor = story.viewed ? 'border-zinc-700' : 'border-brand-500';
          return (
            <div key={story.id} className="flex-shrink-0 w-20 flex flex-col items-center gap-2 cursor-pointer group">
              <div className={`w-16 h-16 rounded-full p-0.5 bg-black ${borderColor} transition-colors group-hover:border-brand-400`}>
                  <img 
                    src={story.user.avatarUrl} 
                    alt={story.user.name} 
                    className="w-full h-full rounded-full object-cover bg-zinc-800"
                  />
              </div>
              <p className="text-xs text-zinc-300 truncate w-full text-center">{story.user.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};