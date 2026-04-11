
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, Heart, Share2, Download, Check, Palette, Shield, Bookmark, AlertTriangle, Sparkles, Shuffle, Plus, MessageCircle, Send, Trash2, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Poster } from '../types';
import { useGlobalContext } from '../context/GlobalContext';
import { RemixModal } from './RemixModal';
import { OptimizedImage } from './ui/OptimizedImage';

interface PosterModalProps {
  poster: Poster | null;
  onClose: () => void;
  onPosterClick?: (poster: Poster) => void;
}

export const PosterModal: React.FC<PosterModalProps> = ({ poster, onClose, onPosterClick }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const navigate = useNavigate();
  const { isFollowing, isFollowedBy, toggleFollow, isSaved, toggleSave, isLiked, toggleLike, posters, user, addComment, getComments, deletePoster, sendMessage, allUsers, getOrCreateThread } = useGlobalContext();
  const [cachedPoster, setCachedPoster] = useState<Poster | null>(poster);
  
  // Use cached poster for rendering to support exit animations when prop becomes null
  const activePoster = poster || cachedPoster;
  
  // Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // ... existing code ...
  const shareableUsers = useMemo(() => {
      if (!user) return [];
      // Only share with people we follow AND who follow us (Mutuals)
      return allUsers.filter(u => u.id !== user.id && isFollowing(u.id) && isFollowedBy(u.id));
  }, [allUsers, user, isFollowing, isFollowedBy]);

  const [shareStatus, setShareStatus] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const handleShareToUser = async (targetUserId: string) => {
      if (!activePoster) return;
      try {
          const threadId = await getOrCreateThread(targetUserId);
          await sendMessage(threadId, `Check out this poster: ${activePoster.title}`, activePoster.id);
          setShowShareModal(false);
          setShareStatus({message: 'Sent to user!', type: 'success'});
          setTimeout(() => setShareStatus(null), 3000);
      } catch {
          setShareStatus({message: 'Failed to share poster', type: 'error'});
          setTimeout(() => setShareStatus(null), 3000);
      }
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
    if (zoomLevel <= 1.5) setPanPosition({ x: 0, y: 0 });
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!document.fullscreenElement) {
        imageContainerRef.current?.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
        setIsFullscreen(true);
    } else {
        document.exitFullscreen();
        setIsFullscreen(false);
    }
  };

  // Sync fullscreen state with browser events (e.g. user presses Esc)
  useEffect(() => {
      const handleFullscreenChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
        e.preventDefault();
        setPanPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || zoomLevel > 1) {
          e.preventDefault();
          e.stopPropagation();
          const delta = e.deltaY * -0.01;
          const newZoom = Math.min(Math.max(zoomLevel + delta, 1), 5);
          setZoomLevel(newZoom);
          if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
      }
  };

  const [showCopied, setShowCopied] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRemixOpen, setIsRemixOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Scroll to top of details when poster changes
  useEffect(() => {
    if (detailsRef.current) {
        detailsRef.current.scrollTop = 0;
    }
  }, [activePoster?.id]);

  // Extract colors from image
  useEffect(() => {
    if (activePoster?.imageUrl) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = activePoster.imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Scale down for performance
            canvas.width = 50;
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);
            
            try {
                const imageData = ctx.getImageData(0, 0, 50, 50).data;
                const colorCounts: Record<string, number> = {};
                
                for (let i = 0; i < imageData.length; i += 4) {
                    const r = imageData[i];
                    const g = imageData[i + 1];
                    const b = imageData[i + 2];
                    const alpha = imageData[i + 3];
                    
                    if (alpha < 128) continue; // Skip transparent
                    
                    // Quantize colors to group similar ones (reduce to 32 levels per channel)
                    const quantize = (val: number) => Math.round(val / 32) * 32;
                    const key = `${quantize(r)},${quantize(g)},${quantize(b)}`;
                    colorCounts[key] = (colorCounts[key] || 0) + 1;
                }
                
                const sortedColors = Object.entries(colorCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([key]) => {
                        const [r, g, b] = key.split(',').map(Number);
                        // Convert to hex
                        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                    });
                
                if (sortedColors.length > 0) {
                    setExtractedColors(sortedColors);
                }
            } catch (e) {
                console.error("Failed to extract colors", e);
            }
        };
    }
  }, [activePoster?.imageUrl]);

  const following = activePoster ? isFollowing(activePoster.creatorId) : false;
  const saved = activePoster ? isSaved(activePoster.id) : false;
  const liked = activePoster ? isLiked(activePoster.id) : false;
  const isOwnPoster = user && activePoster ? user.id === activePoster.creatorId : false;
  
  const posterComments = activePoster ? getComments(activePoster.id) : [];

  // Scroll to bottom of comments when new one added
  useEffect(() => {
    if (posterComments.length > 0) {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [posterComments.length]);
  
  // Find similar from global posters state
  const similarPosters = (() => {
    if (!activePoster) return [];
    
    // 1. Tag match
    let matches = posters.filter(p => p.id !== activePoster.id && p.tags.some(t => activePoster.tags.includes(t)));
    
    // 2. Fallback: Same creator
    if (matches.length < 4) {
        const creatorMatches = posters.filter(p => p.id !== activePoster.id && p.creatorId === activePoster.creatorId && !matches.includes(p));
        matches = [...matches, ...creatorMatches];
    }
    
    // 3. Fallback: Random popular (just to fill the UI)
    if (matches.length < 4) {
        const randomFill = posters.filter(p => p.id !== activePoster.id && !matches.includes(p));
        matches = [...matches, ...randomFill];
    }
    
    return matches.slice(0, 4);
  })();

  const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowShareModal(true);
  };

  const copyLink = () => {
      if (activePoster) {
        navigator.clipboard.writeText(`${window.location.origin}/#/explore?poster=${activePoster.id}`);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
  };

  const requestDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return; 
    setShowDownloadConfirm(true);
  };

  const confirmDownload = () => {
    if (!activePoster) return;
    const link = document.createElement('a');
    link.href = activePoster.imageUrl;
    link.download = `${activePoster.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadConfirm(false);
  };

  const handleDelete = () => {
      if (!activePoster) return;
      deletePoster(activePoster.id);
      onClose();
  };

  const handleRemix = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRemixOpen(true);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || !activePoster) return;
    addComment(activePoster.id, commentText);
    setCommentText('');
  };

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }
  };

  const modalVariants: Variants = {
    hidden: { 
        opacity: 0, 
        scale: 0.92, 
        y: 30,
    },
    visible: { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        transition: { 
            duration: 0.4,
            ease: [0.19, 1, 0.22, 1] // Luxurious easeOut
        } 
    },
    exit: { 
        opacity: 0, 
        scale: 0.92, 
        y: 30, 
        transition: { 
            duration: 0.3, 
            ease: [0.19, 1, 0.22, 1] 
        } 
    }
  };

    const handleCommentSubmit = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!commentText.trim() || !activePoster) return;
        
        try {
            await addComment(activePoster.id, commentText);
            setCommentText('');
            // Scroll to bottom of comments
            setTimeout(() => {
                commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

  return (
    <>
    <AnimatePresence mode='wait'>
      {poster && activePoster && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-8 pointer-events-auto">
            <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            key="backdrop"
            />
            
            <motion.div
            className="relative z-10 w-full max-w-7xl h-[100dvh] md:h-[90vh] bg-neutral-900 border border-white/10 md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            key="modal-content"
            >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-md border border-white/10"
            >
                <X size={24} />
            </button>

                {/* Download Confirmation Overlay */}
                <AnimatePresence>
                {showDownloadConfirm && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-neutral-900 border border-white/10 p-8 rounded-2xl max-w-sm w-full text-center"
                        >
                            <div className="w-16 h-16 bg-neon-lime/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Download size={32} className="text-neon-lime" />
                            </div>
                            <h3 className="text-xl font-bold font-display text-white mb-2 uppercase">Download Poster?</h3>
                            <p className="text-neutral-400 mb-6 font-mono text-sm">Are you sure you want to download this poster?</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowDownloadConfirm(false)}
                                    className="flex-1 py-3 rounded-xl font-bold font-display uppercase text-white hover:bg-white/10 transition-colors border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDownload}
                                    className="flex-1 py-3 rounded-xl font-bold font-display uppercase bg-neon-lime text-black hover:bg-white transition-colors"
                                >
                                    Download
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Delete Confirmation Overlay */}
                <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-neutral-900 border border-red-500/30 p-8 rounded-2xl max-w-sm w-full text-center"
                        >
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold font-display text-white mb-2 uppercase">Delete Poster?</h3>
                            <p className="text-neutral-400 mb-6 font-mono text-sm">This action cannot be undone. Are you sure?</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 rounded-xl font-bold font-display uppercase text-white hover:bg-white/10 transition-colors border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="flex-1 py-3 rounded-xl font-bold font-display uppercase bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Share Modal Overlay */}
                <AnimatePresence>
                {showShareModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowShareModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-neutral-900 border border-white/10 p-6 rounded-2xl max-w-sm w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold font-display text-white uppercase">Share Poster</h3>
                                <button onClick={() => setShowShareModal(false)}><X size={20} className="text-white/60 hover:text-white" /></button>
                            </div>

                            {/* Copy Link */}
                            <button 
                                onClick={copyLink}
                                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl mb-6 transition-colors border border-white/5"
                            >
                                <span className="text-sm font-bold text-white uppercase tracking-wide">Copy Link</span>
                                {showCopied ? <Check size={18} className="text-neon-lime" /> : <Share2 size={18} className="text-white/60" />}
                            </button>

                            {/* User List */}
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                <p className="text-xs font-bold text-neutral-500 uppercase mb-2">Send to Friend</p>
                                {shareableUsers.length > 0 ? (
                                    shareableUsers.map(u => (
                                        <button 
                                            key={u.id}
                                            onClick={() => {
                                                handleShareToUser(u.id);
                                                setShowShareModal(false);
                                            }}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-left"
                                        >
                                            <OptimizedImage src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full border border-white/10" containerClassName="w-8 h-8 rounded-full" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{u.name}</p>
                                                <p className="text-[10px] text-neutral-500 font-mono truncate">@{u.username}</p>
                                            </div>
                                            <Send size={14} className="text-white/40" />
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-xs text-neutral-500 italic text-center py-4">No friends found to share with.</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                </AnimatePresence>

            {/* Image Side */}
            <div ref={imageContainerRef} className="w-full h-[40dvh] md:w-auto md:h-full md:flex-1 bg-black flex items-center justify-center overflow-hidden relative group flex-shrink-0 select-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-black/0 to-black/20 pointer-events-none" />
                
                <div 
                    className={`w-full h-full flex items-center justify-center ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    <div 
                        style={{ 
                            transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                        }}
                        className="relative max-w-full max-h-full flex items-center justify-center"
                    >
                        <OptimizedImage
                            src={activePoster.imageUrl}
                            alt={activePoster.title}
                            className="max-w-full max-h-full object-contain shadow-2xl pointer-events-none"
                            containerClassName="flex items-center justify-center w-full h-full"
                        />
                    </div>
                </div>

                {/* View Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <button onClick={handleZoomIn} className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-transform hover:scale-110" title="Zoom In">
                        <ZoomIn size={20} />
                    </button>
                    <button onClick={handleZoomOut} className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-transform hover:scale-110" title="Zoom Out">
                        <ZoomOut size={20} />
                    </button>
                    <button onClick={handleResetZoom} className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-transform hover:scale-110" title="Reset View">
                        <RotateCcw size={20} />
                    </button>
                    <button onClick={toggleFullscreen} className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-transform hover:scale-110" title="Fullscreen">
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                    <button onClick={() => setShowDetails(!showDetails)} className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-transform hover:scale-110" title={showDetails ? "Hide Details" : "Show Details"}>
                        {showDetails ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {/* Details Side */}
            {showDetails && (
            <div className="w-full md:w-[420px] bg-neutral-950/90 backdrop-blur-md flex flex-col border-l border-white/10 flex-1 md:flex-none md:h-full relative">
                <div ref={detailsRef} className="flex-1 overflow-y-auto no-scrollbar relative">
                    <div className="p-5 md:p-8 border-b border-white/10 sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-md">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-4 min-w-0 flex-1">
                                <div className="relative flex-shrink-0">
                                    <OptimizedImage 
                                        src={activePoster.creator?.avatar} 
                                        alt={activePoster.creator?.username || 'unknown'} 
                                        className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-neon-lime" 
                                        containerClassName="w-12 h-12 md:w-14 md:h-14 rounded-full"
                                    />
                                    {following && <div className="absolute bottom-0 right-0 w-4 h-4 bg-neon-lime rounded-full border-2 border-black shadow-sm" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold font-display text-white text-lg leading-tight uppercase truncate">{activePoster.creator?.name || 'Unknown'}</h3>
                                    <p className="text-neutral-400 text-sm font-mono truncate">@{activePoster.creator?.username || 'unknown'}</p>
                                </div>
                            </div>
                            {user && !isOwnPoster && (
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => toggleFollow(activePoster.creatorId)}
                                    className={`px-4 py-2 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold font-display uppercase transition-all duration-300 flex items-center gap-2 flex-shrink-0
                                        ${following 
                                        ? 'bg-transparent border border-white/20 text-white hover:bg-white/10' 
                                        : 'bg-neon-lime text-black hover:bg-white shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                                        }`}
                                >
                                    {following ? (
                                        <>
                                            <Check size={14} className="md:w-4 md:h-4" /> Following
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={14} className="md:w-4 md:h-4" /> Follow
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </div>

                    <div className="p-5 md:p-8">
                        <h2 className="text-3xl font-display font-bold text-white mb-3 uppercase tracking-wide">{activePoster.title}</h2>
                        <p className="text-neutral-300 text-base leading-relaxed">{activePoster.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-6">
                            {activePoster.tags.map(tag => (
                                <span key={tag} className="text-xs font-bold font-mono text-neon-lime bg-neon-lime/10 border border-neon-lime/20 px-3 py-1.5 rounded-full hover:bg-neon-lime/20 transition-colors cursor-pointer uppercase">#{tag}</span>
                            ))}
                        </div>

                        {/* Color Palette */}
                        {extractedColors.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-xs font-bold font-mono text-neutral-500 uppercase mb-2">Color Palette</h4>
                                <div className="flex gap-2">
                                    {extractedColors.map((color, index) => (
                                        <div 
                                            key={index} 
                                            className="w-8 h-8 rounded-full border border-white/10 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                            onClick={() => {
                                                navigator.clipboard.writeText(color);
                                                setShareStatus({message: `Copied ${color}`, type: 'success'});
                                                setTimeout(() => setShareStatus(null), 2000);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Bar */}
                        {user && (
                            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
                                <button 
                                    onClick={(e) => {e.stopPropagation(); toggleLike(activePoster.id)}} 
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 ${liked ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-white/5 text-white hover:bg-white/10 border border-transparent'}`}
                                >
                                    <Heart size={16} className={liked ? 'fill-red-500' : ''} />
                                    {liked ? 'Liked' : 'Like'}
                                </button>
                                <button 
                                    onClick={(e) => {e.stopPropagation(); toggleSave(activePoster.id)}}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 ${saved ? 'bg-neon-lime/10 text-neon-lime border border-neon-lime/30' : 'bg-white/5 text-white hover:bg-white/10 border border-transparent'}`}
                                >
                                    <Bookmark size={16} className={saved ? 'fill-neon-lime' : ''} />
                                    {saved ? 'Saved' : 'Save'}
                                </button>
                                <button 
                                    onClick={handleShare}
                                    className="flex items-center justify-center p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
                                    title="Share"
                                >
                                    {showCopied ? <Check size={16} className="text-neon-lime" /> : <Share2 size={16} />}
                                </button>
                                <button 
                                    onClick={handleRemix}
                                    className="flex items-center justify-center p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
                                    title="Remix"
                                >
                                    <Shuffle size={16} />
                                </button>
                                <button 
                                    onClick={requestDownload}
                                    className="flex items-center justify-center p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
                                    title="Download"
                                >
                                    <Download size={16} />
                                </button>
                                {isOwnPoster && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                                        className="flex items-center justify-center p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-300 ml-auto"
                                        title="Delete Poster"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* AI Metadata & Palette */}
                        <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold font-mono text-neutral-500 uppercase flex items-center gap-1"><Palette size={12}/> AI Visual Data</span>
                                <span className="text-xs font-bold font-mono text-neutral-500 uppercase flex items-center gap-1 border border-neutral-700 px-2 py-0.5 rounded"><Shield size={10}/> {activePoster.license}</span>
                            </div>
                            <div className="flex h-10 rounded-xl overflow-hidden shadow-inner ring-1 ring-white/10">
                                {(extractedColors.length > 0 ? extractedColors : activePoster.colors).map((color, i) => (
                                    <div key={i} className="flex-1 hover:flex-[2] transition-all duration-300 relative group" style={{ backgroundColor: color }}>
                                        <span className="absolute bottom-1 left-1 text-[8px] font-mono text-white/80 opacity-0 group-hover:opacity-100 bg-black/50 px-1 rounded">{color}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Similar Posters Rail */}
                    <div className="p-8 border-b border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold font-sans text-neutral-500 uppercase tracking-wider">Similar Vibes</h3>
                        </div>
                        {similarPosters.length > 0 ? (
                            <div 
                              className={`flex ${similarPosters.length < 3 ? 'gap-8' : 'gap-4'} overflow-x-auto pb-4 no-scrollbar items-center touch-pan-x select-none`}
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
                                {similarPosters.map(p => (
                                    <div 
                                        key={p.id} 
                                        className="flex-shrink-0 w-32 aspect-[3/4] rounded-xl overflow-hidden bg-neutral-800 cursor-pointer hover:ring-2 ring-neon-lime transition-all group relative"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onPosterClick) {
                                                onPosterClick(p);
                                            } else {
                                                setCachedPoster(p);
                                            }
                                        }}
                                    >
                                        <OptimizedImage 
                                            src={p.imageUrl} 
                                            alt={p.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                            containerClassName="w-full h-full"
                                        />
                                    </div>
                                ))}
                                {/* Improved No More Posters Card */}
                                {similarPosters.length < 4 && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex-shrink-0 w-32 aspect-[3/4] rounded-xl flex flex-col items-center justify-center bg-white/5 border border-dashed border-neutral-700 p-4 opacity-80 hover:opacity-100 transition-all group cursor-default"
                                    >
                                        <Sparkles size={20} className="text-neutral-400 group-hover:text-neon-lime mb-2 transition-colors" />
                                        <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300 font-bold font-mono uppercase tracking-wider text-center transition-colors">
                                            End of List
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-white/5 rounded-xl border border-white/10">
                                <div className="flex justify-center mb-2 text-neutral-600">
                                    <AlertTriangle size={20} />
                                </div>
                                <p className="text-sm font-mono text-neutral-500">No similar posters found.</p>
                            </div>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-6 pb-2">
                            <p className="text-xs font-bold font-mono text-neutral-500 uppercase flex items-center gap-2">
                                <MessageCircle size={14} />
                                Comments ({posterComments.length})
                            </p>
                        </div>
                        
                        <div className="flex-1 px-6 space-y-4 min-h-[200px] pb-4">
                            {posterComments.length > 0 ? (
                                posterComments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3 group">
                                        <OptimizedImage 
                                            src={comment.user.avatar} 
                                            alt={comment.user.username}
                                            className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0"
                                            containerClassName="w-8 h-8 rounded-full flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-bold text-white">{comment.user.username}</span>
                                                    <span className="text-[10px] text-neutral-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <button className="text-neutral-600 hover:text-red-500 transition-colors">
                                                    <Heart size={12} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-neutral-300 leading-relaxed mt-1">{comment.text}</p>
                                            <button onClick={() => document.getElementById('comment-input')?.focus()} className="text-[10px] font-bold text-neutral-500 mt-2 hover:text-white transition-colors uppercase">Reply</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-neutral-600 py-8">
                                    <MessageCircle size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm font-mono italic">No comments yet. Be the first!</p>
                                </div>
                            )}
                            <div ref={commentsEndRef} />
                        </div>
                        
                        {/* Comment Input */}
                        <div className="p-4 border-t border-white/10 bg-neutral-950/80 backdrop-blur-md sticky bottom-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                                    <OptimizedImage src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=guest`} alt="You" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                                </div>
                                <div className="flex-1 relative">
                                    <input 
                                        id="comment-input"
                                        type="text" 
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleCommentSubmit();
                                            }
                                        }}
                                        placeholder="Add a comment..." 
                                        className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-4 pr-10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neon-lime transition-colors"
                                    />
                                    <button 
                                        onClick={handleCommentSubmit}
                                        disabled={!commentText.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neon-lime hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comment Input */}
                {user ? (
                    <form onSubmit={handlePostComment} className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
                        <div className="relative">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 transition-all font-mono"
                            />
                            <button 
                                type="submit"
                                disabled={!commentText.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-neon-lime text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-4 border-t border-white/10 bg-black/20 text-center">
                        <p className="text-xs text-neutral-500 font-mono">Log in to join the conversation</p>
                    </div>
                )}

                {/* Bottom Actions Mobile */}
                {user && (
                    <div className="p-4 border-t border-white/10 bg-black/80 backdrop-blur-md md:hidden">
                    <button onClick={requestDownload} className="w-full py-3 bg-neon-lime text-black font-bold font-display uppercase rounded-xl shadow-lg hover:bg-white transition-colors">
                        Download Original
                    </button>
                    </div>
                )}
            </div>
            )}
            </motion.div>
        </div>
      )}
    </AnimatePresence>

    {activePoster && (
        <RemixModal 
            isOpen={isRemixOpen} 
            onClose={() => setIsRemixOpen(false)} 
            originalPoster={activePoster}
        />
    )}

    {/* Share Status Toast */}
    <AnimatePresence>
        {shareStatus && (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full shadow-2xl font-bold uppercase tracking-widest text-xs ${
                    shareStatus.type === 'success' 
                        ? 'bg-neon-lime text-olive-dark' 
                        : 'bg-red-500 text-white'
                }`}
            >
                {shareStatus.message}
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};
