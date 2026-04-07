import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

export interface SidebarMenuItem {
  label: string;
  link: string;
  ariaLabel?: string;
  onClick?: () => void;
}

interface SidebarMenuProps {
  items: SidebarMenuItem[];
  theme?: 'dark' | 'light';
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleItemClick = (item: SidebarMenuItem) => {
    setIsOpen(false);
    if (item.onClick) {
      item.onClick();
    } else if (item.link && item.link !== '#') {
      navigate(item.link);
    }
  };

  const menuVariants = {
    closed: {
      x: '100%',
      transition: {
        duration: 0.8,
        ease: [0.76, 0, 0.24, 1],
      },
    },
    open: {
      x: '0%',
      transition: {
        duration: 0.8,
        ease: [0.76, 0, 0.24, 1],
      },
    },
  };

  const linkVariants = {
    closed: { 
      y: '100%', 
      opacity: 0,
      rotate: 5,
      filter: 'blur(10px)'
    },
    open: (i: number) => ({
      y: '0%',
      opacity: 1,
      rotate: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        ease: [0.21, 1.02, 0.73, 1],
        delay: 0.2 + i * 0.1,
      },
    }),
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleMenu}
        className={`relative z-[100] w-12 h-12 flex flex-col items-center justify-center gap-1.5 rounded-full transition-colors ${
          isOpen 
            ? 'text-olive-dark hover:bg-black/5' 
            : 'hover:bg-black/10 dark:hover:bg-white/10 text-inherit'
        }`}
        aria-label="Toggle Menu"
      >
        <motion.span
          animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
          className="w-6 h-0.5 bg-current block"
        />
        <motion.span
          animate={isOpen ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
          className="w-6 h-0.5 bg-current block"
        />
        <motion.span
          animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
          className="w-6 h-0.5 bg-current block"
        />
      </button>

      {/* Full Screen Menu Portal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="fixed inset-0 z-[90] flex justify-end"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1, transition: { duration: 0.8 } }} // Keep wrapper alive while children exit
            >
              {/* Overlay for clicking outside */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />

              {/* Menu Panel */}
              <motion.div 
                initial="closed"
                animate="open"
                exit="closed"
                variants={menuVariants as any}
                className="relative w-full max-w-md bg-neon-lime shadow-2xl flex flex-col justify-center px-12 py-24 overflow-y-auto"
              >
                {/* Close Button inside the panel */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-6 right-6 w-12 h-12 flex flex-col items-center justify-center gap-1.5 rounded-full text-olive-dark hover:bg-black/5 transition-colors z-[100]"
                  aria-label="Close Menu"
                >
                  <motion.span
                    initial={{ rotate: 0, y: 0 }}
                    animate={{ rotate: 45, y: 8 }}
                    className="w-6 h-0.5 bg-current block"
                  />
                  <motion.span
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 0.5 }}
                    className="w-6 h-0.5 bg-current block"
                  />
                  <motion.span
                    initial={{ rotate: 0, y: 0 }}
                    animate={{ rotate: -45, y: -8 }}
                    className="w-6 h-0.5 bg-current block"
                  />
                </button>

                <div className="flex flex-col gap-6">
                  {items.map((item, i) => (
                    <div key={i} className="py-2 overflow-hidden">
                      <motion.button
                        custom={i}
                        variants={linkVariants as any}
                        onClick={() => handleItemClick(item)}
                        className="group flex items-center gap-4 text-5xl md:text-6xl font-display font-black uppercase tracking-tighter text-olive-dark hover:text-black transition-colors text-left origin-left"
                      >
                        <span className="text-sm font-mono tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">
                          0{i + 1}
                        </span>
                        <span className="relative">
                          {item.label}
                          <span className="absolute -bottom-2 left-0 w-0 h-1 bg-black transition-all duration-500 ease-out group-hover:w-full" />
                        </span>
                      </motion.button>
                    </div>
                  ))}
                </div>

                {/* Footer / Socials */}
                <motion.div 
                  initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.6, duration: 0.8, ease: [0.21, 1.02, 0.73, 1] }}
                  className="mt-24 pt-8 border-t border-olive-dark/20 flex justify-between items-center text-olive-dark font-mono text-xs uppercase tracking-widest"
                >
                  <span>Posterverse © 2026</span>
                  <div className="flex gap-4">
                    <a href="#" className="hover:text-black transition-colors">TW</a>
                    <a href="#" className="hover:text-black transition-colors">IG</a>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
