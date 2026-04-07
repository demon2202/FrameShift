
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { ArrowRight, AlertCircle, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { ContourBackground } from '../components/ui/ContourBackground';

export const Login: React.FC = () => {
  const { login, loginWithEmail, registerWithEmail, user } = useGlobalContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already logged in (or upon successful login), redirect
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        await registerWithEmail(email, password, username, name);
      } else if (mode === 'forgot-password') {
        // Mock Password Reset
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (!email.includes('@')) throw new Error('Please enter a valid email address.');
        setSuccessMessage(`Password reset link sent to ${email}`);
        setIsLoading(false);
        return; // Don't redirect
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await login();
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot-password') => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    setPassword('');
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Join The Shift';
      case 'forgot-password': return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Sign in to access your creative space';
      case 'register': return 'Create an account to save and share';
      case 'forgot-password': return 'Enter your email to receive a reset link';
    }
  };

  return (
    <div className="min-h-screen bg-olive-dark flex items-center justify-center p-4 relative overflow-hidden">
      <ContourBackground />
      
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-neon-lime/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-olive-dark/80 backdrop-blur-xl border border-cream/10 p-8 md:p-12 rounded-3xl shadow-2xl"
        role="main"
        aria-labelledby="auth-title"
      >
        <div className="text-center mb-10">
            <div className="flex flex-col items-center leading-none tracking-tighter mb-8">
                <span className="font-sans font-black text-5xl text-cream tracking-tighter">FRAME</span>
                <span className="font-serif italic text-5xl -mt-2 text-neon-lime">SHIFT</span>
            </div>
            
            <motion.h1 
                key={mode}
                id="auth-title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-sans font-bold text-cream mb-2 uppercase tracking-widest"
            >
                {getTitle()}
            </motion.h1>
            <p className="text-cream/60 font-mono text-xs uppercase tracking-wider">
                {getSubtitle()}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" aria-label={`${getTitle()} form`}>
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 text-red-200 text-sm overflow-hidden"
                        role="alert"
                    >
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}
                {successMessage && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-start gap-3 text-green-200 text-sm overflow-hidden"
                        role="status"
                    >
                        <Mail size={16} className="text-green-500 shrink-0 mt-0.5" />
                        <span>{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Registration Fields */}
            <AnimatePresence>
                {mode === 'register' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                    >
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-bold text-cream/40 uppercase tracking-widest">Full Name</label>
                            <input 
                                id="name"
                                type="text" 
                                placeholder="Jane Doe" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-olive-dark border border-cream/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime focus:ring-1 focus:ring-neon-lime/20 outline-none transition-all placeholder-cream/20 font-medium"
                                required={mode === 'register'}
                                aria-required={mode === 'register'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="username" className="text-xs font-bold text-cream/40 uppercase tracking-widest">Username</label>
                            <input 
                                id="username"
                                type="text" 
                                placeholder="@janedoe" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-olive-dark border border-cream/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime focus:ring-1 focus:ring-neon-lime/20 outline-none transition-all placeholder-cream/20 font-medium"
                                required={mode === 'register'}
                                aria-required={mode === 'register'}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold text-cream/40 uppercase tracking-widest">
                    {mode === 'login' ? 'Email or Username' : 'Email'}
                </label>
                <input 
                    id="email"
                    type={mode === 'login' ? "text" : "email"}
                    placeholder={mode === 'login' ? "email@example.com or @username" : "email@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-olive-dark border border-cream/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime focus:ring-1 focus:ring-neon-lime/20 outline-none transition-all placeholder-cream/20 font-medium"
                    disabled={isLoading}
                    required
                    aria-required="true"
                />
            </div>
            
            <AnimatePresence>
                {mode !== 'forgot-password' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                    >
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-xs font-bold text-cream/40 uppercase tracking-widest">Password</label>
                            {mode === 'login' && (
                                <button 
                                    type="button"
                                    onClick={() => switchMode('forgot-password')}
                                    className="text-[10px] font-bold text-neon-lime hover:text-white transition-colors uppercase tracking-wider"
                                >
                                    Forgot?
                                </button>
                            )}
                        </div>
                        <input 
                            id="password"
                            type="password" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-olive-dark border border-cream/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime focus:ring-1 focus:ring-neon-lime/20 outline-none transition-all placeholder-cream/20 font-medium"
                            disabled={isLoading}
                            required
                            minLength={6}
                            aria-required="true"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pt-6 space-y-4">
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-neon-lime text-olive-dark font-sans font-black text-lg tracking-wide rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-neon-lime/20"
                    aria-label={isLoading ? "Processing" : (mode === 'login' ? 'Sign In' : mode === 'register' ? 'Sign Up' : 'Send Reset Link')}
                >
                    {isLoading ? (
                        <Loader2 size={24} className="animate-spin" />
                    ) : (
                        <>
                            {mode === 'login' && 'ENTER'}
                            {mode === 'register' && 'JOIN'}
                            {mode === 'forgot-password' && 'SEND LINK'}
                            
                            {mode !== 'forgot-password' && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        </>
                    )}
                </button>

                {mode !== 'forgot-password' && (
                    <>
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex-1 h-px bg-cream/10"></div>
                            <span className="text-xs font-bold text-cream/40 uppercase tracking-widest">OR</span>
                            <div className="flex-1 h-px bg-cream/10"></div>
                        </div>
                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full py-4 bg-white text-olive-dark font-sans font-bold text-sm tracking-wide rounded-xl hover:bg-cream transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                    </>
                )}
            </div>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-cream/5">
            {mode === 'forgot-password' ? (
                <button 
                    onClick={() => switchMode('login')}
                    className="text-cream/40 hover:text-neon-lime transition-colors text-xs flex items-center justify-center gap-2 w-full font-sans uppercase tracking-widest"
                >
                    <ArrowLeft size={14} /> Back to Login
                </button>
            ) : (
                <button 
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    className="text-cream/40 hover:text-neon-lime transition-colors text-xs flex items-center justify-center gap-2 w-full font-sans uppercase tracking-widest"
                >
                    {mode === 'login' ? (
                        <>Don't have an account? <span className="text-cream underline decoration-neon-lime underline-offset-4 font-bold">Sign up</span></>
                    ) : (
                        <>Already have an account? <span className="text-cream underline decoration-neon-lime underline-offset-4 font-bold">Log in</span></>
                    )}
                </button>
            )}
        </div>
      </motion.div>
    </div>
  );
};
