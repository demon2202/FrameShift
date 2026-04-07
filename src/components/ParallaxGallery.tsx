import React, { useRef, useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from './ui/OptimizedImage';

export const ParallaxGallery: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!wrapperRef.current || !stickyRef.current || !trackRef.current) {
            ticking = false;
            return;
          }

          const wrapper = wrapperRef.current;
          const rect = wrapper.getBoundingClientRect();
          const wrapperTop = rect.top + window.scrollY;
          const wrapperHeight = wrapper.offsetHeight;
          const windowHeight = window.innerHeight;
          
          // Calculate how far we've scrolled into the wrapper
          const start = wrapperTop;
          const end = wrapperTop + wrapperHeight - windowHeight;
          const current = window.scrollY;

          if (current < start) {
            setProgress(0);
          } else if (current > end) {
            setProgress(1);
          } else {
            const p = (current - start) / (end - start);
            setProgress(p);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll(); // Init
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Calculate horizontal translation
  // 8 Panels (100vw each) = 800vw
  const totalWidthVw = 800; 
  const maxTranslate = totalWidthVw - 100; // 700vw

  return (
    <div ref={wrapperRef} className="relative h-[800vh] bg-[#2C3B2D]">
      <div ref={stickyRef} className="sticky top-0 h-screen overflow-hidden flex flex-col">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-[#CCFF00]">
            <path d="M20,30 Q40,5 60,30 T90,30 T60,60 T20,60 T20,30" />
            <path d="M10,80 Q30,60 50,80 T90,80 T50,100 T10,100 T10,80" />
            </svg>
            <div className="absolute inset-0 bg-[#2C3B2D]/80 backdrop-blur-[100px]" />
        </div>

        {/* Horizontal Track */}
        <div 
            ref={trackRef}
            className="flex h-full items-center will-change-transform"
            style={{ 
                transform: `translateX(-${progress * maxTranslate}vw)`,
                width: `${totalWidthVw}vw`
            }}
        >
            {/* Panel 1: Quote Block (100vw) */}
            <div className="w-[100vw] min-w-[100vw] h-full flex-shrink-0 flex flex-col justify-center px-8 md:px-24 relative z-10" style={{ padding: '4rem' }}>
                <div className="max-w-7xl w-full overflow-hidden">
                    <h2 className="leading-[0.9] tracking-tight mix-blend-normal">
                        <span className="block font-sans font-light text-[#F0EDE6] text-[clamp(1.8rem,3.5vw,3.2rem)] mb-2">
                            Design is not just what it looks like and feels like.
                        </span>
                        <span className="block font-serif italic font-bold text-[#CCFF00] text-[clamp(1.8rem,3.5vw,3.2rem)]">
                            Design is how it works.
                        </span>
                    </h2>
                    <div className="mt-8">
                        <span className="block font-handwriting text-4xl md:text-5xl text-[#CCFF00] font-cursive mb-2" style={{ fontFamily: 'cursive' }}>Steve Jobs</span>
                        <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#F0EDE6]/60">Visionary Archive</span>
                    </div>
                </div>
            </div>

            {/* Panel 2: Text + Image (100vw) */}
            <div className="w-[100vw] min-w-[100vw] h-full flex-shrink-0 flex items-center justify-center relative px-8 md:px-24 gap-12">
                <div className="flex-1 max-w-xl">
                    <h3 className="text-3xl md:text-5xl font-serif italic text-[#CCFF00] mb-6">It begins with a spark.</h3>
                    <p className="text-[#F0EDE6]/80 font-sans text-lg md:text-xl leading-relaxed">
                        Every great design starts as a fleeting thought. A whisper of an idea that demands to be brought into the physical world. It's the moment you see the invisible.
                    </p>
                </div>
                <div className="flex-1 flex justify-center">
                    <PosterImage 
                        imageUrl="https://picsum.photos/seed/spark/400/500"
                        width="400px"
                        height="500px"
                        label="Genesis"
                        title="The First Idea"
                    />
                </div>
            </div>

            {/* Panel 3: Two Photos Side by Side (100vw) */}
            <div className="w-[100vw] min-w-[100vw] h-full flex-shrink-0 flex items-center justify-center relative gap-16 px-8 md:px-24">
                 <div className="-mt-32">
                    <PosterImage 
                        imageUrl="https://picsum.photos/seed/explore1/300/450"
                        width="300px"
                        height="450px"
                        label="Exploration"
                        title="Wandering"
                    />
                 </div>
                 <div className="max-w-sm text-center">
                    <p className="text-[#F0EDE6]/60 font-mono text-sm uppercase tracking-widest leading-loose">
                        We wander through concepts, discarding the obvious, searching for the profound.
                    </p>
                 </div>
                 <div className="mt-32">
                    <PosterImage 
                        imageUrl="https://picsum.photos/seed/explore2/350/400"
                        width="350px"
                        height="400px"
                        label="Discovery"
                        title="Finding Form"
                    />
                 </div>
            </div>

            {/* Panel 4: Large Text + Background Image (100vw) */}
            <div className="w-[100vw] min-w-[100vw] h-full flex-shrink-0 flex items-center justify-center relative px-8 md:px-24">
                <div className="absolute inset-0 opacity-20">
                    <OptimizedImage src="https://picsum.photos/seed/chaos/1920/1080" alt="Background" className="w-full h-full object-cover grayscale" />
                </div>
                <div className="relative z-10 max-w-4xl text-center">
                    <h3 className="text-5xl md:text-7xl font-sans font-bold text-[#F0EDE6] uppercase tracking-tighter leading-none mb-8">
                        Embrace the <span className="text-[#CCFF00] italic font-serif">Chaos</span>
                    </h3>
                    <p className="text-xl md:text-2xl text-[#F0EDE6]/80 font-light">
                        The process is rarely linear. It's a messy, beautiful collision of colors, shapes, and constraints.
                    </p>
                </div>
            </div>

            {/* Panel 5: Three Images (100vw) */}
            <div className="w-[100vw] min-w-[100vw] h-full flex-shrink-0 flex items-center justify-center relative gap-8 px-8 md:px-24">
                <div className="mt-20">
                    <PosterImage 
                        imageUrl="https://picsum.photos/seed/process1/250/350"
                        width="250px"
                        height="350px"
                        label="Iteration 1"
                        title="Drafting"
                    />
                </div>
                <div className="-mt-10">
                    <PosterImage 
                        imageUrl="https://picsum.photos/seed/process2/300/450"
                        width="300px"
                        height="450px"
                        label="Iteration 2"
                        title="Refining"
                    />
                </div>
                <div className="mt-40">
                    <PosterImage 
                        imageUrl="https://picsum.photos/seed/process3/250/350"
                        width="250px"
                        height="350px"
                        label="Iteration 3"
                        title="Polishing"
                    />
                </div>
            </div>

            {/* Panel 6: Text + Image (100vw) */}
            <div className="w-[100vw] min-w-[100vw] h-full flex-shrink-0 flex items-center justify-center relative px-8 md:px-24 gap-16">
                <div className="flex-1 flex justify-end">
                    <PosterImage 
                        imageUrl="https://picsum.photos/seed/clarity/450/600"
                        width="450px"
                        height="600px"
                        label="Clarity"
                        title="The Breakthrough"
                    />
                </div>
                <div className="flex-1 max-w-lg">
                    <h3 className="text-4xl md:text-6xl font-serif italic text-[#CCFF00] mb-6">Until it clicks.</h3>
                    <p className="text-[#F0EDE6]/80 font-sans text-lg md:text-xl leading-relaxed">
                        Suddenly, the noise fades. The elements align. What was once a chaotic jumble of ideas transforms into a singular, cohesive vision.
                    </p>
                </div>
            </div>

            {/* Panel 7: Single Oversized Photo (100vw) */}
            <div className="w-[100vw] min-w-[100vw] h-full flex-shrink-0 flex items-center justify-center relative px-8 md:px-24">
                <div className="text-center flex flex-col items-center">
                    <p className="text-[#CCFF00] font-mono text-sm uppercase tracking-[0.3em] mb-12">The Final Form</p>
                    <PosterImage 
                        imageUrl="https://picsum.photos/seed/masterpiece/600/750"
                        width="600px"
                        height="750px"
                        label="Masterpiece"
                        title="Future Vision"
                    />
                </div>
            </div>

            {/* Panel 8: Final Text + Call to Action (100vw) */}
            <div className="w-[100vw] min-w-[100vw] h-full flex-shrink-0 flex flex-col items-center justify-center relative px-8 md:px-24 text-center">
                <h2 className="text-5xl md:text-8xl font-sans font-bold text-[#F0EDE6] tracking-tighter mb-8">
                    YOUR TURN TO <span className="text-[#CCFF00] italic font-serif">CREATE</span>
                </h2>
                <p className="text-xl text-[#F0EDE6]/60 max-w-2xl mb-12">
                    Join a community of visionaries. Share your process, discover new perspectives, and redefine what's possible.
                </p>
                <button 
                    onClick={() => {
                        const evt = new CustomEvent('open-login');
                        window.dispatchEvent(evt);
                    }}
                    className="px-8 py-4 bg-[#CCFF00] text-[#2C3B2D] font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors duration-300 flex items-center gap-3"
                >
                    Start Creating <ArrowUpRight size={18} />
                </button>
            </div>
        </div>

        {/* Progress Indicator */}
        <div className="absolute bottom-0 left-0 h-1 bg-[#CCFF00] transition-all duration-100 ease-out z-50" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
};

// Sub-component for Image Logic
const PosterImage: React.FC<{ imageUrl: string, width: string, height: string, label: string, title: string }> = ({ imageUrl, width, height, label, title }) => {
  const navigate = useNavigate();
  
  return (
    <div 
        style={{ width, height }} 
        onClick={() => navigate('/login')}
        className="relative group cursor-pointer flex-shrink-0 bg-white/10 backdrop-blur-sm border border-white/5"
    >
      {/* Label */}
      <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#F0EDE6]">{label}</span>
      </div>

      {/* Image Container */}
      <div className="w-full h-full overflow-hidden relative transition-all duration-500 ease-out transform group-hover:scale-[1.04] group-hover:shadow-[0_0_30px_rgba(204,255,0,0.2)]">
        {/* Border Effect */}
        <div className="absolute inset-0 border border-transparent group-hover:border-[#CCFF00] z-20 transition-colors duration-300 pointer-events-none" />
        
        {/* Image - Grayscale 100% default, 0% on hover */}
        <OptimizedImage 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover grayscale-[100%] group-hover:grayscale-0 transition-all duration-700 block"
          containerClassName="w-full h-full"
        />

        {/* Overlay Info */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
        
        {/* View Button (Fades in) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
            <div className="px-4 py-2 bg-[#CCFF00] text-[#2C3B2D] font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                View <ArrowUpRight size={14} />
            </div>
        </div>
      </div>
      
      {/* Caption - Below Image */}
      <div className="absolute -bottom-8 left-0 w-full text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[rgba(245,240,220,0.5)]">{title}</p>
      </div>
    </div>
  );
};
