import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { User } from '../types';
import { OptimizedImage } from './ui/OptimizedImage';
import { Link } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
}

export const UserListModal: React.FC<UserListModalProps> = ({ isOpen, onClose, title, users }) => {
  const { user: currentUser, isFollowing, toggleFollow, hasRequestedFollow } = useGlobalContext();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-cream dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-olive-dark/10 dark:border-white/10 flex flex-col max-h-[70vh]"
          >
            <div className="p-4 border-b border-olive-dark/10 dark:border-white/10 flex items-center justify-between bg-white dark:bg-white/5">
                <h3 className="font-bold text-olive-dark dark:text-cream uppercase tracking-wide text-sm">{title}</h3>
                <button onClick={onClose} className="p-1 hover:bg-olive-dark/5 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} className="text-olive-dark/60 dark:text-cream/60" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {users.length > 0 ? (
                    <div className="space-y-1">
                        {users.map(u => {
                            const isMe = currentUser?.id === u.id;

                            return (
                                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-olive-dark/5 dark:hover:bg-white/5 rounded-xl transition-colors group">
                                    <Link to={`/profile/${u.id}`} onClick={onClose} className="flex items-center gap-3 flex-1">
                                        <OptimizedImage src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full" containerClassName="w-10 h-10 rounded-full" />
                                        <div>
                                            <h4 className="text-sm font-bold text-olive-dark dark:text-cream leading-none group-hover:text-green-600 dark:group-hover:text-neon-lime transition-colors">{u.username}</h4>
                                            <p className="text-xs text-olive-dark/60 dark:text-cream/60 mt-0.5">{u.name}</p>
                                        </div>
                                    </Link>
                                    {!isMe && currentUser && (() => {
                                        const following = isFollowing(u.id);
                                        const requested = hasRequestedFollow(u.id);
                                        return (
                                            <button 
                                                onClick={() => toggleFollow(u.id)}
                                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
                                                    following 
                                                    ? 'bg-transparent border border-olive-dark/20 dark:border-white/20 text-olive-dark dark:text-cream hover:border-red-500 hover:text-red-500' 
                                                    : requested
                                                    ? 'bg-transparent border border-olive-dark/20 dark:border-white/20 text-olive-dark dark:text-cream hover:border-red-500 hover:text-red-500'
                                                    : 'bg-olive-dark dark:bg-neon-lime text-neon-lime dark:text-olive-dark hover:opacity-90'
                                                }`}
                                            >
                                                {following ? 'Following' : requested ? 'Requested' : 'Follow'}
                                            </button>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-xs font-mono uppercase tracking-widest text-olive-dark/40 dark:text-cream/40">No users found</p>
                    </div>
                )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
