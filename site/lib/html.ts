import { buildLazyRepeaterMarkup } from './ads';
import { LOCAL_UPLOADS_PATH, withBasePath } from './site';

const LIVE_RELATED_BLOGS_BLOCK = String.raw`<h2>Related Blogs</h2>				
      <article>
          <a href="https://morse-codetranslator.com/i-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2026/04/I-in-Morse-Code-300x157.webp" alt="I in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2026/04/I-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2026/04/I-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2026/04/I-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2026/04/I-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2026/04/I-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/i-in-morse-code/" rel="bookmark">
              I in Morse Code						</a>
          </h3>
            I in Morse Code: Symbol &amp; Translation Morse code has been around for over a hundred years. People still love...					
                  <a href="https://morse-codetranslator.com/i-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/k-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2026/04/K-in-Morse-Code-300x157.webp" alt="K in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2026/04/K-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2026/04/K-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2026/04/K-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2026/04/K-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2026/04/K-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/k-in-morse-code/" rel="bookmark">
              K in Morse Code						</a>
          </h3>
            K in Morse Code: Symbol, Translation &amp; Easy Memory Tricks Morse code is a truly amazing secret language. People have...					
                  <a href="https://morse-codetranslator.com/k-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/no-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2026/03/No-in-Morse-Code-300x157.webp" alt="No in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2026/03/No-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2026/03/No-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2026/03/No-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2026/03/No-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2026/03/No-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/no-in-morse-code/" rel="bookmark">
              No in Morse Code						</a>
          </h3>
            No in Morse Code: The Complete Guide to Symbol, Sound, and Survival Do you ever wonder how people communicate during...					
                  <a href="https://morse-codetranslator.com/no-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/b-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2026/03/B-in-Morse-Code-300x157.webp" alt="B in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2026/03/B-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2026/03/B-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2026/03/B-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2026/03/B-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2026/03/B-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/b-in-morse-code/" rel="bookmark">
              B in Morse Code						</a>
          </h3>
            B in Morse Code: Symbol, Translation Easy Memory Tricks Morse code is a truly amazing secret language. People have used...					
                  <a href="https://morse-codetranslator.com/b-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/y-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2026/03/Y-in-Morse-Code-p-300x157.webp" alt="Y in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2026/03/Y-in-Morse-Code-p-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2026/03/Y-in-Morse-Code-p-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2026/03/Y-in-Morse-Code-p-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2026/03/Y-in-Morse-Code-p-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2026/03/Y-in-Morse-Code-p-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/y-in-morse-code/" rel="bookmark">
              Y in Morse Code						</a>
          </h3>
            Y in Morse Code: Symbol &amp; Translation Morse code has been around for over a hundred years. People still love...					
                  <a href="https://morse-codetranslator.com/y-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/n-in-morse/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2026/03/N-in-Morse-Code-300x157.webp" alt="N in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2026/03/N-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2026/03/N-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2026/03/N-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2026/03/N-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2026/03/N-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/n-in-morse/" rel="bookmark">
              N in Morse Code						</a>
          </h3>
            What is the letter N in Morse code? (Symbol, Sound, and Chart) Learning Morse code is a totally fun adventure....					
                  <a href="https://morse-codetranslator.com/n-in-morse/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/g-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2026/03/G-in-Morse-Code-300x157.webp" alt="G in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2026/03/G-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2026/03/G-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2026/03/G-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2026/03/G-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2026/03/G-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/g-in-morse-code/" rel="bookmark">
              G in Morse Code						</a>
          </h3>
            G in Morse Code: Symbol &amp; Translation Morse code has been around for over a hundred years. Even with all...					
                  <a href="https://morse-codetranslator.com/g-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/l-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp" alt="L in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/l-in-morse-code/" rel="bookmark">
              L in Morse Code						</a>
          </h3>
            L in Morse Code: Meaning, History, and Practical Applications Morse code is one of the most fascinating communication systems that...					
                  <a href="https://morse-codetranslator.com/l-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/j-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp" alt="J in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/j-in-morse-code/" rel="bookmark">
              J in Morse Code						</a>
          </h3>
            J in Morse Code: Symbol &amp; Translation One of the most interesting and ancient systems of communication is Morse code....					
                  <a href="https://morse-codetranslator.com/j-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/yes-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp" alt="Yes in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/yes-in-morse-code/" rel="bookmark">
              Yes in Morse Code						</a>
          </h3>
            Yes, in Morse Code: A Simple Word With a Powerful Signal Morse code is a sound, light, and time language....					
                  <a href="https://morse-codetranslator.com/yes-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/s-in-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp" alt="S in Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/s-in-morse-code/" rel="bookmark">
              S in Morse Code						</a>
          </h3>
            S in Morse Code: Symbol &amp; Translation Morse code has outlived its century not due to its age, but due...					
                  <a href="https://morse-codetranslator.com/s-in-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>
        <article>
          <a href="https://morse-codetranslator.com/darius-morse-code/" rel="bookmark">
            <img width="300" height="157" src="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp" alt="Darius Morse Code" loading="lazy" decoding="async" srcset="https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-300x157.webp 300w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1024x536.webp 1024w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-768x402.webp 768w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-1536x804.webp 1536w, https://morse-codetranslator.com/wp-content/uploads/2025/12/A-in-Morse-Code-2048x1072.webp 2048w" sizes="auto, (max-width: 300px) 100vw, 300px" />					</a>
                  <h3>
            <a href="https://morse-codetranslator.com/darius-morse-code/" rel="bookmark">
              Darius Morse Code						</a>
          </h3>
            Darius Morse Code – Decode the Name Using Our Morse Code Translator One of the most interesting communication systems that...					
                  <a href="https://morse-codetranslator.com/darius-morse-code/" rel="bookmark">
            Read More →					</a>
    </article>`;

