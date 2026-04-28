#!/usr/bin/env python3
"""Extract WordPress WXR export into JSON files for the Next.js site.

Outputs:
  site/content/pages.json
  site/content/posts.json
  site/content/menus.json
"""
from __future__ import annotations
import json
import os
import re
import html
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
XML = ROOT / "morse.WordPress.2026-04-22.xml"
OUT = ROOT / "site" / "content"
OUT.mkdir(parents=True, exist_ok=True)

raw = XML.read_text(encoding="utf-8")

# ---------- helpers ----------
CDATA = re.compile(r"<!\[CDATA\[(.*?)\]\]>", re.DOTALL)


def cd(s: str) -> str:
    if s is None:
        return ""
    m = CDATA.search(s)
    return (m.group(1) if m else s).strip()


def find(tag: str, text: str, *, dotall=True) -> Optional[str]:
    m = re.search(rf"<{tag}>(.*?)</{tag}>", text, re.DOTALL if dotall else 0)
    return m.group(1) if m else None


def find_ns(tag: str, text: str) -> Optional[str]:
    """find namespaced like wp:post_name"""
    m = re.search(rf"<{tag}>(.*?)</{tag}>", text, re.DOTALL)
    return m.group(1) if m else None


def all_postmeta(item: str) -> dict:
    out = {}
    for m in re.finditer(
        r"<wp:postmeta>\s*<wp:meta_key>(.*?)</wp:meta_key>\s*<wp:meta_value>(.*?)</wp:meta_value>\s*</wp:postmeta>",
        item, re.DOTALL,
    ):
        k = cd(m.group(1))
        v = cd(m.group(2))
        out[k] = v
    return out


# ---------- attachments map (id -> url) ----------
attachments_by_id: dict[str, str] = {}
items = re.findall(r"<item>.*?</item>", raw, re.DOTALL)
for it in items:
    pt = cd(find_ns("wp:post_type", it) or "")
    if pt != "attachment":
        continue
    pid = (find_ns("wp:post_id", it) or "").strip()
    url = cd(find_ns("wp:attachment_url", it) or "")
    if pid and url:
        attachments_by_id[pid] = url

# ---------- extract pages and posts ----------
def extract(item: str) -> Optional[dict]:
    pt = cd(find_ns("wp:post_type", item) or "")
    status = cd(find_ns("wp:status", item) or "")
    if pt not in ("page", "post") or status != "publish":
        return None
    title = cd(find("title", item) or "")
    slug = cd(find_ns("wp:post_name", item) or "")
    link = (find("link", item) or "").strip()
    pub = (find("pubDate", item) or "").strip()
    date_gmt = (find_ns("wp:post_date_gmt", item) or "").strip()
    modified_gmt = (find_ns("wp:post_modified_gmt", item) or "").strip()
    content_html = cd(find("content:encoded", item) or "")
    excerpt = cd(find("excerpt:encoded", item) or "")
    pid = (find_ns("wp:post_id", item) or "").strip()
    meta = all_postmeta(item)
    thumb_id = meta.get("_thumbnail_id")
    featured = attachments_by_id.get(thumb_id) if thumb_id else None
    return {
        "id": pid,
        "type": pt,
        "title": html.unescape(title),
        "slug": slug,
        "link": link,
        "date": date_gmt,
        "modified": modified_gmt,
        "pubDate": pub,
        "html": content_html,
        "excerpt": excerpt,
        "featuredImage": featured,
        "seo": {
            "title": meta.get("rank_math_title") or "",
            "description": meta.get("rank_math_description") or "",
            "focus_keyword": meta.get("rank_math_focus_keyword") or "",
            "canonical": meta.get("rank_math_canonical_url") or "",
            "robots": meta.get("rank_math_robots") or "",
            "og_title": meta.get("rank_math_facebook_title") or "",
            "og_description": meta.get("rank_math_facebook_description") or "",
            "og_image": meta.get("rank_math_facebook_image") or "",
            "twitter_title": meta.get("rank_math_twitter_title") or "",
            "twitter_description": meta.get("rank_math_twitter_description") or "",
            "twitter_image": meta.get("rank_math_twitter_image") or "",
            "schema": meta.get("rank_math_schema_Article") or meta.get("rank_math_schema_BlogPosting") or "",
        },
    }


pages = []
posts = []
for it in items:
    rec = extract(it)
    if not rec:
        continue
    if rec["type"] == "page":
        pages.append(rec)
    else:
        posts.append(rec)

pages.sort(key=lambda r: r["slug"])
posts.sort(key=lambda r: r["date"], reverse=True)

(OUT / "pages.json").write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf-8")
(OUT / "posts.json").write_text(json.dumps(posts, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------- menus (nav_menu_item) ----------
menus = []
for it in items:
    pt = cd(find_ns("wp:post_type", it) or "")
    if pt != "nav_menu_item":
        continue
    title = cd(find("title", it) or "")
    meta = all_postmeta(it)
    menus.append({
        "title": title,
        "url": meta.get("_menu_item_url", ""),
        "object": meta.get("_menu_item_object", ""),
        "object_id": meta.get("_menu_item_object_id", ""),
        "menu_item_parent": meta.get("_menu_item_menu_item_parent", ""),
        "position": int((find_ns("wp:menu_order", it) or "0").strip() or 0),
    })
menus.sort(key=lambda r: r["position"])
(OUT / "menus.json").write_text(json.dumps(menus, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"Wrote {len(pages)} pages, {len(posts)} posts, {len(menus)} menu items.")
print(f"Attachments indexed: {len(attachments_by_id)}")
