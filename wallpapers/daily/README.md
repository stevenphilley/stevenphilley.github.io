# Daily wallpapers

The wallpapers page loads this folder. A daily job adds an image (and an optional thumb) here and appends one object to `manifest.json`. It does not need to edit `wallpapers/index.html`.

```
wallpapers/daily/
  manifest.json
  YYYY-MM-DD.jpg
  YYYY-MM-DD-thumb.jpg   # optional
```

## manifest.json

```json
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "file": "YYYY-MM-DD.jpg",
      "thumb": "YYYY-MM-DD-thumb.jpg",
      "title": "Short title",
      "description": "One sentence",
      "width": 0,
      "height": 0,
      "source": "grok-imagine",
      "credit": "Generated with Grok Imagine"
    }
  ]
}
```

`items` may be an empty array. The page then shows a waiting state instead of a hero.

| Field | Required | Notes |
| --- | --- | --- |
| `date` | yes | `YYYY-MM-DD`. Newest date is today's wallpaper. The rest are the archive, newest first. |
| `file` | yes | Filename only, in this folder. No paths. |
| `title` | yes | Short title. |
| `description` | yes | One sentence. |
| `source` | yes | `grok-imagine`. |
| `credit` | yes | `Generated with Grok Imagine`. The page always shows that label. |
| `thumb` | no | Filename only. The grid uses it when present, otherwise the full image. |
| `width` | no | Pixel width. Omit, or use `0`, when unknown. The page reads the file. |
| `height` | no | Pixel height. Same as `width`. |

Use one entry per date. If two entries share a date, the page still features a single hero and archives the other.

Filenames may contain letters, numbers, dots, hyphens, and underscores. Do not commit placeholder images.
