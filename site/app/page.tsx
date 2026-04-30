import type { Metadata } from 'next';
import MorseTranslator from '@/components/MorseTranslator';
import WpContent from '@/components/WpContent';
import { AD_UNIT_IDS } from '@/lib/ads';
import { getPageBySlug } from '@/lib/content';
import { buildMetadata } from '@/lib/metadata';
import { buildEntryYoastGraph } from '@/lib/schema';

export function generateMetadata(): Metadata {
  const home = getPageBySlug('home');
  if (!home) return {};
  return buildMetadata(home, '/');
}

export default function HomePage() {
  const home = getPageBySlug('home');

  // FAQPage schema (matches FAQ section in content)
  const faqItems = [
    {
      question: 'How do you say "I love you" in Morse code?',
      answer: '.. / .-.. --- ...- . / -.-- --- ..-',
    },
    {
      question: 'Is there a translator for Morse code?',
      answer: 'Yes, our free Morse Code Translator converts text to Morse and Morse to text instantly with audio playback and visual flashes.',
    },
    {
      question: 'How do you make SOS in Morse code?',
      answer: 'SOS in Morse code is ... --- ... — three dots, three dashes, three dots.',
    },
    {
      question: 'What are dots in Morse code?',
      answer: 'A dot (·) is the shortest unit of Morse code. A dash (—) lasts three times as long as a dot.',
    },
  ];
  const yoastGraph = home ? buildEntryYoastGraph(home, '/', { faqItems }) : null;

  return (
    <>
      <section className="relative overflow-hidden">
        {/* hero background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_120%_70%_at_50%_-10%,rgba(139,92,246,0.18),transparent_60%),radial-gradient(ellipse_80%_60%_at_90%_30%,rgba(34,211,238,0.18),transparent_60%),linear-gradient(180deg,#f4f6fb_0%,#eaf0fb_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.06] pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,#0b1437_1px,transparent_0)] [background-size:22px_22px]" />

        <div className="max-w-6xl mx-auto px-4 pt-12 pb-10 md:pt-16 md:pb-12">
          <div className="text-center mb-8 md:mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-300/50 bg-white/70 backdrop-blur px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-dark shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              Free · Fast · Accurate
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-extrabold tracking-tight text-ink-900 leading-[1.05]">
              The Best{' '}
              <span className="bg-brand-gradient bg-clip-text text-transparent">Morse Code Translator</span>
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg text-ink-700 leading-relaxed">
              Convert text to Morse code and back instantly — with audio playback, light flashes,
              adjustable speed, and one-click MP3 export.
            </p>
          </div>
          <MorseTranslator />
          <div id={AD_UNIT_IDS.inContentLazy} />
        </div>
      </section>

      {home && <WpContent html={home.html} withInContentAds maxLazyRepeaters={100} />}

      {yoastGraph && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(yoastGraph) }}
        />
      )}
    </>
  );
}
