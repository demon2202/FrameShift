
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';
import { UploadModal } from './UploadModal';
import { motion } from 'framer-motion';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useGlobalContext();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Hide bottom nav on login page to avoid clutter
  if (location.pathname === '/login') return null;

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-olive-dark border-t border-cream/10 flex items-center justify-around z-40 pb-safe px-4">
        <Link to="/" className="relative p-2 group">
          <Home size={24} className={`transition-colors ${isActive('/') ? 'text-neon-lime' : 'text-cream/50'}`} strokeWidth={isActive('/') ? 2.5 : 2} />
          {isActive('/') && <motion.div layoutId="bottomNavIndicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-lime rounded-full" />}
        </Link>
        
        <Link to="/explore" className="relative p-2 group">
          <Compass size={24} className={`transition-colors ${isActive('/explore') ? 'text-neon-lime' : 'text-cream/50'}`} strokeWidth={isActive('/explore') ? 2.5 : 2} />
          {isActive('/explore') && <motion.div layoutId="bottomNavIndicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-lime rounded-full" />}
        </Link>

        <button 
          onClick={() => {
              if (user) {
                  setIsUploadOpen(true);
              } else {
                  navigate('/login');
              }
          }}
          className="p-3 -mt-8 bg-neon-lime rounded-full text-olive-dark shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:scale-105 transition-transform border-4 border-olive-dark"
        >
          <Plus size={24} strokeWidth={3} />
        </button>

        <button 
          onClick={() => {
              if (user) {
                  navigate('/messages');
              } else {
                  navigate('/login');
              }
          }}
          className="relative p-2 group"
        >
          <MessageSquare size={24} className={`transition-colors ${isActive('/messages') ? 'text-neon-lime' : 'text-cream/50'}`} strokeWidth={isActive('/messages') ? 2.5 : 2} />
          {isActive('/messages') && <motion.div layoutId="bottomNavIndicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-lime rounded-full" />}
        </button>

        <Link to={user ? `/profile/${user.id}` : '/login'} className="relative p-2 group">
            {user ? (
                <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-colors ${isActive(`/profile/${user.id}`) ? 'border-neon-lime' : 'border-cream/20'}`}>
                    <OptimizedImage 
                        src={user.avatar} 
                        className="w-full h-full object-cover" 
                        alt="Profile"
                        containerClassName="w-full h-full"
                    />
                </div>
            ) : (
                <User size={24} className={`transition-colors ${isActive('/login') ? 'text-neon-lime' : 'text-cream/50'}`} strokeWidth={isActive('/login') ? 2.5 : 2} />
            )}
            {user && isActive(`/profile/${user.id}`) && <motion.div layoutId="bottomNavIndicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-lime rounded-full" />}
        </Link>
      </div>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </>
  );
};
