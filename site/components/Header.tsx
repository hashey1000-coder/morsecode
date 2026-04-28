'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react';
import { LOGO_URL } from '@/lib/site';

type Child = { label: string; href: string };
type NavItem = { label: string; href: string; children?: Child[] };

const NAV: NavItem[] = [
  {
    label: 'Morse Code Translator',
    href: '/',
    children: [
      { label: 'Morse Code Audio Translator', href: '/morse-code-audio-translator/' },
      { label: 'Morse Code Image Translator', href: '/morse-code-image-translator/' },
    ],
  },
  { label: 'Numbers', href: '/morse-code-numbers/' },
  { label: 'Letters', href: '/morse-code-letters/' },
  {
    label: 'Words',
    href: '/morse-code-words/',
    children: [
      { label: 'SOS in Morse Code', href: '/sos-in-morse-code/' },
      { label: 'Hi in Morse Code', href: '/hi-in-morse-code/' },
      { label: 'Hello in Morse Code', href: '/hello-in-morse-code/' },
      { label: 'Help Me in Morse Code', href: '/help-me-in-morse-code/' },
      { label: 'I Love You in Morse Code', href: '/i-love-you-in-morse-code/' },
      { label: 'Love in Morse Code', href: '/love-in-morse-code/' },
      { label: 'Help in Morse Code', href: '/help-in-morse-code/' },
      { label: 'Yes in Morse Code', href: '/yes-in-morse-code/' },
      { label: 'No in Morse Code', href: '/no-in-morse-code/' },
    ],
  },
  {
    label: 'Alphabets',
    href: '/morse-code-alphabets/',
    children: [
      { label: 'A in Morse Code', href: '/a-in-morse-code/' },
      { label: 'S in Morse Code', href: '/s-in-morse-code/' },
      { label: 'J in Morse Code', href: '/j-in-morse-code/' },
      { label: 'L in Morse Code', href: '/l-in-morse-code/' },
      { label: 'G in Morse Code', href: '/g-in-morse-code/' },
      { label: 'N in Morse Code', href: '/n-in-morse/' },
      { label: 'Y in Morse Code', href: '/y-in-morse-code/' },
      { label: 'B in Morse Code', href: '/b-in-morse-code/' },
      { label: 'K in Morse Code', href: '/k-in-morse-code/' },
      { label: 'I in Morse Code', href: '/i-in-morse-code/' },
    ],
  },
  {
    label: 'Blogs',
    href: '/blogs/',
    children: [
      { label: 'How Does Morse Code Work', href: '/how-does-morse-code-work/' },
      { label: 'We Used to Live Here in Morse Code', href: '/we-used-to-live-here-in-morse-code/' },
      { label: 'How to Learn Morse Code', href: '/how-to-learn-morse-code/' },
      { label: 'When Was Morse Code Invented', href: '/when-was-morse-code-invented/' },
    ],
  },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
    setOpenSection(null);
  }, [pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  function close() {
    setMenuOpen(false);
    setOpenSection(null);
  }

  function handleMobileLinkClick(href: string) {
    return (event: ReactMouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      close();

      if (href === pathname) {
        return;
      }

      window.requestAnimationFrame(() => {
        window.location.href = href;
      });
    };
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/75 border-b border-white/60 shadow-[0_1px_0_0_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(15,23,42,0.08)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" onClick={close} className="flex min-w-0 items-center gap-3 shrink group">
          <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-glow ring-1 ring-white/40 transition-transform group-hover:scale-105">
            <img
              src={LOGO_URL}
              alt="Morse Code Logo"
              width="28"
              height="28"
              decoding="async"
              className="h-7 w-7 object-contain drop-shadow-sm"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="max-w-[10.75rem] truncate font-display text-sm font-extrabold tracking-tight text-ink-900 sm:max-w-none sm:text-[15px]">Morse Code Translator</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500 md:block">· — · ·  Translate · Learn · Play</span>
          </span>
        </Link>

        {/* Desktop nav with CSS-only hover dropdowns */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-end">
          {NAV.map((n) =>
            n.children ? (
              <div key={n.href} className="relative group">
                <Link
                  href={n.href}
                  className="flex items-center gap-1 px-3 py-2 text-[13px] font-semibold text-ink-700 hover:text-brand-dark hover:bg-white/80 rounded-lg whitespace-nowrap transition"
                >
                  {n.label}
                  <svg className="w-3 h-3 opacity-50 shrink-0 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                <div className="absolute right-0 top-full pt-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50">
                  <div className="bg-white/95 backdrop-blur-xl border border-white/80 ring-1 ring-ink-900/5 rounded-2xl shadow-2xl py-2 min-w-[260px]">
                    <Link href={n.href} className="block px-4 py-2 text-sm font-bold text-brand-dark hover:bg-brand-gradient-soft rounded-lg mx-1">
                      All {n.label} →
                    </Link>
                    <div className="my-1 mx-3 h-px bg-gradient-to-r from-transparent via-ink-300/40 to-transparent" />
                    {n.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="block px-4 py-1.5 text-sm text-ink-700 hover:text-brand-dark hover:bg-brand-gradient-soft rounded-lg mx-1"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-2 text-[13px] font-semibold text-ink-700 hover:text-brand-dark hover:bg-white/80 rounded-lg whitespace-nowrap transition"
              >
                {n.label}
              </Link>
            )
          )}
        </nav>

        {/* Mobile hamburger */}
        <div ref={menuRef} className="lg:hidden relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-xl border border-ink-300/40 bg-white/90 px-3 py-2 text-sm font-semibold text-ink-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12"/></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            )}
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
          </button>

          {menuOpen && (
            <nav className="absolute right-0 top-full mt-3 max-h-[80vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] border border-white/80 bg-white/95 p-2 shadow-2xl ring-1 ring-ink-900/5 backdrop-blur-xl">
              <div className="mb-2 rounded-2xl border border-ink-200/70 bg-brand-gradient-soft px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-dark">Browse the site</p>
                <p className="mt-1 text-sm text-ink-700">Quick links, word guides, and Morse learning resources.</p>
              </div>
              {NAV.map((n) =>
                n.children ? (
                  <div key={n.href} className="rounded-2xl bg-white/70 mb-1 last:mb-0">
                    <button
                      onClick={() => setOpenSection(openSection === n.href ? null : n.href)}
                      className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-ink-800 transition hover:bg-brand-gradient-soft"
                    >
                      <span>{n.label}</span>
                      <svg
                        className={`w-4 h-4 text-ink-500 transition-transform duration-200 ${openSection === n.href ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openSection === n.href && (
                      <div className="mx-3 mb-3 rounded-xl border border-brand/10 bg-brand-gradient-soft px-2 py-2">
                        <a href={n.href} onClick={handleMobileLinkClick(n.href)} className="block rounded-lg px-3 py-2 text-sm font-bold text-brand-dark transition hover:bg-white/80">
                          All {n.label}
                        </a>
                        {n.children.map((c) => (
                          <a key={c.href} href={c.href} onClick={handleMobileLinkClick(c.href)} className="block rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-white/80 hover:text-brand-dark">
                            {c.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <a key={n.href} href={n.href} onClick={handleMobileLinkClick(n.href)} className="mx-1 mb-1 block rounded-xl px-4 py-3 text-sm font-semibold text-ink-800 transition hover:bg-brand-gradient-soft hover:text-brand-dark last:mb-0">
                    {n.label}
                  </a>
                )
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
