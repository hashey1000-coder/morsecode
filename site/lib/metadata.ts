import type { Metadata } from 'next';
import type { ContentEntry } from './content';
import { LOGO_ABSOLUTE_URL, NOINDEX, SITE_NAME, SITE_URL, toAbsoluteUrl } from './site';
import { clean, toIsoDate, toTitleCase } from './html';

const OG_SITE_NAME = 'Morse';

export type ImageMeta = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  type?: string;
};

export function buildMetadata(entry: ContentEntry, path: string): Metadata {
  const seo = entry.seo;
  const rawTitle = entry.slug === 'home'
    ? 'Best Morse Code Translator — Translate · Learn · Play'
    : seo.title || entry.title;
  const title = toTitleCase(rawTitle);
  const description = decodeMetaText(seo.description || stripTags(entry.excerpt)) || undefined;
  const url = `${SITE_URL}${path}`;
  const canonical = clean(seo.canonical) || url;
  const imageMeta = resolveImageMeta(entry);
  const ogImage = toAbsoluteUrl(clean(seo.og_image) || imageMeta.url) || LOGO_ABSOLUTE_URL;
  const twImage = toAbsoluteUrl(clean(seo.twitter_image) || ogImage) || ogImage;
  const keywords = buildKeywords(entry);
  const ogTitle = toTitleCase(clean(seo.og_title) || title);
  const twTitle = toTitleCase(clean(seo.twitter_title) || title);
  const robotsContent = buildRobotsContent(entry);
  const publishedTime = toIsoDate(entry.date) || undefined;
  const modifiedTime = toIsoDate(entry.modified || entry.date) || undefined;
  const articleLike = isArticleLikeEntry(entry);
  const readingTime = estimateReadingTime(entry.html || entry.excerpt || '');
  const other: NonNullable<Metadata['other']> = {
    robots: robotsContent,
    'og:image:secure_url': ogImage,
    'og:image:alt': imageMeta.alt || title,
    'twitter:label1': 'Time to read',
    'twitter:data1': `${readingTime} minute${readingTime === 1 ? '' : 's'}`,
  };

  if (imageMeta.width) other['og:image:width'] = String(imageMeta.width);
  if (imageMeta.height) other['og:image:height'] = String(imageMeta.height);
  if (imageMeta.type) other['og:image:type'] = imageMeta.type;
  if (modifiedTime) other['og:updated_time'] = modifiedTime;
  if (publishedTime) other['article:published_time'] = publishedTime;
  if (modifiedTime) other['article:modified_time'] = modifiedTime;

  if (keywords.length) {
    other['meta-keywords'] = keywords.join(', ');
  }

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    authors: [{ name: 'Youssef Hesham' }],
    creator: 'Youssef Hesham',
    publisher: SITE_NAME,
    category: articleLike ? 'Article' : 'Reference',
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      title: ogTitle,
      description: decodeMetaText(seo.og_description) || description,
      url,
      siteName: OG_SITE_NAME,
      type: articleLike ? 'article' : 'website',
      images: [{
        url: ogImage,
        width: imageMeta.width,
        height: imageMeta.height,
        alt: imageMeta.alt || title,
        type: imageMeta.type,
      }],
      locale: 'en_US',
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title: twTitle,
      description: decodeMetaText(seo.twitter_description) || description,
      images: [twImage],
    },
    other,
  };
}

export function buildRobotsContent(entry?: ContentEntry, options?: { index?: boolean; follow?: boolean }): string {
  if (NOINDEX) return 'noindex, nofollow';
  if (options) {
    return `${options.follow === false ? 'nofollow' : 'follow'}, ${options.index === false ? 'noindex' : 'index'}, max-snippet:-1, max-video-preview:-1, max-image-preview:large`;
  }

  const parsed = entry?.seo?.robots ? parseRobots(entry.seo.robots) : { index: true, follow: true };
  return `${parsed.follow === false ? 'nofollow' : 'follow'}, ${parsed.index === false ? 'noindex' : 'index'}, max-snippet:-1, max-video-preview:-1, max-image-preview:large`;
}

