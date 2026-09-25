# Computer history timeline

`data/computer-history.json` is the source for `/science/tech/computer-history/`. Edit the JSON, then run:

```bash
node js/computer-history.test.js
```

## Top level

- `eras` — reading-guide bands `{id, label, start, end}` in years. Negative years are BCE. The bands are sequential and conventional. An event keeps its own date even when that date falls outside the band people associate with the topic (the transistor is 1947; the Web proposal is 1989).
- `categories` — filter chips `{id, label, color}`.
- `lanes` — the Compare rows `{id, label}`: Hardware, Software, Networks, AI.
- `scale.stops` — `[year, position]` pairs. Position runs from 0 to 1 and must increase. The timeline interpolates between stops, so antiquity does not occupy the whole axis.
- `events` — the milestones.

## Event

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique slug. Deep link: `?e=<id>` |
| `date` | yes | Year `1642` or `-100`. Month `1971-11`. Day `1946-02-15`. |
| `precision` | yes | `year`, `month`, or `day`, matching how much of `date` is known. |
| `title` | yes | Short label. |
| `summary` | yes | One to three plain sentences. Do not invent dates, figures, or quotes. |
| `categories` | yes | One or more category ids. |
| `lane` | yes | One lane id, used by Compare. |
| `sources` | yes | At least one `{title, url}` with an `http` or `https` link to a real page. |
| `note` | no | Use when a date is disputed or the entry marks a start rather than a finish. |
| `site` | no | `{title, url}` links to other pages on this site, paths beginning with `/`. |

`?t=<year>` centers the timeline on a year (negative for BCE).
