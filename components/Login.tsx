
import React, { useState, useEffect } from 'react';
import { ArrowRight, Lock, Mail, AtSign, UserCheck, Eye, EyeOff, Loader2, X, Check } from 'lucide-react';
import { Button } from './Button';
import { Logo } from './Logo';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  AuthError
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"; 
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

type FormView = 'login' | 'signup' | 'forgot_password';

export const Login: React.FC = () => {
  const [view, setView] = useState<FormView>('login');
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Username Availability State
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time username uniqueness check
  useEffect(() => {
    if (view !== 'signup' || !username.trim()) {
      setIsUsernameAvailable(null);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    setIsUsernameAvailable(null);

    const checkUsername = setTimeout(async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("handle", "==", username));
        const querySnapshot = await getDocs(q);
        
        setIsUsernameAvailable(querySnapshot.empty);
      } catch (err) {
        console.error("Error checking username:", err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(checkUsername);
  }, [username, view]);


  const handleFirebaseError = (err: AuthError) => {
    switch (err.code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'This email is already registered.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/too-many-requests':
             return 'Access temporarily disabled due to many failed attempts. You can reset your password or try again later.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
  }

  const resetFormFields = (keepEmail = false) => {
    setName('');
    setUsername('');
    if (!keepEmail) setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsUsernameAvailable(null);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMessage('Password reset link sent! Please check your inbox.');
      setView('login');
    } catch (err) {
      setError(handleFirebaseError(err as AuthError));
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
    
    if (view === 'signup') {
      if (password !== confirmPassword) {
        setError("Passwords do not match!");
        setIsLoading(false);
        return;
      }
      if (!isUsernameAvailable) {
        setError("Username is taken. Please choose another one.");
        setIsLoading(false);
        return;
      }
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Firebase Auth profile
        await updateProfile(user, {
            displayName: `${name}|${username}`
        });

        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          handle: username,
          email: email, // Save email explicitly for potential future use
          avatarUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
          bannerUrl: `https://picsum.photos/seed/${user.uid}/1000/400`,
          bio: '',
          location: '',
          website: '',
          joinDate: Date.now(),
          followingCount: 0,
          followersCount: 0,
          profileViews: 0,
        });

        await sendEmailVerification(user);
        
        await signOut(auth);

        setInfoMessage('Verification email sent! Please check your inbox to activate your account.');
        setView('login');
        resetFormFields(true);

      } catch (err) {
        setError(handleFirebaseError(err as AuthError));
      }
    } else { // Login view
       if (!isValid) {
        setIsLoading(false);
        return;
      }
      try {
        // Standard Email Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
            await signOut(auth);
            setError("Please verify your email before logging in. Check your inbox for a verification link.");
        }

      } catch (err) {
        setError(handleFirebaseError(err as AuthError));
      }
    }
    setIsLoading(false);
  };

  const isValid = view === 'signup'
    ? (name.trim() && email.trim() && username.trim() && isUsernameAvailable && password.trim() && confirmPassword.trim() && password === confirmPassword)
    : (email.trim() && password.trim());

  const renderFormContent = () => {
    if (view === 'forgot_password') {
      return (
        <>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Reset Password</h2>
          <form onSubmit={handlePasswordReset} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    placeholder="Enter your registered email"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
              {infoMessage && <p className="text-green-400 text-sm text-center bg-green-500/10 p-2 rounded-lg">{infoMessage}</p>}

              <Button type="submit" className="w-full py-4 text-lg mt-4" disabled={isLoading} isLoading={isLoading}>
                Send Reset Link
              </Button>
          </form>
           <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
             <button onClick={() => setView('login')} className="text-sm text-brand-400 hover:underline">Back to Login</button>
           </div>
        </>
      );
    }

    return (
       <>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {view === 'signup' ? 'Create an account' : 'Welcome back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {view === 'signup' && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-5">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-400 ml-1">Full Name</label>
                  <div className="relative group">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              </div>
            )}

             <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-400 ml-1">
                  Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  placeholder="hello@loopzyy.com"
                />
              </div>
            </div>
            
            {view === 'signup' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Username</label>
                <div className="relative group">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className={`w-full bg-zinc-950/50 border ${
                        !username ? 'border-zinc-700' :
                        isCheckingUsername ? 'border-zinc-700' :
                        isUsernameAvailable ? 'border-green-500/50 focus:border-green-500' : 'border-red-500/50 focus:border-red-500'
                    } rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all`}
                    placeholder="your_username"
                  />
                  
                  {/* Status Indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                    ) : username ? (
                      isUsernameAvailable ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )
                    ) : null}
                  </div>
                </div>
                {username && !isCheckingUsername && !isUsernameAvailable && (
                    <p className="text-xs text-red-400 ml-1">Username is already taken</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-400 ml-1">Password</label>
                {view === 'login' && (
                  <button type="button" onClick={() => setView('forgot_password')} className="text-xs text-brand-400 hover:underline">Forgot Password?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl pl-10 pr-12 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {view === 'signup' && password && <PasswordStrengthIndicator password={password} />}
            </div>
            
            {view === 'signup' && (
               <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-zinc-950/50 border ${confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-zinc-700'} rounded-xl pl-10 pr-12 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs ml-1 mt-1">Passwords do not match</p>
                )}
              </div>
            )}
            
            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
            {infoMessage && <p className="text-green-400 text-sm text-center bg-green-500/10 p-2 rounded-lg">{infoMessage}</p>}


            <Button 
              type="submit" 
              className="w-full py-4 text-lg mt-4" 
              disabled={!isValid || isLoading}
              isLoading={isLoading}
              icon={view === 'login' && !isLoading ? <ArrowRight className="w-5 h-5" /> : undefined}
            >
              {view === 'signup' ? 'Sign Up' : 'Log In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
            <p className="text-zinc-400 text-sm">
              {view === 'signup' ? "Already have an account? " : "Don't have an account? "}
              <button 
                onClick={() => {
                  setView(view === 'signup' ? 'login' : 'signup');
                  setError(null);
                  setInfoMessage(null);
                  resetFormFields();
                }}
                className="text-brand-400 hover:text-brand-300 font-medium hover:underline transition-colors ml-1"
              >
                {view === 'signup' ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          </div>
       </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
           <div className="mb-6 animate-bounce">
              <Logo size="xl" />
           </div>
            <h1 className="text-5xl font-bold text-center bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent tracking-tighter mb-2">
              Loopzyy
            </h1>
            <p className="text-zinc-400 text-center text-lg">Social media, reimagined with AI.</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl transition-all duration-300">
          {renderFormContent()}
        </div>
      </div>
    </div>
  );
};
