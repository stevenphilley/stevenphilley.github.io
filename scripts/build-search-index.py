#!/usr/bin/env python3
"""Rebuild search/index.json and sitemap.xml from the HTML pages in this repo.

GitHub Pages serves the committed files. It does not run this script.
After adding, removing, or retitling a page:

    python3 scripts/build-search-index.py

Redirect stubs, pages marked noindex, and 404.html are omitted.
Keyword lists from the previous search/index.json are kept, so a term that
lives only in keywords (for example "sensory" on the HSP page) still matches.
"""

from __future__ import annotations

import json
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://stevenphilley.com"
OLD_INDEX = ROOT / "search" / "index.json"
SKIP_PARTS = {"_includes", "_layouts", "_site", "scripts"}
STOP = {
    "a", "an", "the", "and", "or", "of", "to", "for", "in", "on", "at", "by",
    "with", "from", "this", "that", "is", "are", "be", "as", "it", "its",
    "page", "steven", "philley",
}

TITLE_SUFFIX = re.compile(
    r"\s+[—–\-|]\s+(Steven Philley|stevenphilley\.com)\s*$",
    re.I,
)


class MetaGrab(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.in_title = False
        self.description = ""
        self.canonical = ""
        self.robots = ""
        self.refresh = ""

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            name = (a.get("name") or a.get("property") or "").lower()
            content = a.get("content") or ""
            if name == "description" and not self.description:
                self.description = content
            elif name == "robots":
                self.robots = content
            elif (a.get("http-equiv") or "").lower() == "refresh":
                self.refresh = content
        elif tag == "link" and (a.get("rel") or "").lower() == "canonical":
            self.canonical = a.get("href") or ""

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data)


def public_path(rel: Path) -> str:
    posix = rel.as_posix()
    if posix == "index.html":
        return "/"
    if posix.endswith("/index.html"):
        return "/" + posix[: -len("index.html")]
    return "/" + posix


def is_redirect(meta: MetaGrab, text: str) -> bool:
    refresh = (meta.refresh or "").strip().lower()
    if refresh.startswith("0;") or refresh.startswith("0 ;"):
        return True
    if "location.replace(" in text and (
        "Moved to" in text or "This offer moved" in text
    ):
        return True
    return False


def clean_title(raw: str, fallback: str) -> str:
    title = re.sub(r"\s+", " ", raw).strip()
    title = TITLE_SUFFIX.sub("", title).strip()
    return title or fallback


def section_for(url: str) -> str:
    parts = [p for p in url.split("/") if p]
    if not parts:
        return "Photography"
    head = parts[0]
    names = {
        "wallpapers": "Photography",
        "publicphotos": "Photography",
        "local": "Local",
        "science": "Science",
        "maths": "Science",
        "electronics": "Electronics",
        "tools": "Tools",
        "markets": "Markets",
        "games": "Games",
        "game": "Games",
        "news": "News",
        "whats-new": "Latest",
        "about": "About",
        "quotes": "About",
        "health": "Health",
        "search": "Search",
        "themes": "Themes",
        "bbs": "BBS",
        "film": "Film",
        "filmstudies": "Film",
        "history": "History",
        "family": "Family",
        "extra": "Extra",
        "suggest": "Suggest",
        "suggestions": "Suggest",
        "power": "Power",
        "reader": "Reader",
        "dissertation": "Dissertation",
        "chakras": "Chakras",
        "weather": "Weather",
    }
    if head in names:
        return names[head]
    if head.endswith(".html"):
        return "Pages"
    return head.replace("-", " ").title()


def keyword_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        parts = value.split()
    elif isinstance(value, list):
        parts = []
        for item in value:
            parts.extend(str(item).split())
    else:
        parts = [str(value)]
    out = []
    seen = set()
    for part in parts:
        token = part.strip().lower()
        if len(token) < 2 or token in STOP or token in seen:
            continue
        seen.add(token)
        out.append(token)
    return out


def load_old_keywords() -> dict[str, list[str]]:
    if not OLD_INDEX.is_file():
        return {}
    data = json.loads(OLD_INDEX.read_text(encoding="utf-8"))
    pages = data.get("pages") if isinstance(data, dict) else data
    found = {}
    if not isinstance(pages, list):
        return found
    for page in pages:
        if not isinstance(page, dict):
            continue
        url = page.get("url")
        if not url:
            continue
        words = keyword_list(page.get("keywords"))
        if words:
            found[url] = words
    return found


def generated_keywords(title: str, url: str) -> list[str]:
    blob = title + " " + url.replace("/", " ").replace("-", " ").replace(".html", " ")
    return keyword_list(blob)[:16]


def iter_pages():
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if any(part in SKIP_PARTS or part.startswith("_") for part in rel.parts):
            continue
        if rel.name == "404.html":
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        # Drop leading Jekyll front matter so the title parser sees HTML.
        body = text
        if body.startswith("---"):
            end = body.find("\n---", 3)
            if end != -1:
                body = body[end + 4 :]
        meta = MetaGrab()
        meta.feed(body)
        if "noindex" in meta.robots.lower():
            continue
        if is_redirect(meta, body):
            continue
        url = public_path(rel)
        canon = (meta.canonical or "").strip()
        if canon.startswith(SITE):
            url = canon[len(SITE) :] or "/"
            if not url.startswith("/"):
                url = "/" + url
        title = clean_title("".join(meta.title_parts), url.strip("/") or "Photography")
        description = re.sub(r"\s+", " ", meta.description).strip()
        if len(description) > 320:
            description = description[:317].rstrip() + "…"
        yield url, title, description


def main() -> None:
    old_kw = load_old_keywords()
    pages = []
    seen = set()
    for url, title, description in iter_pages():
        if url in seen:
            continue
        seen.add(url)
        keywords = old_kw.get(url) or generated_keywords(title, url)
        pages.append(
            {
                "title": title,
                "url": url,
                "description": description,
                "section": section_for(url),
                "keywords": keywords,
            }
        )
    pages.sort(key=lambda p: (p["url"] != "/", p["url"]))
    index = {
        "generated": date.today().isoformat(),
        "site": SITE,
        "count": len(pages),
        "pages": pages,
    }
    OLD_INDEX.write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    locs = []
    for page in pages:
        locs.append(f"  <url><loc>{SITE}{page['url']}</loc></url>")
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(locs)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print(f"Wrote {len(pages)} pages to search/index.json and sitemap.xml")


if __name__ == "__main__":
    main()
