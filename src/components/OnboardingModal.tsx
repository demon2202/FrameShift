import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalContext } from '../context/GlobalContext';
import { Sparkles, Check } from 'lucide-react';

const CATEGORIES = ['Art', 'Design', 'Photography', 'Typography', 'Illustration', '3D', 'Minimalism', 'Abstract', 'Nature', 'Cyberpunk'];

export const OnboardingModal: React.FC = () => {
  const { user, updateUserProfile, checkUsernameExists } = useGlobalContext();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const checkTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.username) setUsername(user.username);
  }, [user?.name, user?.username]);

  React.useEffect(() => {
    const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (!cleanUsername || (user && cleanUsername === user.username)) {
      setUsernameError(null);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError(null);
    clearTimeout(checkTimeoutRef.current);

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const _user = user as any;
        const exists = await checkUsernameExists(cleanUsername, _user?.id);
        if (exists) {
          setUsernameError('Username is already taken');
        } else {
          setUsernameError(null);
        }
      } catch (err) {
        setUsernameError('Error checking username');
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(checkTimeoutRef.current);
  }, [username, user]);

  React.useEffect(() => {
    if (user && user.onboarded === false) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [user, user?.onboarded]);

  if (!user || user.onboarded !== false) return null;

  const togglePreference = (cat: string) => {
    setPreferences(prev => 
      prev.includes(cat) ? prev.filter(p => p !== cat) : [...prev, cat]
    );
  };

  const handleComplete = async () => {
    const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (!cleanUsername || !name.trim()) return;
    setIsSaving(true);
    try {
      await updateUserProfile({
        username: cleanUsername,
        name: name.trim(),
        feedPreferences: preferences,
        onboarded: true
      });
    } catch (err: any) {
      alert(err.message || 'Failed to complete onboarding');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cream/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-olive-dark/10"
        >
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-neon-lime rounded-xl flex items-center justify-center text-olive-dark">
                <Sparkles size={20} />
              </div>
              <h2 className="text-2xl font-bold text-olive-dark">Welcome to Poster!</h2>
            </div>

            {step === 1 ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-olive-dark/60 mb-6 font-medium">Let's set up your profile to get started.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-olive-dark/60 uppercase tracking-wider mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-cream border border-olive-dark/10 rounded-xl px-4 py-3 text-olive-dark font-medium focus:outline-none focus:border-olive-dark/30 transition-colors"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-olive-dark/60 uppercase tracking-wider mb-2">Username</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                        className={`w-full bg-cream border rounded-xl px-4 py-3 text-olive-dark font-medium focus:outline-none transition-colors ${
                          usernameError 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-olive-dark/10 focus:border-olive-dark/30'
                        }`}
                        placeholder="username"
                      />
                      {isCheckingUsername && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-olive-dark/30 border-t-olive-dark/60 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {usernameError && (
                      <p className="text-red-500 text-xs font-bold mt-2">{usernameError}</p>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  disabled={!username.trim() || !name.trim() || !!usernameError || isCheckingUsername}
                  className="w-full mt-8 bg-olive-dark text-neon-lime font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Continue
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-olive-dark/60 mb-6 font-medium">What kind of posters do you like?</p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => togglePreference(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        preferences.includes(cat) 
                          ? 'bg-olive-dark text-neon-lime shadow-md' 
                          : 'bg-cream text-olive-dark/60 hover:bg-olive-dark/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep(1)}
                    className="px-6 py-4 bg-cream text-olive-dark font-bold rounded-xl hover:bg-olive-dark/10 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleComplete}
                    disabled={isSaving}
                    className="flex-1 bg-olive-dark text-neon-lime font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {isSaving ? 'Saving...' : (
                      <>
                        Complete Setup <Check size={18} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
