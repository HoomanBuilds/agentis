'use client';

import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  delay?: number;
  duration?: number;
  stagger?: number;
  staggerChildren?: boolean;
}

const animationConfigs = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeInUp: {
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    from: { opacity: 0, x: -40 },
    to: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    from: { opacity: 0, x: 40 },
    to: { opacity: 1, x: 0 },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  },
};

export function AnimatedSection({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.8,
  stagger = 0.1,
  staggerChildren = false,
}: AnimatedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const config = animationConfigs[animation];
    
    const ctx = gsap.context(() => {
      if (staggerChildren) {
        gsap.fromTo(
          element.children,
          config.from,
          {
            ...config.to,
            duration,
            delay,
            stagger,
            ease: 'power3.out',
          }
        );
      } else {
        gsap.fromTo(
          element,
          config.from,
          {
            ...config.to,
            duration,
            delay,
            ease: 'power3.out',
          }
        );
      }
    }, element);

    return () => ctx.revert();
  }, [animation, delay, duration, stagger, staggerChildren]);

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
}
