import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, X, MessageSquare, LogIn, Sparkles, Heart, UserPlus, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';
import { UploadModal } from './UploadModal';
import { SidebarMenu, SidebarMenuItem } from './SidebarMenu';

export const Navbar: React.FC = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'All' | 'Creators' | 'Posters' | 'Tags'>('All');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  
  const { notifications, unreadCount, markAsRead, user, logout, posters, allUsers, acceptFollowRequest, declineFollowRequest, setUploadModalMode, theme, toggleTheme, searchUsersDB, searchPostersDB } = useGlobalContext();

  const menuItems: SidebarMenuItem[] = useMemo(() => {
    const items: SidebarMenuItem[] = [
      { label: 'Home', ariaLabel: 'Go to Home', link: '/' },
      { label: 'Explore', ariaLabel: 'Go to Explore', link: '/explore' },
      { 
        label: 'Create', 
        ariaLabel: 'Create Poster', 
        link: '#',
        onClick: () => {
          if (!user) {
            navigate('/login');
          } else {
            setUploadModalMode('poster');
            setIsUploadOpen(true);
          }
        }
      }
    ];

    if (user) {
      items.push(
        { label: 'Analytics', ariaLabel: 'Go to Analytics', link: '/analytics' },
        { label: 'Profile', ariaLabel: 'Go to Profile', link: `/profile/${user.id}` },
        { 
          label: 'Log Out', 
          ariaLabel: 'Log Out', 
          link: '#',
          onClick: () => {
            logout();
          }
        }
      );
    } else {
      items.push({ label: 'Log In', ariaLabel: 'Log In', link: '/login' });
    }

    return items;
  }, [user, navigate, setUploadModalMode, logout]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          if (currentScrollY > 50) {
            setIsScrolled(true);
          } else {
            setIsScrolled(false);
          }

          if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            setIsHidden(true);
          } else {
            setIsHidden(false);
          }
          
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 80) {
        setIsHidden(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const trendingTags = useMemo(() => ['#3DRender', '#Typography', '#Abstract'], []);
  
  const isHomePage = location.pathname === '/';
  
  const textColor = (isHomePage && !user && !isScrolled) 
    ? 'text-cream' 
    : (theme === 'dark' ? 'text-cream' : 'text-olive-dark');

  const [dbFilteredUsers, setDbFilteredUsers] = useState<any[]>([]);
  const [dbFilteredPosters, setDbFilteredPosters] = useState<any[]>([]);
  const [isSearchingDB, setIsSearchingDB] = useState(false);

  useEffect(() => {
    let active = true;
    if (!searchQuery) {
      setDbFilteredUsers([]);
      setDbFilteredPosters([]);
      setIsSearchingDB(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearchingDB(true);
      try {
        const [uResults, pResults] = await Promise.all([
           searchFilter !== 'Posters' && searchFilter !== 'Tags' ? searchUsersDB(searchQuery) : Promise.resolve([]),
           searchFilter !== 'Creators' ? searchPostersDB(searchQuery, searchFilter as any) : Promise.resolve([])
        ]);
        if (active) {
          let finalUsers = uResults;
          // Local fallback for users
          if (searchFilter === 'All' || searchFilter === 'Creators') {
             const localMatchUsers = allUsers.filter(u => 
                (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) || 
                (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
             );
             const combinedUsers = [...uResults, ...localMatchUsers];
             finalUsers = Array.from(new Set(combinedUsers.map(u => u.id)))
                .map(id => combinedUsers.find(u => u.id === id))
                .filter((u): u is any => u !== undefined);
          } else {
             finalUsers = [];
          }

          if (user && user.blockedUsers) {
             finalUsers = finalUsers.filter(u => !user.blockedUsers!.includes(u.id));
          }
          // We can also fallback to the allUsers array if it's small,
          // but relying completely on searchUsersDB fulfills "optimized query" requirement.
          setDbFilteredUsers(finalUsers.slice(0, 5));
          
          let finalPosters = pResults;
          
          if (searchFilter === 'Tags') {
            const localTags = posters.filter(p => p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
            const combined = [...pResults, ...localTags];
            finalPosters = Array.from(new Set(combined.map(p => p.id)))
                .map(id => combined.find(p => p.id === id))
                .filter((p): p is any => p !== undefined);
          } else if (searchFilter === 'All' || searchFilter === 'Posters') {
             const localTitles = posters.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
             const combined = [...pResults, ...localTitles];
             finalPosters = Array.from(new Set(combined.map(p => p.id)))
                .map(id => combined.find(p => p.id === id))
                .filter((p): p is any => p !== undefined);
          } else {
             // Creators tab, posters should be empty
             finalPosters = [];
          }
          setDbFilteredPosters(finalPosters.slice(0, 5));
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        if (active) setIsSearchingDB(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [searchQuery, searchFilter, searchUsersDB, searchPostersDB, posters, user]);

  const filteredUsers = dbFilteredUsers;
  const filteredPosters = dbFilteredPosters;

  // Unified list for keyboard navigation
  const navigableItems = useMemo(() => {
    if (searchQuery.length === 0) {
        return trendingTags.map(tag => ({ type: 'tag', data: tag }));
    }
    return [
        ...filteredUsers.map(u => ({ type: 'user', data: u })),
        ...filteredPosters.map(p => ({ type: 'poster', data: p }))
    ];
  }, [searchQuery, filteredUsers, filteredPosters, trendingTags]);

  // Keyboard Handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchFocused) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < navigableItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : navigableItems.length - 1));
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && navigableItems[activeIndex]) {
            const item = navigableItems[activeIndex];
            if (item.type === 'tag') {
                setSearchQuery(item.data as string);
                setActiveIndex(-1);
            } else if (item.type === 'user') {
                const u = item.data as any;
                navigate(`/profile/${u.id}`);
                setIsSearchFocused(false);
            } else if (item.type === 'poster') {
                const p = item.data as any;
                navigate(`/explore?poster=${p.id}`);
                setIsSearchFocused(false);
            }
        }
    } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setActiveIndex(-1);
    }
  };

  const navVariants = {
      initial: { 
          height: '6rem', 
          y: 0,
          backgroundColor: (isHomePage && !user) ? 'rgba(0,0,0,0)' : 'var(--nav-bg)', 
          backdropFilter: (isHomePage && !user) ? 'blur(0px)' : 'blur(12px)',
          borderBottomColor: (isHomePage && !user) ? 'rgba(0,0,0,0)' : 'var(--nav-border)'
      },
      scrolled: { 
          height: '5rem', 
          y: isHidden ? '-100%' : 0,
          backgroundColor: 'var(--nav-bg)', 
          backdropFilter: 'blur(12px)',
          borderBottomColor: 'var(--nav-border)'
      }
  };

  // const iconVariants = { // Unused
  //     hover: { scale: 1.1, rotate: 5 }
  // };
  
  const getNotificationIcon = (type: string) => {
      switch(type) {
          case 'like': return <Heart size={16} className="text-red-500 fill-current" />;
          case 'follow': return <UserPlus size={16} className="text-blue-500" />;
          case 'message': return <MessageSquare size={16} className="text-green-500" />;
          default: return <Sparkles size={16} className="text-neon-lime" />;
      }
  };

  return (
    <>
      <motion.nav 
        initial="initial"
        animate={isScrolled ? "scrolled" : "initial"}
        variants={navVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center border-b ${isScrolled ? 'border-olive-dark/5 dark:border-white/5' : 'border-transparent'} ${textColor}`}
        style={{
          '--nav-bg': theme === 'dark' ? 'rgba(23, 23, 23, 0.98)' : 'rgba(242, 240, 233, 0.98)',
          '--nav-border': theme === 'dark' ? 'rgba(204, 255, 0, 0.2)' : 'rgba(10, 15, 13, 0.1)',
        } as React.CSSProperties}
      >
        <div className="w-full px-4 md:px-12 flex items-center justify-between relative h-full gap-2 md:gap-8">
          
          {/* Logo - Side by Side & Bold */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-baseline gap-1 leading-none group relative z-50 whitespace-nowrap">
                <span className={`font-display font-black text-2xl md:text-4xl tracking-tighter uppercase ${textColor} group-hover:text-green-600 dark:group-hover:text-neon-lime transition-colors`}>Frame</span>
                <span className={`font-serif italic font-light text-2xl md:text-4xl tracking-tight ${isHomePage && !user && !isScrolled ? 'text-neon-lime' : 'text-green-600 dark:text-neon-lime'} group-hover:text-olive-dark dark:group-hover:text-cream transition-colors`}>Shift</span>
            </Link>
          </div>

          {/* Search Bar - Centered/Left-aligned but safe */}
          <div className={`items-center flex-1 max-w-md mr-auto z-50 ${isSearchFocused ? 'flex absolute inset-x-4 top-1/2 -translate-y-1/2 bg-cream dark:bg-neutral-900 p-2 rounded-xl shadow-2xl md:static md:translate-y-0 md:bg-transparent md:p-0 md:shadow-none' : 'hidden md:flex'}`}>
             <div className="relative w-full" ref={searchRef}>
                <div 
                    className={`relative flex items-center border-b-2 px-0 py-2 transition-all duration-300 ${
                        isSearchFocused 
                        ? 'border-neon-lime' 
                        : 'border-current opacity-50'
                    }`}
                >
                   <Search size={18} className={`mr-3 transition-colors ${isSearchFocused ? 'text-green-600 dark:text-neon-lime' : 'opacity-60'}`} />
                   <input
                     type="text"
                     placeholder="Search..."
                     className={`bg-transparent border-none outline-none text-base w-full transition-all caret-green-600 dark:caret-neon-lime font-mono uppercase tracking-wider ${isSearchFocused ? 'placeholder-olive-dark/50 dark:placeholder-cream/50 md:placeholder-current md:opacity-70' : 'placeholder-current opacity-70'} ${isSearchFocused ? 'text-olive-dark dark:text-cream md:text-inherit' : 'text-inherit'}`}
                     onFocus={() => setIsSearchFocused(true)}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     onKeyDown={handleKeyDown}
                   />
                   {isSearchFocused && (
                       <button onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }} className="p-1 hover:text-green-600 dark:hover:text-neon-lime opacity-40 hover:opacity-100 transition-opacity md:hidden">
                           <X size={18} className={theme === 'dark' ? 'text-cream' : 'text-olive-dark'} />
                       </button>
                   )}
                   {isSearchFocused && searchQuery && (
                       <button onClick={() => setSearchQuery('')} className="p-1 hover:text-green-600 dark:hover:text-neon-lime opacity-40 hover:opacity-100 transition-opacity hidden md:block">
                           <X size={14} className="text-inherit" />
                       </button>
                   )}
                </div>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {isSearchFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-cream dark:bg-neutral-900 border border-olive-dark/10 dark:border-white/10 shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-4 text-olive-dark dark:text-cream">
                        {/* Dynamic Filter Buttons */}
                        {searchQuery.length > 0 && (
                            <div 
                              className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1 touch-pan-x select-none"
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
                                {['All', 'Creators', 'Posters', 'Tags'].map((filter) => (
                                    <button
                                      key={filter}
                                      onClick={() => setSearchFilter(filter as any)}
                                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                          searchFilter === filter 
                                          ? 'bg-olive-dark dark:bg-cream text-neon-lime dark:text-olive-dark border-olive-dark dark:border-cream' 
                                          : 'bg-transparent text-olive-dark/60 dark:text-cream/60 border-olive-dark/10 dark:border-white/10 hover:border-olive-dark dark:hover:border-cream'
                                      }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchQuery.length === 0 ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="mb-3 text-[10px] font-bold text-olive-dark/40 dark:text-cream/40 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10} className="text-green-600 dark:text-neon-lime" /> Trending Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {trendingTags.map((tag, i) => (
                                            <motion.span 
                                              key={tag}
                                              initial={{ opacity: 0, x: -10 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: i * 0.05 }}
                                              onClick={() => setSearchQuery(tag)}
                                              onMouseEnter={() => setActiveIndex(i)}
                                              className={`px-3 py-1.5 border border-olive-dark/10 dark:border-white/10 text-xs font-mono cursor-pointer transition-colors ${activeIndex === i ? 'bg-neon-lime text-olive-dark border-neon-lime' : 'hover:bg-olive-dark/5 dark:hover:bg-white/5 text-olive-dark/60 dark:text-cream/60'}`}
                                            >
                                                {tag}
                                            </motion.span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                               {filteredUsers.length > 0 && (
                                   <div className="mb-4">
                                       <p className="mb-2 text-[10px] font-bold text-olive-dark/40 dark:text-cream/40 uppercase tracking-widest">Creators</p>
                                       {filteredUsers.map((user, idx) => (
                                           <Link 
                                              to={`/profile/${user.id}`} 
                                              onClick={() => setIsSearchFocused(false)}
                                              onMouseEnter={() => setActiveIndex(idx)}
                                              key={user.id} 
                                              className={`flex items-center space-x-3 p-2 cursor-pointer transition-colors group ${activeIndex === idx ? 'bg-olive-dark/5 dark:bg-white/5' : ''}`}
                                           >
                                               <OptimizedImage src={user.avatar} className="w-8 h-8 rounded-full border border-olive-dark/10 dark:border-white/10" alt={user.username || 'unknown'} containerClassName="w-8 h-8 rounded-full" />
                                               <div>
                                                   <p className="text-sm font-bold text-olive-dark dark:text-cream group-hover:text-green-600 dark:group-hover:text-neon-lime transition-colors">{user.username || 'unknown'}</p>
                                                   <p className="text-xs text-olive-dark/60 dark:text-cream/60">{user.name || 'Unknown'}</p>
                                               </div>
                                           </Link>
                                       ))}
                                   </div>
                               )}
                               {filteredPosters.length > 0 && (
                                   <div>
                                       <p className="mb-2 text-[10px] font-bold text-olive-dark/40 dark:text-cream/40 uppercase tracking-widest">Posters</p>
                                       {filteredPosters.map((poster, idx) => {
                                           const adjustedIdx = idx + filteredUsers.length;
                                           return (
                                               <div key={poster.id} className={`flex items-center space-x-3 p-2 cursor-pointer transition-colors group ${activeIndex === adjustedIdx ? 'bg-olive-dark/5 dark:bg-white/5' : ''}`}
                                                   onClick={() => {
                                                       navigate(`/explore?poster=${poster.id}`);
                                                       setIsSearchFocused(false);
                                                   }}
                                                   onMouseEnter={() => setActiveIndex(adjustedIdx)}
                                               >
                                                   <OptimizedImage src={poster.imageUrl} className="w-8 h-10 object-cover shadow-sm group-hover:shadow-md transition-shadow" alt={poster.title} containerClassName="w-8 h-10" />
                                                   <div>
                                                       <p className="text-sm font-bold text-olive-dark dark:text-cream group-hover:text-green-600 dark:group-hover:text-neon-lime transition-colors">{poster.title}</p>
                                                       <p className="text-xs text-olive-dark/60 dark:text-cream/60">by @{poster.creator?.username || 'unknown'}</p>
                                                   </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                               )}
                               {filteredUsers.length === 0 && filteredPosters.length === 0 && (
                                   <div className="text-center py-8 text-olive-dark/40 dark:text-cream/40 text-sm font-mono">No results found.</div>
                               )}
                            </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-6 z-10">
            {/* Only show Search (already on left), Profile, and Menu on Desktop to mimic minimal Lando style */}
            
            {user ? (
              <>
                {/* Messages */}
                <Link to="/messages" className={`p-2 rounded-full border transition-all hover:border-green-600 dark:hover:border-neon-lime hover:text-green-600 dark:hover:text-neon-lime relative ${isHomePage && !isScrolled ? 'border-white/40 bg-black/10' : 'border-olive-dark/20 dark:border-white/20'} ${textColor}`}>
                    <MessageSquare size={20} />
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-2 rounded-full border transition-all hover:border-green-600 dark:hover:border-neon-lime hover:text-green-600 dark:hover:text-neon-lime relative ${isHomePage && !isScrolled ? 'border-white/40 bg-black/10' : 'border-olive-dark/20 dark:border-white/20'} ${textColor}`}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-neon-lime rounded-full animate-pulse" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-4 w-80 bg-cream dark:bg-neutral-900 border border-olive-dark/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
                            >
                                <div className="p-4 border-b border-olive-dark/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                                    <h3 className="font-bold text-olive-dark dark:text-cream uppercase tracking-widest text-xs">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={() => markAsRead()} className="text-[10px] text-green-600 dark:text-neon-lime hover:text-green-700 dark:hover:text-neon-lime font-bold uppercase tracking-wider transition-colors">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {notifications.filter(n => n.type !== 'system').length > 0 ? (
                                        <div className="divide-y divide-olive-dark/5 dark:divide-white/5">
                                            {notifications.filter(n => n.type !== 'system').map(notif => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => {
                                                        if (!notif.read) markAsRead(notif.id);
                                                    }}
                                                    className={`p-4 flex gap-3 hover:bg-olive-dark/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-olive-dark/5 dark:bg-white/5' : ''}`}
                                                >
                                                    <div className="mt-1">
                                                        {getNotificationIcon(notif.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs text-olive-dark dark:text-cream">
                                                            <span className="font-bold">{notif.actorId ? allUsers.find(u => u.id === notif.actorId)?.username : 'Someone'}</span> {notif.text}
                                                        </p>
                                                        <p className="text-[10px] text-olive-dark/40 dark:text-cream/40 mt-1">{new Date(notif.time).toLocaleTimeString()}</p>
                                                        
                                                        {/* Follow Request Actions */}
                                                        {notif.text && notif.text.includes('requested to follow') && user?.followRequests?.includes(notif.actorId!) && (
                                                            <div className="flex gap-2 mt-2">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        acceptFollowRequest(notif.actorId!);
                                                                        markAsRead(notif.id);
                                                                    }}
                                                                    className="px-3 py-1 bg-olive-dark dark:bg-cream text-neon-lime dark:text-olive-dark text-[10px] font-bold uppercase rounded-full hover:bg-olive-dark/90 dark:hover:bg-cream/90"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        declineFollowRequest(notif.actorId!);
                                                                        markAsRead(notif.id);
                                                                    }}
                                                                    className="px-3 py-1 bg-transparent border border-olive-dark/20 dark:border-white/20 text-olive-dark dark:text-cream text-[10px] font-bold uppercase rounded-full hover:bg-olive-dark/5 dark:hover:bg-white/5"
                                                                >
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!notif.read && <div className="w-2 h-2 rounded-full bg-neon-lime flex-shrink-0" />}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-olive-dark/40 dark:text-cream/40 text-xs font-mono uppercase tracking-widest">
                                            No notifications
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <Link to={`/profile/${user.id}`} className={`relative group w-10 h-10 rounded-full border transition-colors overflow-hidden ${user ? 'border-white/20 hover:border-neon-lime' : 'border-white/20 hover:border-neon-lime'}`}>
                     <OptimizedImage src={user.avatar} className="w-full h-full object-cover" alt="Profile" containerClassName="w-full h-full" />
                </Link>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-2 px-6 py-3 bg-neon-lime text-olive-dark font-black hover:bg-white transition-colors uppercase tracking-widest text-sm shadow-lg">
                <LogIn size={16} /> Member Access
              </Link>
            )}
            
            {/* Theme Toggle */}
            <button 
                className={`p-2 rounded-md border transition-all hover:border-green-600 dark:hover:border-neon-lime hover:text-green-600 dark:hover:text-neon-lime ${isHomePage && !isScrolled ? 'border-white/40 bg-black/10' : 'border-olive-dark/20 dark:border-white/20'} ${textColor} z-50`} 
                onClick={toggleTheme}
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Desktop Menu Trigger */}
            <div className="z-50 flex items-center justify-center">
              <SidebarMenu 
                items={menuItems} 
                theme={theme}
              />
            </div>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4 z-50">
            {!isSearchFocused && (
                <button 
                    className={`p-2 rounded-md transition-colors ${textColor}`} 
                    onClick={() => setIsSearchFocused(true)}
                >
                    <Search size={20} />
                </button>
            )}
            <button 
                className={`p-2 rounded-md transition-colors ${textColor}`} 
                onClick={toggleTheme}
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center justify-center">
              <SidebarMenu 
                items={menuItems} 
                theme={theme}
              />
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Upload Modal */}
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </>
  );
};