function normalizeRelatedBlogsTail(html: string): string {
  if (!/<h2>Related Blogs<\/h2>/i.test(html)) {
    return html;
  }

  return html.replace(/<h2>Related Blogs<\/h2>[\s\S]*$/i, LIVE_RELATED_BLOGS_BLOCK);
}

function transformFaqAccordions(html: string): string {
  return html.replace(
    /<h2>\s*Frequently Asked Questions\s*<\/h2>([\s\S]*?)(?=(?:<h2\b)|$)/gi,
    (fullMatch, faqBody: string) => {
      const items = Array.from(
        faqBody.matchAll(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=(?:<h3\b)|$)/gi)
      );

      if (!items.length) {
        return fullMatch;
      }

      const faqItems = items
        .map((item, index) => {
          const question = item[1].replace(/\s+/g, ' ').trim();
          const answer = item[2].trim();

          if (!question || !answer) {
            return '';
          }

          return `<details class="wp-faq-item"${index === 0 ? ' open' : ''}><summary class="wp-faq-question"><span>${question}</span></summary><div class="wp-faq-answer">${answer}</div></details>`;
        })
        .filter(Boolean)
        .join('');

      if (!faqItems) {
        return fullMatch;
      }

      return `<section class="wp-faq"><h2>Frequently Asked Questions</h2><div class="wp-faq-list">${faqItems}</div></section>`;
    }
  );
}

function normalizeArticleCardExcerpts(html: string): string {
  return html.replace(
    /(<article>[\s\S]*?<\/h3>)\s*([^<][\s\S]*?)\s*(<a href="[^"]+"[^>]*>\s*Read More →\s*<\/a>\s*<\/article>)/gi,
    (_match, before: string, excerpt: string, after: string) => {
      const cleanedExcerpt = excerpt.replace(/\s+/g, ' ').trim();
      if (!cleanedExcerpt) {
        return `${before}${after}`;
      }
      return `${before}<p class="wp-article-excerpt">${cleanedExcerpt}</p>${after}`;
    }
  );
}

