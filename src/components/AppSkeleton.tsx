import React, { useEffect, useRef, useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { motion } from 'framer-motion';

export const AppSkeleton: React.FC = () => {
  const { posters } = useGlobalContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // Extract image URLs or use high-quality fallbacks
  const images = React.useMemo(() => {
    return posters.length > 0
      ? posters.map(p => p.imageUrl)
      : [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop',
        ];
  }, [posters]);

  // Counter animation
  useEffect(() => {
    const duration = 2500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const p = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const easeP = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setProgress(Math.floor(easeP * 100));

      if (p < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  // Image Trail logic
  const lastPos = useRef({ x: 0, y: 0 });
  const imgIndex = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const threshold = 120; // Increased distance threshold for new image (less dense)
    let lastSpawnTime = 0;
    const timeThreshold = 150; // Minimum ms between spawns (slower appearance)

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dist = Math.hypot(e.clientX - lastPos.current.x, e.clientY - lastPos.current.y);
      
      if (dist > threshold && (now - lastSpawnTime) > timeThreshold) {
        lastPos.current = { x: e.clientX, y: e.clientY };
        lastSpawnTime = now;

        const img = document.createElement('img');
        img.src = images[imgIndex.current % images.length];
        imgIndex.current++;

        // Styling for the trail image
        img.className = 'absolute pointer-events-none object-cover rounded-lg shadow-2xl';
        img.style.width = '200px';
        img.style.height = '280px';
        img.style.left = `${e.clientX - 100}px`;
        img.style.top = `${e.clientY - 140}px`;
        
        const initialRotation = Math.random() * 40 - 20;
        img.style.transform = `scale(0.5) rotate(${initialRotation}deg)`;
        img.style.opacity = '0';
        img.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'; // Slower transition
        img.style.zIndex = `${imgIndex.current}`;

        container.appendChild(img);

        // Force reflow
        void img.offsetWidth;

        // Animate In
        img.style.opacity = '0.9';
        img.style.transform = `scale(1) rotate(${initialRotation}deg)`;

        // Animate Out
        setTimeout(() => {
          img.style.opacity = '0';
          img.style.transform = `scale(0.8) translateY(30px) rotate(${initialRotation}deg)`;
          setTimeout(() => {
            if (container.contains(img)) {
              container.removeChild(img);
            }
          }, 800); // Wait for transition to finish
        }, 1000); // How long it stays visible (increased)
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [images]);

  return (
    <div className="fixed inset-0 bg-neutral-950 overflow-hidden flex flex-col items-center justify-center z-[9999] cursor-crosshair">
      {/* Image Trail Container */}
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none" />

      {/* Foreground Content */}
      <div className="z-20 flex flex-col items-center pointer-events-none mix-blend-difference text-white select-none">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-[20vw] md:text-[15vw] font-display font-black leading-none tracking-tighter"
        >
          {progress}%
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="flex flex-col items-center"
        >
          <p className="text-sm md:text-xl font-mono uppercase tracking-[0.5em] mt-2 opacity-80">
            Posterverse
          </p>
          <p className="text-[10px] font-sans uppercase tracking-widest mt-8 opacity-40 animate-pulse">
            Move cursor to interact
          </p>
        </motion.div>
      </div>
    </div>
  );
};
