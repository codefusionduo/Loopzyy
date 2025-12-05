import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Lock, Eye, User as UserIcon, Palette, Check, BadgeCheck, Loader2, Upload, Camera, Plus } from 'lucide-react';
import { User } from '../types';
import { sendVerificationRequest, uploadIdImage } from '../services/verificationService';

interface SettingsProps {
  onLogout: () => void;
  currentUser: User;
}

const THEMES = [
  {
    id: 'violet',
    label: 'Cosmic Violet',
    primary: '#8b5cf6',
    colors: {
      50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa',
      500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
    }
  },
  {
    id: 'blue',
    label: 'Ocean Blue',
    primary: '#3b82f6',
    colors: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
      500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
    }
  },
  {
    id: 'rose',
    label: 'Neon Rose',
    primary: '#f43f5e',
    colors: {
      50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185',
      500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519',
    }
  },
  {
    id: 'emerald',
    label: 'Cyber Emerald',
    primary: '#10b981',
    colors: {
      50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
      500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22',
    }
  },
  {
    id: 'amber',
    label: 'Solar Amber',
    primary: '#f59e0b',
    colors: {
      50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
      500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03',
    }
  }
];

// Helper to convert HSV to HSL for CSS
const hsvToHsl = (h: number, s: number, v: number) => {
    s /= 100;
    v /= 100;
    const l = v * (1 - s / 2);
    const sl = (l === 0 || l === 1) ? 0 : (v - l) / (Math.min(l, 1 - l));
    return { h, s: sl * 100, l: l * 100 };
};

// Helper to generate a full palette from HSL
const generatePaletteFromHSL = (h: number, s: number, l: number) => {
  const shades: Record<number, string> = {};
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  
  steps.forEach(step => {
      let lightness;
      if (step < 500) {
          // Interpolate between 98 (at 50) and UserL (at 500)
          const p = (step - 50) / 450; // 0 to 1
          lightness = 98 - p * (98 - l);
      } else if (step > 500) {
          // Interpolate between UserL (at 500) and 5 (at 950)
          const p = (step - 500) / 450; // 0 to 1
          lightness = l - p * (l - 5);
      } else {
          lightness = l;
      }
      shades[step] = `hsl(${h}, ${s}%, ${lightness}%)`;
  });
  
  return shades;
};

