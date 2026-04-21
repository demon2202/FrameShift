import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { Feed } from '../components/Feed';
import { PosterModal } from '../components/PosterModal';
import { UploadModal } from '../components/UploadModal';
import { StoryViewer } from '../components/StoryViewer';
import { Poster, Story, User } from '../types';
import { useGlobalContext } from '../context/GlobalContext';
import { Plus, Compass, Zap, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { CreatorChain } from '../components/CreatorChain';
import { ParallaxGallery } from '../components/ParallaxGallery';
import { motion, AnimatePresence } from 'framer-motion';
import { ContourBackground } from '../components/ui/ContourBackground';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { InfoModal, InfoType } from '../components/InfoModal';

export const Home: React.FC = () => {
  // 1. Unconditional Hook Calls
  const { getStories, user, posters, setIsUploadOpen, isUploadOpen, setUploadModalMode, isFollowing, isDataLoading } = useGlobalContext();
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [activeInfoModal, setActiveInfoModal] = useState<InfoType | null>(null);
  const [viewingStoryUserIndex, setViewingStoryUserIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'latest' | 'trending'>('latest');
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).scrollTo === 'stories-rail') {
        const element = document.getElementById('stories-rail');
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth' });
            }, 100); // Small delay to ensure render
            // Clear state to prevent scrolling on subsequent renders
            window.history.replaceState({}, document.title);
        }
    }
  }, [location]);

  // 2. Computed Values
  const feed = useMemo(() => posters, [posters]);
  const rawStories = useMemo(() => user ? getStories() : [], [user, getStories]);
  
  // Group stories by user
  const groupedStories = useMemo(() => {
    const groups: { [key: string]: { user: User; stories: Story[] } } = {};
    rawStories.forEach(story => {
        if (!groups[story.userId]) {
            groups[story.userId] = { user: story.user!, stories: [] };
        }
        groups[story.userId].stories.push(story);
    });
    return Object.values(groups);
  }, [rawStories]);

  const spotlightPoster = useMemo(() => {
    return posters.length > 0 ? posters[0] : null;
  }, [posters]);

  const filteredFeed = useMemo(() => {
    let result = feed;
    
    if (activeCategory === 'Following') {
        result = result.filter(p => isFollowing(p.creatorId));
    } else if (activeCategory !== 'All') {
        result = result.filter(p => p.tags.some(t => t.toLowerCase().includes(activeCategory.toLowerCase())));
    }
    
    if (sortBy === 'trending') {
        result = [...result].sort((a, b) => b.likes - a.likes);
    } else {
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return result;
  }, [feed, activeCategory, sortBy, isFollowing]);

  const CATEGORIES = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    posters.forEach(p => {
      p.tags.forEach(tag => {
        const normalized = tag.toLowerCase().trim();
        if (normalized) {
          tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
        }
      });
    });

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag.charAt(0).toUpperCase() + tag.slice(1));

    const baseCategories = ['Cars', 'Anime', '3D', 'Typography', 'Abstract', 'Minimal', 'Swiss', 'Bauhaus', 'Cyberpunk', 'Grunge', 'Noir', 'Vaporwave'];
    const combined = Array.from(new Set([...baseCategories, ...sortedTags]));
    
    return ['All', 'Following', ...combined.slice(0, 15)];
  }, [posters]);

  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 3. Conditional Rendering (After hooks)
  if (!user) {
     return (
       <div className="min-h-screen bg-olive-dark text-cream font-sans">
         <Navbar />
         <Hero />
         <ParallaxGallery />
         <CreatorChain />
       </div>
     );
  }

  // Logged In View
  return (
    <div className="min-h-screen bg-cream dark:bg-neutral-900 text-near-black dark:text-cream font-sans transition-colors duration-300 pt-24 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <ContourBackground />
      </div>
      <Navbar />
      
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 pb-20 relative z-10">
        <div className="w-full space-y-16">
            
            {/* 1. Spotlight Banner - Massive & Editorial */}
            {spotlightPoster && (
                <motion.section 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-full aspect-[4/5] md:aspect-[2/1] overflow-hidden group cursor-pointer rounded-none md:rounded-3xl" onClick={() => setSelectedPoster(spotlightPoster)}
                >
                    <div className="absolute inset-0 bg-black transition-transform duration-1000 group-hover:scale-[1.02]">
                         <OptimizedImage src={spotlightPoster.imageUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-all duration-700 grayscale group-hover:grayscale-0" alt={spotlightPoster.title} containerClassName="w-full h-full" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                    </div>
                    
                    {/* Typography Overlay */}
                    <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-between z-10">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                <span className="w-2 h-2 bg-neon-lime rounded-full animate-pulse"></span>
                                <span className="text-white font-mono text-[10px] uppercase tracking-widest font-bold">Featured Artist</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-neon-lime group-hover:text-black transition-all duration-500 transform group-hover:rotate-45">
                                <ArrowUpRight size={20} />
                            </div>
                         </div>

                        <div className="relative">
                            <h2 className="text-5xl sm:text-7xl md:text-[8rem] font-display font-black text-white uppercase leading-[0.8] tracking-tighter mb-4 sm:mb-6 opacity-90">
                                {spotlightPoster.title}
                            </h2>
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-t border-white/20 pt-4 sm:pt-6">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="relative">
                                        <OptimizedImage src={spotlightPoster.creator?.avatar} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/20 grayscale group-hover:grayscale-0 transition-all" alt={spotlightPoster.creator?.username || 'unknown'} containerClassName="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-neon-lime rounded-full border-2 border-black flex items-center justify-center">
                                            <Zap size={8} className="text-black fill-black" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-base sm:text-lg uppercase tracking-tight">{spotlightPoster.creator?.name || 'Unknown'}</p>
                                        <span className="text-white/60 font-mono text-[10px] sm:text-xs uppercase tracking-widest">@{spotlightPoster.creator?.username || 'unknown'}</span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPoster(spotlightPoster);
                                    }}
                                    className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neon-lime hover:text-white transition-colors"
                                >
                                    View Project <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}



            {/* 3. Feed Header & Filters */}
            <section>
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-8 border-b border-olive-dark/10 dark:border-white/10 pb-8"
                    >
                        <div>
                            <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-black text-olive-dark dark:text-cream uppercase tracking-tighter leading-[0.8]">The Feed</h1>
                        </div>
                    </motion.div>

                    {/* Enhanced Stories Rail - Editorial Style */}
                    <div id="stories-rail" className="mb-8 scroll-mt-32">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="flex items-center gap-2 mb-6"
                        >
                            <span className="w-2 h-2 bg-neon-lime rounded-full animate-pulse"></span>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-olive-dark/60 dark:text-cream/60">Live Stories</h3>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2 touch-pan-x select-none"
                          onMouseDown={(e) => {
                            const ele = e.currentTarget;
                            ele.style.cursor = 'grabbing';
                            ele.style.userSelect = 'none';
                            
                            const pos = { left: ele.scrollLeft, x: e.clientX };
                            
                            const mouseMoveHandler = (e: MouseEvent) => {
                              const dx = e.clientX - pos.x;
                              if (Math.abs(dx) > 5) {
                                ele.setAttribute('data-dragged', 'true');
                              }
                              ele.scrollLeft = pos.left - dx;
                            };
                            
                            const mouseUpHandler = () => {
                              ele.style.cursor = 'grab';
                              ele.style.removeProperty('user-select');
                              document.removeEventListener('mousemove', mouseMoveHandler);
                              document.removeEventListener('mouseup', mouseUpHandler);
                              setTimeout(() => {
                                ele.removeAttribute('data-dragged');
                              }, 50);
                            };
                            
                            document.addEventListener('mousemove', mouseMoveHandler);
                            document.addEventListener('mouseup', mouseUpHandler);
                          }}
                          onClickCapture={(e) => {
                            if (e.currentTarget.getAttribute('data-dragged') === 'true') {
                              e.stopPropagation();
                              e.preventDefault();
                            }
                          }}
                          style={{ cursor: 'grab' }}
                        >
                            {/* Add Story Button */}
                            <div className="flex flex-col items-center gap-3 flex-shrink-0 group cursor-pointer">
                                <div 
                                    onClick={() => {
                                        setUploadModalMode('story');
                                        setIsUploadOpen(true);
                                    }}
                                    className="w-20 h-20 rounded-full border border-dashed border-olive-dark/30 dark:border-cream/30 flex items-center justify-center hover:border-neon-lime hover:bg-neon-lime transition-all relative overflow-hidden group-hover:shadow-[0_0_20px_rgba(204,255,0,0.4)]"
                                >
                                    <Plus size={24} className="text-olive-dark dark:text-cream transition-colors" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-olive-dark/60 dark:text-cream/60 group-hover:text-olive-dark dark:group-hover:text-cream transition-colors">Add Story</span>
                            </div>

                            {/* Story Items (Grouped by User) */}
                            {groupedStories.map((group, i) => (
                                <motion.div 
                                    key={group.user.id} 
                                    onClick={() => setViewingStoryUserIndex(i)}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex flex-col items-center gap-3 cursor-pointer group flex-shrink-0"
                                >
                                    <div className={`w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-olive-dark to-transparent dark:from-cream dark:to-transparent group-hover:from-neon-lime group-hover:to-neon-lime transition-all duration-500 ${group.stories.length > 1 ? 'ring-2 ring-offset-2 ring-neon-lime/50' : ''}`}>
                                        <div className="w-full h-full rounded-full border-2 border-cream dark:border-neutral-900 overflow-hidden relative">
                                            <OptimizedImage src={group.user.avatar} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" alt={group.user.username || 'unknown'} containerClassName="w-full h-full" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-olive-dark dark:text-cream truncate w-20 text-center group-hover:text-green-600 dark:group-hover:text-neon-lime transition-colors">{group.user.username || 'unknown'}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                        
                    {/* Filter Bar */}
                    <div className="bg-cream/90 dark:bg-neutral-900/90 backdrop-blur-md py-6 mb-8 border-b border-olive-dark/10 dark:border-white/10 -mx-4 px-4 md:-mx-8 md:px-8 transition-all duration-300 flex flex-col gap-4">
                        
                        {/* Categories & Styles */}
                        <div className="flex flex-col gap-4">
                            <div 
                              className="flex gap-3 overflow-x-auto no-scrollbar pb-2 items-center snap-x touch-pan-x select-none"
                              onMouseDown={(e) => {
                                const ele = e.currentTarget;
                                ele.style.cursor = 'grabbing';
                                ele.style.userSelect = 'none';
                                
                                const pos = { left: ele.scrollLeft, x: e.clientX };
                                
                                const mouseMoveHandler = (e: MouseEvent) => {
                                  const dx = e.clientX - pos.x;
                                  if (Math.abs(dx) > 5) {
                                    ele.setAttribute('data-dragged', 'true');
                                  }
                                  ele.scrollLeft = pos.left - dx;
                                };
                                
                                const mouseUpHandler = () => {
                                  ele.style.cursor = 'grab';
                                  ele.style.removeProperty('user-select');
                                  document.removeEventListener('mousemove', mouseMoveHandler);
                                  document.removeEventListener('mouseup', mouseUpHandler);
                                  setTimeout(() => {
                                    ele.removeAttribute('data-dragged');
                                  }, 50);
                                };
                                
                                document.addEventListener('mousemove', mouseMoveHandler);
                                document.addEventListener('mouseup', mouseUpHandler);
                              }}
                              onClickCapture={(e) => {
                                if (e.currentTarget.getAttribute('data-dragged') === 'true') {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }
                              }}
                              style={{ cursor: 'grab' }}
                            >
                                <span className="text-xs font-bold uppercase tracking-widest text-olive-dark/40 dark:text-cream/40 mr-2 flex-shrink-0">Filters:</span>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`shrink-0 snap-start px-3 py-1.5 md:px-5 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all border rounded-2xl whitespace-nowrap ${
                                            activeCategory === cat 
                                            ? 'bg-olive-dark text-neon-lime border-olive-dark shadow-lg shadow-olive-dark/20 dark:bg-cream dark:text-olive-dark dark:border-cream' 
                                            : 'bg-white/50 dark:bg-black/50 backdrop-blur-sm text-olive-dark dark:text-cream border-olive-dark/20 dark:border-cream/20 hover:border-olive-dark dark:hover:border-cream hover:bg-olive-dark/5 dark:hover:bg-cream/5'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort Toggle */}
                        <div className="flex justify-end border-t border-olive-dark/5 dark:border-white/5 pt-3">
                            <div className="flex items-center bg-white/50 dark:bg-white/5 rounded-full p-1 border border-olive-dark/10 dark:border-white/10 shrink-0">
                                <button
                                    onClick={() => setSortBy('latest')}
                                    className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        sortBy === 'latest' ? 'bg-olive-dark text-white shadow-md dark:bg-cream dark:text-olive-dark' : 'text-olive-dark/60 dark:text-cream/60 hover:text-olive-dark dark:hover:text-cream'
                                    }`}
                                >
                                    Latest
                                </button>
                                <button
                                    onClick={() => setSortBy('trending')}
                                    className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        sortBy === 'trending' ? 'bg-neon-lime text-olive-dark shadow-md' : 'text-olive-dark/60 dark:text-cream/60 hover:text-olive-dark dark:hover:text-cream'
                                    }`}
                                >
                                    Trending
                                </button>
                            </div>
                        </div>
                    </div>

                    {filteredFeed.length > 0 || isDataLoading ? (
                        <>
                            <Feed posters={filteredFeed.slice(0, visibleCount)} onPosterClick={setSelectedPoster} isLoading={isDataLoading} />
                            {visibleCount < filteredFeed.length && (
                                <div ref={loadMoreRef} className="w-full py-8 flex justify-center items-center">
                                    <div className="w-6 h-6 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </>
                    ) : (
                        <motion.div 
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="flex flex-col items-center justify-center py-40 text-center border border-dashed border-olive-dark/20 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-sm"
                        >
                            <div className="w-24 h-24 bg-olive-dark dark:bg-cream text-neon-lime dark:text-olive-dark rounded-full flex items-center justify-center mb-8 shadow-xl shadow-neon-lime/20">
                                <Compass size={48} />
                            </div>
                            <h2 className="text-4xl font-display font-black text-olive-dark dark:text-cream uppercase mb-4 tracking-tight">No Content Found</h2>
                            <p className="text-olive-dark/60 dark:text-cream/60 font-serif italic text-xl mb-10 max-w-md">"Creativity is allowing yourself to make mistakes. Art is knowing which ones to keep."</p>
                            <Link to="/explore" className="px-10 py-5 bg-neon-lime text-olive-dark font-black uppercase tracking-widest hover:bg-olive-dark hover:text-neon-lime transition-all shadow-lg hover:shadow-xl">
                                Explore The Archive
                            </Link>
                        </motion.div>
                    )}
                </section>

            {/* --- Sidebar Removed for Full Width Feed --- */}
        </div>
      </main>

      {/* Global Footer */}
      <motion.footer 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full border-t border-olive-dark/10 dark:border-white/10 py-12 px-4 md:px-8 mt-12 bg-cream dark:bg-neutral-900"
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-mono uppercase text-olive-dark/60 dark:text-cream/60 mb-8">
                {(['About', 'Manifesto', 'Terms', 'Privacy'] as InfoType[]).map(link => (
                    <button 
                        key={link} 
                        onClick={() => setActiveInfoModal(link)}
                        className="hover:text-olive-dark dark:hover:text-cream transition-colors font-bold tracking-widest"
                    >
                        {link}
                    </button>
                ))}
            </div>
            <div className="text-center text-[10px] font-mono text-olive-dark/40 dark:text-cream/40 uppercase tracking-widest">
                © 2025 FrameShift Studio
            </div>
        </div>
      </motion.footer>

      <PosterModal 
        key={selectedPoster?.id}
        poster={selectedPoster} 
        onClose={() => setSelectedPoster(null)} 
        onPosterClick={setSelectedPoster}
      />

      <InfoModal 
        isOpen={!!activeInfoModal}
        onClose={() => setActiveInfoModal(null)}
        type={activeInfoModal}
      />

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      {/* Full Screen Story Viewer */}
      <AnimatePresence>
        {viewingStoryUserIndex !== null && (
            <StoryViewer 
                groupedStories={groupedStories}
                initialUserIndex={viewingStoryUserIndex}
                onClose={() => setViewingStoryUserIndex(null)}
            />
        )}
      </AnimatePresence>
    </div>
  );
};
