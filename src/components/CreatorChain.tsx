import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, ArrowRight } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { ContourBackground } from './ui/ContourBackground';
import { OptimizedImage } from './ui/OptimizedImage';

interface CreatorCardProps {
  user: User;
  isFollowing: boolean;
  onFollow: (e: React.MouseEvent) => void;
  posterImageUrl?: string;
}

const CreatorCard: React.FC<CreatorCardProps> = ({ user, isFollowing, onFollow, posterImageUrl }) => {
    const navigate = useNavigate();
    
    return (
        <div 
            onClick={() => navigate(`/profile/${user.id}`)}
            className="group relative w-full aspect-[3/4] overflow-hidden cursor-pointer bg-olive-dark border border-cream/10 hover:border-neon-lime transition-all duration-300"
        >
            {/* Image */}
            <OptimizedImage 
                src={posterImageUrl || user.avatar} 
                alt={user.username || 'unknown'} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-60 group-hover:opacity-100"
                containerClassName="w-full h-full"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-olive-dark via-olive-dark/40 to-transparent group-hover:from-olive-dark/80 group-hover:via-transparent transition-colors duration-300" />
            
            {/* Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cream/20 group-hover:border-neon-lime transition-colors">
                        <OptimizedImage src={user.avatar} alt={user.username} className="w-full h-full object-cover" containerClassName="w-full h-full" />
                    </div>
                    <button 
                        onClick={onFollow}
                        className={`w-8 h-8 flex items-center justify-center border transition-all duration-300 ${
                            isFollowing 
                            ? 'bg-neon-lime text-olive-dark border-neon-lime' 
                            : 'bg-transparent text-cream border-cream/20 hover:bg-neon-lime hover:text-olive-dark hover:border-neon-lime'
                        }`}
                    >
                        {isFollowing ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                </div>

                <div>
                    <h3 className="font-display font-bold text-cream text-2xl uppercase leading-none mb-1 mix-blend-difference">{user.name || 'Unknown'}</h3>
                    <p className="font-mono text-xs text-neon-lime uppercase tracking-widest">@{user.username || 'unknown'}</p>
                </div>
            </div>
        </div>
    );
};

const MarqueeColumn = ({ creators, duration, direction = 'up' }: { creators: { user: User, posterImageUrl: string }[], duration: number, direction?: 'up' | 'down' }) => {
    const { isFollowing, toggleFollow, user } = useGlobalContext();
    const list = useMemo(() => [...creators, ...creators, ...creators], [creators]);

    return (
        <div className="relative w-64 md:w-80 flex-shrink-0">
            <motion.div
                initial={{ y: direction === 'up' ? 0 : -1000 }}
                animate={{ y: direction === 'up' ? -1000 : 0 }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop"
                }}
                className="flex flex-col gap-6"
            >
                {list.map((creator, idx) => {
                    const isMe = user?.id === creator.user.id;
                    const isFollowingUser = isFollowing(creator.user.id);
                    const showTick = isMe || isFollowingUser;

                    return (
                        <CreatorCard 
                            key={`${creator.user.id}-${idx}-${direction}`} 
                            user={creator.user} 
                            posterImageUrl={creator.posterImageUrl}
                            isFollowing={showTick}
                            onFollow={(e) => {
                                e.stopPropagation();
                                if (!isMe) {
                                    toggleFollow(creator.user.id);
                                }
                            }}
                        />
                    );
                })}
            </motion.div>
        </div>
    );
};

export const CreatorChain: React.FC = () => {
  const { getAllPosters } = useGlobalContext();
  const navigate = useNavigate();
  
  const uniqueCreators = useMemo(() => {
    const posters = getAllPosters();
    const creatorsMap = new Map<string, { user: User, posterImageUrl: string }>();
    
    posters.forEach(p => {
        if (p.creator && !creatorsMap.has(p.creatorId)) {
            creatorsMap.set(p.creatorId, { user: p.creator, posterImageUrl: p.imageUrl });
        }
    });
    
    return Array.from(creatorsMap.values()).slice(0, 15);
  }, [getAllPosters]);

  if (uniqueCreators.length === 0) return null;

  const chunk1 = uniqueCreators.slice(0, 5);
  const chunk2 = uniqueCreators.slice(5, 10);
  const chunk3 = uniqueCreators.slice(10, 15);

  return (
    <section className="relative py-32 bg-olive-dark overflow-hidden min-h-screen flex flex-col items-center">
        <ContourBackground />

        {/* Header */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 mb-20 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <div className="inline-flex items-center gap-2 mb-6">
                    <span className="w-2 h-2 bg-neon-lime animate-pulse"></span>
                    <span className="font-mono text-neon-lime text-xs uppercase tracking-[0.2em]">The Collective</span>
                </div>
                <h2 className="text-6xl md:text-9xl font-display font-black text-cream uppercase leading-[0.8] tracking-tighter mb-8">
                    Visual<br/>Vanguard
                </h2>
                <p className="text-xl text-cream/60 font-serif italic max-w-2xl mx-auto">
                    "We are the architects of the new digital aesthetic. Join the movement."
                </p>
            </motion.div>
        </div>
        
        {/* Marquee Columns */}
        <div className="relative w-full h-[800px] overflow-hidden flex justify-center gap-6 md:gap-12 transform -skew-y-3 scale-110">
            <div className="hidden md:block pt-20">
                <MarqueeColumn creators={chunk1.length ? chunk1 : uniqueCreators} duration={60} direction="up" />
            </div>
            
            <div className="z-10 shadow-2xl shadow-black/50">
                <MarqueeColumn creators={chunk2.length ? chunk2 : uniqueCreators} duration={45} direction="down" />
            </div>

            <div className="hidden md:block pt-40">
                <MarqueeColumn creators={chunk3.length ? chunk3 : uniqueCreators} duration={70} direction="up" />
            </div>
            
            {/* Gradients */}
            <div className="absolute top-0 left-0 right-0 h-60 bg-gradient-to-b from-olive-dark to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-olive-dark to-transparent z-20 pointer-events-none" />
        </div>

        {/* CTA */}
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="relative z-20 mt-[-100px]"
        >
            <button 
                onClick={() => navigate('/explore')}
                className="group px-12 py-6 bg-neon-lime text-olive-dark font-black text-xl uppercase tracking-widest hover:bg-cream hover:text-olive-dark transition-all shadow-[0_0_50px_rgba(204,255,0,0.3)] flex items-center gap-4"
            >
                Join The Archive
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
        </motion.div>
    </section>
  );
};
