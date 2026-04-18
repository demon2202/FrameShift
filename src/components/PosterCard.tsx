import React, { useState } from 'react';
// Force refresh
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Poster } from '../types';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';
import toast from 'react-hot-toast';

interface PosterCardProps {
  poster: Poster;
  onClick: (poster: Poster) => void;
  featured?: boolean;
}

export const PosterCard: React.FC<PosterCardProps> = React.memo(({ poster, onClick, featured = false }) => {
  const [showHeart, setShowHeart] = useState(false);
  const navigate = useNavigate();
  
  const { isSaved, toggleSave, isLiked, toggleLike, user } = useGlobalContext();
  const saved = user ? isSaved(poster.id) : false;
  const liked = user ? isLiked(poster.id) : false;
  
  const totalLikes = poster.likes || 0;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!liked) toggleLike(poster.id);
    
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      toggleSave(poster.id);
    } else {
      navigate('/login');
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      toggleLike(poster.id);
    } else {
      navigate('/login');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#/explore?poster=${poster.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!', {
      style: {
        background: '#CCFF00',
        color: '#2C3B2D',
        fontWeight: 'bold',
        borderRadius: '0px',
      },
      iconTheme: {
        primary: '#2C3B2D',
        secondary: '#CCFF00',
      }
    });
  };

  return (
    <motion.div
      layoutId={`poster-card-${poster.id}`}
      className={`relative break-inside-avoid group cursor-pointer bg-cream dark:bg-neutral-900 mb-8 border border-transparent transition-all duration-300 ${featured ? 'h-full' : ''}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={() => onClick(poster)}
      onDoubleClick={handleDoubleClick}
    >
      <div className="relative w-full overflow-hidden rounded-sm">
        {/* Image Container */}
        <motion.div
            className="relative"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <OptimizedImage
              layoutId={`poster-image-${poster.id}`}
              src={poster.imageUrl}
              alt={poster.title}
              className={`w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ${featured ? 'h-full' : 'h-auto'}`}
              containerClassName="w-full h-full"
            />
            
            {/* Hover Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4`}>
                {/* Top Actions */}
                <div className="flex justify-end gap-2 translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300">
                    <button 
                        onClick={handleSave} 
                        className="p-2 bg-white/10 hover:bg-neon-lime text-white hover:text-olive-dark backdrop-blur-md rounded-full transition-colors"
                    >
                        <Bookmark size={18} className={saved ? "fill-current" : ""} />
                    </button>
                    <button 
                        onClick={handleShare} 
                        className="p-2 bg-white/10 hover:bg-neon-lime text-white hover:text-olive-dark backdrop-blur-md rounded-full transition-colors"
                    >
                        <Share2 size={18} />
                    </button>
                </div>

                {/* Bottom Info */}
                <div className="translate-y-[10px] group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-bold text-white uppercase text-lg tracking-tight leading-none mb-2 truncate">{poster.title}</h3>
                    <div className="flex items-center justify-between">
                        <div 
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${poster.creatorId}`);
                            }}
                        >
                            <OptimizedImage 
                                src={poster.creator?.avatar} 
                                alt={poster.creator?.username} 
                                className="w-6 h-6 rounded-full border border-white/20"
                                containerClassName="w-6 h-6 rounded-full"
                            />
                            <span className="font-mono text-xs text-white/90 uppercase tracking-wider truncate max-w-[120px]">
                                @{poster.creator?.username || 'unknown'}
                            </span>
                        </div>
                        <button 
                            onClick={handleLike} 
                            className="flex items-center gap-1.5 text-white hover:text-neon-lime transition-colors"
                        >
                            <Heart size={16} className={liked ? "fill-neon-lime text-neon-lime" : ""} />
                            <span className="font-mono text-xs font-bold">{totalLikes}</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Double Click Heart Animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 20, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Heart className="w-24 h-24 text-neon-lime fill-neon-lime drop-shadow-[0_0_15px_rgba(204,255,0,0.5)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
