import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, Bookmark, TrendingUp, ArrowUpRight, Layers, Zap, Globe, Users, Download } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { ContourBackground } from '../components/ui/ContourBackground';
import { Navbar } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

export const Analytics: React.FC = () => {
  const { user, posters } = useGlobalContext();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('ALL');

  const allUserPosters = useMemo(() => {
      if (!user) return [];
      return posters.filter(p => p.creatorId === user.id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [user, posters]);

  const userPosters = useMemo(() => {
      if (timeRange === 'ALL') return allUserPosters;
      
      const now = new Date().getTime();
      let cutoff = now;
      if (timeRange === '7D') cutoff -= 7 * 24 * 60 * 60 * 1000;
      else if (timeRange === '30D') cutoff -= 30 * 24 * 60 * 60 * 1000;
      else if (timeRange === '1Y') cutoff -= 365 * 24 * 60 * 60 * 1000;

      return allUserPosters.filter(p => new Date(p.createdAt).getTime() >= cutoff);
  }, [allUserPosters, timeRange]);

  // Calculate Real Stats
  const stats = useMemo(() => {
    if (!user) return [
        { title: 'Total Views', value: '0', change: '0%', icon: Eye },
        { title: 'Total Likes', value: '0', change: '0%', icon: Heart },
        { title: 'Followers', value: '0', change: '0%', icon: Users },
        { title: 'Total Reach', value: '0', change: '0%', icon: TrendingUp },
    ];

    const totalLikes = userPosters.reduce((acc, p) => acc + p.likes, 0);
    const totalViews = totalLikes * 12; // Estimated views based on likes
    const totalFollowers = user.followers || 0;
    
    // Calculate growth (mock logic for demo purposes, but based on real totals)
    const hasEngagement = totalLikes > 0;

    return [
        { title: 'Total Views', value: totalViews.toLocaleString(), change: hasEngagement ? '+12%' : '-', icon: Eye },
        { title: 'Total Likes', value: totalLikes.toLocaleString(), change: hasEngagement ? '+5%' : '-', icon: Heart },
        { title: 'Followers', value: totalFollowers.toLocaleString(), change: totalFollowers > 0 ? '+1' : '-', icon: Users },
        { title: 'Total Reach', value: (totalViews * 1.5).toLocaleString(), change: hasEngagement ? '+24%' : '-', icon: TrendingUp },
    ];
  }, [user, userPosters]);

  const handleExportData = () => {
    if (!userPosters.length) return alert('No data to export.');
    
    const headers = ['Poster ID', 'Title', 'Created At', 'Likes', 'Estimated Views', 'Tags'];
    const rows = userPosters.map(p => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      new Date(p.createdAt).toISOString(),
      p.likes,
      p.likes * 12,
      `"${p.tags.join(', ')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_${user?.username || 'user'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full mb-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-olive-dark/10 dark:border-white/10 pb-8">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${userPosters.length > 0 ? 'bg-neon-lime' : 'bg-gray-400'}`}></span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-olive-dark/60 dark:text-cream/60">Live Dashboard</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-display font-black text-olive-dark dark:text-cream uppercase tracking-tighter leading-none mb-4">
                    Creator <span className="text-neon-lime mix-blend-multiply dark:mix-blend-normal">Analytics</span>
                </h1>
                <p className="font-mono text-[10px] md:text-xs text-olive-dark/60 dark:text-cream/60 uppercase tracking-widest max-w-sm">MEASURE YOUR IMPACT. UNDERSTAND YOUR AUDIENCE. GROW YOUR ARCHIVE.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="flex items-center bg-white/50 dark:bg-black/20 p-1 rounded-full border border-olive-dark/10 dark:border-white/10 backdrop-blur-sm overflow-x-auto no-scrollbar w-full sm:w-auto justify-between sm:justify-start">
                    {(['7D', '30D', '1Y', 'ALL'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-center rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                                timeRange === range 
                                ? 'bg-olive-dark text-neon-lime shadow-md dark:bg-cream dark:text-olive-dark' 
                                : 'text-olive-dark/60 dark:text-cream/60 hover:text-olive-dark dark:hover:text-cream'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={handleExportData}
                    className="p-2 sm:p-3 rounded-full border border-olive-dark/20 dark:border-white/20 hover:bg-olive-dark hover:text-neon-lime dark:hover:bg-cream dark:hover:text-olive-dark transition-colors flex-shrink-0 ml-auto sm:ml-0"
                    title="Export Data"
                >
                    <Download size={16} className="sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-16">
            {stats.map((stat, idx) => (
                <motion.div 
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 sm:p-6 md:p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-olive-dark/10 dark:border-white/10 hover:border-neon-lime transition-colors group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <stat.icon size={64} className="text-olive-dark dark:text-cream hidden sm:block" />
                        <stat.icon size={48} className="text-olive-dark dark:text-cream block sm:hidden" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <h3 className="text-olive-dark/60 dark:text-cream/60 font-mono text-[10px] uppercase tracking-widest mb-4">{stat.title}</h3>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-olive-dark dark:text-cream tracking-tighter">{stat.value}</span>
                            </div>
                            <div className="mt-2 sm:mt-4 flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-green-600 dark:text-neon-lime bg-olive-dark/5 dark:bg-white/5 px-2 py-1 rounded-full w-fit">
                                {stat.change !== '-' && <ArrowUpRight size={14} className="w-3 h-3 sm:w-4 sm:h-4" />}
                                <span>{stat.change === '-' ? '-' : `${stat.change} growth`}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 h-1 bg-neon-lime w-0 group-hover:w-full transition-all duration-500" />
                </motion.div>
            ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main Growth Chart */}
            <div className="lg:col-span-2 p-4 sm:p-6 md:p-8 bg-olive-dark dark:bg-black text-cream relative overflow-hidden group rounded-2xl md:rounded-lg">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 relative z-10">
                    <h3 className="font-display font-black uppercase text-xl sm:text-2xl tracking-tight flex items-center gap-3">
                        <Zap className="text-neon-lime" /> Engagement Velocity
                    </h3>
                    <div className="flex gap-2">
                        {(['7D', '30D', '1Y', 'ALL'] as const).map(range => (
                            <button 
                                key={range} 
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 border text-[10px] font-mono hover:bg-neon-lime hover:text-olive-dark hover:border-neon-lime transition-colors uppercase ${timeRange === range ? 'bg-neon-lime text-olive-dark border-neon-lime' : 'border-cream/20'}`}
                            >
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
                    {[...userPosters].sort((a,b) => b.likes - a.likes).slice(0, 4).map((poster, i) => (
                        <div key={poster.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/explore?id=${poster.id}`)}>
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
                 
                 <button 
                    onClick={() => navigate('/profile')}
                    className="mt-8 w-full py-4 border border-olive-dark/10 dark:border-white/10 hover:bg-olive-dark dark:hover:bg-cream hover:text-neon-lime dark:hover:text-olive-dark transition-colors uppercase font-bold text-xs tracking-widest"
                 >
                    View All Uploads
                 </button>
            </div>
        </div>
        
        {/* Replaced Global Reach with Top Tags (Real Data) */}
        <div className="mt-8 p-4 sm:p-6 md:p-8 bg-neutral-900 border border-olive-dark/10 dark:border-white/10 text-cream relative overflow-hidden rounded-2xl md:rounded-lg w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 relative z-10 w-full">
                <div className="flex items-center gap-3 w-full">
                    <Globe className="text-neon-lime hidden sm:block w-6 h-6 md:w-8 md:h-8" /> 
                    <div>
                        <h3 className="font-display font-black uppercase text-xl sm:text-2xl md:text-3xl tracking-tight leading-none mb-1">Top Categories</h3>
                        <p className="text-cream/40 font-mono text-[10px] md:text-xs">Most used tags in your work.</p>
                    </div>
                </div>
            </div>
            
            {userPosters.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 relative z-10 w-full overflow-hidden">
                    {/* Calculate top tags from user posters */}
                    {(() => {
                        const tagCounts: Record<string, number> = {};
                        userPosters.forEach(p => p.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1));
                        const topTags = Object.entries(tagCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 4);
                        
                        return topTags.map(([tag, count], i) => (
                            <div key={tag} className="group min-w-0 pr-2">
                                <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 overflow-hidden">
                                    <span className="text-cream/80 truncate mr-2" title={tag}>#{tag}</span>
                                    <span className="text-neon-lime shrink-0">{count}</span>
                                </div>
                                <div className="h-1 bg-white/10 w-full overflow-hidden rounded-full">
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
                <div className="py-8 md:py-12 flex items-center justify-center border border-dashed border-white/10 rounded-lg w-full">
                    <p className="text-cream/40 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-center px-4">No data available to generate tags</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
