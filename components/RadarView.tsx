
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Radio, Coffee, Zap, Moon, Ghost, Navigation, MapPin, Hand, X, Loader2, AlertTriangle, Send, CheckCircle2, Clock, Users, Lock, Share } from 'lucide-react';
import { Button } from './Button';
import { activateRadar, deactivateRadar, scanForFriends, broadcastCheckIn } from '../services/radarService';

interface RadarViewProps {
  currentUser: User;
}

const MOODS = [
  { id: 'casual', label: 'Just Looking', icon: Radio },
  { id: 'coffee', label: 'Coffee?', icon: Coffee },
  { id: 'party', label: 'Party Mode', icon: Zap },
  { id: 'quiet', label: 'Quiet Vibes', icon: Moon },
];

export const RadarView: React.FC<RadarViewProps> = ({ currentUser }) => {
  const [isActive, setIsActive] = useState(false);
  const [mood, setMood] = useState('casual');
  const [visibility, setVisibility] = useState<'all' | 'close'>('all');
  const [status, setStatus] = useState<'setup' | 'scanning' | 'detected' | 'revealed'>('setup');
  const [detectedFriend, setDetectedFriend] = useState<User | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [permissionError, setPermissionError] = useState(false);
  
  // New State for Meet Request Flow
  const [meetStatus, setMeetStatus] = useState<'idle' | 'sending' | 'waiting' | 'accepted' | 'rejected'>('idle');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  
  // Fake friend data for the demo
  const loopzyyBot: User = {
      id: 'u2',
      name: 'Loopzyy Bot',
      handle: 'loopzyy_bot',
      avatarUrl: 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Crect%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22%232563eb%22%2F%3E%3Cpath%20d%3D%22M12%2012C10%209.33%207%208%205%208C2.79%208%201%209.79%201%2012C1%2014.21%202.79%2016%205%2016C7%2016%2010%2014.67%2012%2012ZM12%2012C14%2014.67%2017%2016%2019%2016C21.21%2016%2023%2014.21%2023%2012C23%209.79%2021.21%208%2019%208C17%208%2014%209.33%2012%2012Z%22%20stroke%3D%22white%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',
      verified: true
  };

  const handleActivate = async () => {
    setPermissionError(false);
    // 1. Request Permission
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            setIsActive(true);
            setStatus('scanning');
            setMeetStatus('idle'); // Reset meet status
            await activateRadar(currentUser.id, mood, 60, visibility); // 60 mins default
            
            // 2. Simulate Scanning
            const result = await scanForFriends(currentUser.id);
            if (result.found) {
                setTimeout(() => {
                    setDetectedFriend(loopzyyBot);
                    setStatus('detected');
                }, 2000);
            }
        }, (error) => {
            console.error("Geolocation error:", error);
            setPermissionError(true);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
  };

  const handleDeactivate = async () => {
    setIsActive(false);
    setStatus('setup');
    setDetectedFriend(null);
    setMeetStatus('idle');
    await deactivateRadar(currentUser.id);
  };

  const handleWave = () => {
      // Simulate sending a wave and getting an immediate "Accept" for the demo
      if (!detectedFriend) return;
      
      // Visual feedback for wave
      // alert(`Waved at @${detectedFriend.handle}! Waiting for them...`); 
      // Replaced alert with UI state change for smoother UX if desired, but keeping simple for now
      
      setTimeout(() => {
          setStatus('revealed');
          setDistance('350m');
      }, 1500);
  };

  const handleMeetRequest = () => {
      if (!detectedFriend) return;
      setMeetStatus('sending');

      // 1. Simulate Network Request
      setTimeout(() => {
          setMeetStatus('waiting');
          
          // 2. Simulate Friend Response (Accept)
          setTimeout(() => {
              setMeetStatus('accepted');
              
              // 3. Auto-open maps or allow user to click
              setTimeout(() => {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("Starbucks")}`, '_blank');
              }, 2000);
          }, 3500); // Wait 3.5s for "friend" to reply
      }, 1000);
  };

  const handleCheckIn = async () => {
      setIsCheckingIn(true);
      await broadcastCheckIn(currentUser.id, "Current Location");
      alert("📍 Location broadcasted to nearby friends!");
      setIsCheckingIn(false);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden pb-20 md:pb-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 z-10">
            <div className="flex items-center gap-2">
                <Radio className={`w-6 h-6 ${isActive ? 'text-green-400 animate-pulse' : 'text-zinc-500'}`} />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-brand-500 bg-clip-text text-transparent">
                    Friend Radar
                </h1>
            </div>
            {isActive && (
                <button 
                    onClick={handleDeactivate}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 rounded-full text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700"
                >
                    <Ghost className="w-3 h-3" /> Ghost Mode
                </button>
            )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
            
            {status === 'setup' && (
                <div className="w-full max-w-md p-6 space-y-8 animate-in fade-in zoom-in-95">
                    <div className="text-center space-y-2">
                        <div className="w-24 h-24 mx-auto bg-brand-500/10 rounded-full flex items-center justify-center border border-brand-500/30 mb-4 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                            <Radio className="w-10 h-10 text-brand-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Turn on Presence</h2>
                        <p className="text-zinc-400">
                            Create a temporary bubble. Friends nearby can see you're around, but exact location is hidden until you both agree.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Visibility Selector */}
                        <div className="bg-zinc-900/50 p-1 rounded-xl flex border border-zinc-800">
                            <button 
                                onClick={() => setVisibility('all')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${visibility === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Users className="w-4 h-4" /> All Friends
                                </div>
                            </button>
                            <button 
                                onClick={() => setVisibility('close')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${visibility === 'close' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Lock className="w-4 h-4" /> Close Friends
                                </div>
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 uppercase tracking-wider ml-1 mb-2 block">Set your Vibe</label>
                            <div className="grid grid-cols-2 gap-3">
                                {MOODS.map((m) => {
                                    const Icon = m.icon;
                                    const isSelected = mood === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setMood(m.id)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                                                isSelected 
                                                ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-500/20' 
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                        >
                                            <Icon className="w-6 h-6" />
                                            <span className="font-medium text-sm">{m.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {permissionError && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-center mb-2">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <p className="text-red-400 text-sm mb-3">
                                Radar requires location permissions to work! It's a proximity feature.
                            </p>
                            <Button 
                                onClick={handleActivate} 
                                variant="secondary" 
                                className="h-9 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 border-transparent w-full"
                            >
                                Retry Permission
                            </Button>
                        </div>
                    )}

                    <Button 
                        onClick={handleActivate}
                        className="w-full py-4 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-shadow"
                        variant="primary"
                        style={{ backgroundColor: '#10b981' }} // Emerald for "Go"
                    >
                        Activate Radar
                    </Button>
                    <p className="text-center text-xs text-zinc-600">
                        Signal expires in 60m or when you leave. Exact location is never shared without consent.
                    </p>
                </div>
            )}

            {(status === 'scanning' || status === 'detected') && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                    
                    {/* The Sonar Animation */}
                    <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex items-center justify-center">
                        {/* Rings */}
                        <div className="absolute inset-0 border border-brand-500/20 rounded-full opacity-20 scale-50" />
                        <div className="absolute inset-0 border border-brand-500/20 rounded-full opacity-20 scale-75" />
                        <div className="absolute inset-0 border border-brand-500/20 rounded-full opacity-20" />
                        
                        {/* Scanning Beam */}
                        <div className="absolute inset-0 rounded-full animate-spin [animation-duration:4s] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(139,92,246,0.1)_300deg,rgba(139,92,246,0.5)_360deg)]" 
                             style={{ maskImage: 'radial-gradient(circle, transparent 30%, black 100%)' }}
                        />

                        {/* User Center */}
                        <div className="absolute w-20 h-20 bg-black rounded-full border-4 border-zinc-800 z-20 flex items-center justify-center shadow-2xl">
                            <img src={currentUser.avatarUrl} className="w-full h-full rounded-full object-cover opacity-80" alt="me" />
                        </div>

                        {/* Detected Friend Blip */}
                        {status === 'detected' && detectedFriend && (
                            <button 
                                onClick={handleWave}
                                className="absolute top-[20%] right-[20%] w-16 h-16 z-30 flex flex-col items-center justify-center gap-1 group animate-in zoom-in fade-in duration-500"
                            >
                                <div className="relative">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75 animate-ping"></span>
                                    <img 
                                        src={detectedFriend.avatarUrl} 
                                        className="relative inline-flex h-12 w-12 rounded-full border-2 border-brand-400 object-cover" 
                                        alt="friend"
                                    />
                                </div>
                                <div className="bg-black/80 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap border border-zinc-800">
                                    Someone nearby
                                </div>
                            </button>
                        )}
                    </div>

                    <div className="absolute bottom-10 text-center space-y-4 z-20 px-4 w-full max-w-sm">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-widest uppercase animate-pulse">
                                {status === 'scanning' ? 'Scanning Area...' : 'Signal Detected'}
                            </h3>
                            <p className="text-zinc-400 text-sm mt-1">
                                {status === 'scanning' ? 'Looking for friends within 1km' : 'Tap the signal to wave'}
                            </p>
                        </div>
                        
                        {/* Check-In Button */}
                        <button 
                            onClick={handleCheckIn}
                            disabled={isCheckingIn}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors"
                        >
                            {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share className="w-4 h-4" />}
                            Check In (Broadcast Location)
                        </button>
                    </div>
                </div>
            )}

            {status === 'revealed' && detectedFriend && (
                <div className="w-full max-w-md p-6 space-y-8 text-center animate-in fade-in slide-in-from-bottom-10">
                    <div className="relative mx-auto w-32 h-32">
                        <img 
                            src={detectedFriend.avatarUrl} 
                            className="w-full h-full rounded-full border-4 border-brand-500 object-cover shadow-[0_0_40px_rgba(139,92,246,0.4)]"
                            alt="friend" 
                        />
                        <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-zinc-700 p-2 rounded-full">
                            <Hand className="w-6 h-6 text-yellow-400" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{detectedFriend.name}</h2>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30">
                            <MapPin className="w-4 h-4" />
                            <span className="font-bold">{distance} away</span>
                        </div>
                        <p className="text-zinc-400 mt-4 text-lg">
                            "Hey! I'm around. Let's catch up?"
                        </p>
                    </div>

                    <div className="space-y-4">
                        {meetStatus === 'idle' && (
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="secondary" onClick={handleDeactivate}>
                                    Ignore
                                </Button>
                                <Button 
                                    variant="primary" 
                                    className="bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20"
                                    icon={<Navigation className="w-4 h-4" />}
                                    onClick={handleMeetRequest}
                                >
                                    Meet Now
                                </Button>
                            </div>
                        )}

                        {meetStatus === 'sending' && (
                            <div className="bg-zinc-800/50 p-4 rounded-xl flex items-center justify-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                                <span className="text-zinc-300">Sending meet request...</span>
                            </div>
                        )}

                        {meetStatus === 'waiting' && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex flex-col items-center gap-2 animate-pulse">
                                <div className="flex items-center gap-2 text-yellow-400">
                                    <Clock className="w-5 h-5" />
                                    <span className="font-bold">Waiting for {detectedFriend.name}...</span>
                                </div>
                                <p className="text-xs text-yellow-500/70">Request sent. Waiting for them to accept.</p>
                            </div>
                        )}

                        {meetStatus === 'accepted' && (
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex flex-col items-center gap-2 animate-in zoom-in">
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span className="font-bold text-lg">Accepted!</span>
                                </div>
                                <p className="text-xs text-green-500/70">Opening navigation...</p>
                            </div>
                        )}
                        
                        {meetStatus === 'rejected' && (
                             <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                                <p className="text-red-400 mb-2">Request Declined</p>
                                <Button variant="secondary" onClick={() => setMeetStatus('idle')} className="h-8 text-xs">OK</Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};
