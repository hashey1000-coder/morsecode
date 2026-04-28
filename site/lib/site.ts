export const SITE_URL = 'https://morse-codetranslator.com';
export const SITE_NAME = 'Morse Code Translator';
export const SITE_DESCRIPTION =
  'Free online Morse Code Translator. Convert text to Morse code (dots and dashes) and Morse code to text instantly with audio playback, light flashes, and adjustable speed.';
const RAW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '';
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === 'true';

function normalizeBasePath(value: string): string {
  if (!value || value === '/') return '';
  return `/${value.replace(/^\/+|\/+$/g, '')}`;
}

export const BASE_PATH = normalizeBasePath(RAW_BASE_PATH);

export function withBasePath(path: string | null | undefined): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!BASE_PATH) return normalized;
  if (normalized === BASE_PATH || normalized.startsWith(`${BASE_PATH}/`)) return normalized;
  if (normalized === '/') return `${BASE_PATH}/`;
  return `${BASE_PATH}${normalized}`;
}

export const UPLOADS_PATH = '/wp-content/uploads';
export const LOCAL_UPLOADS_PATH = withBasePath(UPLOADS_PATH);
export const LOGO_PATH = `${UPLOADS_PATH}/2026/01/cropped-morse-code-192x192.webp`;
export const LOGO_URL = withBasePath(LOGO_PATH);

function localizeUploadPath(url: string | null | undefined): string {
  if (!url) return '';
  return url.replace(
    /^https?:\/\/(?:www\.)?morse-codetranslator\.com\/wp-content\/uploads/gi,
    UPLOADS_PATH
  );
}

export function localizeUploadUrl(url: string | null | undefined): string {
  const localized = localizeUploadPath(url);
  if (!localized) return '';
  if (/^https?:\/\//i.test(localized)) return localized;
  return withBasePath(localized);
}

export function toAbsoluteUrl(url: string | null | undefined): string {
  const localized = localizeUploadPath(url);
  if (!localized) return '';
  if (/^https?:\/\//i.test(localized)) return localized;
  return `${SITE_URL}${localized.startsWith('/') ? localized : `/${localized}`}`;
}

export const LOGO_ABSOLUTE_URL = toAbsoluteUrl(LOGO_PATH);
