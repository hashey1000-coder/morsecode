from pathlib import Path
from urllib.parse import urlparse
import re
import html as htmlmod
import xml.etree.ElementTree as ET
import requests

SITE = 'https://morse-codetranslator.com'
OUT = Path('/Users/hesh/morsecodetranslator/site/out')


def fetch(url: str) -> str:
    r = requests.get(url, timeout=25, headers={'User-Agent': 'Mozilla/5.0 SEO audit'})
    print('FETCH', url, r.status_code, len(r.text))
    r.raise_for_status()
    return r.text


def parse_sitemap_xml(txt: str):
    root = ET.fromstring(txt.encode('utf-8'))
    ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    urls = []
    for u in root.findall('sm:url', ns):
        loc = u.findtext('sm:loc', default='', namespaces=ns)
        lm = u.findtext('sm:lastmod', default='', namespaces=ns)
        urls.append((loc, lm))
    return urls


def get_sitemap_urls(url: str):
    txt = fetch(url)
    root = ET.fromstring(txt.encode('utf-8'))
    ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    if root.tag.endswith('sitemapindex'):
        urls = []
        for sm in root.findall('sm:sitemap', ns):
            loc = sm.findtext('sm:loc', default='', namespaces=ns)
            if loc:
                urls.extend(get_sitemap_urls(loc))
        return urls
    return parse_sitemap_xml(txt)


def url_to_out_path(url: str) -> Path:
    p = urlparse(url).path
    if p in ('', '/'):
        return OUT / 'index.html'
    return OUT / p.strip('/') / 'index.html'


def tag_content(doc: str, pattern: str) -> str:
    m = re.search(pattern, doc, re.I | re.S)
    return htmlmod.unescape(m.group(1).strip()) if m else ''


def get_meta(doc: str):
    return {
        'title': tag_content(doc, r'<title[^>]*>(.*?)</title>'),
        'description': tag_content(doc, r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)["\']'),
        'canonical': tag_content(doc, r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']*)["\']'),
        'og_title': tag_content(doc, r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']*)["\']'),
        'og_image': tag_content(doc, r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']*)["\']'),
        'robots': tag_content(doc, r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)["\']'),
    }


def main():
    local_sitemap = (OUT / 'sitemap.xml').read_text(errors='ignore')
    live_urls = get_sitemap_urls(SITE + '/sitemap.xml')
    local_urls = parse_sitemap_xml(local_sitemap)
    live_set = {u for u, _ in live_urls}
    local_set = {u for u, _ in local_urls}

    print('\nROUTE COUNTS live', len(live_set), 'local sitemap', len(local_set), 'local html files', len(list(OUT.glob('**/*.html'))))
    print('MISSING FROM LOCAL SITEMAP', len(live_set - local_set), sorted(live_set - local_set)[:80])
    print('EXTRA IN LOCAL SITEMAP', len(local_set - live_set), sorted(local_set - live_set)[:80])

    missing_files = [u for u, _ in local_urls if not url_to_out_path(u).exists()]
    print('LOCAL SITEMAP URLS MISSING HTML FILE', len(missing_files), missing_files[:80])

    meta_diffs = []
    for u in sorted(live_set & local_set):
        lp = url_to_out_path(u)
        if not lp.exists():
            continue
        local_doc = lp.read_text(errors='ignore')
        try:
            r = requests.get(u, timeout=12, headers={'User-Agent': 'Mozilla/5.0 SEO audit'})
            if r.status_code != 200:
                meta_diffs.append((u, 'live_status', str(r.status_code), ''))
                continue
            live_doc = r.text
        except Exception as e:
            meta_diffs.append((u, 'live_fetch_error', str(e), ''))
            continue
        lm, vm = get_meta(local_doc), get_meta(live_doc)
        for k in ['title', 'description', 'canonical']:
            if lm[k] != vm[k]:
                meta_diffs.append((u, k, lm[k][:180], vm[k][:180]))
    print('\nMETADATA DIFFS title/description/canonical', len(meta_diffs))
    for row in meta_diffs[:60]:
        print('DIFF', row)

    html_files = [p for p in OUT.glob('**/*.html') if '/wp-content/' not in p.as_posix()]
    no_title = []
    no_desc = []
    no_canon = []
    h1_bad = []
    no_jsonld = []
    for p in html_files:
        rel = '/' if p == OUT / 'index.html' else '/' + str(p.relative_to(OUT)).replace('/index.html', '/')
        doc = p.read_text(errors='ignore')
        m = get_meta(doc)
        if not m['title']:
            no_title.append(rel)
        if not m['description'] and '404' not in rel:
            no_desc.append(rel)
        if not m['canonical'] and '404' not in rel and '_not-found' not in rel:
            no_canon.append(rel)
        h1 = len(re.findall(r'<h1\b', doc, re.I))
        if h1 != 1 and rel not in ['/404/', '/_not-found/']:
            h1_bad.append((rel, h1))
        if 'application/ld+json' not in doc and rel not in ['/404/', '/_not-found/']:
            no_jsonld.append(rel)
    print('\nHTML HEALTH')
    print('NO TITLE', no_title[:50])
    print('NO DESC', no_desc[:50])
    print('NO CANON', no_canon[:50])
    print('H1 BAD', h1_bad[:80])
    print('NO JSONLD', no_jsonld[:50])

    missing_refs = []
    visible_remote_imgs = []
    attr_pat = re.compile(r'\b(?:href|src)=["\']([^"\']+)["\']', re.I)
    srcset_pat = re.compile(r'\bsrcset=["\']([^"\']+)["\']', re.I)
    for p in html_files:
        doc = p.read_text(errors='ignore')
        rel = str(p.relative_to(OUT))
        refs = attr_pat.findall(doc)
        for ss in srcset_pat.findall(doc):
            refs += [part.strip().split()[0] for part in ss.split(',') if part.strip()]
        for ref in refs:
            if ref.startswith(('mailto:', 'tel:', 'data:', '#', 'javascript:')):
                continue
            if ref.startswith('http'):
                continue
            if ref.startswith('/_next/') or ref.startswith('/wp-content/') or ref.startswith('/favicon'):
                target = OUT / ref.lstrip('/').split('?')[0]
                if not target.exists():
                    missing_refs.append((rel, ref))
            elif ref.startswith('/'):
                target = (OUT / 'index.html') if ref == '/' else (OUT / ref.strip('/') / 'index.html')
                if not target.exists():
                    missing_refs.append((rel, ref))
        for m in re.finditer(r'<img[^>]+src=["\'](https://morse-codetranslator\.com/wp-content/uploads/[^"\']+)["\']', doc, re.I):
            visible_remote_imgs.append((rel, m.group(1)))
    print('\nLINK/ASSET HEALTH')
    print('MISSING INTERNAL/ASSET REFS', len(missing_refs))
    for x in missing_refs[:80]:
        print('MISS', x)
    print('VISIBLE REMOTE UPLOAD IMG SRC', len(visible_remote_imgs))
    for x in visible_remote_imgs[:30]:
        print('REMOTEIMG', x)

    print('\nKEY FILES')
    for f in ['robots.txt', 'sitemap.xml', 'wp-content/uploads/2026/01/cropped-morse-code-32x32.webp', 'wp-content/uploads/2025/11/Morse-Code-Logo.png']:
        print('EXISTS', f, (OUT / f).exists())


if __name__ == '__main__':
    main()
