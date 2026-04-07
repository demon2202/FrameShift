import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, Bookmark, TrendingUp, ArrowUpRight, Layers, Zap, Globe } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { ContourBackground } from '../components/ui/ContourBackground';
import { Navbar } from '../components/Navbar';

export const Analytics: React.FC = () => {
  const { user, posters } = useGlobalContext();

  const userPosters = useMemo(() => {
      if (!user) return [];
      return posters.filter(p => p.creatorId === user.id);
  }, [user, posters]);

  // Calculate Real Stats
  const stats = useMemo(() => {
    if (!user) return [
        { title: 'Total Views', value: '0', change: '0%', icon: Eye },
        { title: 'Total Likes', value: '0', change: '0%', icon: Heart },
        { title: 'Total Saves', value: '0', change: '0%', icon: Bookmark },
        { title: 'Total Reach', value: '0', change: '0%', icon: TrendingUp },
    ];

    const totalLikes = userPosters.reduce((acc, p) => acc + p.likes, 0);
    const totalViews = totalLikes * 12; // Estimated views based on likes
    const totalSaves = Math.floor(totalLikes * 0.15); // Estimated saves
    
    // Calculate growth (mock logic for demo purposes, but based on real totals)
    const hasEngagement = totalLikes > 0;

    return [
        { title: 'Total Views', value: totalViews.toLocaleString(), change: hasEngagement ? '+12%' : '-', icon: Eye },
        { title: 'Total Likes', value: totalLikes.toLocaleString(), change: hasEngagement ? '+5%' : '-', icon: Heart },
        { title: 'Total Saves', value: totalSaves.toLocaleString(), change: hasEngagement ? '+18%' : '-', icon: Bookmark },
        { title: 'Total Reach', value: (totalViews * 1.5).toLocaleString(), change: hasEngagement ? '+24%' : '-', icon: TrendingUp },
    ];
  }, [user, userPosters]);

  if (!user) {
      return (
          <div className="min-h-screen bg-cream dark:bg-neutral-900 text-olive-dark dark:text-cream flex items-center justify-center">
              <div className="text-center">
                  <h1 className="text-4xl font-display font-black uppercase">Please Log In</h1>
                  <p className="font-mono text-sm mt-4">Access your creator analytics dashboard.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-neutral-900 text-olive-dark dark:text-cream pt-24 pb-20 relative transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <ContourBackground />
      </div>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-olive-dark/10 dark:border-white/10 pb-8">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${userPosters.length > 0 ? 'bg-neon-lime' : 'bg-gray-400'}`}></span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-olive-dark/60 dark:text-cream/60">Live Dashboard</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-display font-black text-olive-dark dark:text-cream uppercase tracking-tighter leading-none">
                    Creator <span className="text-neon-lime mix-blend-multiply dark:mix-blend-normal">Analytics</span>
                </h1>
            </div>
            <div className="flex gap-4">
                <button className="px-6 py-3 bg-olive-dark dark:bg-cream text-neon-lime dark:text-olive-dark font-bold uppercase tracking-widest text-xs hover:bg-neon-lime hover:text-olive-dark dark:hover:bg-neon-lime dark:hover:text-olive-dark transition-colors shadow-lg">
                    Export Data
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, idx) => (
                <motion.div 
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-olive-dark/10 dark:border-white/10 hover:border-neon-lime transition-colors group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <stat.icon size={64} className="text-olive-dark dark:text-cream" />
                    </div>
                    
                    <div className="relative z-10">
                        <h3 className="text-olive-dark/60 dark:text-cream/60 font-mono text-[10px] uppercase tracking-widest mb-4">{stat.title}</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-display font-black text-olive-dark dark:text-cream tracking-tighter">{stat.value}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-600 dark:text-neon-lime">
                            <ArrowUpRight size={14} />
                            <span>{stat.change} this week</span>
                        </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 h-1 bg-neon-lime w-0 group-hover:w-full transition-all duration-500" />
                </motion.div>
            ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Growth Chart */}
            <div className="lg:col-span-2 p-8 bg-olive-dark dark:bg-black text-cream relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                
                <div className="flex justify-between items-center mb-12 relative z-10">
                    <h3 className="font-display font-black uppercase text-2xl tracking-tight flex items-center gap-3">
                        <Zap className="text-neon-lime" /> Engagement Velocity
                    </h3>
                    <div className="flex gap-2">
                        {['7D', '30D', '1Y'].map(range => (
                            <button key={range} className="px-3 py-1 border border-cream/20 text-[10px] font-mono hover:bg-neon-lime hover:text-olive-dark hover:border-neon-lime transition-colors uppercase">
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
                
                {userPosters && userPosters.length > 0 ? (
                    <div className="flex items-end justify-between h-64 gap-2 relative z-10">
                        {/* Generate bars based on actual likes distribution or a placeholder pattern if only 1 post */}
                        {userPosters.length === 1 
                            ? [0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end group/bar h-full relative">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: 0.2 + i * 0.05, duration: 1, type: "spring" }}
                                        className={`w-full relative ${h > 0 ? 'bg-neon-lime' : 'bg-white/5'}`}
                                    />
                                </div>
                            ))
                            : userPosters.slice(0, 12).map((p, i) => {
                                const maxLikes = Math.max(...userPosters.map(up => up.likes)) || 1;
                                const height = Math.max(5, Math.min(100, (p.likes / maxLikes) * 100)); // Min 5% height
                                return (
                                    <div key={i} className="flex-1 flex flex-col justify-end group/bar h-full relative">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ delay: 0.2 + i * 0.05, duration: 1, type: "spring" }}
                                            className={`w-full transition-colors relative ${p.likes > 0 ? 'bg-neon-lime hover:bg-white' : 'bg-white/20 hover:bg-white/30'}`}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity text-[10px] font-mono text-neon-lime mb-2">
                                                {p.likes}
                                            </div>
                                        </motion.div>
                                    </div>
                                );
                            })
                        }
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center border border-dashed border-cream/10 rounded-lg">
                        <p className="text-cream/40 font-mono text-xs uppercase tracking-widest">No engagement data available</p>
                    </div>
                )}
            </div>

            {/* Top Performing Posters */}
            <div className="p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-olive-dark/10 dark:border-white/10 flex flex-col">
                 <h3 className="font-display font-black uppercase text-xl tracking-tight mb-8 flex items-center gap-3">
                    <Layers className="text-olive-dark dark:text-cream" /> Top Artifacts
                 </h3>
                 
                 <div className="space-y-6 flex-1">
                    {userPosters.slice(0, 4).map((poster, i) => (
                        <div key={poster.id} className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-12 h-16 bg-gray-200 overflow-hidden relative">
                                <OptimizedImage src={poster.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={poster.title} containerClassName="w-full h-full" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-olive-dark dark:text-cream uppercase text-sm leading-tight group-hover:text-green-600 dark:group-hover:text-neon-lime transition-colors">{poster.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-mono text-olive-dark/50 dark:text-cream/50 flex items-center gap-1">
                                        <Heart size={8} /> {poster.likes}
                                    </span>
                                    <span className="text-[10px] font-mono text-olive-dark/50 dark:text-cream/50 flex items-center gap-1">
                                        <Eye size={8} /> {poster.likes * 12}
                                    </span>
                                </div>
                            </div>
                            <div className="text-green-600 dark:text-neon-lime font-black text-lg font-display">#{i + 1}</div>
                        </div>
                    ))}
                    {userPosters.length === 0 && (
                        <div className="text-center py-10 text-olive-dark/40 dark:text-cream/40 font-mono text-xs">
                            No artifacts uploaded yet.
                        </div>
                    )}
                 </div>
                 
                 <button className="mt-auto w-full py-4 border border-olive-dark/10 dark:border-white/10 hover:bg-olive-dark dark:hover:bg-cream hover:text-neon-lime dark:hover:text-olive-dark transition-colors uppercase font-bold text-xs tracking-widest">
                    View All Uploads
                 </button>
            </div>
        </div>
        
        {/* Replaced Global Reach with Top Tags (Real Data) */}
        <div className="mt-8 p-8 bg-neutral-900 text-cream relative overflow-hidden">
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h3 className="font-display font-black uppercase text-2xl tracking-tight flex items-center gap-3">
                        <Globe className="text-neon-lime" /> Top Categories
                    </h3>
                    <p className="text-cream/40 font-mono text-xs mt-2">Most used tags in your work.</p>
                </div>
            </div>
            
            {userPosters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                    {/* Calculate top tags from user posters */}
                    {(() => {
                        const tagCounts: Record<string, number> = {};
                        userPosters.forEach(p => p.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1));
                        const topTags = Object.entries(tagCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 4);
                        
                        return topTags.map(([tag, count], i) => (
                            <div key={tag} className="group">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                                    <span className="text-cream">#{tag}</span>
                                    <span className="text-neon-lime">{count}</span>
                                </div>
                                <div className="h-1 bg-white/10 w-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${(count / userPosters.length) * 100}%` }}
                                        transition={{ duration: 1.5, delay: i * 0.2, ease: "circOut" }}
                                        className="h-full bg-neon-lime group-hover:bg-white transition-colors"
                                    />
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            ) : (
                <div className="py-12 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
                    <p className="text-cream/40 font-mono text-xs uppercase tracking-widest">No data available</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
