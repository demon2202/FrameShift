import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Feed } from '../components/Feed';
import { Poster } from '../types';
import { PosterModal } from '../components/PosterModal';
import { useGlobalContext } from '../context/GlobalContext';
import { X, Filter, ArrowUpRight, Zap, Layers, Sparkles, Check, Plus } from 'lucide-react';
import { ContourBackground } from '../components/ui/ContourBackground';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

import { CollageSection } from '../components/CollageSection';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { InfoModal, InfoType } from '../components/InfoModal';

export const Explore: React.FC = () => {
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [activeInfoModal, setActiveInfoModal] = useState<InfoType | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'latest' | 'trending'>('recommended');
  const { posters, likedPosters, savedPosters, user, toggleFollow, isFollowing, isDataLoading } = useGlobalContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"]
  });

  // Handle URL query params for direct poster linking
  useEffect(() => {
      const params = new URLSearchParams(location.search);
      const posterId = params.get('poster');
      if (posterId) {
          const found = posters.find(p => p.id === posterId);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          if (found) setSelectedPoster(found);
      }
  }, [location.search, posters]);

  // Extract unique creators from posters to populate Featured Artists
  const realUsers = useMemo(() => {
    const usersMap = new Map();
    posters.forEach(p => {
      if (p.creator && !usersMap.has(p.creator.id)) {
        usersMap.set(p.creator.id, p.creator);
      }
    });
    if (user && !usersMap.has(user.id)) {
      usersMap.set(user.id, user);
    }
    // Return up to 4 unique creators
    return Array.from(usersMap.values()).slice(0, 4);
  }, [posters, user]);

  // Smart Recommendation Algorithm
  const sortedPosters = useMemo(() => {
    const interactedPosterIds = [...likedPosters, ...savedPosters];
    const preferredTags = new Set<string>();

    posters.forEach(p => {
      if (interactedPosterIds.includes(p.id)) {
        p.tags.forEach(t => preferredTags.add(t));
      }
    });

    return [...posters].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (user && a.creatorId === user.id) scoreA += 100;
      if (user && b.creatorId === user.id) scoreB += 100;

      if (a.tags.some(t => preferredTags.has(t))) scoreA += 5;
      if (b.tags.some(t => preferredTags.has(t))) scoreB += 5;

      if (a.id.startsWith('p-')) scoreA += 10;
      if (b.id.startsWith('p-')) scoreB += 10;

      scoreA += a.likes * 0.001;
      scoreB += b.likes * 0.001;

      return scoreB - scoreA;
    });
  }, [posters, likedPosters, savedPosters, user]);

  // Filter Logic
  const filteredPosters = useMemo(() => {
    let result = sortedPosters;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.creator?.username.toLowerCase().includes(q) ||
        p.creator?.name.toLowerCase().includes(q)
      );
    }

    if (activeTag) {
        const term = activeTag.toLowerCase();
        result = result.filter(p =>
          p.tags.some(t => {
            const tagLower = t.toLowerCase();
            if (term === '3d render' || term === '3d') return tagLower.includes('3d');
            if (term === 'swiss style') return tagLower.includes('swiss');
            return tagLower.includes(term);
          })
        );
    }

    if (sortBy === 'latest') {
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'trending') {
        result = [...result].sort((a, b) => b.likes - a.likes);
    }
    
    return result;
  }, [sortedPosters, activeTag, sortBy, searchQuery]);

  const categories = useMemo(() => {
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

    const baseCategories = ['Cars', 'Anime', 'Typography', '3D', 'Minimal', 'Abstract'];
    const combined = Array.from(new Set([...baseCategories, ...sortedTags]));
    
    return combined.slice(0, 12);
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

  const dailyTrendingPosters = useMemo(() => {
    const trending = [...posters].sort((a, b) => b.likes - a.likes);
    const topN = trending.slice(0, 15);
    if (topN.length === 0) return [];
    
    // Seeded shuffle based on current date for daily refresh
    const dateStr = new Date().toDateString();
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed += dateStr.charCodeAt(i);
    }
    
    const shuffled = [...topN];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [posters]);

  // Parallax for Hero Text
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    // ✅ KEY FIX: removed overflow-hidden from root div — it breaks position:sticky in CollageSection
    <div ref={containerRef} className="min-h-screen bg-cream dark:bg-neutral-900 text-olive-dark dark:text-cream transition-colors duration-300 relative">
      
      {/* ✅ ContourBackground gets its own overflow-hidden wrapper so it doesn't escape */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <ContourBackground />
      </div>

      <Navbar />

      {/* 1. HERO SECTION - EDITORIAL SPLIT */}
      <section className="relative min-h-[90vh] flex flex-col md:flex-row items-stretch justify-between overflow-hidden pt-24 bg-cream dark:bg-neutral-900 border-b border-olive-dark/10 dark:border-white/10">
        
        {/* Vertical Rail Text (Left) */}
        <div className="hidden lg:flex w-16 border-r border-olive-dark/10 dark:border-white/10 items-center justify-center py-8">
            <span className="[writing-mode:vertical-rl] rotate-180 font-mono text-[10px] uppercase tracking-[0.2em] text-olive-dark/40 dark:text-cream/40">
                Curated Digital Archive • Vol. 01
            </span>
        </div>

        {/* Left Content: Massive Typography */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="flex-1 z-10 flex flex-col items-start justify-center w-full md:w-1/2 px-6 md:px-12 lg:px-20 py-12"
        >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex mb-8 px-4 py-1.5 rounded-full border border-olive-dark/20 dark:border-white/20 bg-white/50 dark:bg-black/50 backdrop-blur-md shadow-sm"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-olive-dark dark:text-cream flex items-center gap-2">
                <Sparkles size={14} className="text-olive-dark dark:text-neon-lime" />
                Discover Digital Art
              </span>
            </motion.div>

            <motion.h1 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
              }}
              className="text-[12vw] sm:text-[10vw] md:text-[8vw] lg:text-[9vw] leading-[0.85] font-display font-black text-olive-dark dark:text-cream uppercase tracking-tighter flex flex-col"
            >
              <div className="flex overflow-hidden">
                {"Explore".split('').map((char, index) => (
                  <motion.span
                    key={index}
                    variants={{
                      hidden: { y: "100%" },
                      visible: { y: 0, transition: { duration: 0.8, ease: [0.21, 1.02, 0.73, 1] } }
                    }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              <motion.span 
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.5, ease: "easeOut" } }
                }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-olive-dark to-olive-dark/60 dark:from-neon-lime dark:to-neon-lime/60 italic font-serif font-light tracking-normal pr-4"
              >
                The Unseen
              </motion.span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mt-8 text-base md:text-lg font-sans text-olive-dark/70 dark:text-cream/70 max-w-md leading-relaxed border-l-2 border-neon-lime pl-6"
            >
              Curated collections of digital artifacts, visual experiments, and boundary-pushing design from creators worldwide.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <button 
                onClick={() => {
                  const feedSection = document.getElementById('main-feed');
                  if (feedSection) feedSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 bg-olive-dark dark:bg-cream text-neon-lime dark:text-olive-dark font-black uppercase tracking-widest text-xs hover:bg-olive-dark/90 dark:hover:bg-cream/90 transition-colors flex items-center justify-center gap-2 rounded-none"
              >
                Start Browsing <ArrowUpRight size={16} />
              </button>
              <button 
                onClick={() => {
                  const trendingSection = document.getElementById('trending-section');
                  if (trendingSection) trendingSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-olive-dark/20 dark:border-white/20 text-olive-dark dark:text-cream font-bold uppercase tracking-widest text-xs hover:bg-olive-dark/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2 rounded-none"
              >
                View Trending
              </button>
            </motion.div>
        </motion.div>

        {/* Right Content: Floating Image Collage & Circular CTA */}
        <div className="flex-1 relative h-[50vh] md:h-[80vh] min-h-[400px] md:min-h-[600px] w-full items-center justify-center bg-olive-dark/5 dark:bg-black/20 border-t md:border-t-0 md:border-l border-olive-dark/10 dark:border-white/10 overflow-hidden mt-8 md:mt-0">
            {/* Decorative Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(204,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(204,255,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Floating Images */}
            {dailyTrendingPosters.slice(0, 3).map((poster, i) => (
                <motion.div
                    key={poster.id}
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        rotate: i === 0 ? [-6, -2, -6] : i === 1 ? [4, 8, 4] : [12, 8, 12], 
                        y: i === 0 ? [-20, -35, -20] : i === 1 ? [10, -5, 10] : [-10, -25, -10] 
                    }}
                    transition={{ 
                        opacity: { duration: 1, delay: 0.2 + i * 0.2 },
                        scale: { duration: 1, delay: 0.2 + i * 0.2, type: "spring" },
                        rotate: { duration: 6 + i, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 5 + i, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className={`absolute rounded-xl overflow-hidden shadow-2xl border-2 md:border-4 border-white dark:border-neutral-800 ${
                        i === 0 ? 'w-32 h-40 sm:w-40 sm:h-52 md:w-56 md:h-72 left-[5%] md:left-[10%] top-[10%] md:top-[15%] z-10' : 
                        i === 1 ? 'w-40 h-48 sm:w-48 sm:h-60 md:w-64 md:h-80 right-[5%] md:right-[15%] top-[20%] md:top-[25%] z-20' : 
                        'w-24 h-32 sm:w-32 sm:h-48 md:w-48 md:h-64 left-[20%] md:left-[30%] bottom-[10%] md:bottom-[15%] z-30'
                    }`}
                >
                    <OptimizedImage src={poster.imageUrl} alt={poster.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" containerClassName="w-full h-full" />
                </motion.div>
            ))}
            
            {/* Circular CTA */}
            <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1, type: "spring" }}
                className="absolute top-1/2 left-1/2 -ml-12 -mt-12 md:-ml-16 md:-mt-16 z-40 w-24 h-24 md:w-32 md:h-32 rounded-full bg-neon-lime text-olive-dark flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-transform"
                onClick={() => {
                  const feedSection = document.getElementById('main-feed');
                  if (feedSection) feedSection.scrollIntoView({ behavior: 'smooth' });
                }}
            >
                <div className="text-center">
                    <span className="block font-mono text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Explore</span>
                    <ArrowUpRight size={20} className="mx-auto mt-1 md:w-6 md:h-6" />
                </div>
            </motion.div>

            {/* Decorative Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[400px] md:h-[400px] z-0 pointer-events-none">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full border border-dashed border-olive-dark/20 dark:border-white/20 rounded-full"
                />
            </div>
        </div>
      </section>



      {/* 2. TRENDING CREATORS SPOTLIGHT */}
      <section id="trending-section" className="py-16 md:py-32 relative z-10 bg-cream dark:bg-neutral-900 border-t-2 border-olive-dark dark:border-cream transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12 md:mb-24 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="flex flex-col">
            <span className="text-olive-dark dark:text-neon-lime font-mono text-sm font-bold uppercase tracking-widest mb-4">01 // Trending</span>
            <h2 className="text-5xl sm:text-7xl md:text-9xl font-display font-black text-olive-dark dark:text-cream uppercase tracking-tighter leading-[0.8]">
              Trending
              <br />
              <span className="font-serif italic font-light text-olive-dark/50 dark:text-cream/50">Now</span>
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-6 max-w-sm">
            <p className="text-sm md:text-base font-mono text-olive-dark/70 dark:text-cream/70 uppercase tracking-widest text-left md:text-right">
              The most loved and shared creations from our community this week.
            </p>
            <button
              onClick={() => {
                setSortBy('trending');
                const feedSection = document.getElementById('main-feed');
                if (feedSection) feedSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full md:w-auto px-8 py-4 bg-olive-dark dark:bg-cream text-neon-lime dark:text-olive-dark font-bold uppercase tracking-widest hover:scale-105 transition-transform text-xs flex items-center justify-center gap-2 group rounded-none"
            >
              View All Trending
              <ArrowUpRight
                size={16}
                className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              />
            </button>
          </div>
        </div>

        {/* Creator Spotlight Carousel */}
        <div className="w-full relative mt-8">
          <div className="flex overflow-x-auto gap-6 px-4 md:px-8 pb-12 pt-4 snap-x snap-mandatory no-scrollbar touch-pan-x">
            {realUsers.slice(0, 5).map((creator, index) => {
              const creatorPosters = posters.filter(p => p.creatorId === creator.id).slice(0, 3);
              const isMe = user?.id === creator.id;
              const isFollowingUser = isFollowing(creator.id);
              const showTick = isMe || isFollowingUser;

              return (
                <motion.div 
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="min-w-[85vw] sm:min-w-[400px] md:min-w-[450px] snap-center bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-xl border border-olive-dark/10 dark:border-white/10 flex flex-col gap-6"
                >
                  {/* Creator Header */}
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-4 cursor-pointer group"
                      onClick={() => navigate(`/profile/${creator.id}`)}
                    >
                      <OptimizedImage 
                        src={creator.avatar} 
                        alt={creator.username} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-neon-lime group-hover:scale-105 transition-transform"
                        containerClassName="w-16 h-16 rounded-full shrink-0"
                      />
                      <div>
                        <h3 className="font-display font-bold text-xl uppercase leading-tight group-hover:text-neon-lime transition-colors">{creator.name}</h3>
                        <p className="font-mono text-xs text-olive-dark/60 dark:text-cream/60">@{creator.username}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (user) {
                          if (!isMe) toggleFollow(creator.id);
                        } else {
                          navigate('/login');
                        }
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                        showTick
                          ? 'bg-olive-dark/10 dark:bg-white/10 text-olive-dark dark:text-white hover:bg-red-500/20 hover:text-red-500'
                          : 'bg-neon-lime text-olive-dark hover:bg-olive-dark hover:text-neon-lime'
                      }`}
                    >
                      {showTick ? <Check size={14} className="inline mr-1" /> : <Plus size={14} className="inline mr-1" />}
                      {showTick ? 'Following' : 'Follow'}
                    </button>
                  </div>

                  {/* Mini Grid of Posters */}
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    {creatorPosters.map((p, i) => (
                      <div 
                        key={p.id} 
                        className={`rounded-xl overflow-hidden cursor-pointer relative group ${i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'col-span-1 aspect-square'}`}
                        onClick={() => setSelectedPoster(p)}
                      >
                        <OptimizedImage 
                          src={p.imageUrl} 
                          alt={p.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          containerClassName="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ArrowUpRight className="text-neon-lime" size={24} />
                        </div>
                      </div>
                    ))}
                    {/* Fill empty spots if less than 3 posters */}
                    {Array.from({ length: Math.max(0, 3 - creatorPosters.length) }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-olive-dark/5 dark:bg-white/5 rounded-xl aspect-square" />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. COLLAGE SECTION — Horizontal scroll between Trending & Featured Artists */}
      <CollageSection />

      {/* 4. FEATURED ARTISTS */}
      <section className="py-24 md:py-32 bg-olive-dark text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col mb-16">
            <span className="text-neon-lime font-mono text-sm font-bold uppercase tracking-widest mb-4">02 // Creators</span>
            <h2 className="text-4xl sm:text-7xl md:text-9xl font-display font-black uppercase tracking-tighter leading-[0.8]">
              Featured
              <br />
              <span className="text-transparent" style={{ WebkitTextStroke: '2px #CCFF00' }}>Artists</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-lg md:text-2xl font-serif italic text-cream/80 mb-12 max-w-lg leading-relaxed">
                Collaborating with a range of visionaries who share a passion for pushing visual
                boundaries and redefining digital art.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {realUsers.map((u, i) => {
                  const isMe = user?.id === u.id;
                  const isFollowingUser = isFollowing(u.id);
                  const showTick = isMe || isFollowingUser;

                  return (
                  <div key={u.id} className="flex items-center justify-between group cursor-pointer p-4 border border-cream/10 hover:border-neon-lime transition-colors bg-cream/5 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-neon-lime/50 text-xs">0{i + 1}</span>
                      <OptimizedImage
                        src={u.avatar}
                        alt={u.username}
                        className="w-14 h-14 rounded-none grayscale group-hover:grayscale-0 transition-all duration-500 object-cover"
                        containerClassName="w-14 h-14 shrink-0"
                      />
                      <div>
                        <h4 className="font-display font-bold uppercase text-base group-hover:text-neon-lime transition-colors tracking-wide">
                          {u.name}
                        </h4>
                        <p className="text-xs font-mono text-cream/50">@{u.username}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (user) {
                          if (!isMe) {
                            toggleFollow(u.id);
                          }
                        } else {
                          navigate('/login');
                        }
                      }}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                        showTick
                          ? 'bg-white/10 border-white/20 text-white hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50'
                          : 'border-cream/20 group-hover:bg-neon-lime group-hover:text-olive-dark group-hover:border-neon-lime'
                      }`}
                    >
                      {showTick ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                )})}
              </div>
              
              <button 
                onClick={() => {
                  const feedSection = document.getElementById('main-feed');
                  if (feedSection) feedSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-12 px-8 py-4 border-2 border-neon-lime text-neon-lime font-bold uppercase tracking-widest text-sm hover:bg-neon-lime hover:text-olive-dark transition-colors flex items-center gap-2 group w-full sm:w-auto justify-center"
              >
                View All Creators <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>

            <div className="order-1 lg:order-2 relative h-[400px] sm:h-[500px] lg:h-[700px] w-full flex items-center justify-center">
              <div className="absolute inset-0 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {[...posters.slice(0, 4), ...Array(Math.max(0, 4 - posters.length)).fill(null)].slice(0, 4).map((p, i) => (
                  <motion.div
                    key={p?.id || `fallback-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`relative overflow-hidden border border-cream/20 ${
                      i === 0 ? 'col-span-1 sm:col-span-2 sm:row-span-2 h-full' : 'col-span-1 h-full hidden sm:block'
                    }`}
                  >
                    <OptimizedImage
                      src={p?.imageUrl || `https://picsum.photos/seed/featured${i}/800/1000`}
                      alt={p?.title || `Featured Art ${i + 1}`}
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                      containerClassName="w-full h-full absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-olive-dark/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <span className="text-neon-lime font-mono text-xs uppercase tracking-widest">{p?.title || 'Community Art'}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SPLIT VIEW - ON TRACK / OFF TRACK */}
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[60vh] md:h-[80vh]">
          {/* Left: On Track */}
          <div
            onClick={() => setActiveTag('3D')}
            className="bg-cream dark:bg-neutral-900 relative flex flex-col items-center justify-center text-center group overflow-hidden cursor-pointer border-r border-olive-dark/10 dark:border-white/10 py-16 md:py-0"
          >
            <div className="absolute inset-0 bg-neon-lime transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-0" />
            <div className="relative z-10 mix-blend-multiply dark:mix-blend-normal group-hover:mix-blend-normal">
              <h3 className="text-[18vw] md:text-[12vw] font-display font-black text-olive-dark dark:text-cream uppercase leading-[0.8] tracking-tighter group-hover:translate-x-4 transition-transform duration-500 group-hover:text-olive-dark">
                On
              </h3>
              <h3 className="text-[18vw] md:text-[12vw] font-display font-black text-olive-dark dark:text-cream uppercase leading-[0.8] tracking-tighter ml-12 md:ml-24 -mt-4 md:-mt-8 group-hover:translate-x-4 transition-transform duration-500 group-hover:text-olive-dark">
                Track
              </h3>
              <p className="font-serif italic text-olive-dark/60 dark:text-cream/60 text-lg md:text-2xl mt-8 group-hover:text-olive-dark transition-colors">
                Latest visual releases
              </p>
            </div>
            <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 w-12 h-12 md:w-16 md:h-16 border border-olive-dark dark:border-cream flex items-center justify-center rounded-full group-hover:rotate-45 transition-transform duration-500 z-10 group-hover:border-olive-dark">
              <Zap size={20} className="text-olive-dark dark:text-cream group-hover:text-olive-dark md:w-6 md:h-6" />
            </div>
          </div>

          {/* Right: Off Track */}
          <div
            onClick={() => setActiveTag('Abstract')}
            className="bg-olive-dark dark:bg-black relative flex flex-col items-center justify-center text-center group overflow-hidden cursor-pointer py-16 md:py-0"
          >
            <div className="absolute inset-0 bg-cream transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right z-0" />
            <div className="relative z-10">
              <h3 className="text-[18vw] md:text-[12vw] font-display font-black text-cream uppercase leading-[0.8] tracking-tighter group-hover:text-olive-dark group-hover:-translate-x-4 transition-transform duration-500">
                Off
              </h3>
              <h3 className="text-[18vw] md:text-[12vw] font-display font-black text-cream uppercase leading-[0.8] tracking-tighter ml-12 md:ml-24 -mt-4 md:-mt-8 group-hover:text-olive-dark group-hover:-translate-x-4 transition-transform duration-500">
                Track
              </h3>
              <p className="font-serif italic text-cream/60 text-lg md:text-2xl mt-8 group-hover:text-olive-dark/60 transition-colors">
                Curated collections
              </p>
            </div>
            <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 w-12 h-12 md:w-16 md:h-16 border border-cream group-hover:border-olive-dark flex items-center justify-center rounded-full group-hover:-rotate-45 transition-transform duration-500 z-10">
              <Layers size={20} className="text-cream group-hover:text-olive-dark transition-colors md:w-6 md:h-6" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. MAIN FEED WITH FILTERS */}
      <section id="main-feed" className="py-16 max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col gap-8 mb-12">
          {/* Top Row: Search and Sort */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 text-olive-dark dark:text-cream font-display font-black text-2xl uppercase tracking-tighter">
                <Filter size={24} /> Feed
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-1/3 min-w-[300px] flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-olive-dark/50 dark:text-cream/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search creators, titles, or tags..." 
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-black border border-olive-dark/20 dark:border-white/20 rounded-full focus:outline-none focus:border-neon-lime focus:ring-1 focus:ring-neon-lime text-sm font-mono text-olive-dark dark:text-cream placeholder-olive-dark/40 dark:placeholder-cream/40 transition-all shadow-sm"
                />
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-4 self-start md:self-auto">
              <div className="flex items-center gap-1 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-2xl p-1.5 border border-olive-dark/10 dark:border-white/10">
                <button
                  onClick={() => setSortBy('recommended')}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                    sortBy === 'recommended' ? 'bg-olive-dark text-neon-lime shadow-md dark:bg-cream dark:text-olive-dark' : 'text-olive-dark/60 dark:text-cream/60 hover:text-olive-dark dark:hover:text-cream'
                  }`}
                >
                  For You
                </button>
                <button
                  onClick={() => setSortBy('latest')}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                    sortBy === 'latest' ? 'bg-olive-dark text-white shadow-md dark:bg-cream dark:text-olive-dark' : 'text-olive-dark/60 dark:text-cream/60 hover:text-olive-dark dark:hover:text-cream'
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('trending')}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                    sortBy === 'trending' ? 'bg-neon-lime text-olive-dark shadow-md dark:bg-cream dark:text-olive-dark' : 'text-olive-dark/60 dark:text-cream/60 hover:text-olive-dark dark:hover:text-cream'
                  }`}
                >
                  Trending
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Categories (Horizontal Scroll) */}
          <div className="relative w-full">
            <div 
              className="flex overflow-x-auto pb-4 -mb-4 gap-3 no-scrollbar snap-x touch-pan-x select-none"
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
              {categories.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`shrink-0 snap-start px-3 py-1.5 md:px-5 md:py-2.5 rounded-2xl border transition-all duration-300 text-[10px] md:text-xs font-bold uppercase tracking-wider cursor-pointer ${
                    activeTag === tag
                      ? 'bg-olive-dark text-neon-lime border-olive-dark shadow-lg shadow-olive-dark/20 dark:bg-cream dark:text-olive-dark dark:border-cream'
                      : 'bg-white/50 dark:bg-black/50 backdrop-blur-sm border-olive-dark/20 text-olive-dark hover:border-olive-dark hover:bg-olive-dark/5 dark:border-cream/20 dark:text-cream dark:hover:border-cream dark:hover:bg-cream/5'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {activeTag && (
                <button
                  onClick={() => setActiveTag(null)}
                  className="shrink-0 snap-start px-4 py-2.5 rounded-2xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                  title="Clear Filter"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3 min-h-[400px]">
            <Feed posters={filteredPosters.slice(0, visibleCount)} onPosterClick={setSelectedPoster} isLoading={isDataLoading} />
            {visibleCount < filteredPosters.length && (
              <div ref={loadMoreRef} className="w-full py-8 flex justify-center items-center">
                <div className="w-6 h-6 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-12 sticky top-24 h-fit">
            {/* Trending Tags List */}
            <div>
              <h3 className="text-xs font-bold font-mono text-olive-dark/40 dark:text-cream/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Zap size={12} /> Trending Topics
              </h3>
              <div className="space-y-6">
                {categories.slice(0, 5).map((tag, i) => (
                  <div key={tag} className="group cursor-pointer" onClick={() => setActiveTag(tag)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-xl text-olive-dark dark:text-cream group-hover:text-green-600 dark:group-hover:text-neon-lime transition-colors">#{tag}</span>
                      <span className="font-mono text-xs text-olive-dark/40 dark:text-cream/40 group-hover:text-green-600 dark:group-hover:text-neon-lime transition-colors">
                        {((tag.length * 7) % 50 + 10) / 10}k
                      </span>
                    </div>
                    <div className="h-0.5 w-full bg-olive-dark/5 dark:bg-white/5 overflow-hidden rounded-full">
                      <div 
                        className="h-full bg-green-600 dark:bg-neon-lime transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" 
                        style={{ transitionDelay: `${i * 50}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Posters - "Staff Picks" */}
            <div>
              <h3 className="text-xs font-bold font-mono text-olive-dark/40 dark:text-cream/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Sparkles size={12} /> Staff Picks
              </h3>
              <div className="space-y-4">
                {posters.slice(10, 13).map(poster => (
                  <div 
                    key={poster.id} 
                    onClick={() => setSelectedPoster(poster)}
                    className="group cursor-pointer relative aspect-[4/3] rounded-xl overflow-hidden"
                  >
                    <OptimizedImage 
                      src={poster.imageUrl} 
                      alt={poster.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <h4 className="text-white font-bold font-display uppercase text-sm leading-tight">{poster.title}</h4>
                      <p className="text-neon-lime text-[10px] font-mono">@{poster.creator?.username || 'unknown'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Favorites */}
            <div>
              <h3 className="text-xs font-bold font-mono text-olive-dark/40 dark:text-cream/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Layers size={12} /> Community Favorites
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {posters.slice(13, 19).map(poster => (
                  <div 
                    key={poster.id} 
                    onClick={() => setSelectedPoster(poster)}
                    className="group cursor-pointer relative aspect-square rounded-lg overflow-hidden"
                  >
                    <OptimizedImage 
                      src={poster.imageUrl} 
                      alt={poster.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Zap size={16} className="text-neon-lime fill-neon-lime" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            <div className="pt-8 border-t border-olive-dark/10 dark:border-white/10">
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
                {(['About', 'Manifesto', 'Terms', 'Privacy'] as InfoType[]).map(link => (
                  <button 
                    key={link} 
                    onClick={() => setActiveInfoModal(link)}
                    className="text-xs font-bold uppercase tracking-wider text-olive-dark/40 dark:text-cream/40 hover:text-olive-dark dark:hover:text-cream transition-colors"
                  >
                    {link}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-mono text-olive-dark/20 dark:text-cream/20">
                © 2025 FRAMESHIFT STUDIO. ALL RIGHTS RESERVED.
                <br />
                DESIGNED FOR THE VISIONARIES.
              </p>
            </div>
          </div>
        </div>
      </section>

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
    </div>
  );
};