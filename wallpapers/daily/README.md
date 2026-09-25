# Wallpapers manifest

The wallpapers page loads this folder. Add an image (and an optional thumb) here and append one object to `manifest.json`. Do not edit `wallpapers/index.html` for a new image.

```
wallpapers/daily/
  manifest.json
  YYYY-MM-DD.jpg
  nature-01-slug.jpg
  nature-01-slug-thumb.jpg   # optional
```

Filenames are not dates. Any name in this folder is fine, for example `2026-09-25.jpg` or `nature-01-slug.jpg`. Use letters, numbers, dots, hyphens, and underscores. No folders and no `..`.

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
      "credit": "Generated with Grok Imagine",
      "category": "nature",
      "daily": true
    }
  ]
}
```

`items` may be an empty array. The page then shows a waiting state instead of a hero.

| Field | Required | Notes |
| --- | --- | --- |
| `date` | yes | `YYYY-MM-DD`. Many collection images may share a date — the day they were added. |
| `file` | yes | Filename only, in this folder. Not necessarily the date. |
| `title` | yes | Short title. |
| `description` | yes | One sentence. |
| `source` | yes | `grok-imagine`. |
| `credit` | yes | `Generated with Grok Imagine`. The page always shows that label. |
| `thumb` | no | Filename only. The archive uses it when present, otherwise the full image. |
| `width` | no | Pixel width. Omit, or use `0`, when unknown. The page reads the file. Current images are 1792×1008. |
| `height` | no | Pixel height. Same as `width`. |
| `category` | no | Optional slug. Known chips: `nature`, `sci-fi`, `swimwear`, `fedora`, `cityscapes` (Cityscapes), `underwater` (Underwater), `abstract` (Abstract). Any other slug of letters, numbers, and hyphens still gets a title-cased chip when the archive has at least one image in it. Omit when the image is not in a collection. |
| `daily` | no | `true` or `false`. Omit or use `false` for collection images. |

The archive sorts newest `date` first. Images with the same date keep the order they appear in `items`.

Today's wallpaper is the newest item with `daily` set to `true`. If none is marked daily, the newest item is shown there instead. The rest of the list is the archive. Chips are All, Daily, then Nature, Sci-fi, Swimwear, Fedora, Cityscapes, Underwater, and Abstract when those categories have archive images, then any other category present in the list. A category with no images stays hidden. The address keeps the choice, for example `?c=fedora`. The page intro stays general (“and other collections”) so new chips do not require a rewrite.

An item with category `fedora` also shows this line in its detail: "Fedora-inspired, not official Fedora Project artwork. Fedora is a trademark of Red Hat, Inc."

Do not commit placeholder images.
