
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Check, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Poster } from '../types';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';

interface RemixModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPoster: Poster;
}

const FILTERS = [
  { name: 'Original', filter: 'none' },
  { name: 'Grayscale', filter: 'grayscale(100%)' },
  { name: 'Sepia', filter: 'sepia(100%)' },
  { name: 'Invert', filter: 'invert(100%)' },
  { name: 'Contrast', filter: 'contrast(200%)' },
  { name: 'Noir', filter: 'grayscale(100%) contrast(120%) brightness(90%)' },
  { name: 'Vapor', filter: 'sepia(50%) hue-rotate(180deg) saturate(200%)' },
  { name: 'Cyber', filter: 'contrast(150%) saturate(150%) hue-rotate(20deg)' },
  { name: 'Glitch', filter: 'contrast(120%) saturate(200%) hue-rotate(-20deg) invert(10%)' },
  { name: 'Muted', filter: 'grayscale(30%) sepia(20%) contrast(90%)' },
];

export const RemixModal: React.FC<RemixModalProps> = ({ isOpen, onClose, originalPoster }) => {
  const { user, addPoster } = useGlobalContext();
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a ref to the image to draw it to canvas later
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedFilter(FILTERS[0]);
        setTitle(`Remix of ${originalPoster.title}`);
    }
  }, [isOpen, originalPoster]);

  const handleSave = async () => {
      if (!user) return;
      setIsLoading(true);

      // Give UI a moment to update/animate
      await new Promise(resolve => setTimeout(resolve, 500));

      let finalImageUrl = originalPoster.imageUrl;

      // Burn filter into image using Canvas
      // Note: This relies on the image server supporting CORS for toDataURL to work without tainting the canvas
      if (selectedFilter.filter !== 'none' && imageRef.current && canvasRef.current) {
          try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = imageRef.current;

            if (ctx) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                // Apply filter to context
                ctx.filter = selectedFilter.filter;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                finalImageUrl = canvas.toDataURL('image/jpeg', 0.85);
            }
          } catch (e) {
              console.warn("Could not process image on canvas (likely CORS). Saving metadata only.", e);
              // Fallback: In a real app we might save the filter string to the DB. 
              // For this demo, we fall back to the original image if CORS blocks us.
          }
      }

      const newPoster: Poster = {
          id: `remix-${Date.now()}`,
          title: title,
          description: `Remixed from "${originalPoster.title}" by @${originalPoster.creator?.username || 'unknown'}`,
          imageUrl: finalImageUrl,
          creatorId: user.id,
          creator: user,
          likes: 0,
          tags: [...originalPoster.tags, 'remix'],
          createdAt: new Date().toISOString(),
          colors: originalPoster.colors,
          license: 'personal'
      };

      await addPoster(newPoster);
      setIsLoading(false);
      onClose();
  };

  return (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                >
                    {/* Hidden Canvas for Processing */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Image Preview Side */}
                    <div className="flex-1 bg-black/50 relative flex items-center justify-center p-8 overflow-hidden group">
                        <div className="relative shadow-2xl rounded-lg overflow-hidden">
                            <OptimizedImage 
                                ref={imageRef}
                                src={originalPoster.imageUrl} 
                                className="max-w-full max-h-[50vh] md:max-h-[70vh] object-contain transition-all duration-300 group-active:filter-none"
                                style={{ filter: selectedFilter.filter }}
                                crossOrigin="anonymous" 
                                alt="Preview"
                                containerClassName="max-w-full max-h-[50vh] md:max-h-[70vh]"
                            />
                            {/* Compare Hint */}
                            <div 
                                className="absolute top-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Hold click to compare
                            </div>
                        </div>
                    </div>

                    {/* Controls Side */}
                    <div className="w-full md:w-96 bg-neutral-900 border-l border-white/10 flex flex-col h-[40vh] md:h-auto">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Wand2 className="text-accent" /> Remix Studio
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="text-neutral-400" size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">Title</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                                    <Sliders size={12} /> Filters
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {FILTERS.map(filter => (
                                        <button
                                            key={filter.name}
                                            onClick={() => setSelectedFilter(filter)}
                                            className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between group ${
                                                selectedFilter.name === filter.name 
                                                ? 'bg-accent/20 border-accent text-white' 
                                                : 'bg-white/5 border-transparent text-neutral-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {filter.name}
                                            {selectedFilter.name === filter.name && <Check size={14} className="text-accent" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-black/20">
                            <button 
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Save Remix</>}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
  );
};
