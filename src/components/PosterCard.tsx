import React, { useState } from 'react';
// Force refresh
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bookmark, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Poster } from '../types';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';

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

  return (
    <motion.div
      layoutId={`poster-card-${poster.id}`}
      className={`relative break-inside-avoid group cursor-pointer bg-cream dark:bg-neutral-900 mb-8 border border-transparent hover:border-olive-dark/20 dark:hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${featured ? 'h-full' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
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
            <div className={`absolute inset-0 bg-gradient-to-t from-olive-dark/80 via-olive-dark/20 to-transparent mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Corner Accent */}
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-neon-lime text-olive-dark p-1">
                    <ArrowUpRight size={20} />
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

      {/* Minimal Info Bar */}
      <div className="pt-3 flex justify-between items-start">
          <div>
              <h3 className="font-bold text-olive-dark dark:text-cream uppercase text-sm tracking-tight leading-none mb-1 group-hover:text-green-600 dark:group-hover:text-neon-lime transition-colors">{poster.title}</h3>
              <p className="font-mono text-[10px] text-olive-dark/60 dark:text-cream/60 uppercase tracking-wider">@{poster.creator?.username || 'unknown'}</p>
          </div>
          
          <div className="flex items-center gap-3">
              <button onClick={handleLike} className="group/btn flex items-center gap-1 hover:text-green-600 dark:hover:text-neon-lime transition-colors">
                  <Heart size={16} className={liked ? "fill-neon-lime text-neon-lime" : "text-olive-dark dark:text-cream"} />
                  <span className="font-mono text-[10px] text-olive-dark dark:text-cream">{totalLikes}</span>
              </button>
              <button onClick={handleSave} className="hover:text-green-600 dark:hover:text-neon-lime transition-colors">
                  <Bookmark size={16} className={saved ? "fill-olive-dark text-olive-dark dark:fill-cream dark:text-cream" : "text-olive-dark dark:text-cream"} />
              </button>
          </div>
      </div>
    </motion.div>
  );
});
