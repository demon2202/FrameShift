import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalContext } from '../context/GlobalContext';
import { Poster } from '../types';

interface SaveToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  poster: Poster;
}

export const SaveToCollectionModal: React.FC<SaveToCollectionModalProps> = ({ isOpen, onClose, poster }) => {
  const { collections, createCollection, addToCollection, removeFromCollection, user } = useGlobalContext();
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isOpen || !user) return null;

  const userCollections = collections.filter(c => c.userId === user.id);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    await createCollection(newCollectionName, newCollectionDesc, isPrivate);
    setNewCollectionName('');
    setNewCollectionDesc('');
    setIsPrivate(false);
    setIsCreating(false);
  };

  const toggleCollection = async (collectionId: string, isSaved: boolean) => {
    if (isSaved) {
      await removeFromCollection(collectionId, poster.id);
    } else {
      await addToCollection(collectionId, poster.id);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-cream dark:bg-neutral-900 border border-olive-dark/20 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-olive-dark/10 dark:border-white/10">
            <h2 className="text-xl font-display font-black uppercase tracking-tight text-olive-dark dark:text-cream">
              Save to Collection
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-olive-dark/5 dark:hover:bg-white/5 rounded-full transition-colors text-olive-dark dark:text-cream"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {isCreating ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-olive-dark/60 dark:text-cream/60 mb-2">Name</label>
                  <input 
                    type="text" 
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-olive-dark/20 dark:border-white/20 p-2 text-olive-dark dark:text-cream focus:outline-none focus:border-neon-lime transition-colors"
                    placeholder="e.g., Cyberpunk Inspo"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-olive-dark/60 dark:text-cream/60 mb-2">Description (Optional)</label>
                  <input 
                    type="text" 
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-olive-dark/20 dark:border-white/20 p-2 text-olive-dark dark:text-cream focus:outline-none focus:border-neon-lime transition-colors"
                    placeholder="What's this collection about?"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="private"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="accent-neon-lime"
                  />
                  <label htmlFor="private" className="text-sm text-olive-dark dark:text-cream">Make Private</label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-olive-dark dark:text-cream border border-olive-dark/20 dark:border-white/20 hover:bg-olive-dark/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!newCollectionName.trim()}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-neon-lime text-olive-dark disabled:opacity-50 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-3 p-4 border border-dashed border-olive-dark/20 dark:border-white/20 hover:border-neon-lime hover:bg-neon-lime/5 transition-all text-olive-dark dark:text-cream group"
                >
                  <div className="w-10 h-10 rounded-full bg-olive-dark/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-neon-lime group-hover:text-olive-dark transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="font-bold uppercase tracking-widest text-sm">New Collection</span>
                </button>

                <div className="space-y-2 pt-4">
                  {userCollections.length === 0 ? (
                    <p className="text-center text-sm text-olive-dark/50 dark:text-cream/50 italic py-4">
                      You don't have any collections yet.
                    </p>
                  ) : (
                    userCollections.map(collection => {
                      const isSaved = collection.posterIds?.includes(poster.id);
                      return (
                        <button
                          key={collection.id}
                          onClick={() => toggleCollection(collection.id, isSaved)}
                          className="w-full flex items-center justify-between p-4 border border-olive-dark/10 dark:border-white/10 hover:border-neon-lime hover:bg-neon-lime/5 transition-all text-left group"
                        >
                          <div>
                            <h3 className="font-bold text-olive-dark dark:text-cream uppercase tracking-tight">{collection.name}</h3>
                            <p className="text-xs text-olive-dark/50 dark:text-cream/50">{collection.posterIds?.length || 0} items</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSaved ? 'bg-neon-lime border-neon-lime text-olive-dark' : 'border-olive-dark/20 dark:border-white/20 text-transparent group-hover:border-neon-lime'}`}>
                            <Check size={14} />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
