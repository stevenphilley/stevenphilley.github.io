# Social preview patches

Everything needed to make stevenphilley.com unfurl properly on Mastodon, Slack,
Discord, Signal and iMessage. Two halves: the Jekyll pages get an include, the
seven standalone pages get a hand-pasted block.

---

## 1. `_config.yml` — append

```yaml
# --- Site identity, used by _includes/meta.html ---
url: "https://stevenphilley.com"
baseurl: ""

title: "Steven Philley"
description: "Landscape photography and a small shelf of browser tools, each built as a single file with no dependencies."

# Fallback card image for any page that doesn't set its own
og_image: "/images/og/og-home.png"
og_image_alt: "A dusk-toned card reading Steven Philley, Photography."
og_image_width: 1200
og_image_height: 630

# Mastodon 4.3+ author byline. Replace with your real handle, including both @s.
fediverse_creator: "@yourhandle@mastodon.social"

theme_color: "#1c1a24"
```

One thing to check: `title` here becomes `og:site_name`, so it should be the site
name (`Steven Philley`), not a page name. If `_config.yml` currently sets
`title: Photography — Steven Philley`, move that string into `index.html`'s front
matter instead, or the `<title>` on every future page will inherit it.

---

## 2. `_layouts/default.html`

Drop the include inside `<head>`, after the charset and viewport lines:

```liquid
{% include meta.html %}
```

Then delete whatever `<meta name="description">`, `<link rel="canonical">`,
`og:*` and `twitter:*` lines are already in there — the include emits all of
them and duplicates confuse some scrapers. Keep the existing `<title>` tag; the
include deliberately doesn't emit one.

---

## 3. `index.html` front matter

```yaml
---
layout: default
title: "Photography — Steven Philley"
description: "Nine landscape photographs from the Northern California coast and countryside, sequenced warm to cool. Hover any frame to reveal its original color."
image: "/images/01.jpg"
image_alt: "Orchard at sunset, orange and pink sky"
image_width: 1600
image_height: 1067
---
```

Set `image_width` / `image_height` to the real pixel dimensions of `01.jpg` —
those two numbers are how Mastodon decides between a large banner card and a
small thumbnail. Anything at least 400px wide and wider than it is tall gets the
big treatment. If the file is over 2 MB, export a smaller copy for the card.

---

## 4. Standalone pages

These don't run through Jekyll, so each one gets a literal block. Paste inside
`<head>`, and delete any existing `<meta name="description">` line first.

### `sitemap.html`

```html
<meta name="description" content="An index of everything on stevenphilley.com — one photography portfolio and six browser tools, each a single file with no dependencies.">
<link rel="canonical" href="https://stevenphilley.com/sitemap.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Steven Philley">
<meta property="og:title" content="Contents — stevenphilley.com">
<meta property="og:description" content="An index of everything on stevenphilley.com — one photography portfolio and six browser tools, each a single file with no dependencies.">
<meta property="og:url" content="https://stevenphilley.com/sitemap.html">
<meta property="og:image" content="https://stevenphilley.com/images/og/og-sitemap.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Card reading Contents, the index of stevenphilley.com.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Contents — stevenphilley.com">
<meta name="twitter:description" content="One portfolio and six tools. Every page runs entirely in the browser.">
<meta name="twitter:image" content="https://stevenphilley.com/images/og/og-sitemap.png">
<meta name="fediverse:creator" content="@yourhandle@mastodon.social">
```

### `circular-calendar.html`

```html
<meta name="description" content="A calendar built like a clock. Read the whole year as one engraved dial, or switch to a single month with live hands.">
<link rel="canonical" href="https://stevenphilley.com/circular-calendar.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Steven Philley">
<meta property="og:title" content="Annual Dial — a calendar built like a clock">
<meta property="og:description" content="Read the whole year as one engraved dial, or switch to a single month with live hands. Click any day to mark it.">
<meta property="og:url" content="https://stevenphilley.com/circular-calendar.html">
<meta property="og:image" content="https://stevenphilley.com/images/og/og-circular-calendar.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Card reading Annual Dial, a calendar built like a clock.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Annual Dial — a calendar built like a clock">
<meta name="twitter:description" content="Read the whole year as one engraved dial, or switch to a single month with live hands.">
<meta name="twitter:image" content="https://stevenphilley.com/images/og/og-circular-calendar.png">
<meta name="fediverse:creator" content="@yourhandle@mastodon.social">
```

### `marketpulse.html`

```html
<meta name="description" content="A finance terminal in the browser. Live crypto prices with a scrolling ticker, index snapshots, and business headlines pulled from seven feeds.">
<link rel="canonical" href="https://stevenphilley.com/marketpulse.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Steven Philley">
<meta property="og:title" content="MarketPulse — a finance terminal">
<meta property="og:description" content="Live crypto prices with a scrolling ticker, index snapshots, and business headlines pulled from seven feeds.">
<meta property="og:url" content="https://stevenphilley.com/marketpulse.html">
<meta property="og:image" content="https://stevenphilley.com/images/og/og-marketpulse.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Card reading MarketPulse, a finance terminal.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="MarketPulse — a finance terminal">
<meta name="twitter:description" content="Live crypto prices, index snapshots, and business headlines from seven feeds.">
<meta name="twitter:image" content="https://stevenphilley.com/images/og/og-marketpulse.png">
<meta name="fediverse:creator" content="@yourhandle@mastodon.social">
```

### `percent-calculator.html`

