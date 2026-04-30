import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MorseImageTranslator from '@/components/MorseImageTranslator';
import WpContent from '@/components/WpContent';
import { AD_UNIT_IDS } from '@/lib/ads';
import { getAdjacentPosts, getAllRoutableSlugs, getEntryBySlug } from '@/lib/content';
import { buildMetadata, isArticleLikeEntry } from '@/lib/metadata';
import { buildEntryYoastGraph } from '@/lib/schema';
import { SITE_NAME, SITE_URL, toAbsoluteUrl } from '@/lib/site';
import { clean, toIsoDate } from '@/lib/html';

type Params = { slug: string };

function stripImageTranslatorEmbed(html: string): string {
  return html
    .replace(/<!--\s*=+[\s\S]*?<\/style>/i, '')
    .replace(/<link rel="preconnect"[\s\S]*?<\/style>/i, '');
}

function stripFirstH1(html: string): string {
  return html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, '');
}

export function generateStaticParams(): Params[] {
  return getAllRoutableSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) return {};
  return buildMetadata(entry, `/${entry.slug}/`);
}

export default async function DynamicPage(
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) {
    notFound();
    return null;
  }

  const pageHtml = slug === 'morse-code-image-translator'
    ? stripFirstH1(stripImageTranslatorEmbed(entry.html))
    : entry.html;

  const yoastGraph = buildEntryYoastGraph(entry, `/${entry.slug}/`, {
    breadcrumbs: [
      { name: 'Home', item: SITE_URL },
      ...(entry.type === 'post' ? [{ name: 'Blogs', item: `${SITE_URL}/blogs/` }] : []),
      { name: entry.title, item: `${SITE_URL}/${entry.slug}/` },
    ],
  });
  const maxLazyRepeaters = entry.type === 'post' || isArticleLikeEntry(entry) ? 8 : 6;

  return (
    <article className={`py-10 ${entry.type === 'post' ? 'is-post-page' : 'is-page-entry'}`}>
      {/* Breadcrumb — left-aligned, matches page max-width */}
      <nav className="max-w-6xl mx-auto px-5 text-xs text-ink-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur border border-ink-300/40 hover:bg-white text-ink-700 hover:text-brand-dark transition font-semibold">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10"/></svg>
          Home
        </Link>
        <span className="text-ink-300">›</span>
        {entry.type === 'post' && (
          <>
            <Link href="/blogs/" className="px-2.5 py-1 rounded-full bg-white/70 backdrop-blur border border-ink-300/40 hover:bg-white text-ink-700 hover:text-brand-dark transition font-semibold">Blogs</Link>
            <span className="text-ink-300">›</span>
          </>
        )}
        <span className="text-ink-900 font-bold truncate max-w-xs">{entry.title}</span>
      </nav>

      {slug === 'morse-code-image-translator' && (
        <section className="max-w-6xl mx-auto px-5 mb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-ink-950 mb-6">{entry.title}</h1>
          <p className="text-base sm:text-lg text-ink-700 max-w-3xl mb-6">Upload a clear Morse image below to decode the symbols into text directly in your browser.</p>
          <MorseImageTranslator />
        </section>
      )}

      <div id={AD_UNIT_IDS.inContentLazy} />

      <WpContent html={pageHtml} withInContentAds maxLazyRepeaters={maxLazyRepeaters} />

      {entry.type === 'post' && <PostNav slug={entry.slug} />}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(yoastGraph) }} />
    </article>
  );
}

function PostNav({ slug }: { slug: string }) {
  const { previous, next } = getAdjacentPosts(slug);
  if (!previous && !next) return null;
  return (
    <nav
      aria-label="Post navigation"
      className="max-w-6xl mx-auto px-5 mt-12 pt-6 border-t border-gray-200 grid sm:grid-cols-2 gap-4 text-sm"
    >
      {previous ? (
        <Link
          href={`/${previous.slug}/`}
          rel="prev"
          className="group block sm:text-left bg-white/80 backdrop-blur hover:bg-white border border-ink-300/30 ring-1 ring-ink-900/5 rounded-2xl px-5 py-4 transition shadow-soft hover:shadow-glow hover:-translate-y-0.5"
        >
          <span className="block text-[10px] uppercase tracking-[0.18em] font-bold text-brand">← Previous</span>
          <span className="block font-display font-bold text-ink-900 mt-1 group-hover:text-brand transition">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/${next.slug}/`}
          rel="next"
          className="group block sm:text-right bg-white/80 backdrop-blur hover:bg-white border border-ink-300/30 ring-1 ring-ink-900/5 rounded-2xl px-5 py-4 transition shadow-soft hover:shadow-glow hover:-translate-y-0.5"
        >
          <span className="block text-[10px] uppercase tracking-[0.18em] font-bold text-brand">Next →</span>
          <span className="block font-display font-bold text-ink-900 mt-1 group-hover:text-brand transition">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
