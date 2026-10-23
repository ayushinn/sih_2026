import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface CustomCursorProps {
  reducedMotion?: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ reducedMotion }) => {
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === 'undefined') return;

    // Do not enable on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const ring = cursorRingRef.current;
    const dot = cursorDotRef.current;
    if (!ring || !dot) return;

    // Set initial offscreen
    gsap.set([ring, dot], { xPercent: -50, yPercent: -50, opacity: 0 });

    const xToRing = gsap.quickTo(ring, 'x', { duration: 0.28, ease: 'power2.out' });
    const yToRing = gsap.quickTo(ring, 'y', { duration: 0.28, ease: 'power2.out' });
    const xToDot = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power1.out' });
    const yToDot = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power1.out' });

    let isVisible = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) {
        gsap.to([ring, dot], { opacity: 1, duration: 0.2 });
        isVisible = true;
      }
      xToRing(e.clientX);
      yToRing(e.clientY);
      xToDot(e.clientX);
      yToDot(e.clientY);
    };

    const onMouseLeave = () => {
      gsap.to([ring, dot], { opacity: 0, duration: 0.2 });
      isVisible = false;
    };

    // Interactive target detection
    const onMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'a, button, [role="button"], [role="tab"], input, select, textarea, [data-cursor="pointer"]'
      );
      if (target) {
        gsap.to(ring, {
          scale: 2.2,
          backgroundColor: 'rgba(99, 152, 224, 0.2)',
          borderColor: 'rgba(99, 152, 224, 0.8)',
          duration: 0.25,
          ease: 'power2.out',
        });
        gsap.to(dot, { scale: 0, duration: 0.2 });
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'a, button, [role="button"], [role="tab"], input, select, textarea, [data-cursor="pointer"]'
      );
      if (target) {
        gsap.to(ring, {
          scale: 1,
          backgroundColor: 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.45)',
          duration: 0.25,
          ease: 'power2.out',
        });
        gsap.to(dot, { scale: 1, duration: 0.2 });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <>
      {/* Outer Follower Ring */}
      <div
        ref={cursorRingRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-9 h-9 rounded-full border border-white/45 pointer-events-none z-[9999] transition-transform hidden sm:block backdrop-blur-[0.5px]"
        style={{ willChange: 'transform' }}
      />
      {/* Inner Dot */}
      <div
        ref={cursorDotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-brand-soft pointer-events-none z-[9999] hidden sm:block shadow-[0_0_8px_#6398E0]"
        style={{ willChange: 'transform' }}
      />
    </>
  );
};
