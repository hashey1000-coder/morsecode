import type { Metadata } from 'next';
import Link from 'next/link';
import { AD_UNIT_IDS } from '@/lib/ads';
import { getAllPosts } from '@/lib/content';
import { buildExcerpt } from '@/lib/html';
import { buildRobotsContent, estimateReadingTime } from '@/lib/metadata';
import { buildYoastGraph } from '@/lib/schema';
import { NOINDEX, SITE_NAME, SITE_URL, localizeUploadUrl } from '@/lib/site';

const BLOGS_TITLE = 'Blogs - Morse';
const BLOGS_DESCRIPTION =
  'Browse all Morse Code articles, guides, and translations on Morse-CodeTranslator.com.';

export const metadata: Metadata = {
  title: BLOGS_TITLE,
  description: BLOGS_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blogs/` },
  openGraph: {
    title: BLOGS_TITLE,
    description: BLOGS_DESCRIPTION,
    url: `${SITE_URL}/blogs/`,
    siteName: 'Morse',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: BLOGS_TITLE,
    description: BLOGS_DESCRIPTION,
  },
  other: {
    robots: buildRobotsContent(undefined, { index: false, follow: !NOINDEX }),
    'twitter:label1': 'Time to read',
    'twitter:data1': `${estimateReadingTime(BLOGS_DESCRIPTION)} minute${estimateReadingTime(BLOGS_DESCRIPTION) === 1 ? '' : 's'}`,
  },
};

export default function BlogsIndexPage() {
  const posts = getAllPosts();
  const featuredPosts = posts.slice(0, 6);
  const remainingPosts = posts.slice(6);
  const yoastGraph = buildYoastGraph({
    url: `${SITE_URL}/blogs/`,
    title: BLOGS_TITLE,
    description: BLOGS_DESCRIPTION,
    breadcrumbs: [
      { name: 'Home', item: SITE_URL },
      { name: 'Blogs', item: `${SITE_URL}/blogs/` },
    ],
  });

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-300/50 bg-white/70 backdrop-blur px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-dark shadow-sm">
            Library
          </span>
          <h1 className="mt-4 font-display text-4xl md:text-5xl font-extrabold tracking-tight text-ink-900">
            All <span className="bg-brand-gradient bg-clip-text text-transparent">Blogs</span>
          </h1>
          <p className="mt-3 text-ink-700 max-w-xl mx-auto">
            Articles, guides, and translations covering everything Morse code.
          </p>
        </div>
        <div id={AD_UNIT_IDS.inContentLazy} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPosts.map((p) => (
            <Link
              key={p.slug}
              href={`/${p.slug}/`}
              className="group block bg-white rounded-2xl border border-ink-300/30 ring-1 ring-ink-900/5 overflow-hidden shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-200"
            >
              {p.featuredImage && (
                <div className="relative overflow-hidden aspect-[16/10] bg-brand-gradient-soft">
                  <img
                    src={localizeUploadUrl(p.featuredImage)}
                    alt={p.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 via-transparent to-transparent opacity-60" />
                </div>
              )}
              <div className="p-5">
                <h2 className="font-display font-bold text-lg text-ink-900 group-hover:text-brand transition leading-snug">{p.title}</h2>
                <p className="text-sm text-ink-700 mt-2 line-clamp-3 leading-relaxed">
                  {(p.excerpt && p.excerpt.replace(/<[^>]+>/g, '').trim()) || buildExcerpt(p.html, 140)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand group-hover:gap-2 transition-all">
                  Read More <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
        {remainingPosts.length > 0 && (
          <>
            <div className="lazy" parent-unit={AD_UNIT_IDS.inContentLazy} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${p.slug}/`}
                  className="group block bg-white rounded-2xl border border-ink-300/30 ring-1 ring-ink-900/5 overflow-hidden shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-200"
                >
                  {p.featuredImage && (
                    <div className="relative overflow-hidden aspect-[16/10] bg-brand-gradient-soft">
                      <img
                        src={localizeUploadUrl(p.featuredImage)}
                        alt={p.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 via-transparent to-transparent opacity-60" />
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="font-display font-bold text-lg text-ink-900 group-hover:text-brand transition leading-snug">{p.title}</h2>
                    <p className="text-sm text-ink-700 mt-2 line-clamp-3 leading-relaxed">
                      {(p.excerpt && p.excerpt.replace(/<[^>]+>/g, '').trim()) || buildExcerpt(p.html, 140)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand group-hover:gap-2 transition-all">
                      Read More <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(yoastGraph) }} />
    </>
  );
}
