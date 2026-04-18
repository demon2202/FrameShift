import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Send, Trash2, Loader2 } from 'lucide-react';
import { Story, User } from '../types';
import { OptimizedImage } from './ui/OptimizedImage';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalContext } from '../context/GlobalContext';

interface StoryViewerProps {
  groupedStories: { user: User; stories: Story[] }[];
  initialUserIndex: number;
  onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ groupedStories, initialUserIndex, onClose }) => {
  const { sendMessage, user, deleteStory, viewStory, getOrCreateThread } = useGlobalContext();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const currentUserGroup = groupedStories[currentUserIndex];
  const currentStory = currentUserGroup?.stories[currentStoryIndex];
  const isOwnStory = user && currentUserGroup ? user.id === currentUserGroup.user.id : false;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleNext = useCallback(() => {
    if (currentStoryIndex < currentUserGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < groupedStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, currentUserGroup, currentUserIndex, groupedStories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  }, [currentStoryIndex, currentUserIndex]);

  const handleSendMessage = async () => {
      if (!messageText.trim() || !user || !currentUserGroup) return;
      
      setReplyStatus('sending');
      try {
          const threadId = await getOrCreateThread(currentUserGroup.user.id);
          await sendMessage(threadId, `Replying to story: ${messageText}`);
          setMessageText('');
          setIsPaused(false);
          setReplyStatus('success');
          setTimeout(() => setReplyStatus('idle'), 2000);
      } catch {
          setReplyStatus('error');
          setTimeout(() => setReplyStatus('idle'), 2000);
      }
  };

  const handleDelete = () => {
      if (currentStory) {
          deleteStory(currentStory.id);
          setShowDeleteConfirm(false);
          // If it was the last story for this user
          if (currentUserGroup.stories.length <= 1) {
              // If it was the last user
              if (groupedStories.length <= 1) {
                  onClose();
              } else {
                  // Move to next user or prev user
                  if (currentUserIndex < groupedStories.length - 1) {
                      // Next user will slide in
                      // setCurrentUserIndex(prev => prev + 1); // Actually, the group will be removed from props by parent re-render? 
                      // Ideally parent should handle this, but for now let's just close or try to move.
                      // Since we are modifying global state, the parent `groupedStories` prop should update.
                      // We just need to ensure we don't crash.
                      onClose(); // Safest bet for now to avoid index out of bounds on re-render
                  } else {
                      onClose();
                  }
              }
          } else {
             // Not the last story, just move to next or prev
             if (currentStoryIndex >= currentUserGroup.stories.length - 1) {
                 setCurrentStoryIndex(prev => prev - 1);
             }
             // If not last index, the next one will take its place at current index
          }
      }
  };

  // Timer
  useEffect(() => {
    if (isPaused || !currentStory || showDeleteConfirm) return;

    if (user && !currentStory.viewers.includes(user.id)) {
      viewStory(currentStory.id);
    }

    const duration = 5000; // 5 seconds
    const interval = 50; // Update every 50ms
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStory, isPaused, handleNext, showDeleteConfirm, user, viewStory]);

  if (!currentUserGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Blurred Background */}
      <div className="absolute inset-0 z-0 opacity-30 blur-3xl scale-110">
        <OptimizedImage 
            src={currentStory.imageUrl} 
            className="w-full h-full object-cover" 
            alt="Background" 
            containerClassName="w-full h-full"
        />
      </div>

      {/* Close Button (Desktop) */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 z-50 p-3 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md border border-white/10 hidden md:block"
      >
        <X size={24} />
      </button>

      {/* Main Story Container - Mobile Aspect Ratio */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full md:w-[400px] h-full md:h-[85vh] bg-black md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 z-10 flex flex-col"
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-3 pt-4 bg-gradient-to-b from-black/60 to-transparent">
          {currentUserGroup.stories.map((_, idx) => (
            <div key={idx} className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div 
                className="h-full bg-white"
                initial={{ width: idx < currentStoryIndex ? '100%' : '0%' }}
                animate={{ 
                  width: idx < currentStoryIndex ? '100%' : 
                         idx === currentStoryIndex ? `${progress}%` : '0%' 
                }}
                transition={{ ease: "linear", duration: idx === currentStoryIndex ? 0.05 : 0.3 }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-30 flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="p-[2px] bg-gradient-to-tr from-neon-lime to-cyan-400 rounded-full">
              <OptimizedImage 
                  src={currentUserGroup.user.avatar} 
                  className="w-8 h-8 rounded-full border border-black" 
                  alt={currentUserGroup.user.username || 'unknown'} 
                  containerClassName="w-8 h-8 rounded-full"
              />
            </div>
            <div className="flex flex-col">
                <p className="text-white font-bold text-sm drop-shadow-md flex items-center gap-2">
                    {currentUserGroup.user.username || 'unknown'}
                    <span className="text-white/60 font-normal text-xs">• {new Date(currentStory.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwnStory && (
                <button 
                    onClick={() => { setIsPaused(true); setShowDeleteConfirm(true); }}
                    className="p-2 text-white/80 hover:text-red-500 transition-colors z-50"
                >
                    <Trash2 size={20} />
                </button>
            )}
            {/* Mobile Close */}
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white md:hidden">
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        <AnimatePresence>
        {showDeleteConfirm && (
            <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
                <div className="bg-neutral-900 border border-red-500/30 p-6 rounded-2xl w-full text-center">
                    <h3 className="text-lg font-bold text-white mb-2">Delete Story?</h3>
                    <p className="text-neutral-400 mb-6 text-sm">This cannot be undone.</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setShowDeleteConfirm(false); setIsPaused(false); }}
                            className="flex-1 py-2 rounded-lg font-medium text-white bg-white/10 hover:bg-white/20"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="flex-1 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}
        </AnimatePresence>

        {/* Navigation Zones */}
        <div className="absolute inset-0 z-20 flex">
          <div 
              className="w-1/3 h-full" 
              onClick={handlePrev} 
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
          />
          <div 
              className="w-1/3 h-full" 
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
          />
          <div 
              className="w-1/3 h-full" 
              onClick={handleNext}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
          />
        </div>

        {/* Image Content */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {/* Internal Blurred Background for Letterboxing */}
            <div className="absolute inset-0 opacity-50 blur-xl scale-110">
                <OptimizedImage 
                    src={currentStory.imageUrl} 
                    className="w-full h-full object-cover" 
                    alt="Background" 
                    containerClassName="w-full h-full"
                />
            </div>

            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentStory.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 w-full h-full flex items-center justify-center"
                >
                    <OptimizedImage 
                        src={currentStory.imageUrl} 
                        className="max-w-full max-h-full object-contain shadow-lg" 
                        alt="Story" 
                        containerClassName="w-full h-full flex items-center justify-center"
                    />
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Footer / Reply */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <AnimatePresence>
                {replyStatus === 'success' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-neon-lime text-olive-dark px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg"
                    >
                        Reply Sent!
                    </motion.div>
                )}
                {replyStatus === 'error' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg"
                    >
                        Failed to send
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex items-center gap-4">
                <input 
                    type="text" 
                    placeholder="Send a message..." 
                    className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-3 text-white placeholder-white/60 text-sm focus:outline-none focus:border-white backdrop-blur-md"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={replyStatus === 'sending'}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || replyStatus === 'sending'}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors disabled:opacity-50"
                >
                    {replyStatus === 'sending' ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </div>
        </div>
      </motion.div>

      {/* Desktop Navigation Arrows */}
      <button 
        onClick={handlePrev}
        className="absolute left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hidden md:flex items-center justify-center z-50 hover:scale-110"
      >
        <ChevronLeft size={32} />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hidden md:flex items-center justify-center z-50 hover:scale-110"
      >
        <ChevronRight size={32} />
      </button>

    </div>
  );
};
