'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const SHOW_AFTER_PX = 360;

export default function ScrollToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > SHOW_AFTER_PX);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateVisibility);
    };
  }, [pathname]);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to top"
      className={[
        'fixed bottom-6 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full',
        'border border-brand-dark/20 bg-brand text-white shadow-[0_18px_40px_-20px_rgba(139,92,246,0.9)]',
        'transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-dark focus:outline-none',
        'focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-[#f4f6fb]',
        'sm:bottom-8 sm:right-6',
        isVisible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0',
      ].join(' ')}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </svg>
    </button>
  );
}