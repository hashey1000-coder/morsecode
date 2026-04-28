# Morse Code Translator — Next.js rebuild

Static React/Next.js port of https://morse-codetranslator.com/ — content extracted from the WordPress export and rendered with original HTML preserved for SEO parity.

## What's preserved
- All 13 pages and 25 posts at their original URLs (e.g. `/hello-in-morse-code/`)
- Original article HTML, headings, internal links, and images
- Per-page SEO metadata from Rank Math (title, description, canonical, OG, Twitter)
- JSON-LD: WebSite, Organization, Article, BreadcrumbList, FAQPage
- `sitemap.xml` and `robots.txt` auto-generated
- Trailing-slash URL style identical to WordPress

## What's new
- Interactive Morse Translator built in TypeScript using the Web Audio API
  (text↔Morse, audio playback, light flash, configurable WPM / Farnsworth / pitch / volume / tone, copy, share, random)

## Image hosting
Images currently load from `https://morse-codetranslator.com/wp-content/uploads/...` (your live WordPress domain). When you migrate DNS to the new host, copy the `uploads/` folder into `site/public/wp-content/uploads/` to make them self-hosted.

## Develop locally
```bash
cd site
npm install
npm run dev
# open http://localhost:3000
```

## Static export (deploy anywhere)
```bash
cd site
npm run build
# output is in `site/out/`  — drop it on Vercel, Netlify, Cloudflare Pages, S3, or any static host
```

## GitHub Actions deploy to cPanel
This repo now includes [.github/workflows/deploy-cpanel.yml](.github/workflows/deploy-cpanel.yml) so every push to `main` can build the static export and upload `site/out/` to cPanel over SSH.

Add these GitHub repository secrets before enabling it:
- `CPANEL_HOST` — your cPanel SSH host
- `CPANEL_PORT` — optional SSH port (leave unset for `22`)
- `CPANEL_USER` — your cPanel SSH username
- `CPANEL_SSH_KEY` — the private key for that SSH user
- `CPANEL_TARGET_DIR` — full remote path, for example `/home/USERNAME/public_html`

After the secrets are added, pushing to `main` will:
1. install dependencies in `site/`
2. run the Next.js static build
3. sync `site/out/` to your cPanel target directory with `rsync --delete`

## Re-import content from a fresh WordPress export
1. Replace `morse.WordPress.YYYY-MM-DD.xml` at the repo root.
2. Update the path in `scripts/extract-wp.py` if the filename changed.
3. Run:
   ```bash
   python3 scripts/extract-wp.py
   ```
   This regenerates `site/content/{pages,posts,menus}.json`. Rebuild the site afterwards.

## File map
- `scripts/extract-wp.py` — WXR → JSON importer
- `site/content/*.json` — extracted content (committed for build)
- `site/lib/morse.ts` — encode/decode logic
- `site/components/MorseTranslator.tsx` — interactive widget
- `site/components/WpContent.tsx` — renders WordPress HTML
- `site/app/page.tsx` — home (translator + home content)
- `site/app/[slug]/page.tsx` — every WP page & post
- `site/app/blogs/page.tsx` — blog index
- `site/app/sitemap.ts`, `site/app/robots.ts` — SEO files
