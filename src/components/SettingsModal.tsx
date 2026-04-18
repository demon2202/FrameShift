import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, Shield, Bell, Moon, Sun, User, Palette, Layout } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEED_TAGS = ['Neon', 'Retro', 'Minimal', 'Abstract', 'Nature', 'Glitch', 'Swiss', 'Typography', '3D', 'Dark', 'Sci-Fi', 'Cyberpunk'];

const BlockedUserItem: React.FC<{ userId: string }> = ({ userId }) => {
    const { allUsers, unblockUser } = useGlobalContext();
    const user = allUsers.find(u => u.id === userId);

    if (!user) return null;

    return (
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-olive-dark/10 shadow-sm">
            <div className="flex items-center gap-3">
                <OptimizedImage src={user.avatar} alt={user.username || 'unknown'} className="w-10 h-10 rounded-full" containerClassName="w-10 h-10 rounded-full" />
                <div>
                    <h4 className="text-sm font-bold text-olive-dark leading-none">{user.username || 'unknown'}</h4>
                    <span className="text-[10px] text-olive-dark/40 font-mono uppercase">Blocked</span>
                </div>
            </div>
            <button 
                onClick={() => unblockUser(userId)}
                className="px-3 py-1 bg-olive-dark/5 text-olive-dark hover:bg-red-500 hover:text-white rounded-full text-xs font-bold uppercase tracking-wide transition-colors"
            >
                Unblock
            </button>
        </div>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updatePassword, togglePrivacy, deleteAccount, theme, toggleTheme, updateFeedPreferences, updateUserProfile } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'notifications' | 'appearance' | 'feed'>('account');
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Profile State
  const [username, setUsername] = useState(user?.username || '');
  const [name, setName] = useState(user?.name || '');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Mock States
  // const [emailNotifs, setEmailNotifs] = useState(true);
  // const [pushNotifs, setPushNotifs] = useState(true);
  
  const notifs = {
      email: user?.notificationPreferences?.email ?? true,
      push: user?.notificationPreferences?.push ?? true,
      likesAndComments: user?.notificationPreferences?.likesAndComments ?? true,
      newFollowers: user?.notificationPreferences?.newFollowers ?? true,
      directMessages: user?.notificationPreferences?.directMessages ?? true,
  };

  const handleToggleNotification = async (key: keyof typeof notifs) => {
      if (!user) return;
      await updateUserProfile({
          notificationPreferences: {
              ...(user.notificationPreferences || { email: true, push: true }),
              [key]: !notifs[key]
          }
      });
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const [localFeedPrefs, setLocalFeedPrefs] = useState<string[]>(user?.feedPreferences || []);

  React.useEffect(() => {
    if (user?.feedPreferences) {
      setLocalFeedPrefs(user.feedPreferences);
    }
  }, [user?.feedPreferences]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords don't match" });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters" });
            return;
        }
        
        await updatePassword(newPassword);
        setMessage({ type: 'success', text: "Password updated successfully" });
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        setMessage({ type: 'error', text: error.message || "Failed to update password" });
    }
  };

  const handleProfileChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) {
        setProfileMessage({ type: 'error', text: "Name and Username are required" });
        return;
    }
    try {
        await updateUserProfile({
            username: username.trim(),
            name: name.trim()
        });
        setProfileMessage({ type: 'success', text: "Profile updated successfully" });
    } catch (error: any) {
        setProfileMessage({ type: 'error', text: error.message || "Failed to update profile" });
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-olive-dark/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-cream dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-olive-dark/10 dark:border-white/10 flex flex-col md:flex-row max-h-[85vh]"
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-olive-dark/5 dark:bg-white/5 border-r border-olive-dark/10 dark:border-white/10 p-6 flex flex-col gap-2 overflow-y-auto">
            <h2 className="text-2xl font-display font-black text-olive-dark dark:text-cream uppercase tracking-tighter mb-6">Settings</h2>
            
            <button 
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-wide ${activeTab === 'account' ? 'bg-olive-dark text-neon-lime shadow-lg' : 'text-olive-dark/60 dark:text-cream/60 hover:bg-olive-dark/5 dark:hover:bg-white/5 hover:text-olive-dark dark:hover:text-cream'}`}
            >
                <User size={16} /> Account
            </button>
            <button 
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-wide ${activeTab === 'privacy' ? 'bg-olive-dark text-neon-lime shadow-lg' : 'text-olive-dark/60 dark:text-cream/60 hover:bg-olive-dark/5 dark:hover:bg-white/5 hover:text-olive-dark dark:hover:text-cream'}`}
            >
                <Shield size={16} /> Privacy
            </button>
            <button 
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-wide ${activeTab === 'notifications' ? 'bg-olive-dark text-neon-lime shadow-lg' : 'text-olive-dark/60 dark:text-cream/60 hover:bg-olive-dark/5 dark:hover:bg-white/5 hover:text-olive-dark dark:hover:text-cream'}`}
            >
                <Bell size={16} /> Notifications
            </button>
            <button 
                onClick={() => setActiveTab('appearance')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-wide ${activeTab === 'appearance' ? 'bg-olive-dark text-neon-lime shadow-lg' : 'text-olive-dark/60 dark:text-cream/60 hover:bg-olive-dark/5 dark:hover:bg-white/5 hover:text-olive-dark dark:hover:text-cream'}`}
            >
                <Palette size={16} /> Appearance
            </button>
            <button 
                onClick={() => setActiveTab('feed')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-wide ${activeTab === 'feed' ? 'bg-olive-dark text-neon-lime shadow-lg' : 'text-olive-dark/60 dark:text-cream/60 hover:bg-olive-dark/5 dark:hover:bg-white/5 hover:text-olive-dark dark:hover:text-cream'}`}
            >
                <Layout size={16} /> Feed
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-neutral-900/50 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-olive-dark/5 dark:hover:bg-white/10 rounded-full transition-colors z-10">
                <X size={20} className="text-olive-dark/60 dark:text-cream/60" />
            </button>

            {activeTab === 'feed' && (
                <div className="space-y-8 max-w-lg">
                    <div>
                        <h3 className="text-xl font-bold text-olive-dark dark:text-cream uppercase tracking-tight mb-2">Feed Preferences</h3>
                        <p className="text-sm text-olive-dark/60 dark:text-cream/60">Customize your feed by selecting topics you love.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {FEED_TAGS.map(tag => {
                            const isSelected = localFeedPrefs.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        const newPrefs = isSelected 
                                            ? localFeedPrefs.filter(t => t !== tag)
                                            : [...localFeedPrefs, tag];
                                        setLocalFeedPrefs(newPrefs);
                                        updateFeedPreferences(newPrefs);
                                    }}
                                    className={`px-4 py-2 rounded-full text-xs font-bold font-mono uppercase transition-all border ${
                                        isSelected 
                                        ? 'bg-neon-lime text-black border-neon-lime shadow-[0_0_10px_rgba(204,255,0,0.3)]' 
                                        : 'bg-olive-dark/5 dark:bg-white/5 text-olive-dark/60 dark:text-cream/60 border-olive-dark/10 dark:border-white/10 hover:border-olive-dark/30 dark:hover:border-white/30'
                                    }`}
                                >
                                    {isSelected && <span className="mr-2">✓</span>}
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="p-4 bg-olive-dark/5 dark:bg-white/5 rounded-xl border border-dashed border-olive-dark/10 dark:border-white/10">
                        <p className="text-xs text-olive-dark/60 dark:text-cream/60 text-center font-mono">
                            Selected topics will appear more frequently in your feed, even from creators you don't follow.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'account' && (
                <div className="space-y-8 max-w-lg">
                    <div>
                        <h3 className="text-xl font-bold text-olive-dark dark:text-cream uppercase tracking-tight mb-2">Profile Info</h3>
                        <p className="text-sm text-olive-dark/60 dark:text-cream/60">Update your public display name and username.</p>
                    </div>

                    <form onSubmit={handleProfileChange} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-olive-dark dark:text-cream uppercase tracking-widest mb-2">Display Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => { setProfileMessage(null); setName(e.target.value); }}
                                className="w-full bg-cream dark:bg-white/5 border border-olive-dark/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-olive-dark/30 dark:focus:border-white/30 text-olive-dark dark:text-cream transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-olive-dark dark:text-cream uppercase tracking-widest mb-2">Username</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => { setProfileMessage(null); setUsername(e.target.value); }}
                                className="w-full bg-cream dark:bg-white/5 border border-olive-dark/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-olive-dark/30 dark:focus:border-white/30 text-olive-dark dark:text-cream transition-colors"
                            />
                        </div>

                        {profileMessage && (
                            <div className={`text-xs font-bold uppercase tracking-wide p-3 rounded-lg ${profileMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {profileMessage.text}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="px-8 py-3 bg-olive-dark text-neon-lime font-bold text-xs uppercase tracking-widest rounded-full hover:bg-olive-dark/90 transition-all shadow-lg"
                        >
                            Update Profile
                        </button>
                    </form>

                    <div className="pt-8 mt-8 border-t border-olive-dark/10 dark:border-white/10">
                        <h3 className="text-xl font-bold text-olive-dark dark:text-cream uppercase tracking-tight mb-2">Change Password</h3>
                        <p className="text-sm text-olive-dark/60 dark:text-cream/60">Update your password to keep your account secure.</p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-olive-dark dark:text-cream uppercase tracking-widest mb-2">New Password</label>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => { setMessage(null); setNewPassword(e.target.value); }}
                                className="w-full bg-cream dark:bg-white/5 border border-olive-dark/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-olive-dark/30 dark:focus:border-white/30 text-olive-dark dark:text-cream transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-olive-dark dark:text-cream uppercase tracking-widest mb-2">Confirm Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => { setMessage(null); setConfirmPassword(e.target.value); }}
                                className="w-full bg-cream dark:bg-white/5 border border-olive-dark/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-olive-dark/30 dark:focus:border-white/30 text-olive-dark dark:text-cream transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        {message && (
                            <div className={`text-xs font-bold uppercase tracking-wide p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="px-8 py-3 bg-olive-dark text-neon-lime font-bold text-xs uppercase tracking-widest rounded-full hover:bg-olive-dark/90 transition-all shadow-lg"
                        >
                            Update Password
                        </button>
                    </form>

                    <div className="pt-8 mt-8 border-t border-red-500/20">
                        <h3 className="text-xl font-bold text-red-500 uppercase tracking-tight mb-2">Danger Zone</h3>
                        <p className="text-sm text-red-500/60 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                        <button 
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                                    deleteAccount();
                                    onClose();
                                }
                            }}
                            className="px-6 py-3 bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-widest rounded-full hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'privacy' && (
                <div className="space-y-8 max-w-lg">
                    <div>
                        <h3 className="text-xl font-bold text-olive-dark dark:text-cream uppercase tracking-tight mb-2">Account Privacy</h3>
                        <p className="text-sm text-olive-dark/60 dark:text-cream/60">Control who can see your content and message you.</p>
                    </div>

                    <div className="flex items-start justify-between p-6 bg-cream dark:bg-white/5 rounded-2xl border border-olive-dark/10 dark:border-white/10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Lock size={18} className="text-olive-dark dark:text-cream" />
                                <span className="font-bold text-olive-dark dark:text-cream uppercase tracking-wide">Private Account</span>
                            </div>
                            <p className="text-xs text-olive-dark/60 dark:text-cream/60 max-w-xs leading-relaxed">
                                When your account is private, only people you approve can see your photos and videos. Your existing followers won't be affected.
                            </p>
                        </div>
                        <button 
                            onClick={togglePrivacy}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${user.isPrivate ? 'bg-olive-dark dark:bg-neon-lime' : 'bg-olive-dark/20 dark:bg-white/20'}`}
                        >
                            <div className={`absolute top-1 left-1 w-6 h-6 bg-white dark:bg-olive-dark rounded-full shadow-md transition-transform duration-300 ${user.isPrivate ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="pt-8 mt-8 border-t border-olive-dark/10 dark:border-white/10">
                        <h3 className="text-xl font-bold text-olive-dark dark:text-cream uppercase tracking-tight mb-4">Blocked Accounts</h3>
                        <p className="text-sm text-olive-dark/60 dark:text-cream/60 mb-6">Users you have blocked cannot see your profile or posts.</p>
                        
                        {(user.blockedUsers && user.blockedUsers.length > 0) ? (
                            <div className="space-y-4">
                                {user.blockedUsers.map(blockedId => (
                                    <BlockedUserItem key={blockedId} userId={blockedId} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-olive-dark/5 dark:bg-white/5 rounded-xl border border-dashed border-olive-dark/10 dark:border-white/10">
                                <p className="text-xs font-bold text-olive-dark/40 dark:text-cream/40 uppercase tracking-widest">No blocked users</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-8 max-w-lg">
                    <div>
                        <h3 className="text-xl font-bold text-olive-dark dark:text-cream uppercase tracking-tight mb-2">Notifications</h3>
                        <p className="text-sm text-olive-dark/60 dark:text-cream/60">Manage how you receive updates.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { id: 'email', label: 'Email Notifications', desc: 'Receive emails about your account activity.' },
                            { id: 'push', label: 'Push Notifications', desc: 'Receive push notifications on your device.' },
                            { id: 'likesAndComments', label: 'Likes & Comments', desc: 'When someone interacts with your posters.' },
                            { id: 'newFollowers', label: 'New Followers', desc: 'When someone starts following you.' },
                            { id: 'directMessages', label: 'Direct Messages', desc: 'When you receive a new message.' },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-cream dark:bg-white/5 rounded-xl border border-olive-dark/10 dark:border-white/10 hover:border-olive-dark/30 dark:hover:border-white/30 transition-colors">
                                <div>
                                    <h4 className="font-bold text-olive-dark dark:text-cream uppercase tracking-wide text-sm">{item.label}</h4>
                                    <p className="text-xs text-olive-dark/60 dark:text-cream/60 mt-1">{item.desc}</p>
                                </div>
                                <button 
                                    onClick={() => handleToggleNotification(item.id as keyof typeof notifs)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${notifs[item.id as keyof typeof notifs] ? 'bg-olive-dark dark:bg-neon-lime' : 'bg-olive-dark/20 dark:bg-white/20'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white dark:bg-olive-dark rounded-full shadow-sm transition-transform duration-300 ${notifs[item.id as keyof typeof notifs] ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'appearance' && (
                <div className="space-y-8 max-w-lg">
                    <div>
                        <h3 className="text-xl font-bold text-olive-dark dark:text-cream uppercase tracking-tight mb-2">Appearance</h3>
                        <p className="text-sm text-olive-dark/60 dark:text-cream/60">Customize your viewing experience.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => theme === 'dark' && toggleTheme()}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-olive-dark bg-olive-dark/5 shadow-lg' : 'border-olive-dark/10 hover:border-olive-dark/30 bg-transparent'}`}
                        >
                            <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mb-4 shadow-inner">
                                <Sun size={28} className="text-olive-dark" />
                            </div>
                            <span className="font-bold text-olive-dark dark:text-cream uppercase tracking-wide text-sm">Light Mode</span>
                        </button>
                        
                        <button 
                            onClick={() => theme === 'light' && toggleTheme()}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-neon-lime bg-white/5 shadow-lg shadow-neon-lime/10' : 'border-olive-dark/10 dark:border-white/10 hover:border-olive-dark/30 dark:hover:border-white/30 bg-transparent'}`}
                        >
                            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 shadow-inner">
                                <Moon size={28} className="text-neon-lime" />
                            </div>
                            <span className="font-bold text-olive-dark dark:text-cream uppercase tracking-wide text-sm">Dark Mode</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
};
