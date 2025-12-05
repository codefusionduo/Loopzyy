
import React, { useState, useEffect } from 'react';
import { User, CallSession } from '../types';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, User as UserIcon, Phone } from 'lucide-react';

interface CallModalProps {
  session: CallSession;
  onEndCall: () => void;
  onAcceptCall?: () => void;
  currentUser: User;
}

export const CallModal: React.FC<CallModalProps> = ({ session, onEndCall, onAcceptCall, currentUser }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (session.status === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session.isActive) return null;

  // Minimized View (Floating Bubble)
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 z-[100] w-32 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="relative aspect-[3/4] bg-zinc-800">
           {session.type === 'video' ? (
              <img src={session.partner.avatarUrl} className="w-full h-full object-cover opacity-50" alt="partner" />
           ) : (
              <div className="w-full h-full flex items-center justify-center">
                 <img src={session.partner.avatarUrl} className="w-12 h-12 rounded-full" alt="partner" />
              </div>
           )}
           <div className="absolute inset-0 flex flex-col items-center justify-between p-2">
              <span className="text-xs bg-black/50 px-2 py-0.5 rounded-full text-green-400">
                  {formatTime(duration)}
              </span>
              <div className="flex gap-2">
                 <button onClick={() => setIsMinimized(false)} className="p-1.5 bg-zinc-700 rounded-full text-white"><Maximize2 className="w-3 h-3"/></button>
                 <button onClick={onEndCall} className="p-1.5 bg-red-500 rounded-full text-white"><PhoneOff className="w-3 h-3"/></button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Full Screen View
  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col animate-in fade-in duration-300">
      
      {/* Video Background (Simulated) */}
      {session.type === 'video' && (
         <div className="absolute inset-0 z-0">
             {session.status === 'connected' && !isCameraOff ? (
                 <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative">
                     {/* Remote Video Placeholder */}
                     <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                        <img src={session.partner.avatarUrl} alt="Remote" className="w-full h-full object-cover opacity-30 blur-sm" />
                        <UserIcon className="w-20 h-20 text-zinc-600 absolute" />
                     </div>
                     
                     {/* Local Video PIP */}
                     <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-xl border border-zinc-700 shadow-xl overflow-hidden">
                        <img src={currentUser.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                     </div>
                 </div>
             ) : (
                 <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                     <img src={session.partner.avatarUrl} className="w-full h-full object-cover opacity-20 blur-xl" alt="bg" />
                 </div>
             )}
         </div>
      )}

      {/* Header */}
      <div className="relative z-10 pt-12 px-6 flex justify-between items-start">
         <button onClick={() => setIsMinimized(true)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
             <Minimize2 className="w-6 h-6" />
         </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
         {session.type === 'voice' || session.status !== 'connected' ? (
             <div className="flex flex-col items-center">
                 <div className="relative mb-8">
                     <div className={`absolute inset-0 bg-brand-500/30 rounded-full blur-2xl ${session.status === 'outgoing' || session.status === 'incoming' ? 'animate-pulse' : ''}`}></div>
                     <img 
                        src={session.partner.avatarUrl} 
                        alt={session.partner.name} 
                        className="w-32 h-32 rounded-full border-4 border-zinc-800 shadow-2xl relative z-10"
                     />
                 </div>
                 <h2 className="text-3xl font-bold text-white mb-2">{session.partner.name}</h2>
                 <p className="text-zinc-400 text-lg">
                    {session.status === 'outgoing' && 'Calling...'}
                    {session.status === 'incoming' && 'Incoming Call...'}
                    {session.status === 'connected' && formatTime(duration)}
                 </p>
             </div>
         ) : null}
      </div>

      {/* Controls */}
      <div className="relative z-10 pb-12 px-6">
         {session.status === 'incoming' ? (
            // Incoming Call Controls
            <div className="flex justify-center gap-12">
               <button 
                  onClick={onEndCall}
                  className="flex flex-col items-center gap-2 group"
               >
                  <div className="p-5 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 group-hover:scale-110 transition-transform">
                     <PhoneOff className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300">Decline</span>
               </button>
               
               <button 
                  onClick={onAcceptCall}
                  className="flex flex-col items-center gap-2 group animate-bounce"
               >
                  <div className="p-5 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/40 group-hover:scale-110 transition-transform">
                     <Phone className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300">Accept</span>
               </button>
            </div>
         ) : (
            // Active/Outgoing Controls
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-center justify-evenly max-w-md mx-auto shadow-2xl">
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                
                {session.type === 'video' && (
                    <button 
                        onClick={() => setIsCameraOff(!isCameraOff)}
                        className={`p-4 rounded-full transition-all ${isCameraOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </button>
                )}

                <button 
                    onClick={onEndCall}
                    className="p-4 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 hover:bg-red-600 transition-all hover:scale-110 active:scale-95"
                >
                    <PhoneOff className="w-8 h-8" />
                </button>
            </div>
         )}
      </div>
    </div>
  );
};
