'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface CTASectionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

export function CTASection({ 
  title = 'Create Your First Agent',
  description = 'Join the AI revolution. Mint your unique AI agent today.',
  buttonText = 'Get Started',
  buttonLink = '/create'
}: CTASectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.cta-content', 
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 90%' }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[900px] mx-auto">
        <div className="cta-content relative bg-gradient-to-br from-emerald-500/10 to-lime-500/5 backdrop-blur-xl rounded-3xl p-10 md:p-14 border border-emerald-500/15 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-[80px] -z-10" />
          
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            {description}
          </p>
          <Link
            href={buttonLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-black font-semibold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-emerald-500/25"
          >
            {buttonText}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