export const Settings: React.FC<SettingsProps> = ({ onLogout, currentUser }) => {
  const [activeThemeId, setActiveThemeId] = useState('violet');
  const [customHsv, setCustomHsv] = useState({ h: 260, s: 100, v: 100 });
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(currentUser.isPrivate || false);
  
  const idFileRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);
  
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  // Picker Refs
  const satValRef = useRef<HTMLDivElement>(null);
  const [isDraggingSatVal, setIsDraggingSatVal] = useState(false);

  useEffect(() => {
    const savedThemeId = localStorage.getItem('loopzyy-theme-id');
    const savedHsv = localStorage.getItem('loopzyy-theme-hsv');
    
    if (savedThemeId) {
      setActiveThemeId(savedThemeId);
    }
    if (savedHsv) {
      try {
        setCustomHsv(JSON.parse(savedHsv));
      } catch (e) { console.error("Error parsing saved HSV", e); }
    }
  }, []);

  const safeStringify = (obj: any) => {
    try {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
            return;
            }
            seen.add(value);
        }
        return value;
        });
    } catch (e) {
        console.error("SafeStringify failed", e);
        return "{}";
    }
  };

  const handleThemeChange = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;

    setActiveThemeId(themeId);
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--brand-${key}`, value);
    });

    try {
      localStorage.setItem('loopzyy-theme', safeStringify(theme.colors));
      localStorage.setItem('loopzyy-theme-id', themeId);
    } catch (error) {
      console.error("Failed to save theme preferences:", error);
    }
  };

  const applyCustomTheme = (h: number, s: number, v: number) => {
    const { h: hue, s: sat, l: light } = hsvToHsl(h, s, v);
    const colors = generatePaletteFromHSL(hue, sat, light);
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--brand-${key}`, value);
    });

    try {
      localStorage.setItem('loopzyy-theme', safeStringify(colors));
      localStorage.setItem('loopzyy-theme-id', 'custom');
      localStorage.setItem('loopzyy-theme-hsv', JSON.stringify({ h, s, v }));
    } catch (error) {
      console.error("Failed to save custom theme:", error);
    }
  };

  const updateSatVal = useCallback((clientX: number, clientY: number) => {
    if (!satValRef.current) return;
    const rect = satValRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    
    // x is saturation (0 to 100)
    // y is inverse value (top is 100, bottom is 0)
    const newS = x * 100;
    const newV = (1 - y) * 100;
    
    setCustomHsv(prev => {
        const next = { ...prev, s: newS, v: newV };
        applyCustomTheme(next.h, next.s, next.v);
        return next;
    });
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDraggingSatVal(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSatVal(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingSatVal) {
        updateSatVal(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDraggingSatVal(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleHueChange = (newHue: number) => {
      setCustomHsv(prev => {
          const next = { ...prev, h: newHue };
          applyCustomTheme(next.h, next.s, next.v);
          return next;
      });
  };

  const handleDeactivate = () => {
    if (window.confirm('Are you sure you want to deactivate your account? This cannot be undone.')) {
      alert('Account deactivation scheduled.');
    }
  };

  const handleTogglePrivate = async () => {
      const newState = !isPrivate;
      setIsPrivate(newState);
      // In a real app, update Firestore
      // await updateDoc(doc(db, "users", currentUser.id), { isPrivate: newState });
  };

  const handleSubmitVerification = async () => {
    if (!idFile || !selfieFile) {
        alert("Please upload both your ID and a selfie.");
        return;
    }

    setIsVerificationPending(true);
    try {
        const idUrl = await uploadIdImage(idFile);
        const selfieUrl = await uploadIdImage(selfieFile);
        
        await sendVerificationRequest(currentUser.id, "User requested verification", idUrl, selfieUrl);
        
        alert("Verification request submitted! We will check your details and notify you via email.");
        setIsVerificationModalOpen(false);
        setIdFile(null);
        setSelfieFile(null);
    } catch (error) {
        console.error("Verification failed", error);
        alert("Failed to submit request. Please try again later.");
    } finally {
        setIsVerificationPending(false);
    }
  };

  // Calculate current color for preview
  const currentHsl = hsvToHsl(customHsv.h, customHsv.s, customHsv.v);
  const currentColorString = `hsl(${currentHsl.h}, ${currentHsl.s}%, ${currentHsl.l}%)`;

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-0 relative">
      <h2 className="text-2xl font-bold mb-8">Settings</h2>
      
      {/* Verification Modal */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                <h3 className="text-xl font-bold mb-2">Request Verification</h3>
                <p className="text-zinc-400 text-sm mb-6">
                    To receive the blue tick, please upload a government-issued ID and a clear selfie holding the ID.
                </p>

                <div className="space-y-4 mb-6">
                    {/* ID Upload */}
                    <div 
                        onClick={() => idFileRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${idFile ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800'}`}
                    >
                        <input type="file" ref={idFileRef} className="hidden" accept="image/*" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                        {idFile ? (
                            <div className="text-center">
                                <Check className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-white">{idFile.name}</p>
                            </div>
                        ) : (
                            <div className="text-center text-zinc-500">
                                <Upload className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Upload Government ID</p>
                            </div>
                        )}
                    </div>

                    {/* Selfie Upload */}
                    <div 
                        onClick={() => selfieFileRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${selfieFile ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800'}`}
                    >
                        <input type="file" ref={selfieFileRef} className="hidden" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} />
                         {selfieFile ? (
                            <div className="text-center">
                                <Check className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-white">{selfieFile.name}</p>
                            </div>
                        ) : (
                            <div className="text-center text-zinc-500">
                                <Camera className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Upload Selfie</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsVerificationModalOpen(false)}
                        className="flex-1 py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmitVerification}
                        disabled={isVerificationPending || !idFile || !selfieFile}
                        className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isVerificationPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
      )}
      
      <div className="space-y-6">
        <Section title="Appearance" icon={<Palette className="w-5 h-5" />}>
           <div className="flex flex-col gap-4">
             <div className="font-medium text-zinc-200">Accent Color</div>
             <div className="flex flex-wrap gap-4">
               {THEMES.map(theme => (
                 <button
                   key={theme.id}
                   onClick={() => handleThemeChange(theme.id)}
                   className={`
                     relative w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110
                     ${activeThemeId === theme.id ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'}
                   `}
                   style={{ backgroundColor: theme.primary }}
                   title={theme.label}
                 >
                   {activeThemeId === theme.id && <Check className="w-5 h-5 text-white drop-shadow-md" strokeWidth={3} />}
                 </button>
               ))}
               
               {/* Custom Color Button */}
               <button
                 onClick={() => { setActiveThemeId('custom'); applyCustomTheme(customHsv.h, customHsv.s, customHsv.v); }}
                 className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110
                    bg-gradient-to-tr from-red-500 via-green-500 to-blue-500
                    ${activeThemeId === 'custom' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'}
                 `}
                 title="Custom Color"
               >
                  {activeThemeId === 'custom' ? (
                     <Check className="w-5 h-5 text-white drop-shadow-md" strokeWidth={3} />
                  ) : (
                     <Plus className="w-6 h-6 text-white" />
                  )}
               </button>
             </div>
             
             {/* Custom Color Picker Slider */}
             {activeThemeId === 'custom' && (
                <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 animate-in fade-in slide-in-from-top-2">
                    {/* Saturation/Brightness Area */}
                    <div 
                        ref={satValRef}
                        className="w-full h-40 rounded-xl mb-4 relative cursor-crosshair touch-none select-none overflow-hidden"
                        style={{ backgroundColor: `hsl(${customHsv.h}, 100%, 50%)` }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
                        
                        {/* Thumb */}
                        <div 
                            className="absolute w-6 h-6 rounded-full border-2 border-white shadow-md -ml-3 -mt-3 pointer-events-none"
                            style={{ 
                                left: `${customHsv.s}%`, 
                                top: `${100 - customHsv.v}%`,
                                backgroundColor: currentColorString
                            }}
                        />
                    </div>

                    {/* Hue Slider */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-500 uppercase">Hue</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="360" 
                            value={customHsv.h} 
                            onChange={(e) => handleHueChange(parseInt(e.target.value))}
                            className="flex-1 h-4 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)`
                            }}
                        />
                        <div 
                            className="w-8 h-8 rounded-full border border-zinc-600 shadow-inner" 
                            style={{ backgroundColor: currentColorString }}
                        />
                    </div>
                    
                    {/* Palette Preview */}
                    <div className="mt-4 flex gap-1">
                        <div className="h-8 flex-1 rounded-l-lg" style={{ backgroundColor: `hsl(${currentHsl.h}, ${currentHsl.s}%, 95%)` }} />
                        <div className="h-8 flex-1" style={{ backgroundColor: `hsl(${currentHsl.h}, ${currentHsl.s}%, 80%)` }} />
                        <div className="h-8 flex-1" style={{ backgroundColor: `hsl(${currentHsl.h}, ${currentHsl.s}%, 50%)` }} />
                        <div className="h-8 flex-1" style={{ backgroundColor: `hsl(${currentHsl.h}, ${currentHsl.s}%, 30%)` }} />
                        <div className="h-8 flex-1 rounded-r-lg" style={{ backgroundColor: `hsl(${currentHsl.h}, ${currentHsl.s}%, 10%)` }} />
                    </div>
                </div>
             )}

             <p className="text-sm text-zinc-500">Select a preset or customize your theme color.</p>
           </div>
           <div className="h-px bg-zinc-800 my-2"></div>
           <Toggle label="High Contrast Mode" description="Increase contrast for better visibility" />
        </Section>

        <Section title="Account Preference" icon={<UserIcon className="w-5 h-5" />}>
           <Toggle 
             label="Private Account" 
             description="Only followers can see your posts" 
             checked={isPrivate}
             onChange={handleTogglePrivate}
           />
           <Toggle label="Show Read Receipts" description="Let others know when you've seen their messages" checked />
           
           <div className="h-px bg-zinc-800 my-2"></div>
           
           <div className="flex items-center justify-between group">
              <div>
                <div className="font-medium text-zinc-200 flex items-center gap-2">
                    Verification 
                    <BadgeCheck className="w-4 h-4 text-brand-500" />
                </div>
                <div className="text-sm text-zinc-500">Apply for a verified badge</div>
              </div>
              
              {currentUser.verified ? (
                 <div className="px-4 py-2 bg-green-500/10 text-green-400 rounded-xl text-sm font-medium border border-green-500/20 flex items-center gap-2">
                     <Check className="w-4 h-4" /> Verified
                 </div>
              ) : (
                <button 
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all border shadow-lg shadow-black/20 bg-zinc-800 hover:bg-brand-600 text-white border-zinc-700 hover:border-brand-500"
                >
                    Request
                </button>
              )}
           </div>
        </Section>

        <Section title="Content & Display" icon={<Eye className="w-5 h-5" />}>
           <Toggle label="Autoplay Videos" description="Play videos automatically on Wi-Fi" checked />
           <Toggle label="Reduce Motion" description="Minimize animation effects" />
        </Section>

        <div className="pt-6 border-t border-zinc-800">
          <h3 className="font-bold text-red-400 mb-4">Danger Zone</h3>
          <div className="flex flex-col items-start gap-4">
            <button 
              onClick={onLogout}
              className="text-red-500 hover:text-red-400 text-sm font-medium hover:underline transition-all"
            >
              Log Out
            </button>
            <button 
              onClick={handleDeactivate}
              className="text-red-500 hover:text-red-400 text-sm font-medium hover:underline transition-all"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
    <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/50">
      <div className="text-brand-400">{icon}</div>
      <h3 className="font-bold text-white">{title}</h3>
    </div>
    <div className="p-4 space-y-6">
      {children}
    </div>
  </div>
);

const Toggle: React.FC<{ label: string; description: string; checked?: boolean; onChange?: () => void }> = ({ label, description, checked = false, onChange }) => {
  const [isOn, setIsOn] = useState(checked);
  
  useEffect(() => {
      setIsOn(checked);
  }, [checked]);

  const handleClick = () => {
      const newState = !isOn;
      setIsOn(newState);
      if (onChange) onChange();
  };

  return (
    <div className="flex items-center justify-between group cursor-pointer" onClick={handleClick}>
      <div>
        <div className="font-medium text-zinc-200 group-hover:text-white transition-colors">{label}</div>
        <div className="text-sm text-zinc-500">{description}</div>
      </div>
      <button 
        className={`w-12 h-6 rounded-full transition-colors relative ${isOn ? 'bg-brand-500' : 'bg-zinc-700'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isOn ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
};