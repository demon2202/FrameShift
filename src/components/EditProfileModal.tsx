
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2 } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';
import { ImageEditor } from './ImageEditor';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateUserProfile } = useGlobalContext();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [website, setWebsite] = useState('');
    const [location, setLocation] = useState('');
    const [avatar, setAvatar] = useState('');
    const [banner, setBanner] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Image Editing State
    const [editingImage, setEditingImage] = useState<{
        src: string;
        type: 'avatar' | 'banner';
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user && isOpen) {
            setName(user.name || '');
            setUsername(user.username || '');
            setBio(user.bio || '');
            setWebsite(user.website || '');
            setLocation(user.location || '');
            setAvatar(user.avatar);
            setBanner(user.bannerUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1500&q=80');
        }
        
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [user, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File is too large. Maximum size is 10MB.');
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingImage({
                    src: reader.result as string,
                    type
                });
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        e.target.value = '';
    };

    const handleSaveImage = (editedImage: string) => {
        if (editingImage?.type === 'avatar') {
            setAvatar(editedImage);
        } else if (editingImage?.type === 'banner') {
            setBanner(editedImage);
        }
        setEditingImage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            await updateUserProfile({ 
                name, 
                username: username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(), 
                bio, 
                website, 
                location, 
                avatar, 
                bannerUrl: banner 
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    
                    {editingImage ? (
                        <ImageEditor 
                            imageSrc={editingImage.src}
                            aspectRatio={editingImage.type === 'avatar' ? 1 : 3} // 3:1 for banner
                            circular={editingImage.type === 'avatar'}
                            onSave={handleSaveImage}
                            onCancel={() => setEditingImage(null)}
                        />
                    ) : (
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md bg-olive-dark border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <button 
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-cream/40 hover:text-neon-lime transition-colors z-20"
                            >
                                <X size={24} />
                            </button>

                            <h2 className="text-2xl font-display font-black text-cream mb-6 uppercase tracking-tight">Edit Profile</h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Banner Upload */}
                                <div className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer group border-2 border-white/10 hover:border-neon-lime transition-colors" onClick={() => bannerInputRef.current?.click()}>
                                    <OptimizedImage src={banner} alt="Banner" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-neon-lime" size={24} />
                                        <span className="ml-2 text-xs font-bold text-neon-lime uppercase">Change Banner</span>
                                    </div>
                                    <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden" />
                                </div>

                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center -mt-12 relative z-10">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-4 border-olive-dark hover:border-neon-lime transition-colors"
                                    >
                                        <OptimizedImage src={avatar} alt="Avatar" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-neon-lime" size={24} />
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden" />
                                    </div>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs font-bold uppercase tracking-widest text-neon-lime hover:text-white transition-colors">Change Photo</button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Username</label>
                                        <input 
                                            type="text" 
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            maxLength={30}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime outline-none font-medium"
                                            placeholder="username"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Display Name</label>
                                        <input 
                                            type="text" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            maxLength={50}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime outline-none font-medium"
                                            placeholder="Your Name"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Bio</label>
                                        <textarea 
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            maxLength={160}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime outline-none resize-none h-24 font-medium"
                                            placeholder="Tell the world about yourself..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Website</label>
                                        <input 
                                            type="url" 
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            maxLength={100}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime outline-none font-medium"
                                            placeholder="https://yourwebsite.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Location</label>
                                        <input 
                                            type="text" 
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            maxLength={50}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime outline-none font-medium"
                                            placeholder="City, Country"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-neon-lime text-olive-dark font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:shadow-[0_0_30px_rgba(204,255,0,0.4)]"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                 </div>
            )}
        </AnimatePresence>
    );
};
