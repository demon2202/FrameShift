import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from './ui/OptimizedImage';

export const CollageSection: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const { posters } = useGlobalContext();

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

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const track = trackRef.current;

    if (!wrapper || !track) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = wrapper.getBoundingClientRect();
          const totalScrollable = wrapper.offsetHeight - window.innerHeight;
          const scrolled = -rect.top;
          const progressVal = Math.max(0, Math.min(1, scrolled / totalScrollable));
          const maxShift = track.scrollWidth - window.innerWidth;
          track.style.transform = `translateX(${-progressVal * maxShift}px)`;
          setProgress(progressVal);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const captionStyle: React.CSSProperties = {
    color: '#F2F0E9',
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    opacity: 0.5,
    marginTop: '0.75rem',
  };

  return (
    <div ref={wrapperRef} style={{ height: '400vh', position: 'relative' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          background: '#2C3B2D',
          paddingTop: '80px', // Account for navbar
          boxSizing: 'border-box',
        }}
      >
        {/* Background SVG blob pattern */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            opacity: 0.15,
            pointerEvents: 'none',
          }}
          viewBox="0 0 1440 900"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M200,300 C300,100 600,200 700,400 C800,600 500,800 300,700 C100,600 100,500 200,300Z"
            fill="none"
            stroke="#3d5c3e"
            strokeWidth="1.5"
          />
          <path
            d="M800,100 C1000,50 1300,200 1400,400 C1500,600 1200,750 1000,650 C800,550 600,350 800,100Z"
            fill="none"
            stroke="#3d5c3e"
            strokeWidth="1.5"
          />
          <path
            d="M500,500 C650,400 900,500 950,650 C1000,800 800,900 650,800 C500,700 350,600 500,500Z"
            fill="none"
            stroke="#3d5c3e"
            strokeWidth="1"
          />
        </svg>

        {/* Horizontal track */}
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center', // Center vertically
            height: '100%',
            width: 'max-content',
            willChange: 'transform',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Panel 1 — Quote */}
          <div
            style={{
              minWidth: '100vw',
              height: '100%',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center', // Center horizontally
              padding: '0 8vw',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ maxWidth: '800px', textAlign: 'center', padding: '0 1rem' }}>
                <p
                style={{
                    fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                    letterSpacing: '0.3em',
                    color: '#F2F0E9',
                    marginBottom: 'clamp(1.5rem, 4vw, 3rem)',
                    textTransform: 'uppercase',
                    opacity: 0.6,
                }}
                >
                Trending Now
                </p>
                <h2
                style={{
                    fontSize: 'clamp(1.8rem, 6vw, 5rem)',
                    fontWeight: 300,
                    color: '#F2F0E9',
                    lineHeight: 1.1,
                    margin: 0,
                }}
                >
                The most appreciated
                </h2>
                <h2
                style={{
                    fontSize: 'clamp(1.8rem, 6vw, 5rem)',
                    fontWeight: 400,
                    color: '#CCFF00',
                    fontStyle: 'italic',
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1.1,
                    margin: '0.5rem 0 0 0',
                }}
                >
                artworks of the day.
                </h2>
                <p
                style={{
                    fontSize: 'clamp(1.2rem, 4vw, 2.5rem)',
                    color: '#CCFF00',
                    fontFamily: 'cursive',
                    marginTop: 'clamp(1.5rem, 4vw, 3rem)',
                    marginBottom: '0.5rem',
                }}
                >
                — Community Choice
                </p>
                <p
                style={{
                    fontSize: 'clamp(0.6rem, 2vw, 0.8rem)',
                    letterSpacing: '0.25em',
                    color: '#F2F0E9',
                    opacity: 0.5,
                    textTransform: 'uppercase',
                }}
                >
                Visionary Archive
                </p>
            </div>
          </div>

          {/* Panel 2 — Single tall photo left-aligned */}
          <div
            className="min-w-[100vw] md:min-w-[80vw] h-full shrink-0 flex items-center justify-center px-6 md:px-[4vw] box-border"
          >
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-16 w-full max-w-5xl">
              <OptimizedImage
                src={topPosters[0]?.imageUrl || "https://picsum.photos/seed/picsum/600/800"}
                alt="Panel 2"
                className="w-[80vw] h-[35vh] md:w-[50vh] md:h-[70vh] max-w-[600px] max-h-[800px] object-cover transition-all duration-400 grayscale hover:grayscale-0 hover:scale-105 hover:outline hover:outline-2 hover:outline-neon-lime cursor-pointer block"
                containerClassName="w-[80vw] h-[35vh] md:w-[50vh] md:h-[70vh] max-w-[600px] max-h-[800px] shrink-0"
              />
              <div className="mt-4 md:mt-0 text-left w-full md:w-auto">
                <p style={{...captionStyle, fontSize: '0.8rem'}} className="md:text-[0.9rem]">01 — Top Trending</p>
                <p className="text-[#F2F0E9] opacity-90 text-sm md:text-xl font-mono max-w-[400px] mt-2 md:mt-4 leading-relaxed">
                  {topPosters[0]?.title || "Every great journey starts with a single pixel. The blank canvas is not a void, but a universe waiting to be born."}
                </p>
                {topPosters[0]?.creator && (
                  <p className="text-[#CCFF00] mt-2 md:mt-3 text-xs md:text-sm font-mono">
                    By @{topPosters[0].creator.username}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Panel 3 — Two photos offset */}
          <div
            className="min-w-[100vw] md:min-w-[90vw] h-full shrink-0 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-32 px-6 md:px-[4vw] box-border"
          >
            <div className="md:-mt-[10vh] text-center md:text-left">
              <OptimizedImage
                src={topPosters[1]?.imageUrl || "https://picsum.photos/seed/bali/400/600"}
                alt="Panel 3 Left"
                className="w-[80vw] h-[25vh] md:w-[35vh] md:h-[50vh] object-cover transition-all duration-400 grayscale hover:grayscale-0 hover:scale-105 hover:outline hover:outline-2 hover:outline-neon-lime cursor-pointer block"
                containerClassName="w-[80vw] h-[25vh] md:w-[35vh] md:h-[50vh] shrink-0 mx-auto md:mx-0"
              />
              <div className="mt-4 md:mt-6 text-left w-full md:w-auto">
                <p style={{...captionStyle, fontSize: '0.8rem'}} className="md:text-[0.9rem]">02 — Rising Star</p>
                <p className="text-[#F2F0E9] opacity-90 text-sm md:text-base font-mono max-w-[300px] mt-2 md:mt-3 leading-relaxed">
                  {topPosters[1]?.title || "Through the noise and the chaos, we find our rhythm. A pattern emerges from the static."}
                </p>
                {topPosters[1]?.creator && (
                  <p className="text-[#CCFF00] mt-2 md:mt-3 text-xs md:text-sm font-mono">
                    By @{topPosters[1].creator.username}
                  </p>
                )}
              </div>
            </div>
            <div className="md:mt-[10vh] text-center md:text-left hidden sm:block">
              <OptimizedImage
                src={topPosters[2]?.imageUrl || "https://picsum.photos/seed/city/500/400"}
                alt="Panel 3 Right"
                className="w-[80vw] h-[25vh] md:w-[45vh] md:h-[35vh] object-cover transition-all duration-400 grayscale hover:grayscale-0 hover:scale-105 hover:outline hover:outline-2 hover:outline-neon-lime cursor-pointer block"
                containerClassName="w-[80vw] h-[25vh] md:w-[45vh] md:h-[35vh] shrink-0 mx-auto md:mx-0"
              />
              <div className="mt-4 md:mt-6 text-left w-full md:w-auto">
                <p style={{...captionStyle, fontSize: '0.8rem'}} className="md:text-[0.9rem]">03 — Community Favorite</p>
                <p className="text-[#F2F0E9] opacity-90 text-sm md:text-base font-mono max-w-[350px] mt-2 md:mt-3 leading-relaxed">
                  {topPosters[2]?.title || "We stumble upon beauty in the unexpected. The glitch becomes the feature."}
                </p>
                {topPosters[2]?.creator && (
                  <p className="text-[#CCFF00] mt-2 md:mt-3 text-xs md:text-sm font-mono">
                    By @{topPosters[2].creator.username}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Panel 4 — Big photo right-aligned bottom */}
          <div
            className="min-w-[100vw] h-full shrink-0 flex items-center justify-center px-6 md:px-[8vw] box-border"
          >
            <div className="flex flex-col md:flex-row-reverse items-center gap-4 md:gap-16 w-full max-w-6xl">
              <OptimizedImage
                src={topPosters[3]?.imageUrl || "https://picsum.photos/seed/nature/700/800"}
                alt="Panel 4"
                className="w-[80vw] h-[35vh] md:w-[60vh] md:h-[70vh] object-cover transition-all duration-400 grayscale hover:grayscale-0 hover:scale-105 hover:outline hover:outline-2 hover:outline-neon-lime cursor-pointer block"
                containerClassName="w-[80vw] h-[35vh] md:w-[60vh] md:h-[70vh] shrink-0"
              />
              <div className="mt-4 md:mt-0 text-left md:text-right w-full md:w-auto">
                <p className="text-[#F2F0E9] text-[0.75rem] md:text-[0.9rem] tracking-[0.15em] uppercase opacity-50 mt-2 md:mt-3 md:text-right">
                  04 — Masterpiece
                </p>
                <p className="text-[#F2F0E9] opacity-90 text-sm md:text-2xl font-mono max-w-[500px] mt-2 md:mt-4 leading-relaxed md:ml-auto">
                  {topPosters[3]?.title || "We arrive not at a place, but at a new perspective. The cycle begins anew, but we are changed."}
                </p>
                {topPosters[3]?.creator && (
                  <p className="text-[#CCFF00] mt-2 md:mt-3 text-xs md:text-base font-mono">
                    By @{topPosters[3].creator.username}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: '#CCFF00',
            width: `${progress * 100}%`,
            transition: 'width 0.1s linear',
            zIndex: 10,
          }}
        />
      </div>
    </div>
  );
};
