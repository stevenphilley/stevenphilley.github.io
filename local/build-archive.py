#!/usr/bin/env python3
"""Merge local/news.json items into local/archive.json (cap 100) and regenerate HTML pages.

Usage:
  python3 build-archive.py --root /path/to/stevenphilley.github.io
  python3 build-archive.py --news news.json --archive archive.json --out-dir /path/to/repo

Writes:
  <root>/local/archive.json
  <root>/local/news/index.html
  <root>/local/news/<id>.html
  Updates id/url on <root>/local/news.json items when --root or --news points at the live file.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from datetime import datetime
from pathlib import Path

CAP = 100

PAGE_STYLE = r'''
body{background:var(--base-2,#14161c);color:var(--ink,#e8e6e1)}
.l-wrap{max-width:960px;margin:0 auto;padding:0 clamp(20px,5vw,64px) 72px}
.e-top{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:18px 0;border-bottom:1px solid var(--line,#2c303a);font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase}
.e-top a{color:var(--ink-soft,#9b9a96);text-decoration:none}
.e-top a:hover,.e-top a[aria-current="page"]{color:inherit}
.kicker{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent,#c8b48a);margin:28px 0 10px}
h1{font-family:"Bebas Neue",Impact,sans-serif;font-weight:400;font-size:clamp(40px,9vw,84px);line-height:.9;margin:0}
.lede{max-width:58ch;margin:16px 0 0;font-family:"IBM Plex Mono",monospace;font-size:13.5px;line-height:1.7;color:var(--ink-soft,#9b9a96)}
.lede a{color:var(--ink,#e8e6e1)}
.meta{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#63666e);margin:18px 0 0}
.body{margin-top:28px;border-top:1px solid var(--line,#2c303a);padding-top:18px;font-family:"IBM Plex Mono",monospace;font-size:14px;line-height:1.75;color:var(--ink-soft,#9b9a96);max-width:62ch}
.list{margin-top:28px;border-top:1px solid var(--line,#2c303a)}
.list a.item{display:block;border-bottom:1px solid var(--line,#2c303a);padding:14px 0;text-decoration:none;color:inherit}
.list a.item:hover .label{color:var(--accent,#c8b48a)}
.list .when{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent,#c8b48a);margin:0 0 4px}
.list .label{font-family:"Bebas Neue",Impact,sans-serif;font-size:22px;margin:0 0 6px;color:var(--ink,#e8e6e1)}
.list .snip{margin:0;font-family:"IBM Plex Mono",monospace;font-size:13px;line-height:1.65;color:var(--ink-soft,#9b9a96)}
.e-foot{margin-top:40px;padding-top:18px;border-top:1px solid var(--line,#2c303a);font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.1em;display:flex;gap:16px;flex-wrap:wrap}
.e-foot a{color:var(--ink-soft,#9b9a96);text-decoration:none}
.themes{display:flex;border:1px solid var(--line,#2c303a)}
.themes button{appearance:none;background:transparent;border:0;border-right:1px solid var(--line,#2c303a);color:var(--muted,#63666e);font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.1em;padding:5px 10px;cursor:pointer;text-transform:uppercase}
.themes button:last-child{border-right:0}
.themes button[aria-pressed="true"]{color:var(--base-2,#14161c);background:var(--ink,#e8e6e1)}
.back{display:inline-block;margin-top:22px;font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent,#c8b48a);text-decoration:none}
.back:hover{text-decoration:underline}
'''.strip()

THEME_BOOT = (
    "<script>(function(){try{var t=localStorage.getItem('sp-theme')||'neon';"
    "if(['neon','emerald','dusk','sage','tide','sand'].indexOf(t)>-1)"
    "document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>"
)

THEME_SCRIPT = """<script>
(function(){
  var KEY='sp-theme';
  var root=document.documentElement;
  var buttons=[].slice.call(document.querySelectorAll('[data-set-theme]'));
  function paint(){var c=root.getAttribute('data-theme')||'neon';buttons.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.setTheme===c));});}
  buttons.forEach(function(b){b.addEventListener('click',function(){root.setAttribute('data-theme',b.dataset.setTheme);try{localStorage.setItem(KEY,b.dataset.setTheme);}catch(e){}paint();});});
  paint();
})();
</script>"""

NAV = """  <div class="e-top">
    <a href="/">Steven Philley</a>
    <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      <a href="/local/">Local</a>
      <a href="/local/news/" {archive_current}>Archive</a>
      <a href="/family/">Family</a>
      <a href="/sitemap.html">Site contents</a>
      <div class="themes" role="group" aria-label="Color theme">
        <button type="button" data-set-theme="neon">Neon</button>
        <button type="button" data-set-theme="emerald">Emerald</button>
        <button type="button" data-set-theme="dusk">Dusk</button>
        <button type="button" data-set-theme="sage">Sage</button>
        <button type="button" data-set-theme="tide">Tide</button>
        <button type="button" data-set-theme="sand">Sand</button>
      </div>
    </div>
  </div>"""

FOOT = """  <footer class="e-foot">
    <a href="/local/">Local desk</a>
    <a href="/local/news/">Local news archive</a>
    <a href="/">Photography</a>
    <a href="/sitemap.html">Site contents</a>
  </footer>"""


def esc(s: str) -> str:
    return html.escape(str(s or ""), quote=True)


def slugify(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower())
    return re.sub(r"-+", "-", s).strip("-")[:72] or "item"


def extract_chp(text: str):
    m = re.search(r"CHP\s*#?\s*([0-9][0-9A-Za-z]{2,19})", text or "", re.I)
    if not m:
        return None
    tok = m.group(1)
    if re.match(r"^\d{3,5}$", tok):
        return tok
    if re.match(r"^\d{6,}", tok) or re.search(r"[A-Za-z]", tok):
        return tok.lower()
    m3 = re.match(r"^(\d{3,5})", tok)
    return m3.group(1) if m3 else None


def make_id(it: dict) -> str:
    if it.get("id"):
        return slugify(str(it["id"])) if False else str(it["id"])
    chp = extract_chp(it.get("text") or "")
    if chp:
        return f"chp-{slugify(chp)}"
    t = it.get("time") or ""
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})", t)
    if m:
        stamp = f"{m.group(1)}{m.group(2)}{m.group(3)}-{m.group(4)}{m.group(5)}"
    else:
        stamp = hashlib.sha1((it.get("text") or "").encode()).hexdigest()[:8]
    return f"{stamp}-{slugify(it.get('label'))}"


def pretty_time(iso: str) -> str:
    if not iso:
        return ""
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return d.strftime("%b %d · %I:%M %p").replace(" 0", " ") + " PT"
    except Exception:
        return iso


def load_archive(path: Path) -> dict:
    if not path.exists():
        return {"items": [], "cap": CAP}
    data = json.loads(path.read_text())
    if isinstance(data, list):
        return {"items": data, "cap": CAP}
    data.setdefault("items", [])
    data.setdefault("cap", CAP)
    return data


def merge(archive: dict, news_items: list) -> list:
    by_id = {}
    for it in archive.get("items") or []:
        if not isinstance(it, dict):
            continue
        iid = it.get("id") or make_id(it)
        entry = {
            "id": iid,
            "time": it.get("time"),
            "label": it.get("label"),
            "text": it.get("text"),
            "url": f"/local/news/{iid}.html",
        }
        if it.get("cleared") is not None:
            entry["cleared"] = it.get("cleared")
        by_id[iid] = entry

    for it in news_items or []:
        if not isinstance(it, dict):
            continue
        text = (it.get("text") or "").strip()
        if not text:
            continue
        iid = it.get("id") or make_id(it)
        entry = {
            "id": iid,
            "time": it.get("time"),
            "label": it.get("label"),
            "text": text,
            "url": f"/local/news/{iid}.html",
        }
        if it.get("cleared") is not None:
            entry["cleared"] = it.get("cleared")
        prev = by_id.get(iid)
        if prev:
            # Prefer longer / non-"still on board" text
            score = lambda x: len(x.get("text") or "") - (
                200 if re.search(r"still on board", x.get("text") or "", re.I) else 0
            )
            if score(entry) >= score(prev):
                # keep earliest time if both set
                if prev.get("time") and entry.get("time"):
                    entry["time"] = min(prev["time"], entry["time"])
                elif prev.get("time"):
                    entry["time"] = prev["time"]
                by_id[iid] = entry
            else:
                by_id[iid] = prev
        else:
            by_id[iid] = entry

    items = sorted(by_id.values(), key=lambda x: x.get("time") or "", reverse=True)
    return items[:CAP]


def head(title: str, desc: str, canonical: str, og_type: str = "article") -> str:
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="neon">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{esc(canonical)}">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Steven Philley">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{esc(canonical)}">
{THEME_BOOT}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<style>
{PAGE_STYLE}
</style>
</head>
<body>
<div class="l-wrap">
"""


