# Local news archive

The live desk at `/local/` reads `/local/news.json` (current board only — typically a handful of active items).

Longer history lives in:

- `/local/archive.json` — up to **100** items, newest first
- `/local/news/` — HTML index
- `/local/news/<id>.html` — one page per archived item

## Item shape (`archive.json`)

```json
{
  "id": "chp-2435",
  "time": "2026-09-09T19:27:00-07:00",
  "label": "SR-17 NB · SR-9",
  "text": "…",
  "url": "/local/news/chp-2435.html",
  "cleared": false
}
```

### Stable `id` rules

1. If the text mentions a CHP number (`CHP 2435` or `CHP #2435`), use `chp-<number>` (or the CAD token if it is alphanumeric).
2. Otherwise use `<YYYYMMDD-HHMM>-<slug(label)>` from the item `time` + `label`.

## Publisher workflow

When you publish a new `news.json` desk feed:

1. For each `items[]` entry, compute its `id` (rules above).
2. If that `id` is already in `archive.json`, update `text` / `label` / `time` if the new copy is better; keep position by time.
3. If new, **prepend** (or insert by `time` descending).
4. Cap at **100** (drop oldest).
5. Set `id` + `url` on the live `news.json` items so the desk can link.
6. Regenerate `/local/news/index.html` and `/local/news/<id>.html` (themes: neon…sand like the Local hub).

Helper script (box / workspace):

```bash
python3 /workspace/local/build-archive.py \
  --news /path/to/news.json \
  --archive /path/to/archive.json \
  --out-dir /path/to/site-root
```

Or from this repo after editing JSON:

```bash
python3 local/build-archive.py --root .
```

Seed history: reconstructed from public git commits that touched `local/news.json` on 2026-09-09 (Campbell feeds), deduped by CHP / label+hour.
