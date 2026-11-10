# Pages of Us 📖

A private, book-style website for Cheena: the story of us, told in chapters, with our photos tucked between the pages.

- **Desktop / tablet (wide screens):** a real two-page book you can turn with the ← → keys, by clicking a page, or by dragging a corner.
- **Phones:** one comfortable scrolling column, no cramped page flips. (On desktop she can switch to this too with the 📄 button.)
- Locked-diary password screen, cover with an opening animation, dedication, contents, chapters, a closing letter, and “To be continued…”.
- Extras: a timeline of firsts, a map of places we've been, and a gallery of every photo.
- Night-reading mode 🌙, an optional page-turn sound 🔈, and **“Continue reading”**, which remembers where she stopped on her device.

---

## Contents

1. [Quick start](#1-quick-start)
2. [Where everything lives](#2-where-everything-lives)
3. [Writing a chapter](#3-writing-a-chapter)
4. [Adding photos](#4-adding-photos)
5. [Dedication & closing letter](#5-dedication--closing-letter)
6. [Timeline, map & gallery](#6-timeline-map--gallery)
7. [Settings: title, names, password, colours](#7-settings-title-names-password-colours)
8. [Deploying for free](#8-deploying-for-free) (Netlify · Vercel · GitHub Pages)
9. [Privacy notes](#9-privacy-notes)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Quick start

You need [Node.js](https://nodejs.org) **22.23 or newer** (download the “LTS” version).

```bash
npm install
```

```bash
npm run dev
```

Open the address it prints (usually http://localhost:4321). The diary answer is set in `src/config.ts`.
The page refreshes automatically every time you save a file.

To produce the final website files (into `dist/`):

```bash
npm run build
```

**Why Astro?** It reads the Markdown chapters for you, checks the frontmatter for typos, and turns big phone photos into small, fast AVIF/WebP images at several sizes, all automatically at build time. The finished site is plain static HTML, so Netlify, Vercel or GitHub Pages can host it free.

---

## 2. Where everything lives

```
content/
  chapters/           ← one .md file per chapter (this is where you write)
  dedication.md       ← the dedication page
  closing-letter.md   ← the letter at the end
  firsts.yaml         ← timeline of "firsts"
  places.yaml         ← map pins
  gallery.yaml        ← (optional) captions/descriptions for gallery photos
photos/               ← drop your photos here (any size)
src/config.ts         ← title, names, password, which extras are on, defaults
src/styles/global.css ← colours & fonts (top of the file)
```

You will rarely need to touch anything else.

---

## 3. Writing a chapter

Create a new file in `content/chapters/`, e.g. `07-our-first-trip.md`:

```markdown
---
title: Our First Trip
subtitle: Mountains, cold air, warm chai
date: 2026-08-15
order: 7
cover: ../../photos/trip-1.jpg
coverAlt: Cheena laughing on the hotel balcony
coverCaption: the view (and the view)
epigraph: Optional short quote shown under the title.
epigraphSource: Optional author
---

Your story starts here. The first letter automatically becomes a big decorative drop cap.

Leave a blank line between paragraphs.
```

That's it. The new chapter appears in the book and in the table of contents, with page numbers worked out for you.

| Field | Needed? | What it does |
|---|---|---|
| `title` | yes | Chapter title |
| `subtitle` | no | Italic line under the title |
| `date` | yes | `YYYY-MM-DD`. Shown as “21 May 2026 · Day 1” (Day 1 = `togetherSince` in config) |
| `order` | yes | Chapter number / position (1, 2, 3…) |
| `cover` | no | Photo on the chapter's opening page (path from the chapter file to the photo) |
| `coverAlt` | no | Short description of the cover photo for screen readers |
| `coverCaption` | no | Handwritten caption under the cover photo |
| `epigraph`, `epigraphSource` | no | A small quote on the opening page |
| `draft: true` | no | Hides the chapter while you're still writing it |

### Little extras you can use in your writing

| You type | You get |
|---|---|
| `==Jind==` | the word with a soft pink highlighter swipe (used for pet names) |
| `*italic*` | *italic* |
| `<aside>Your note here</aside>` | a handwritten “margin note” in rose ink |
| `---` on its own line | a decorative ❦ section break |
| `> a quote` | an indented italic quote |

The `<!-- … -->` blocks at the top of each placeholder chapter are writing prompts. They are invisible on the site, so delete them whenever you like.

---

## 4. Adding photos

1. Put the photo files in `photos/` (JPG, PNG, WebP or AVIF; straight from your phone is fine).
2. In a chapter, add a photo on its own line:

```markdown
![Short description of the photo](../../photos/dinner.jpg "handwritten caption")
```

- The text in `[...]` is the **alt text**: a short description for screen readers. Please always fill it in.
- The text in `"..."` becomes the **handwritten caption** under the polaroid. It's optional.
- **Two or more photos on the same line** sit side-by-side as a little pair of polaroids:

```markdown
![Us at dinner](../../photos/a.jpg "the table") ![The dessert](../../photos/b.jpg "dessert first")
```

Each photo becomes a slightly tilted polaroid with a strip of washi tape. Tapping one opens it large (a lightbox).

**Automatic optimisation:** when the site is built, every photo is resized into several widths and converted to WebP/AVIF. Photos lazy-load, and location data (GPS) in the original file is stripped from the published versions. Your originals are never changed.

**Placeholders:** the `placeholder-01.jpg … placeholder-12.jpg` files are just stand-ins. Replace the references in the chapters with your own photos, then delete the placeholders. (If you ever want them back, run `npm run placeholders`.)

> 💡 **iPhone photos (.HEIC)** aren't supported. Either set *Settings → Camera → Formats → Most Compatible*, or AirDrop/export them as JPG first.

---

## 5. Dedication & closing letter

- `content/dedication.md`: the words on the dedication page. Each line break you leave with a blank line becomes a new line.
- `content/closing-letter.md`: the letter just before the end. `title` is its heading and `signoff` is the handwritten line at the bottom (e.g. `Forever yours, Akam`).

Both are placeholder text right now. Replace them with your own words.

---

## 6. Timeline, map & gallery

All three are linked from the contents page (“Tucked in the back”) and from the ☰ menu.

**Timeline**: `content/firsts.yaml`:
```yaml
- date: 2026-05-21
  title: First official date
  note: The day we became us.
  photo: ../photos/first-date.jpg   # optional
  photoAlt: The two of us at dinner # optional
```

**Map**: `content/places.yaml`. To find coordinates, right-click a spot on [openstreetmap.org](https://www.openstreetmap.org) → “Show address” and copy the two numbers. The map zooms itself to fit all your pins and joins them with a dashed line in date order.
```yaml
- name: The café we keep going back to
  lat: 30.7525
  lng: 76.8101
  date: 2026-06-15
  note: Two chais, always.
```
> The current pins are **placeholders** (near Chandigarh). Replace them with your real places.

**Gallery**: shows every photo in `photos/` automatically. Optionally give photos a description/caption in `content/gallery.yaml`:
```yaml
dinner.jpg:
  alt: Cheena laughing at dinner
  caption: that laugh
```

Turn any of these off in `src/config.ts` → `sections`.

---

## 7. Settings: title, names, password, colours

Open **`src/config.ts`**:

- `book.title`, `book.subtitle`, `book.names`, `book.author`, `book.coverNote`
- `book.togetherSince`: the date that counts as “Day 1”
- `book.toBeContinued` / `book.nextVolumeNote`: the last page
- `gate.question`, `gate.hint`, `gate.answer`: the locked diary
  - Capitals, spaces and punctuation are ignored when she types the answer.
  - The hint appears after two wrong tries.
  - Only a scrambled fingerprint (hash) of the answer is published, never the answer itself.
  - `rememberDevice: true` keeps it unlocked on her phone after the first time.
- `sections`: switch the timeline / map / gallery on or off
- `reading.soundOnByDefault`, `reading.defaultTheme`

**Colours & fonts** are at the top of `src/styles/global.css` (`--paper`, `--ink`, `--rose-ink`, `--cover`, `--foil`…). The current palette is dusty rose and ink navy. The fonts are EB Garamond (body), Playfair Display (titles, a nod to the glamorous covers of Taylor Jenkins Reid's novels) and Caveat (handwriting). All of them are self-hosted, so no requests go to Google.

**Volume II later?** Keep adding chapters. When you're ready for a new volume, change `subtitle` to “Volume II · …”, update `toBeContinued`, and carry on.

---

## 8. Deploying for free

First, push this project to your **private** GitHub repository.

### Option A: Netlify (recommended)

1. Go to [app.netlify.com](https://app.netlify.com) and sign up with GitHub (free).
2. **Add new site → Import an existing project → GitHub**, then pick this repository. (Netlify asks for permission to see private repos; allow it for this one.)
3. Netlify reads `netlify.toml` automatically (build command `npm run build`, publish folder `dist`). Click **Deploy**.
4. When it's done you get an address like `https://random-name-123.netlify.app`. Change it under **Site configuration → Change site name**, e.g. `pages-of-us-cheena`.
5. From now on, every push to GitHub updates the site automatically.

*No-GitHub alternative:* run `npm run build` locally, then drag the `dist` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

### Option B: Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub (free “Hobby” plan).
2. **Add New → Project**, then import this repository.
3. Vercel detects Astro (settings are in `vercel.json`). Click **Deploy**.
4. You get an address like `https://pages-of-us.vercel.app`, and every push redeploys.

### Option C: GitHub Pages

⚠️ GitHub Pages **from a private repository requires a paid GitHub plan** (Pro/Team), and the published site is public on the internet either way (the diary gate still applies). If the repo is private on a free account, use Netlify or Vercel instead.

1. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**.
3. The site appears at `https://<your-username>.github.io/<repo-name>/`.
4. To redeploy on every push, uncomment the `push:` lines in `.github/workflows/deploy-github-pages.yml`.

### Custom domain (optional)

All three hosts let you add a domain you own (e.g. `pagesofus.love`) under their domain settings, with free HTTPS.

---

## 9. Privacy notes

- The password gate is a **pretty lock, not real security**. Someone determined and technical could read the page source. Don't put anything in the book you'd be devastated to see leaked.
- Search engines are told to stay away: every page has `noindex, nofollow` tags, `robots.txt` blocks all crawlers, and Netlify/Vercel also send an `X-Robots-Tag` header.
- Keep the **GitHub repository private**, because the photos and writing live there.
- “Continue reading”, the theme and the sound setting are stored only in her browser (localStorage). Nothing is sent anywhere.
- The map loads its tiles from OpenStreetMap. That's the only outside service the site uses.

---

## 10. Troubleshooting

- **A chapter doesn't show up:** check that its frontmatter has `title`, `date` and `order`, and that it doesn't have `draft: true`. Errors also appear in the terminal running `npm run dev`.
- **“Could not find image”:** the photo path is relative to the chapter file. From `content/chapters/` it's `../../photos/name.jpg`; from `content/firsts.yaml` it's `../photos/name.jpg`. File names are case-sensitive (`IMG_01.JPG` ≠ `img_01.jpg`).
- **She's stuck behind the gate on a new phone:** the answer ignores capitals and spaces. After two wrong tries the hint appears.
- **Reset “Continue reading” for testing:** open the browser's dev tools and clear the site's storage, or use a private window.
- **A photo looks too big on a page:** the book shrinks it or moves it to the next page automatically. If it still looks awkward, put it after a different paragraph.
