import React, { useRef, useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export const CollageSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { posters } = useGlobalContext();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smoothing the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Get top 4 most liked posters, refreshed daily
  const topPosters = useMemo(() => {
    const sorted = [...posters].sort((a, b) => b.likes - a.likes);
    const topN = sorted.slice(0, 15);
    if (topN.length === 0) return [null, null, null, null];
    
    const dateStr = new Date().toDateString();
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed += dateStr.charCodeAt(i);
    }
    
    const shuffled = [...topN];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return [
      shuffled[0] || null,
      shuffled[1] || null,
      shuffled[2] || null,
      shuffled[3] || null,
    ];
  }, [posters]);

  // Map progress to X translation
  // 4 panels, each 100vw. Total track 400vw.
  // Last panel should stop when its left edge is at 0 (meaning x = -300vw)
  const x = useTransform(smoothProgress, [0, 1], ["0vw", "-300vw"]);

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-olive-dark flex items-center">
        {/* Background Half-tone */}
        <div className="absolute inset-0 halftone-bg opacity-10 pointer-events-none z-0" />
        
        {/* Horizontal track */}
        <motion.div
          style={{ x }}
          className="flex h-full w-max relative z-10 flex-row items-center will-change-transform"
        >
          {/* Panel 1 — Quote */}
          <div className="w-screen h-full shrink-0 flex flex-col justify-center items-center px-8 md:px-[8vw] box-border relative overflow-hidden">
            <div className="max-w-[1000px] text-center px-4 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 2 }}
                    transition={{ type: "spring", stiffness: 150 }}
                    className="bg-white text-olive-dark px-6 py-2 comic-border inline-block mb-12 shadow-[8px_8px_0px_rgba(200,241,53,1)]"
                >
                    <p className="text-xl font-impact tracking-widest uppercase">TRENDING NOW!</p>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-7xl sm:text-9xl md:text-[10rem] font-impact text-white leading-[0.8] tracking-tighter m-0 drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] uppercase"
                >
                  THE MOST <br/> APPRECIATED
                </motion.h2>
                <motion.h2
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 2 }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="text-6xl sm:text-8xl md:text-[8rem] font-impact text-neon-lime leading-[0.8] mt-4 uppercase drop-shadow-[4px_4px_0px_rgba(255,255,255,0.2)]"
                >
                  ARTWORKS TODAY!
                </motion.h2>
            </div>
          </div>

          {/* Panel 2 — Single tall photo left-aligned */}
          <div className="w-screen h-full shrink-0 flex items-center justify-center px-6 md:px-20 box-border">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-20 w-full max-w-6xl">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-white translate-x-4 translate-y-4 comic-border -z-1" />
                <OptimizedImage
                  src={topPosters[0]?.imageUrl || "https://picsum.photos/seed/picsum/600/800"}
                  alt="Panel 2"
                  className="w-[80vw] h-[40vh] md:w-[50vh] md:h-[75vh] max-w-[600px] max-h-[850px] object-cover grayscale hover:grayscale-0 transition-all duration-700 cursor-pointer border-4 border-olive-dark"
                  containerClassName="w-[80vw] h-[40vh] md:w-[50vh] md:h-[75vh] max-w-[600px] max-h-[850px] shrink-0 comic-shadow"
                />
              </motion.div>
              <div className="mt-4 md:mt-0 text-left w-full md:w-auto relative">
                <div className="absolute -top-12 -left-8 w-24 h-24 halftone-bg text-neon-lime/10 pointer-events-none" />
                <p className="font-impact text-2xl md:text-4xl text-neon-lime mb-4">01 — TOP TRENDING</p>
                <p className="text-white font-comic text-xl md:text-2xl max-w-[400px] mt-2 md:mt-4 leading-snug">
                  "{topPosters[0]?.title || "EVERY GREAT JOURNEY STARTS WITH A SINGLE PIXEL."}"
                </p>
              </div>
            </div>
          </div>

          {/* Panel 3 — Two photos offset */}
          <div className="w-screen h-full shrink-0 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-32 px-6 md:px-20 box-border">
            <motion.div 
               className="md:-mt-[15vh] text-center md:text-left"
               whileHover={{ y: -20, rotate: -2 }}
               transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-neon-lime translate-x-2 translate-y-2 comic-border -z-1" />
                <OptimizedImage
                  src={topPosters[1]?.imageUrl || "https://picsum.photos/seed/bali/400/600"}
                  alt="Panel 3 Left"
                  className="w-[70vw] h-[30vh] md:w-[35vh] md:h-[55vh] object-cover grayscale hover:grayscale-0 transition-all duration-700 cursor-pointer border-4 border-white"
                  containerClassName="w-[70vw] h-[30vh] md:w-[35vh] md:h-[55vh] shrink-0 mx-auto md:mx-0 shadow-xl"
                />
              </div>
              <div className="mt-8 text-left">
                <p className="font-impact text-xl text-neon-lime uppercase tracking-widest">02 — RISING STAR</p>
                <p className="text-white font-comic text-lg max-w-[300px] mt-2 leading-snug">
                  "{topPosters[1]?.title || "THROUGH THE NOISE AND CHAOS, WE FIND OUR RHYTHM."}"
                </p>
              </div>
            </motion.div>
            <motion.div 
              className="md:mt-[15vh] text-center md:text-left hidden sm:block"
              whileHover={{ y: 20, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white translate-x-2 translate-y-2 comic-border -z-1" />
                <OptimizedImage
                  src={topPosters[2]?.imageUrl || "https://picsum.photos/seed/city/500/400"}
                  alt="Panel 3 Right"
                  className="w-[70vw] h-[30vh] md:w-[45vh] md:h-[40vh] object-cover grayscale hover:grayscale-0 transition-all duration-700 cursor-pointer border-4 border-olive-dark"
                  containerClassName="w-[70vw] h-[30vh] md:w-[45vh] md:h-[40vh] shrink-0 mx-auto md:mx-0 shadow-xl"
                />
              </div>
              <div className="mt-8 text-left">
                <p className="font-impact text-xl text-neon-lime uppercase tracking-widest">03 — FAVORITE</p>
                <p className="text-white font-comic text-lg max-w-[350px] mt-2 leading-snug">
                  "{topPosters[2]?.title || "WE STUMBLE UPON BEAUTY IN THE UNEXPECTED."}"
                </p>
              </div>
            </motion.div>
          </div>

          {/* Panel 4 — Big photo right-aligned bottom */}
          <div className="w-screen h-full shrink-0 flex items-center justify-center px-6 md:px-20 box-border">
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-20 w-full max-w-6xl">
              <div className="relative group">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-10"
                >
                  <div className="absolute inset-0 bg-neon-lime translate-x-4 translate-y-4 comic-border -z-1" />
                  <OptimizedImage
                    src={topPosters[3]?.imageUrl || "https://picsum.photos/seed/nature/700/800"}
                    alt="Panel 4"
                    className="w-[85vw] h-[40vh] md:w-[65vh] md:h-[75vh] object-cover grayscale hover:grayscale-0 transition-all duration-700 cursor-pointer border-4 border-white"
                    containerClassName="w-[85vw] h-[40vh] md:w-[65vh] md:h-[75vh] shrink-0 shadow-2xl"
                  />
                </motion.div>
                <div className="absolute -bottom-6 -right-6 bg-white text-olive-dark px-8 py-3 comic-border font-impact text-2xl rotate-3 shadow-xl z-20">
                    MASTERPIECE!
                </div>
              </div>
              <div className="mt-12 md:mt-0 text-left md:text-right w-full md:w-auto relative">
                <div className="absolute -bottom-12 -right-8 w-32 h-32 halftone-bg text-white/5 pointer-events-none" />
                <p className="font-impact text-3xl md:text-5xl text-neon-lime mb-6 uppercase tracking-widest">04 — THE FINALE</p>
                <p className="text-white font-comic text-xl md:text-3xl max-w-[500px] mt-2 md:mt-4 leading-snug md:ml-auto uppercase">
                  "{topPosters[3]?.title || "THE CYCLE BEGINS ANEW, BUT WE ARE CHANGED."}"
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          style={{ scaleX: scrollYProgress }}
          className="absolute bottom-0 left-0 h-[3px] bg-neon-lime w-full origin-left z-[100]"
        />
      </div>
    </div>
  );
};
