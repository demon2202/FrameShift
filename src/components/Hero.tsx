import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';

export const Hero: React.FC = () => {
    const component = useRef<HTMLDivElement>(null);
    const slider = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { posters } = useGlobalContext();
    const [activeIndex, setActiveIndex] = useState(0);

    const heroPosters = useMemo(() => {
        if (!posters || posters.length === 0) return [];
        return [...posters]
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 5);
    }, [posters]);

    useLayoutEffect(() => {
        if (!component.current || !slider.current || heroPosters.length === 0) return;

        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            const panels = gsap.utils.toArray('.hero-panel');
            
            // Pin the entire component wrapper instead of just the slider
            gsap.to(panels, {
                xPercent: -100 * (panels.length - 1),
                ease: "none",
                scrollTrigger: {
                    trigger: component.current,
                    pin: true,
                    scrub: 1, 
                    snap: 1 / (panels.length - 1),
                    start: "top top",
                    end: () => `+=${(panels.length - 1) * 100}%`,
                    onUpdate: (self) => {
                        const index = Math.round(self.progress * (panels.length - 1));
                        setActiveIndex(index);
                    }
                }
            });
        }, component);

        return () => ctx.revert();
    }, [heroPosters]);

    if (heroPosters.length === 0) return <div className="h-screen bg-black" />;

    return (
        <div ref={component} className="relative h-screen bg-black overflow-hidden selection:bg-neon-lime selection:text-black z-10">
            {/* 1. LAYER: ATMOSPHERE */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)] pointer-events-none" />

            {/* 2. LAYER: FIXED LEFT SIDEBAR */}
            <div className="absolute left-0 top-0 h-full w-20 md:w-24 border-r border-white/5 flex flex-col justify-between items-center py-12 z-50 bg-black/80 backdrop-blur-3xl">
                <div className="flex flex-col gap-10 items-center">
                    <h1 
                        className="text-white font-impact text-3xl rotate-[-90deg] whitespace-nowrap tracking-widest cursor-pointer hover:text-neon-lime transition-colors"
                        onClick={() => navigate('/')}
                    >
                        
                    </h1>
                    <div className="h-20 w-[1px] bg-white/10" />
                </div>

                <div className="flex flex-col gap-8 items-center">
                    {[1, 2, 3, 4, 5].map((num, i) => (
                        <div 
                            key={num}
                            className={`flex flex-col items-center gap-2 transition-all duration-500 ${activeIndex === i ? 'scale-110' : 'opacity-20'}`}
                        >
                             <span className={`text-[10px] font-impact ${activeIndex === i ? 'text-white' : 'text-white/40'}`}>
                                0{num}
                            </span>
                            {activeIndex === i && (
                                <motion.div 
                                    layoutId="nav-dot-hero"
                                    className="w-1 h-1 bg-neon-lime rounded-full" 
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="rotate-[-90deg] whitespace-nowrap">
                    <span className="cinematic-text text-white/20 text-[8px] font-bold tracking-[0.4em]">STABLE_CORE</span>
                </div>
            </div>

            {/* 3. LAYER: TOP NAVIGATION */}
            <div className="absolute top-0 left-24 right-0 h-20 flex items-center justify-between px-12 z-40 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    <span className="cinematic-text text-white/50 font-bold text-[9px] tracking-[0.2em]">TRANSMISSION_LIVE</span>
                </div>
            </div>

            {/* 4. LAYER: MAIN SCROLLER */}
            <div ref={slider} className="flex h-full relative z-10 will-change-transform">
                
                {/* Intro Panel */}
                <div className="hero-panel w-screen h-full flex-shrink-0 flex flex-col justify-center pl-32 md:pl-48 pr-12 bg-black relative">
                    <div className="max-w-4xl">
                        <motion.h1 
                            initial={{ opacity: 0, x: -100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="text-white text-[15vw] md:text-[10rem] font-impact leading-[0.8] tracking-tighter uppercase mb-12"
                        >
                            FRAME<br/><span className="text-neon-lime">SHIFT</span>
                        </motion.h1>

                        <p className="text-white/60 text-2xl font-comic leading-relaxed max-w-xl border-l-4 border-neon-lime pl-8 mb-12 uppercase italic">
                            A curated digital archive of the visual underground.
                        </p>

                        <button 
                            onClick={() => navigate('/login')}
                            className="px-12 py-6 bg-white text-black font-impact text-xl tracking-widest hover:bg-neon-lime transition-all uppercase shadow-[12px_12px_0px_#222]"
                        >
                            ACCESS TERMINAL
                        </button>
                    </div>
                </div>

                {/* Featured Poster Panels */}
                {heroPosters.slice(0, 3).map((poster, index) => (
                    <div key={poster.id} className="hero-panel w-screen h-full flex-shrink-0 flex items-center justify-center pl-32 md:pl-48 pr-12 relative bg-black">
                        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                            
                            {/* Visual */}
                            <div className="relative group">
                                <motion.div 
                                    className="relative w-full max-w-md aspect-[3/4] border-4 border-white shadow-[20px_20px_0px_rgba(204,255,0,0.5)] overflow-hidden cursor-pointer"
                                    onClick={() => navigate(`/poster/${poster.id}`)}
                                >
                                    <OptimizedImage 
                                        src={poster.imageUrl} 
                                        alt={poster.title}
                                        className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000"
                                        containerClassName="w-full h-full"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
                                </motion.div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col gap-10">
                                <span className="font-impact text-neon-lime text-3xl tracking-[0.2em]">EXHIBIT_0{index + 1}</span>
                                
                                <h2 className="text-white text-7xl md:text-[8rem] font-impact leading-none uppercase tracking-tighter mix-blend-difference">
                                    {poster.title}
                                </h2>

                                <div className="flex flex-col gap-8">
                                    <p className="text-white/40 font-comic text-2xl italic max-w-sm">
                                        "{poster.description || "A study in digital chaos and structural evolution."}"
                                    </p>

                                    <button 
                                        onClick={() => navigate(`/poster/${poster.id}`)}
                                        className="w-max px-10 py-5 bg-neon-lime text-black font-impact text-lg uppercase tracking-widest hover:bg-white transition-all shadow-[8px_8px_0px_#444]"
                                    >
                                        VIEW ENTRY
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Final CTA Panel */}
                <div className="hero-panel w-screen h-full flex-shrink-0 flex items-center justify-center bg-neon-lime">
                    <div className="text-center">
                        <h2 className="text-[14vw] font-impact text-black leading-[0.8] uppercase mb-16">
                            READY TO<br/>CREATE?
                        </h2>
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-20 py-10 bg-black text-white font-impact text-5xl uppercase tracking-widest hover:scale-110 transition-all shadow-[20px_20px_0px_white]"
                        >
                            START NOW
                        </button>
                        <p className="mt-12 font-comic text-black/60 text-2xl uppercase tracking-widest">Join the Vanguard</p>
                    </div>
                </div>
            </div>

            {/* 5. LAYER: FOOTER */}
            <div className="absolute bottom-0 left-24 right-0 h-16 flex items-center justify-between px-12 z-40 bg-gradient-to-t from-black/50 to-transparent">
                <span className="cinematic-text text-white/20 text-[8px] font-bold tracking-[0.2em]">P.VERSE_SYSTEM_V1.0</span>
            </div>
        </div>
    );
};
