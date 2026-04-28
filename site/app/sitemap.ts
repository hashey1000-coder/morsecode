import type { MetadataRoute } from 'next';
import { getAllPages, getAllPosts } from '@/lib/content';
import { toIsoDate } from '@/lib/html';
import { NOINDEX, SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  if (NOINDEX) return [];

  const now = new Date();
  const standalonePages = [
    { slug: 'morse-code-audio-translator', lastModified: new Date('2026-04-25T10:00:00.000Z'), priority: 0.8 },
  ];
  const safeDate = (s?: string): Date => {
    const iso = toIsoDate(s);
    if (!iso) return now;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? now : d;
  };
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
  ];
  for (const page of standalonePages) {
    entries.push({
      url: `${SITE_URL}/${page.slug}/`,
      lastModified: page.lastModified,
      changeFrequency: 'monthly',
      priority: page.priority,
    });
  }
  for (const p of getAllPages()) {
    if (p.slug === 'home') continue;
    if (standalonePages.some((page) => page.slug === p.slug)) continue;
    entries.push({
      url: `${SITE_URL}/${p.slug}/`,
      lastModified: safeDate(p.modified || p.date),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }
  for (const p of getAllPosts()) {
    entries.push({
      url: `${SITE_URL}/${p.slug}/`,
      lastModified: safeDate(p.modified || p.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }
  return entries;
}