```html
<meta name="description" content="Three kinds of percentage math in one place — what a percent of a number is, what one number is as a percent of another, and the change between two figures.">
<link rel="canonical" href="https://stevenphilley.com/percent-calculator.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Steven Philley">
<meta property="og:title" content="Percentages — three kinds of percent math">
<meta property="og:description" content="Percent of a number, one number as a percent of another, and the change between two figures. Results update as you type.">
<meta property="og:url" content="https://stevenphilley.com/percent-calculator.html">
<meta property="og:image" content="https://stevenphilley.com/images/og/og-percent-calculator.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Card reading Percentages, three kinds of percent math.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Percentages — three kinds of percent math">
<meta name="twitter:description" content="Percent of a number, one number as a percent of another, and the change between two figures.">
<meta name="twitter:image" content="https://stevenphilley.com/images/og/og-percent-calculator.png">
<meta name="fediverse:creator" content="@yourhandle@mastodon.social">
```

### `pomodoro.html`

```html
<meta name="description" content="A focus timer with three sessions — pomodoro, short break, long break — each with its own color. Set your own durations, and a chime marks the end of every round.">
<link rel="canonical" href="https://stevenphilley.com/pomodoro.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Steven Philley">
<meta property="og:title" content="Pomodoro — a focus timer">
<meta property="og:description" content="Three sessions, each with its own color. Set your own durations, and a chime marks the end of every round.">
<meta property="og:url" content="https://stevenphilley.com/pomodoro.html">
<meta property="og:image" content="https://stevenphilley.com/images/og/og-pomodoro.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Card reading Pomodoro, a focus timer.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Pomodoro — a focus timer">
<meta name="twitter:description" content="Three sessions, each with its own color, and a chime at the end of every round.">
<meta name="twitter:image" content="https://stevenphilley.com/images/og/og-pomodoro.png">
<meta name="fediverse:creator" content="@yourhandle@mastodon.social">
```

### `typing-tutor.html`

```html
<meta name="description" content="A quiet typing tutor. Three difficulty levels, a beginner mode that drills the keys you choose, and a pace chart with words per minute and accuracy at the end of every run.">
<link rel="canonical" href="https://stevenphilley.com/typing-tutor.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Steven Philley">
<meta property="og:title" content="Stilltype — a quiet typing tutor">
<meta property="og:description" content="Three difficulty levels, a beginner mode that drills the keys you choose, and a pace chart with words per minute and accuracy at the end of every run.">
<meta property="og:url" content="https://stevenphilley.com/typing-tutor.html">
<meta property="og:image" content="https://stevenphilley.com/images/og/og-typing-tutor.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Card reading Stilltype, a quiet typing tutor.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Stilltype — a quiet typing tutor">
<meta name="twitter:description" content="Three difficulty levels, a beginner mode for the keys you choose, and a pace chart after every run.">
<meta name="twitter:image" content="https://stevenphilley.com/images/og/og-typing-tutor.png">
<meta name="fediverse:creator" content="@yourhandle@mastodon.social">
```

Stilltype has a share-your-result link already. If you ever want the shared URL
to carry the score into the card, that needs a server or a prerender step —
Mastodon reads raw HTML and never runs your JavaScript, so a client-side
`document.title` rewrite won't reach it.

### `chakras/index.html`

```html
<meta name="description" content="The nine chakras of the tantric subtle body — name, meaning, element, seed sound, and the qualities each governs, with petal marks drawn to scale.">
<link rel="canonical" href="https://stevenphilley.com/chakras/">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Steven Philley">
<meta property="og:title" content="Nine Chakras — the tantric subtle body">
<meta property="og:description" content="Name, meaning, element, seed sound, and the qualities each governs, with a sticky scroll-spy rail and petal marks drawn to scale.">
<meta property="og:url" content="https://stevenphilley.com/chakras/">
<meta property="og:image" content="https://stevenphilley.com/images/og/og-chakras.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Card reading Nine Chakras, the tantric subtle body.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Nine Chakras — the tantric subtle body">
<meta name="twitter:description" content="Name, meaning, element, seed sound, and the qualities each governs.">
<meta name="twitter:image" content="https://stevenphilley.com/images/og/og-chakras.png">
<meta name="fediverse:creator" content="@yourhandle@mastodon.social">
```

---

## 5. Card images

Open `og-cards.html` from the repo root, check the four color swatches look
right, then **Download all**. Save the PNGs into `/images/og/`. The filenames
match the `og:image` paths above.

The generator reads the Dusk tokens straight out of `style.css` by probing a
list of likely custom property names. If it reports that it fell back to the
built-in palette, the swatches are still editable and everything repaints live —
or tell me the actual token names and I'll wire them in directly.

---

## 6. Two things about Mastodon specifically

**The `fediverse:creator` trade-off.** It puts a "More from @you" byline under
the card, which is the single most distinctive thing you can add. But it needs
setup on the Mastodon side — Preferences → Public Profile → Verification →
Author attribution, listing `stevenphilley.com` — and there's a long-standing
open issue where the byline renders *instead of* the description rather than
alongside it. If the description matters more to you than the byline, leave the
`fediverse:creator` lines out and everything else still works.

**Caching.** Mastodon holds a preview card for roughly two weeks, per instance.
Testing on a URL you've already posted will show the old bare card no matter
what you push. Test with `https://stevenphilley.com/typing-tutor.html?v=2` or a
page you haven't shared before.

A third-party unfurl previewer such as opengraph.xyz will confirm the tags are
being served, but the most useful check is posting a fresh link on your own
instance and looking at the result.
