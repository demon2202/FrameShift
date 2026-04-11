
import React, { useState } from 'react';
import { Settings, MapPin, Link as LinkIcon, Grid, Bookmark, Layers, LogOut, Plus, Upload, Lock, Crown, UserX, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalContext } from '../context/GlobalContext';
import { PosterModal } from '../components/PosterModal';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { Poster } from '../types';
import { useParams } from 'react-router-dom';
import { UploadModal } from '../components/UploadModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { SettingsModal } from '../components/SettingsModal';
import { UserListModal } from '../components/UserListModal';
import { ContourBackground } from '../components/ui/ContourBackground';
import { Navbar } from '../components/Navbar';

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'posters' | 'saved' | 'collections'>('posters');
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeList, setActiveList] = useState<'followers' | 'following' | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const { savedPosters, user: currentUser, logout, posters, allUsers, toggleFollow, isFollowing, hasRequestedFollow, cancelFollowRequest, getLikeCount, setUploadModalMode, blockUser, getUserStats, getFollowers, getFollowing, collections, isDataLoading } = useGlobalContext();
  const { userId } = useParams();

  // Determine which user profile to show
  // If route has userId, find that user. If not (legacy or self), fallback to currentUser.
  const profileUser = userId ? allUsers.find(u => u.id === userId) : currentUser;

  // Security check: If checking own profile via ID, treat as own.
  const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;

  if (!profileUser) return <div className="min-h-screen flex items-center justify-center text-olive-dark bg-cream">User not found</div>;

  const following = isFollowing(profileUser.id);
  const requested = hasRequestedFollow(profileUser.id);
  const isPrivateAndHidden = profileUser.isPrivate && !following && !isOwnProfile;

  // Get dynamic stats
  const stats = getUserStats(profileUser.id);

  // Filter real posters from state for this profile user
  const myPosters = posters.filter(p => p.creatorId === profileUser.id);
  // Fetch full poster objects based on saved IDs (Only for own profile)
  const savedPosterData = isOwnProfile ? posters.filter(p => savedPosters.includes(p.id)) : [];

  // Use the first poster cover or fallback
  const fallbackCover = posters[0]?.imageUrl || '';

  const userCollections = collections.filter(c => c.userId === profileUser.id && (!c.isPrivate || isOwnProfile));
  
  const displayCollections = userCollections.map(c => {
    const coverPoster = posters.find(p => c.posterIds?.[0] === p.id);
    return {
      id: c.id,
      title: c.name,
      count: c.posterIds?.length || 0,
      cover: coverPoster?.imageUrl || fallbackCover
    };
  });

  // Available tabs depend on if it's your profile
  const tabs = [
      { id: 'posters', icon: Grid, label: 'Posters' },
      { id: 'collections', icon: Layers, label: 'Collections' },
  ];
  if (isOwnProfile) {
      tabs.push({ id: 'saved', icon: Bookmark, label: 'Saved' });
  }

  const renderEmptyState = () => {
      if (activeTab === 'saved') {
          return (
            <div className="col-span-full py-20 text-center text-olive-dark/60 dark:text-cream/60 flex flex-col items-center">
                <div className="w-16 h-16 bg-olive-dark/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-olive-dark/10 dark:border-white/10">
                    <Bookmark size={32} className="text-olive-dark/40 dark:text-cream/40" />
                </div>
                <h3 className="text-lg font-bold text-olive-dark dark:text-cream mb-2 uppercase tracking-wide">No saved posters yet</h3>
                <p className="max-w-xs text-sm">Save posters you love to build your personal collection of inspiration.</p>
            </div>
          );
      }
      if (activeTab === 'collections') {
        return (
            <div className="col-span-full py-20 text-center text-olive-dark/60 dark:text-cream/60 flex flex-col items-center">
                <div className="w-16 h-16 bg-olive-dark/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-olive-dark/10 dark:border-white/10">
                    <Grid size={32} className="text-olive-dark/40 dark:text-cream/40" />
                </div>
                <h3 className="text-lg font-bold text-olive-dark dark:text-cream mb-2 uppercase tracking-wide">No collections yet</h3>
                <p className="max-w-xs text-sm">Curate your inspiration by creating collections of your favorite posters.</p>
            </div>
        );
      }
      return (
        <div className="col-span-full py-20 text-center text-olive-dark/60 dark:text-cream/60 flex flex-col items-center">
            <div className="w-16 h-16 bg-olive-dark/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-olive-dark/10 dark:border-white/10">
                <Image size={32} className="text-olive-dark/40 dark:text-cream/40" />
            </div>
            <h3 className="text-lg font-bold text-olive-dark dark:text-cream mb-2 uppercase tracking-wide">No posters yet</h3>
            <p className="max-w-xs text-sm">When you upload posters, they will appear here on your profile.</p>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-neutral-900 text-olive-dark dark:text-cream pt-24 transition-colors duration-300 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <ContourBackground />
      </div>
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
        {/* Banner Image */}
        <div className="w-full h-48 md:h-72 rounded-3xl overflow-hidden mb-8 relative border border-olive-dark/10 dark:border-white/10 group shadow-2xl">
            <OptimizedImage 
                src={profileUser.bannerUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1500&q=80'} 
                alt="Banner" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                containerClassName="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Edit Banner Button */}
            {isOwnProfile && (
                <button 
                    onClick={() => setIsEditProfileOpen(true)}
                    className="absolute bottom-4 right-4 p-3 bg-olive-dark/80 backdrop-blur-md text-neon-lime rounded-full border border-neon-lime/20 hover:bg-neon-lime hover:text-olive-dark transition-all shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                    title="Change Banner"
                >
                    <Settings size={18} />
                </button>
            )}
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10 mb-16 px-4 md:px-8 relative">
             <div className="relative group -mt-24 md:-mt-32 z-20 flex-shrink-0">
                 <div className="w-32 h-32 md:w-48 md:h-48 rounded-full p-2 border-4 border-cream dark:border-neutral-900 bg-cream dark:bg-neutral-900 group-hover:border-neon-lime transition-colors duration-500 shadow-2xl relative overflow-hidden">
                    <OptimizedImage src={profileUser.avatar} className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" containerClassName="w-full h-full rounded-full" alt={profileUser.username} />
                     {profileUser.isWinner && (
                         <div className="absolute -top-2 -right-2 bg-black/80 p-2 rounded-full border border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce z-30">
                             <Crown size={24} className="text-yellow-400 fill-yellow-400" />
                         </div>
                     )}
                 </div>
                 {isOwnProfile && (
                     <div 
                        onClick={() => setIsEditProfileOpen(true)}
                        className="absolute inset-2 rounded-full bg-olive-dark/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm"
                     >
                         <span className="text-neon-lime text-xs font-bold uppercase tracking-widest border border-neon-lime px-3 py-1 rounded-full">Change</span>
                     </div>
                 )}
             </div>
             
             <div className="flex-1 w-full pt-2 md:pt-0">
                 <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                     <motion.h1 
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                        }}
                        className="text-4xl md:text-5xl font-sans font-black text-olive-dark dark:text-cream mb-4 md:mb-0 uppercase tracking-tighter flex overflow-hidden"
                     >
                        {(profileUser.username || '').split('').map((char, index) => (
                            <motion.span
                                key={index}
                                variants={{
                                    hidden: { y: "100%" },
                                    visible: { y: 0, transition: { duration: 0.6, ease: [0.21, 1.02, 0.73, 1] } }
                                }}
                                className="inline-block"
                            >
                                {char}
                            </motion.span>
                        ))}
                     </motion.h1>
                     <div className="flex gap-3">
                         {isOwnProfile ? (
                             <>
                                <button onClick={logout} className="p-3 border border-olive-dark/20 dark:border-white/20 text-olive-dark dark:text-cream hover:bg-olive-dark hover:text-white dark:hover:bg-white dark:hover:text-olive-dark rounded-full transition-colors" title="Log Out">
                                    <LogOut size={18} />
                                </button>
                                <button 
                                    onClick={() => setIsEditProfileOpen(true)}
                                    className="px-6 py-2 bg-olive-dark text-neon-lime font-bold text-xs uppercase tracking-widest rounded-full hover:bg-olive-dark/90 transition-all shadow-lg shadow-olive-dark/20"
                                >
                                    Edit Profile
                                </button>
                                <button 
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-3 text-olive-dark dark:text-cream border border-olive-dark/20 dark:border-white/20 hover:bg-olive-dark hover:text-white dark:hover:bg-white dark:hover:text-olive-dark rounded-full transition-colors"
                                >
                                    <Settings size={18} />
                                </button>
                             </>
                         ) : (
                             currentUser && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => requested ? cancelFollowRequest(profileUser.id) : toggleFollow(profileUser.id)}
                                        className={`px-8 py-3 font-bold text-xs uppercase tracking-widest rounded-full transition-all shadow-lg ${
                                            following 
                                            ? 'bg-transparent border border-olive-dark dark:border-cream text-olive-dark dark:text-cream' 
                                            : requested
                                                ? 'bg-olive-dark/10 dark:bg-white/10 text-olive-dark dark:text-cream border border-transparent'
                                                : 'bg-neon-lime text-olive-dark hover:bg-white'
                                        }`}
                                    >
                                        {following ? 'Following' : requested ? 'Requested' : 'Follow'}
                                    </button>
                                    
                                    {/* Block Button */}
                                    <button 
                                        onClick={() => setShowBlockConfirm(true)}
                                        className="p-3 border border-olive-dark/20 dark:border-white/20 text-olive-dark/60 dark:text-cream/60 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-full transition-colors"
                                        title="Block User"
                                    >
                                        <UserX size={18} />
                                    </button>
                                </div>
                             )
                         )}
                     </div>
                 </div>
                 
                 <div className="flex gap-8 mb-8 text-sm font-mono uppercase tracking-tight border-y border-olive-dark/10 dark:border-white/10 py-4">
                     <button 
                         onClick={() => setActiveList('followers')}
                         className="text-olive-dark dark:text-cream hover:text-green-600 dark:hover:text-neon-lime transition-colors"
                     >
                         <strong className="font-bold text-lg">{stats.followers}</strong> followers
                     </button>
                     <button 
                         onClick={() => setActiveList('following')}
                         className="text-olive-dark dark:text-cream hover:text-green-600 dark:hover:text-neon-lime transition-colors"
                     >
                         <strong className="font-bold text-lg">{stats.following}</strong> following
                     </button>
                     <span className="text-olive-dark dark:text-cream"><strong className="font-bold text-lg">{stats.posts}</strong> posters</span>
                 </div>
                 
                 <div className="mb-6">
                     {/* <h2 className="font-serif italic text-2xl text-olive-dark mb-2">{profileUser.name}</h2> */}
                     <p className="text-olive-dark/80 dark:text-cream/80 leading-relaxed max-w-lg font-medium">{profileUser.bio}</p>
                 </div>
                 
                 <div className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-widest text-olive-dark/60 dark:text-cream/60">
                    <span className="flex items-center gap-2"><MapPin size={14} className="text-green-600 dark:text-neon-lime" /> {profileUser.location || 'Global'}</span>
                    {profileUser.website ? (
                        <a href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-olive-dark dark:hover:text-cream cursor-pointer transition-colors">
                            <LinkIcon size={14} className="text-green-600 dark:text-neon-lime" /> {profileUser.website.replace(/^https?:\/\//, '')}
                        </a>
                    ) : (
                        <span className="flex items-center gap-2 hover:text-olive-dark dark:hover:text-cream cursor-pointer transition-colors"><LinkIcon size={14} className="text-green-600 dark:text-neon-lime" /> frameshift.app/{profileUser.username}</span>
                    )}
                 </div>
             </div>
        </div>

        {/* Private Account Message */}
        {isPrivateAndHidden ? (
            <div className="flex flex-col items-center justify-center py-20 border-t border-olive-dark/10 dark:border-white/10">
                <div className="w-20 h-20 rounded-full bg-olive-dark/5 dark:bg-white/5 flex items-center justify-center mb-6 border border-olive-dark/10 dark:border-white/10">
                    <Lock size={32} className="text-olive-dark/40 dark:text-cream/40" />
                </div>
                <h3 className="text-xl font-bold text-olive-dark dark:text-cream uppercase tracking-wide mb-2">This Account is Private</h3>
                <p className="text-olive-dark/60 dark:text-cream/60 text-sm max-w-xs text-center">Follow this account to see their photos and videos.</p>
            </div>
        ) : (
            <>
                {/* Tabs */}
                <div 
                  className="flex items-center gap-8 border-b border-olive-dark/10 dark:border-white/10 mb-10 overflow-x-auto no-scrollbar touch-pan-x select-none"
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
                    {tabs.map(tab => (
                        <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 py-4 border-b-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'border-neon-lime text-olive-dark dark:text-cream' : 'border-transparent text-olive-dark/40 dark:text-cream/40 hover:text-olive-dark dark:hover:text-cream'}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode='wait'>
                    {activeTab === 'collections' ? (
                        <motion.div 
                            key="collections"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20"
                        >
                            {/* CTA Button */}
                            {isOwnProfile && (
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex flex-col items-center justify-center aspect-[16/9] rounded-none border border-dashed border-olive-dark/30 dark:border-white/30 bg-olive-dark/5 dark:bg-white/5 cursor-pointer hover:bg-olive-dark/10 dark:hover:bg-white/10 transition-colors group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-olive-dark dark:bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-olive-dark/20">
                                        <Plus size={32} className="text-neon-lime dark:text-olive-dark" />
                                    </div>
                                    <span className="font-sans font-black text-xl uppercase tracking-tight text-olive-dark dark:text-cream">New Collection</span>
                                    <span className="text-xs font-mono uppercase tracking-widest text-olive-dark/60 dark:text-cream/60 mt-2">Curate your inspiration</span>
                                </motion.div>
                            )}

                            {displayCollections.length > 0 ? (
                                displayCollections.map((col) => (
                                    <div key={col.id} className="group relative aspect-[16/9] overflow-hidden cursor-pointer border border-olive-dark/10 dark:border-white/10">
                                        <OptimizedImage src={col.cover} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" containerClassName="w-full h-full" alt={col.title} />
                                        <div className="absolute inset-0 bg-olive-dark/60 group-hover:bg-olive-dark/40 transition-colors flex flex-col items-center justify-center text-center p-6 border-4 border-transparent group-hover:border-neon-lime/50 m-2">
                                            <h3 className="text-3xl font-sans font-black text-white uppercase tracking-tighter mb-2">{col.title}</h3>
                                            <p className="text-xs font-mono text-neon-lime uppercase tracking-widest">{col.count} Posters</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !isOwnProfile && renderEmptyState()
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="grid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pb-20"
                        >
                            {/* Upload Poster Button (Only in Posters tab for own profile) */}
                            {isOwnProfile && activeTab === 'posters' && (
                                <>
                                    <motion.div 
                                        onClick={() => {
                                            setUploadModalMode('poster');
                                            setIsUploadOpen(true);
                                        }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="aspect-[3/4] relative group cursor-pointer overflow-hidden border border-dashed border-olive-dark/30 dark:border-white/30 flex flex-col items-center justify-center hover:bg-olive-dark/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-olive-dark dark:bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                            <Upload size={20} className="text-neon-lime dark:text-olive-dark" />
                                        </div>
                                        <span className="text-xs font-bold text-olive-dark dark:text-cream uppercase tracking-widest">Upload Poster</span>
                                    </motion.div>

                                    <motion.div 
                                        onClick={() => {
                                            setUploadModalMode('story');
                                            setIsUploadOpen(true);
                                        }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="aspect-[3/4] relative group cursor-pointer overflow-hidden border border-dashed border-neon-lime/50 flex flex-col items-center justify-center hover:bg-neon-lime/5 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-neon-lime flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                            <Plus size={20} className="text-olive-dark" />
                                        </div>
                                        <span className="text-xs font-bold text-olive-dark dark:text-cream uppercase tracking-widest">Create Story</span>
                                    </motion.div>
                                </>
                            )}

                            {isDataLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <div key={`skeleton-${i}`} className="aspect-[3/4] relative overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
                                    </div>
                                ))
                            ) : (activeTab === 'posters' ? myPosters : savedPosterData).length > 0 ? (
                                (activeTab === 'posters' ? myPosters : savedPosterData).map((poster, idx) => (
                                    <motion.div 
                                        key={poster.id}
                                        layoutId={`poster-${poster.id}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="aspect-[3/4] relative group cursor-pointer overflow-hidden bg-olive-dark/5 dark:bg-white/5"
                                        onClick={() => setSelectedPoster(poster)}
                                    >
                                        <OptimizedImage src={poster.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0" containerClassName="w-full h-full" alt={poster.title} />
                                        <div className="absolute inset-0 bg-olive-dark/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-4 text-center">
                                            <span className="font-sans font-black text-white text-lg uppercase leading-none">{poster.title}</span>
                                            <div className="w-8 h-[1px] bg-neon-lime my-2"></div>
                                            <span className="font-mono text-neon-lime text-xs">❤️ {getLikeCount(poster.id)}</span>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                renderEmptyState()
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )}
      </div>

      <PosterModal 
        key={selectedPoster?.id}
        poster={selectedPoster} 
        onClose={() => setSelectedPoster(null)} 
        onPosterClick={setSelectedPoster}
      />

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <UserListModal
        isOpen={!!activeList}
        onClose={() => setActiveList(null)}
        title={activeList === 'followers' ? 'Followers' : 'Following'}
        users={activeList === 'followers' ? getFollowers(profileUser.id) : activeList === 'following' ? getFollowing(profileUser.id) : []}
      />

      {/* Block Confirmation Modal */}
      <AnimatePresence>
        {showBlockConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowBlockConfirm(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-sm bg-olive-dark border border-white/10 rounded-3xl p-6 shadow-2xl text-center"
                >
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserX size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-cream uppercase tracking-wide mb-2">Block {profileUser.username}?</h3>
                    <p className="text-cream/60 text-sm mb-6">They won't be able to find your profile, posts or story on FrameShift. They won't be notified that you blocked them.</p>
                    
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => {
                                blockUser(profileUser.id);
                                setShowBlockConfirm(false);
                                window.location.hash = '#/';
                            }}
                            className="w-full py-3 bg-red-500 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-red-600 transition-colors"
                        >
                            Block
                        </button>
                        <button 
                            onClick={() => setShowBlockConfirm(false)}
                            className="w-full py-3 bg-white/5 text-cream font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
