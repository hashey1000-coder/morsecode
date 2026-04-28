import type { ContentEntry } from './content';
import { clean, toIsoDate } from './html';
import { estimateReadingTime, isArticleLikeEntry, resolveImageMeta } from './metadata';
import { LOGO_ABSOLUTE_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, toAbsoluteUrl } from './site';

type BreadcrumbItem = {
  name: string;
  item: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type YoastGraphOptions = {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
  publishedTime?: string;
  modifiedTime?: string;
  breadcrumbs?: BreadcrumbItem[];
  articleLike?: boolean;
  faqItems?: FaqItem[];
};

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const SOCIALS = [
  'https://www.facebook.com/morsecodetranslators/',
  'https://x.com/translator77515',
  'https://www.reddit.com/user/MorseCodeTranslator1/',
  'https://www.quora.com/profile/Morse-Code-Translator-6',
  'https://www.linkedin.com/in/youssef-hesham-72913a33b/',
];

export function buildEntryYoastGraph(entry: ContentEntry, path: string, options?: { breadcrumbs?: BreadcrumbItem[]; faqItems?: FaqItem[] }) {
  const url = `${SITE_URL}${path}`;
  const imageMeta = resolveImageMeta(entry);

  return buildYoastGraph({
    url,
    title: entry.title,
    description: clean(entry.seo.description) || stripTags(entry.excerpt) || SITE_DESCRIPTION,
    imageUrl: toAbsoluteUrl(imageMeta.url) || LOGO_ABSOLUTE_URL,
    imageAlt: imageMeta.alt || entry.title,
    imageWidth: imageMeta.width,
    imageHeight: imageMeta.height,
    imageType: imageMeta.type,
    publishedTime: toIsoDate(entry.date) || undefined,
    modifiedTime: toIsoDate(entry.modified || entry.date) || undefined,
    breadcrumbs: options?.breadcrumbs,
    articleLike: entry.slug === 'home' ? !!entry.featuredImage : isArticleLikeEntry(entry),
    faqItems: options?.faqItems,
  });
}

export function buildYoastGraph(options: YoastGraphOptions) {
  const {
    url,
    title,
    description,
    imageUrl,
    imageAlt,
    imageWidth,
    imageHeight,
    imageType,
    publishedTime,
    modifiedTime,
    breadcrumbs = [],
    articleLike = false,
    faqItems = [],
  } = options;

  const pageAuthorId = `${url}#author`;
  const imageId = imageUrl || LOGO_ABSOLUTE_URL;
  const webPageId = `${url}#webpage`;
  const breadcrumbId = breadcrumbs.length > 1 ? `${url}#breadcrumb` : undefined;
  const richSnippetId = `${url}#richSnippet`;
  const faqId = faqItems.length ? `${url}#faq` : undefined;
  const graph: Array<Record<string, unknown>> = [
    {
      '@type': ['Person', 'Organization'],
      '@id': PERSON_ID,
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', '@id': LOGO_ABSOLUTE_URL, url: LOGO_ABSOLUTE_URL },
      image: { '@id': LOGO_ABSOLUTE_URL },
      sameAs: SOCIALS,
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { '@id': PERSON_ID },
      potentialAction: [
        {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?s={search_term_string}` },
          'query-input': { '@type': 'PropertyValueSpecification', valueRequired: true, valueName: 'search_term_string' },
        },
      ],
      inLanguage: 'en-US',
    },
    {
      '@type': 'ImageObject',
      '@id': imageId,
      url: imageUrl || LOGO_ABSOLUTE_URL,
      contentUrl: imageUrl || LOGO_ABSOLUTE_URL,
      caption: imageAlt || title,
      inLanguage: 'en-US',
      ...(imageWidth ? { width: imageWidth } : {}),
      ...(imageHeight ? { height: imageHeight } : {}),
      ...(imageType ? { encodingFormat: imageType } : {}),
    },
  ];

  if (breadcrumbId) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    });
  }

  graph.push({
    '@type': 'WebPage',
    '@id': webPageId,
    url,
    name: title,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': PERSON_ID },
    ...(breadcrumbId ? { breadcrumb: { '@id': breadcrumbId } } : {}),
    primaryImageOfPage: { '@id': imageId },
    image: { '@id': imageId },
    thumbnailUrl: imageUrl || LOGO_ABSOLUTE_URL,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    description,
    inLanguage: 'en-US',
    potentialAction: [{ '@type': 'ReadAction', target: [url] }],
  });

  graph.push({
    '@type': 'Person',
    '@id': pageAuthorId,
    name: 'Youssef Hesham',
    url: 'https://www.linkedin.com/in/youssef-hesham-72913a33b/',
    worksFor: { '@id': PERSON_ID },
  });

  if (articleLike) {
    graph.push({
      '@type': 'Article',
      '@id': richSnippetId,
      isPartOf: { '@id': webPageId },
      author: { '@id': pageAuthorId },
      headline: title,
      datePublished: publishedTime,
      dateModified: modifiedTime || publishedTime,
      mainEntityOfPage: { '@id': webPageId },
      wordCount: estimateReadingTime(description) * 200,
      publisher: { '@id': PERSON_ID },
      image: { '@id': imageId },
      thumbnailUrl: imageUrl || LOGO_ABSOLUTE_URL,
      articleSection: 'Morse Code',
      inLanguage: 'en-US',
    });
  }

  if (faqId) {
    graph.push({
      '@type': 'FAQPage',
      '@id': faqId,
      isPartOf: { '@id': webPageId },
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim();
}