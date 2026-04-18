import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { ContourBackground } from './ui/ContourBackground';
import { OptimizedImage } from './ui/OptimizedImage';

gsap.registerPlugin(ScrollTrigger);

export const Hero: React.FC = () => {
  const component = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { posters, user } = useGlobalContext();

  useLayoutEffect(() => {
    if (!component.current || !slider.current) return;

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray('.hero-panel');
      
      if (panels.length === 0) return;

      gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: slider.current,
          pin: true,
          scrub: 1,
          snap: 1 / (panels.length - 1),
          end: () => "+=" + slider.current?.offsetWidth,
        }
      });
    }, component);

    return () => ctx.revert();
  }, [posters]);

  const [dayIndex] = React.useState(() => Math.floor(Date.now() / (1000 * 60 * 60 * 24)));

  const heroPosters = React.useMemo(() => {
    if (!posters || posters.length === 0) return [];
    
    // Sort posters by likes descending
    const sortedPosters = [...posters].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    // Get the top trending posters (e.g., top 10)
    const topPosters = sortedPosters.slice(0, 10);
    
    // Use the current day to select one poster, changing every 24 hours
    const selectedPoster = topPosters[dayIndex % topPosters.length];
    
    return [selectedPoster];
  }, [posters, dayIndex]);

  return (
    <div ref={component} className="relative w-full overflow-hidden bg-olive-dark text-cream">
      <div ref={slider} className="h-screen w-full flex flex-nowrap">
        
        {/* Panel 1: Main Landing */}
        <div className="hero-panel w-screen h-full flex-shrink-0 flex flex-col justify-between relative p-8 md:p-16 overflow-hidden">
            <ContourBackground />
            
            {/* Top Bar */}
            <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-neon-lime animate-pulse"></span>
                    <span className="font-mono text-xs uppercase tracking-widest text-neon-lime">Est. 2025</span>
                </div>
                <div className="hidden md:block text-right">
                    <p className="font-mono text-xs uppercase tracking-widest opacity-60">Digital Archive</p>
                    <p className="font-mono text-xs uppercase tracking-widest opacity-60">Vol. 01</p>
                </div>
            </div>

            {/* Main Title */}
            <div className="relative z-10 mix-blend-difference">
                <motion.h1 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="text-[15vw] md:text-[18vw] leading-[0.8] font-display font-black uppercase tracking-tighter text-cream flex overflow-hidden"
                >
                    {"Frame".split('').map((char, index) => (
                        <motion.span
                            key={index}
                            variants={{
                                hidden: { y: "100%" },
                                visible: { y: 0, transition: { duration: 0.8, ease: [0.21, 1.02, 0.73, 1] } }
                            }}
                            className="inline-block"
                        >
                            {char}
                        </motion.span>
                    ))}
                </motion.h1>
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
                    }}
                    className="flex items-center gap-4 md:gap-12"
                >
                    <h1 className="text-[15vw] md:text-[18vw] leading-[0.8] font-display font-black uppercase tracking-tighter text-neon-lime flex overflow-hidden">
                        {"Shift".split('').map((char, index) => (
                            <motion.span
                                key={index}
                                variants={{
                                    hidden: { y: "100%" },
                                    visible: { y: 0, transition: { duration: 0.8, ease: [0.21, 1.02, 0.73, 1] } }
                                }}
                                className="inline-block"
                            >
                                {char}
                            </motion.span>
                        ))}
                    </h1>
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.8, ease: "easeOut" } }
                        }}
                        className="hidden md:block max-w-xs"
                    >
                        <p className="font-serif italic text-xl leading-tight text-cream/80">
                            "The interface between human creativity and digital chaos."
                        </p>
                    </motion.div>
                </motion.div>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-end z-10">
                <motion.button 
                    onClick={() => navigate(user ? '/explore' : '/login')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group flex items-center gap-4 px-8 py-4 bg-cream text-olive-dark font-bold uppercase tracking-widest hover:bg-neon-lime transition-colors"
                >
                    {user ? 'Start Creating' : 'Join the Archive'}
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <div className="flex items-center gap-2 text-cream/40 animate-bounce">
                    <span className="font-mono text-xs uppercase tracking-widest">Scroll</span>
                    <ArrowRight className="rotate-90" size={14} />
                </div>
            </div>
        </div>

        {/* Panel 2-5: Featured Posters */}
        {heroPosters.map((poster, index) => (
          <div key={poster.id} className="hero-panel w-screen h-full flex-shrink-0 flex items-center justify-center relative bg-olive-dark">
             {/* Background Number */}
             <span className="absolute top-0 left-0 text-[20vw] font-display font-black text-cream/5 leading-none select-none z-0">
                0{index + 1}
             </span>

             <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full max-w-[1600px] mx-auto p-8 md:p-16 gap-8 md:gap-16 items-center z-10">
                {/* Image Side */}
                <div className="relative h-[60vh] md:h-[80vh] w-full group cursor-pointer" onClick={() => navigate('/login')}>
                    <div className="absolute inset-0 bg-neon-lime transform translate-x-2 translate-y-2 transition-transform group-hover:translate-x-4 group-hover:translate-y-4" />
                    <OptimizedImage 
                        src={poster.imageUrl} 
                        alt={poster.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 border border-cream/10" 
                        containerClassName="relative w-full h-full"
                    />
                    <div className="absolute top-4 right-4 bg-cream text-olive-dark p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={24} />
                    </div>
                </div>

                {/* Text Side */}
                <div className="flex flex-col justify-center h-full">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <OptimizedImage 
                                src={poster.creator?.avatar} 
                                alt={poster.creator?.username || 'unknown'} 
                                className="w-10 h-10 rounded-full border border-cream/20 object-cover" 
                                containerClassName="w-10 h-10 rounded-full"
                            />
                            <div>
                                <p className="font-bold text-cream uppercase tracking-wide">{poster.creator?.name || 'Unknown'}</p>
                                <p className="font-mono text-xs text-neon-lime uppercase tracking-widest">@{poster.creator?.username || 'unknown'}</p>
                            </div>
                        </div>
                        <h2 className="text-4xl sm:text-6xl md:text-8xl font-display font-black text-cream uppercase leading-[0.85] tracking-tighter mb-4 sm:mb-6">
                            {poster.title}
                        </h2>
                        <p className="text-cream/60 font-serif italic text-2xl max-w-md">
                            {poster.description || "A visual exploration of form and void."}
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <button onClick={() => navigate(user ? '/explore' : '/login')} className="px-8 py-3 border border-cream/20 text-cream font-mono text-xs uppercase tracking-widest hover:bg-cream hover:text-olive-dark transition-colors">
                            {user ? 'View Project' : 'Member Access'}
                        </button>
                    </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
