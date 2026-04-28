import pagesData from '@/content/pages.json';
import postsData from '@/content/posts.json';
import menusData from '@/content/menus.json';

export type SeoMeta = {
  title: string;
  description: string;
  focus_keyword: string;
  canonical: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  schema: string;
};

export type ContentEntry = {
  id: string;
  type: 'page' | 'post';
  title: string;
  slug: string;
  link: string;
  date: string;
  modified: string;
  pubDate: string;
  html: string;
  excerpt: string;
  featuredImage: string | null;
  seo: SeoMeta;
};

export type MenuItem = {
  title: string;
  url: string;
  object: string;
  object_id: string;
  menu_item_parent: string;
  position: number;
};

const pages = pagesData as ContentEntry[];
const posts = postsData as ContentEntry[];
const menus = menusData as MenuItem[];

export function getAllPages(): ContentEntry[] {
  return pages;
}
export function getAllPosts(): ContentEntry[] {
  return posts;
}
export function getMenu(): MenuItem[] {
  return menus;
}

export function getPageBySlug(slug: string): ContentEntry | undefined {
  return pages.find((p) => p.slug === slug);
}
export function getPostBySlug(slug: string): ContentEntry | undefined {
  return posts.find((p) => p.slug === slug);
}

/** All slugs (pages + posts) excluding home which lives at "/" */
export function getAllRoutableSlugs(): string[] {
  return [
    ...pages.filter((p) => p.slug !== 'home').map((p) => p.slug),
    ...posts.map((p) => p.slug),
  ];
}

export function getEntryBySlug(slug: string): ContentEntry | undefined {
  return getPageBySlug(slug) || getPostBySlug(slug);
}

/**
 * Returns posts ordered chronologically (oldest → newest), matching the order
 * the live site uses for prev/next navigation links.
 */
export function getPostsChronological(): ContentEntry[] {
  const stripCdata = (s: string): string => {
    const m = s.match(/<!\[CDATA\[(.*?)\]\]>/s);
    return (m ? m[1] : s).trim();
  };
  return [...posts].sort((a, b) => stripCdata(a.date).localeCompare(stripCdata(b.date)));
}

export function getAdjacentPosts(slug: string): {
  previous?: ContentEntry;
  next?: ContentEntry;
} {
  const ordered = getPostsChronological();
  const idx = ordered.findIndex((p) => p.slug === slug);
  if (idx === -1) return {};
  return {
    previous: idx > 0 ? ordered[idx - 1] : undefined,
    next: idx < ordered.length - 1 ? ordered[idx + 1] : undefined,
  };
}
