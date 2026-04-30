import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
  scale?: number;
  rotate?: number;
  skew?: number;
  blur?: number;
  threshold?: number;
  type?: 'tween' | 'spring';
  stiffness?: number;
  damping?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.8,
  distance = 30,
  className = '',
  once = true,
  scale = 1,
  rotate = 0,
  skew = 0,
  blur = 0,
  threshold = 0.1,
  type = 'tween',
  stiffness = 100,
  damping = 20,
}) => {
  const ref = useRef(null);
  // Using a negative margin for threshold as before, but with a more standard range
  const isInView = useInView(ref, { 
    once, 
    margin: `-${threshold * 100}% 0px -${threshold * 100}% 0px` as any 
  });

  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
      case 'left': return { x: distance };
      case 'right': return { x: -distance };
      default: return { x: 0, y: 0 };
    }
  };

  const variants: any = {
    hidden: {
      opacity: 0,
      scale: scale !== 1 ? scale : 1,
      rotate: rotate !== 0 ? rotate : 0,
      skewX: skew !== 0 ? skew : 0,
      filter: blur > 0 ? `blur(${blur}px)` : 'blur(0px)',
      ...getInitialPosition(),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      skewX: 0,
      filter: 'blur(0px)',
      transition: {
        type,
        stiffness,
        damping,
        duration: type === 'tween' ? duration : undefined,
        delay,
        ease: type === 'tween' ? [0.22, 1, 0.36, 1] : undefined,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
};