function injectLazyAdRepeaters(html: string, maxRepeaters = 3): string {
  const headingCount = html.match(/<h2\b/gi)?.length ?? 0;

  if (headingCount < 4) {
    return html;
  }

  let headingIndex = 0;
  let repeaterIndex = 0;

  return html.replace(/(<h2\b[^>]*>[\s\S]*?<\/h2>)/gi, (match) => {
    headingIndex += 1;

    if (
      headingIndex < 2 ||
      headingIndex % 3 !== 0 ||
      repeaterIndex >= maxRepeaters ||
      /Frequently Asked Questions/i.test(match)
    ) {
      return match;
    }

    repeaterIndex += 1;
    return `${match}${buildLazyRepeaterMarkup(repeaterIndex)}`;
  });
}

type ProcessHtmlOptions = {
  injectLazyAds?: boolean;
  maxLazyRepeaters?: number;
};

/**
 * Post-process WordPress HTML to make it work in our React app.
 */
export function processHtml(html: string, options: ProcessHtmlOptions = {}): string {
  let out = html;

  out = normalizeRelatedBlogsTail(out);

  // 1. Remove WPCode shortcodes (legacy translator widget)
  out = out.replace(/\[wpcode[^\]]*\]/gi, '');

  // 1a. Remove body-injected assets/scripts and known extraction artifacts
  out = out
    .replace(/<link[^>]*>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<section[^>]*data-turn-id="[^"]*"[^>]*>[\s\S]*?<\/section>/gi, '');

  // 1ab. Rewrite WordPress upload URLs to local static assets.
  out = out.replace(
    /https?:\/\/(?:www\.)?morse-codetranslator\.com\/wp-content\/uploads/gi,
    LOCAL_UPLOADS_PATH
  );

  // 1aa. Fix bad placeholder links that leaked into extracted content
  out = out.replace(/href="link"/gi, `href="${withBasePath('/')}"`);

  // 1b. Strip inline color:white / color:#fff / color:#ffffff styles from WP HTML
  //     These produce invisible text on light backgrounds.
  out = out.replace(
    /\s*style="([^"]*)"/gi,
    (_m, styleVal: string) => {
      const cleaned = styleVal
        .replace(/color\s*:\s*(?:#fff(?:fff)?|white|rgba\(255,255,255[^)]*\))\s*;?/gi, '')
        .trim()
        .replace(/;$/, '')
        .trim();
      return cleaned ? ` style="${cleaned}"` : '';
    }
  );

  // 2. Rewrite data-text links to visible pill links using their data-text label.
  out = out.replace(
    /<a([^>]+)data-text="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi,
    (_m, attrs: string, label: string) => {
      const href = attrs.match(/href="([^"]+)"/)?.[1] ?? '#';
      return `<a href="${href}" class="wp-guide-link">${label}</a>`;
    }
  );

  // 3. Remove remaining bare decorative SVG elements (aria-hidden icons
  //    used as accordion +/- toggles and navigation arrows).
  //    We keep any SVG that is not aria-hidden (e.g. inline brand marks).
  out = out.replace(/<svg\s[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/svg>/gi, '');

  // 4. Add class="wp-img" to every <img> so CSS can reliably target them
  //    and strip the explicit width= / height= attributes that fight max-width.
  //    Also derive a friendly alt= from the src filename when alt is missing/empty
  //    so we don't ship inaccessible content images.
  out = out.replace(
    /<img\s([^>]*?)(?:\s*\/)?>/gi,
    (_m, attrs: string) => {
      // Remove width=, height=, sizes= attributes (CSS handles sizing)
      let cleaned = attrs
        .replace(/\s*width="[^"]*"/gi, '')
        .replace(/\s*height="[^"]*"/gi, '')
        .replace(/\s*sizes="[^"]*"/gi, '')
        .trim();

      const altMatch = cleaned.match(/\salt="([^"]*)"/i);
      const hasAlt = !!altMatch && altMatch[1].trim().length > 0;
      if (!hasAlt) {
        const src = cleaned.match(/\ssrc="([^"]+)"/i)?.[1] ?? '';
        const file = src.split('/').pop() || '';
        const base = file
          .replace(/\.[a-z0-9]+$/i, '')
          .replace(/-\d{2,4}x\d{2,4}$/i, '') // strip WP size suffix e.g. -1024x536
          .replace(/[-_]+/g, ' ')
          .replace(/\s*scaled\s*$/i, '')
          .replace(/\s+/g, ' ')
          .trim();
        const altText = base ? toTitleCase(base) : 'Morse code illustration';
        if (altMatch) {
          cleaned = cleaned.replace(/\salt="[^"]*"/i, ` alt="${altText.replace(/"/g, '&quot;')}"`);
        } else {
          cleaned = `${cleaned} alt="${altText.replace(/"/g, '&quot;')}"`;
        }
      }
      return `<img ${cleaned} class="wp-img" />`;
    }
  );

  // 5. Trim whitespace from heading text content
  out = out.replace(/(<h[1-6][^>]*>)\s+/g, '$1');
  out = out.replace(/\s+(<\/h[1-6]>)/g, '$1');

  // 6. Make internal anchors relative
  out = out.replace(
    /href="https?:\/\/(?:www\.)?morse-codetranslator\.com\/?"/gi,
    `href="${withBasePath('/')}"`
  );
  out = out.replace(
    /href="https?:\/\/(?:www\.)?morse-codetranslator\.com\/([^"#?]+?)\/?"/gi,
    (_m, slug: string) => `href="${withBasePath(`/${slug}/`)}"`
  );

  // 7. Wrap sequences of bare internal links (the word-link pills section)
  //    Detect: 3+ consecutive <a> tags not inside <p>/<li> — wrap in a pill container.
  //    Pattern from WP: newline-separated <a> links between sections.
  out = out.replace(
    /(?<=\n|>|^)((?:\s*<a href="\/[^"]+"[^>]*>[^<]+<\/a>\s*){3,})/gm,
    (m) => `<div class="wp-link-pills">${m}</div>`
  );

  // 8. Wrap consecutive <article> blocks in a grid container
  out = out.replace(
    /(<article>[\s\S]*?<\/article>)(\s*<article>[\s\S]*?<\/article>)+/gi,
    (m) => `<div class="wp-articles-grid">${m}</div>`
  );

  out = normalizeArticleCardExcerpts(out);

  // 9. Remove empty <p> and <p>\s*</p> tags
  out = out.replace(/<p>\s*<\/p>/gi, '');
  out = out.replace(/<p>(?:\s|&nbsp;|&#160;)*<\/p>/gi, '');

  // 10. Wrap callout paragraphs (Pro Tip:, Note:, Tip:, Quick Examples, Practice Tip)
  //     in a highlight container for visual emphasis
  out = out.replace(
    /<p>(\s*<(?:strong|b)>\s*(?:Pro\s*Tip|Note|Tip|Practice\s*Tip|Quick\s*Tip|Important|Remember|Example|Fun\s*Fact)\s*:?[^<]*<\/(?:strong|b)>[\s\S]*?)<\/p>/gi,
    '<p class="wp-highlight">$1</p>'
  );

  // 10a. Convert FAQ sections into accessible accordions.
  out = transformFaqAccordions(out);

  if (options.injectLazyAds) {
    out = injectLazyAdRepeaters(out, options.maxLazyRepeaters ?? 3);
  }

  // 11. Normalise stray invalid <br> variants
  out = out.replace(/<\/br>/gi, '<br />');

  // 12. Smart quotes — match the live site's wptexturize output for " and '.
  //     The exported source content is inconsistent (some posts kept straight
  //     quotes, others were already curly). Live applies smart-quote rendering
  //     uniformly, so we do the same here.
  //     We deliberately do NOT touch '...' or '---': converting those to
  //     ellipsis / em-dash silently corrupts Morse-code dot/dash sequences
  //     (a known live-site rendering bug we will not replicate).
  out = applySmartQuotes(out);

  return out;
}

function applySmartQuotes(html: string): string {
  const tokens: string[] = [];
  // Mask anything we must not touch: HTML tags, <pre>/<code> blocks
  // (which include attribute values automatically since tags are masked).
  const masked = html.replace(
    /<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>|<[^>]+>/gi,
    (m) => {
      const idx = tokens.length;
      tokens.push(m);
      return `\u0001${idx}\u0001`;
    }
  );

  // Treat a quote as "opening" when at start of input or preceded by
  // whitespace, an opening bracket/dash, another opening quote, or our
  // tag-mask sentinel (\u0001) which represents an HTML tag boundary.
  const isOpener = (prev: string) =>
    !prev || /[\s(\[{<>\u2014\u2013\u00a0\u2018\u201c\-\u0001]/.test(prev);

  let text = masked.replace(/"/g, (_m, offset: number, str: string) =>
    isOpener(offset > 0 ? str[offset - 1] : '') ? '\u201c' : '\u201d'
  );

  text = text.replace(/'/g, (_m, offset: number, str: string) =>
    isOpener(offset > 0 ? str[offset - 1] : '') ? '\u2018' : '\u2019'
  );

  return text.replace(/\u0001(\d+)\u0001/g, (_m, idx: string) => tokens[Number(idx)]);
}

/** Strip CDATA wrappers that may have leaked through */
export function clean(s: string | null | undefined): string {
  if (!s) return '';
  const m = s.match(/<!\[CDATA\[(.*?)\]\]>/s);
  return (m ? m[1] : s).trim();
}

/**
 * Convert a WordPress-exported date (which may be CDATA-wrapped and uses
 * `YYYY-MM-DD HH:MM:SS` with no timezone) to an ISO-8601 UTC string suitable
 * for sitemaps, OG `article:*_time` and JSON-LD `datePublished`/`dateModified`.
 * Returns an empty string if the input cannot be parsed.
 */
export function toIsoDate(s: string | null | undefined): string {
  const raw = clean(s);
  if (!raw) return '';
  // Already ISO-ish (contains T or Z): trust it after Date round-trip.
  if (/T|Z|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }
  // WP `YYYY-MM-DD HH:MM:SS` (assumed UTC, matching WP's stored post_date_gmt).
  const wp = raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/);
  if (wp) {
    const d = new Date(`${wp[1]}T${wp[2]}Z`);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }
  // RFC 2822 (the `pubDate` field) and other parseable formats.
  const d = new Date(raw);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

/**
 * Title-case every word in a string (matches the live site's <title> casing).
 * Capitalises the first alphabetic character of each whitespace-separated token,
 * preserves the rest of the token verbatim (so things like ALL-CAPS acronyms,
 * contractions, parenthetical morse like "(...)" and punctuation pass through).
 * HTML entities like &amp; / &#8217; are left untouched so they keep rendering
 * correctly after the transform.
 */
export function toTitleCase(input: string): string {
  if (!input) return '';
  // Decode the handful of entities that commonly appear in WP titles so we
  // operate on the user-visible text, then leave Next.js to re-encode as needed.
  const decoded = input
    .replace(/&amp;/gi, '&')
    .replace(/&#038;/g, '&')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201c')
    .replace(/&#8221;/g, '\u201d')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&nbsp;/gi, ' ');
  return decoded.replace(/\S+/g, (word) => {
    // Skip raw HTML entity tokens entirely.
    if (/^&[#a-z0-9]+;$/i.test(word)) return word;
    // Find first alphabetic character and uppercase it; leave the rest as-is.
    return word.replace(/^([^A-Za-z]*)([a-z])/, (_m, prefix: string, ch: string) => prefix + ch.toUpperCase());
  });
}

/**
 * Strip HTML tags and collapse whitespace, returning at most `maxChars` of plain
 * text with an ellipsis suffix if truncated.
 */
export function buildExcerpt(html: string, maxChars = 130): string {
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#8217;/g, '\u2019')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxChars) return text;
  // Cut on a word boundary
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + ' \u2026';
}
