import Link from 'next/link';
import type { ReactNode } from 'react';
import { LOGO_URL } from '@/lib/site';

const FOOTER_LINKS = [
  { label: 'Morse Code Translator', href: '/' },
  { label: 'Blogs', href: '/blogs/' },
  { label: 'Contact us', href: '/contact-us/' },
  { label: 'About Us', href: '/about-us/' },
  { label: 'Terms and Conditions', href: '/terms-and-conditions/' },
  { label: 'Disclaimer', href: '/disclaimer/' },
  { label: 'Privacy Policy', href: '/privacy-policy/' },
];

const SOCIAL: Array<{ label: string; href: string; icon: ReactNode }> = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/morsecodetranslators/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.78v-2.91h2.52V9.86c0-2.49 1.49-3.87 3.77-3.87 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.62.77-1.62 1.56v1.87h2.76l-.44 2.91h-2.32V22c4.78-.75 8.44-4.91 8.44-9.93z"/></svg>
    ),
  },
  {
    label: 'Reddit',
    href: 'https://www.reddit.com/user/MorseCodeTranslator1/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22 12.14a2.13 2.13 0 0 0-3.6-1.55c-1.42-.95-3.34-1.55-5.45-1.62l1.1-3.46 2.97.7a1.7 1.7 0 1 0 .17-.96l-3.34-.78a.5.5 0 0 0-.59.34l-1.27 4c-2.16.05-4.13.65-5.59 1.62A2.13 2.13 0 1 0 3.93 14a4 4 0 0 0-.06.7c0 3.34 3.65 6.04 8.13 6.04s8.13-2.7 8.13-6.04c0-.24-.02-.47-.06-.7A2.14 2.14 0 0 0 22 12.14zM7 14a1.4 1.4 0 1 1 2.8 0 1.4 1.4 0 0 1-2.8 0zm8.36 3.78c-1.05 1.05-3.07 1.13-3.66 1.13-.59 0-2.61-.08-3.66-1.13a.4.4 0 1 1 .56-.56c.66.66 2.08.9 3.1.9 1.02 0 2.44-.24 3.1-.9a.4.4 0 1 1 .56.56zM14.6 15.4a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z"/></svg>
    ),
  },
  {
    label: 'Quora',
    href: 'https://www.quora.com/profile/Morse-Code-Translator-6',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.74 18.05c-.45-.89-.97-1.78-2.07-1.78-.21 0-.42.04-.6.12l-.36-.7c.43-.36 1.32-.97 2.7-.97 2.16 0 3.27 1.04 4.16 2.34.55-1.13.82-2.62.82-4.31 0-4.21-1.32-6.36-4.39-6.36-3.05 0-4.37 2.15-4.37 6.36 0 4.19 1.32 6.34 4.37 6.34.6 0 1.16-.08 1.66-.24l-.92-.8zM12.99 22c-5.18 0-8.99-4.13-8.99-9.25S7.81 3.5 12.99 3.5c5.26 0 9.01 4.13 9.01 9.25 0 2.85-1.16 5.34-3 7.01.59.89 1.21 1.49 2.08 1.49.95 0 1.34-.74 1.4-1.31h.95c.06.74-.31 4.06-4.55 4.06-2.57 0-3.92-1.49-4.99-3.05-.31.04-.63.06-.94.06z"/></svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 bg-brand-deep text-ink-300 overflow-hidden">
      {/* gradient top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
      <div className="absolute inset-0 -z-0 opacity-[0.07] pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-light/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-5 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-glow ring-1 ring-white/20">
              <img src={LOGO_URL} alt="Morse Code Logo" width="28" height="28" decoding="async" className="h-7 w-7 object-contain" />
            </span>
            <span className="font-display font-extrabold text-lg text-white">Morse Code Translator</span>
          </div>
          <p className="text-sm text-ink-300/90 leading-relaxed max-w-md">
            Translate messages instantly with precision. Bringing historic Morse code into modern
            digital communication with accuracy, speed, and engineering-driven reliability.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-ink-300 hover:text-white hover:bg-brand-gradient hover:border-transparent transition"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-white font-display font-bold mb-4 text-sm uppercase tracking-[0.18em]">Quick Links</h3>
          <ul className="space-y-2.5 text-sm">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex items-center gap-2 text-ink-300 hover:text-white transition group">
                  <span className="h-px w-3 bg-ink-300/40 group-hover:w-5 group-hover:bg-brand transition-all" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-white font-display font-bold mb-4 text-sm uppercase tracking-[0.18em]">Try It Out</h3>
          <p className="text-sm text-ink-300/90 leading-relaxed mb-4">
            Encode your name, send <code className="font-mono text-brand-accent">... --- ...</code>, or
            decode a message — all in one click.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:brightness-110 transition"
          >
            Open Translator →
          </Link>
        </div>
      </div>
      <div className="relative border-t border-white/10 py-5 text-center text-xs text-ink-300/70">
        © {new Date().getFullYear()} morse-codetranslator · Made with{' '}
        <span className="text-brand-accent font-mono">. .-.. --- ...- .</span> for Morse enthusiasts.
      </div>
    </footer>
  );
}
