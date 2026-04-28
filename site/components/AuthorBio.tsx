import { withBasePath } from '@/lib/site';

/**
 * Site-wide author bio block, shown above the footer on every page.
 */

const AUTHOR_IMAGE_URL = withBasePath('/wp-content/uploads/2025/12/Youssef-Hesham-1.webp');

export default function AuthorBio() {
  return (
    <aside aria-label="About the author" className="relative mt-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur border border-white shadow-soft ring-1 ring-ink-900/5 p-8 md:p-10">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-gradient opacity-10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left">
            <div className="shrink-0">
              <div className="relative inline-flex h-24 w-24 md:h-28 md:w-28 overflow-hidden rounded-3xl ring-4 ring-white shadow-[0_20px_40px_-20px_rgba(11,20,55,0.45)] bg-brand-gradient">
                <img
                  src={AUTHOR_IMAGE_URL}
                  alt="Youssef Hesham"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-dark ring-2 ring-white shadow">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9 12l2 2 4-4m5.6-2.6A9 9 0 1121 12a9 9 0 01-3.4 7.6"/></svg>
                </span>
              </div>
            </div>
            <div className="flex-1">
              <span className="inline-block text-[10px] uppercase tracking-[0.22em] font-bold text-brand mb-1">About the Author</span>
              <a
                href="https://www.linkedin.com/in/youssef-hesham-72913a33b/"
                target="_blank"
                rel="noopener noreferrer author"
                className="block font-display font-extrabold text-2xl text-ink-900 hover:text-brand transition"
              >
                Youssef Hesham
              </a>
              <p className="mt-3 text-[15px] text-ink-700 leading-relaxed">
                Electronics &amp; Communications Engineering student specializing in signal
                processing and encoding systems. Creator of Morse-CodeTranslator.com and
                developer of an Arduino-based Automated Morse Code Transmitter — bridging
                technical accuracy with user-friendly translation so modern learners can
                explore Morse code with confidence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