def write_pages(out_dir: Path, items: list) -> None:
    news_dir = out_dir / "local" / "news"
    news_dir.mkdir(parents=True, exist_ok=True)

    # Remove stale item pages (keep index rebuild)
    for p in news_dir.glob("*.html"):
        if p.name != "index.html":
            p.unlink()

    idx_items = []
    for it in items:
        snip = it.get("text") or ""
        if len(snip) > 160:
            snip = snip[:157].rsplit(" ", 1)[0] + "…"
        idx_items.append(
            f'<a class="item" href="/local/news/{esc(it["id"])}.html">'
            f'<p class="when">{esc(pretty_time(it.get("time")))}</p>'
            f'<h2 class="label">{esc(it.get("label"))}</h2>'
            f'<p class="snip">{esc(snip)}</p></a>'
        )

    index_html = (
        head(
            "Local news archive — Steven Philley",
            "Archived Campbell-area local desk items — traffic and safety notes, newest first.",
            "https://stevenphilley.com/local/news/",
            og_type="website",
        )
        + NAV.format(archive_current='aria-current="page"')
        + f"""
  <p class="kicker">Campbell · 95008</p>
  <h1>Local news</h1>
  <p class="lede">Archive of Campbell-area desk items from the Local hub. Up to 100 kept, newest first. Live desk stays on <a href="/local/">/local/</a>.</p>
  <p class="meta">{len(items)} archived item{'s' if len(items) != 1 else ''}</p>
  <div class="list">
    {''.join(idx_items)}
  </div>
{FOOT}
</div>
{THEME_SCRIPT}
</body>
</html>
"""
    )
    (news_dir / "index.html").write_text(index_html)

    for it in items:
        title = f"{it.get('label')} — Local news"
        desc = (it.get("text") or "")[:155]
        page = (
            head(title, desc, f"https://stevenphilley.com/local/news/{it['id']}.html")
            + NAV.format(archive_current="")
            + f"""
  <p class="kicker">Local news · archive</p>
  <h1>{esc(it.get('label'))}</h1>
  <p class="meta">{esc(pretty_time(it.get('time')))} · id {esc(it['id'])}</p>
  <div class="body"><p>{esc(it.get('text'))}</p></div>
  <a class="back" href="/local/news/">← All local news</a>
  <a class="back" href="/local/" style="margin-left:18px">Local desk</a>
{FOOT}
</div>
{THEME_SCRIPT}
</body>
</html>
"""
        )
        (news_dir / f"{it['id']}.html").write_text(page)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, help="Site root containing local/")
    ap.add_argument("--news", type=Path, help="Path to news.json")
    ap.add_argument("--archive", type=Path, help="Path to archive.json")
    ap.add_argument("--out-dir", type=Path, help="Site root for HTML output")
    ap.add_argument("--no-pages", action="store_true", help="Only update archive.json")
    args = ap.parse_args()

    root = args.root
    news_path = args.news or (root / "local" / "news.json" if root else None)
    archive_path = args.archive or (root / "local" / "archive.json" if root else None)
    out_dir = args.out_dir or root
    if not news_path or not archive_path or not out_dir:
        ap.error("Provide --root or --news/--archive/--out-dir")

    news = json.loads(news_path.read_text())
    archive = load_archive(archive_path)
    items = merge(archive, news.get("items") or [])

    # Stamp id/url back onto live news items
    by_id_text = {((it.get("text") or "").strip()): it for it in items}
    for it in news.get("items") or []:
        match = by_id_text.get((it.get("text") or "").strip())
        if not match:
            iid = make_id(it)
            match = next((x for x in items if x["id"] == iid), None)
        if match:
            it["id"] = match["id"]
            it["url"] = match["url"]

    news["_archive"] = {
        "path": "/local/archive.json",
        "index": "/local/news/",
        "cap": CAP,
        "note": "Merge new items into archive.json (dedupe by id), cap 100, regenerate pages. See local/NEWS_ARCHIVE.md.",
    }

    payload = {
        "updated": news.get("updated") or datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": news.get("source") or archive.get("source") or "Local",
        "cap": CAP,
        "count": len(items),
        "note": "Historical local desk items, newest first. See local/NEWS_ARCHIVE.md.",
        "items": items,
    }
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    archive_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    news_path.write_text(json.dumps(news, indent=2, ensure_ascii=False) + "\n")

    if not args.no_pages:
        write_pages(out_dir, items)

    print(f"archive={len(items)} pages={'no' if args.no_pages else 'yes'} -> {archive_path}")


if __name__ == "__main__":
    main()