export function isArticleLikeEntry(entry: ContentEntry): boolean {
  if (entry.type === 'post') return true;
  if (entry.slug === 'home') return false;

  const nonArticlePageSlugs = new Set([
    'about-us',
    'contact-us',
    'privacy-policy',
    'terms-and-conditions',
    'disclaimer',
    'morse-code-image-translator',
  ]);

  if (nonArticlePageSlugs.has(entry.slug)) return false;
  return !!entry.featuredImage;
}

export function estimateReadingTime(html: string): number {
  const words = stripTags(html)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}

export function resolveImageMeta(entry: ContentEntry): ImageMeta {
  const featured = clean(entry.seo.og_image) || entry.featuredImage || '';
  const featuredStem = normalizeImageStem(featured);
  const imageMatches = [...entry.html.matchAll(/<img\b[^>]*>/gi)];
  const parsedImages = imageMatches.map((match) => {
    const tag = match[0] || '';
    const src = tag.match(/\ssrc="([^"]+)"/i)?.[1] || '';
    const alt = tag.match(/\salt="([^"]*)"/i)?.[1] || '';
    const width = tag.match(/\swidth="(\d+)"/i)?.[1] || '';
    const height = tag.match(/\sheight="(\d+)"/i)?.[1] || '';
    return { src, alt, width, height };
  });

  for (const { src, alt, width, height } of parsedImages) {
    if (featuredStem && normalizeImageStem(src) !== featuredStem) continue;
    const dims = inferImageDimensions(src, width, height);
    return {
      url: src,
      alt: alt || entry.title,
      width: dims.width,
      height: dims.height,
      type: inferMimeType(src),
    };
  }

  if (/-scaled\.[a-z0-9]+$/i.test(featured)) {
    const sizedFeatured = featured.replace(/-scaled(\.[a-z0-9]+)$/i, '-1024x536$1');
    return {
      url: sizedFeatured,
      alt: entry.title,
      width: 1024,
      height: 536,
      type: inferMimeType(sizedFeatured),
    };
  }

  const firstImage = parsedImages.find((image) => image.src);
  if (firstImage) {
    const dims = inferImageDimensions(firstImage.src, firstImage.width, firstImage.height);
    return {
      url: firstImage.src,
      alt: firstImage.alt || entry.title,
      width: dims.width,
      height: dims.height,
      type: inferMimeType(firstImage.src),
    };
  }

  const dims = inferImageDimensions(featured);
  return {
    url: featured || LOGO_ABSOLUTE_URL,
    alt: entry.title,
    width: dims.width,
    height: dims.height,
    type: inferMimeType(featured),
  };
}

function buildKeywords(entry: ContentEntry): string[] {
  const seo = entry.seo;
  const parts = [
    clean(seo.focus_keyword),
    decodeMetaText(seo.title),
    entry.title,
    SITE_NAME,
    'Morse code',
    'Morse code translator',
  ];

  return Array.from(
    new Set(
      parts
        .flatMap((value) => value.split(/,|\||•|·/))
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim();
}

function decodeMetaText(s: string | null | undefined): string {
  return clean(s)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

function parseRobots(input: string): { index: boolean; follow: boolean } {
  // Rank Math stores robots as a serialized PHP array; just look for keywords
  const lower = input.toLowerCase();
  return {
    index: !lower.includes('noindex'),
    follow: !lower.includes('nofollow'),
  };
}

function normalizeImageStem(url: string): string {
  return url
    .split('/').pop() || ''
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/-\d+x\d+$/i, '')
    .replace(/-scaled$/i, '');
}

function inferImageDimensions(url: string, width?: string, height?: string): { width?: number; height?: number } {
  const numericWidth = width ? Number(width) : NaN;
  const numericHeight = height ? Number(height) : NaN;
  if (Number.isFinite(numericWidth) && Number.isFinite(numericHeight)) {
    return { width: numericWidth, height: numericHeight };
  }

  const sizeMatch = url.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i);
  if (sizeMatch) {
    return { width: Number(sizeMatch[1]), height: Number(sizeMatch[2]) };
  }

  return {};
}

function inferMimeType(url: string): string | undefined {
  const ext = (url.match(/\.([a-z0-9]+)(?:$|\?)/i)?.[1] || '').toLowerCase();
  if (!ext) return undefined;
  if (ext === 'jpg') return 'image/jpeg';
  if (ext === 'svg') return 'image/svg+xml';
  return `image/${ext}`;
}
