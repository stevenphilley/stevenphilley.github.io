# stevenphilley.com

Personal photography portfolio — static site hosted on GitHub Pages.

## Stack
Pure HTML + CSS + vanilla JS. No build tools, no dependencies, no framework.

## Aesthetic
90s editorial print — B&W with heavy borders, Bebas Neue display type, IBM Plex Mono body.
Click any image for the fullscreen lightbox viewer. Hover to reveal original color.

## Image sequence (warm → cool)
| File | Title | Subject |
|------|-------|---------|
| 01.jpg | Orchard, Last Light | Golden hour orchard sunset |
| 02.jpg | Storm Clearing | Stormy dusk silhouettes |
| 03.jpg | Bare Canopy | Pink/purple twilight orchard |
| 04.jpg | Filtered Fire | Sunset through bare branches |
| 05.jpg | Motion at Dark | Crimson motion-blur sky |
| 06.jpg | Sky Study | Blue sky / cloud transition |
| 07.jpg | Rock Spire | Pacific coast rock formation |
| 08.jpg | Limestone Shore | Santa Cruz beach and cliffs |
| 09.jpg | Pacific Terminus | Cliff over open ocean |

## File structure
```
stevenphilley.com/
├── index.html        ← single page, all content
├── style.css         ← all styles including lightbox
├── images/
│   └── 01–09.jpg
├── .gitignore
└── README.md
```

## Image prep recommendations
- Export width: 2400px long edge
- Format: JPEG, quality 85
- Color space: sRGB
- Strip GPS metadata before committing if desired

## Deploy to GitHub Pages

### Step 1 — Create the repo
1. Go to github.com → New repository
2. Name it exactly: `stevenphilley.com`
3. Set to **Public**
4. Do NOT initialize with a README (we have our own)
5. Click **Create repository**

### Step 2 — Push the files
Open Terminal in this folder and run:
```bash
git init
git add .
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stevenphilley.com.git
git push -u origin main
```
Replace `YOUR_USERNAME` with your GitHub username.

### Step 3 — Enable GitHub Pages
1. Go to the repo on GitHub
2. **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **(root)**
5. Click **Save**

GitHub will give you a URL like `https://YOUR_USERNAME.github.io/stevenphilley.com`

### Step 4 — Add custom domain
1. Still in **Settings → Pages**, enter `stevenphilley.com` under **Custom domain**
2. Click **Save** — this creates a `CNAME` file in the repo automatically

### Step 5 — Configure DNS
In your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

**A records** — point apex domain to GitHub:
```
@   A   185.199.108.153
@   A   185.199.109.153
@   A   185.199.110.153
@   A   185.199.111.153
```

**CNAME record** — www subdomain:
```
www   CNAME   YOUR_USERNAME.github.io
```

### Step 6 — Enforce HTTPS
Once DNS propagates (up to 48h), go back to **Settings → Pages** and check **Enforce HTTPS**.

## Adding images later
1. Add the file to `images/` with the next number (e.g. `10.jpg`)
2. Copy any `<figure>` block in `index.html` and update `src`, `alt`, and caption text
3. `git add . && git commit -m "Add image 10" && git push`
