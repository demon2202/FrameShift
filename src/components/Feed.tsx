
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PosterCard } from './PosterCard';
import { Poster } from '../types';
import { Compass, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeedProps {
  posters: Poster[];
  onPosterClick: (poster: Poster) => void;
  isLoading?: boolean;
}

export const Feed: React.FC<FeedProps> = ({ posters, onPosterClick, isLoading }) => {
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset visible count when posters array changes (e.g. filtering)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(12);
  }, [posters]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < posters.length) {
          // Add a small delay for "loading" feel and to prevent rapid-fire updates
          setTimeout(() => {
             setVisibleCount((prev) => Math.min(prev + 8, posters.length));
          }, 500);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, posters.length]);

  const visiblePosters = posters.slice(0, visibleCount);

  if (isLoading) {
    return (
      <div className="columns-1 sm:columns-2 md:columns-3 gap-8 space-y-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="break-inside-avoid mb-6">
            <div className={`w-full bg-neutral-200 dark:bg-neutral-800/50 rounded-sm relative overflow-hidden ${i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'} border border-olive-dark/5 dark:border-white/5`}>
                {/* Modern shimmer effect */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
            </div>
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800/50 relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
                    </div>
                    <div className="w-20 h-3 rounded-full bg-neutral-200 dark:bg-neutral-800/50 relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
                    </div>
                </div>
                <div className="w-8 h-3 rounded-full bg-neutral-200 dark:bg-neutral-800/50 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
                </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posters.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-olive-dark/20 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-colors"
      >
        <div className="relative mb-8">
            <div className="w-24 h-24 bg-olive-dark dark:bg-cream text-neon-lime dark:text-olive-dark rounded-full flex items-center justify-center shadow-xl shadow-neon-lime/20 transition-colors">
                <Compass size={48} strokeWidth={1.5} />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-neon-lime text-olive-dark rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-cream dark:border-neutral-900">
                <Sparkles size={20} fill="currentColor" />
            </div>
        </div>
        
        <h3 className="text-4xl font-display font-black text-olive-dark dark:text-cream uppercase mb-4 tracking-tight transition-colors">
            Inspiration Awaits
        </h3>
        <p className="text-olive-dark/60 dark:text-cream/60 font-serif italic text-xl mb-10 max-w-md leading-relaxed transition-colors">
            "The creative act is a letting down of the net. Human souls are the catch."
        </p>
        
        <Link 
            to="/explore" 
            className="px-10 py-5 bg-neon-lime text-olive-dark font-black uppercase tracking-widest hover:bg-olive-dark dark:hover:bg-cream hover:text-neon-lime dark:hover:text-olive-dark transition-all shadow-lg hover:shadow-xl flex items-center gap-3 group"
        >
            <Compass size={20} className="group-hover:rotate-45 transition-transform" />
            Start Exploring
        </Link>
      </motion.div>
    );
  }

  return (
    <>
        <div className="columns-1 sm:columns-2 md:columns-3 gap-8 space-y-8">
          {visiblePosters.map((poster, i) => (
            <motion.div
                layout
                key={poster.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                    duration: 0.5,
                    ease: "easeOut",
                    delay: (i % 4) * 0.1 
                }}
                className="break-inside-avoid mb-6"
            >
                <PosterCard 
                  poster={poster} 
                  onClick={onPosterClick} 
                />
            </motion.div>
          ))}
        </div>

        {/* Infinite Scroll Sentinel */}
        {visibleCount < posters.length && (
            <div ref={loadMoreRef} className="py-12 flex justify-center w-full">
                <div className="flex items-center gap-2 text-olive-dark/40 dark:text-cream/40 font-mono text-xs uppercase tracking-widest animate-pulse transition-colors">
                    <Loader2 size={16} className="animate-spin" />
                    Loading Inspiration...
                </div>
            </div>
        )}
    </>
  );
};
