// The book reader.
//  • Desktop: the content in #book-source is laid out into real pages and turned with page-flip.
//  • Phones (or by choice): #book-source itself is shown as one comfortable scrolling column.
//  • Her place is remembered (localStorage, wrapped in try/catch) so she can "Continue reading".
import { PageFlip } from 'page-flip';

type Pos = { bid: string; label: string; at: number };

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const root = document.documentElement;
const source = $('book-source');
const reader = $('reader');
const coverStage = $('cover-stage');
const openBtn = $<HTMLButtonElement>('open-book');
const continueBtn = $<HTMLButtonElement>('continue-reading');
const flipStage = $('flip-stage');
const hostWrap = $('flip-host-wrap');
const statusEl = $('flip-status');
const prevBtn = $<HTMLButtonElement>('flip-prev');
const nextBtn = $<HTMLButtonElement>('flip-next');
const tbContents = document.getElementById('tb-contents') as HTMLButtonElement | null;
const tbView = document.getElementById('tb-view') as HTMLButtonElement | null;
const tbSound = document.getElementById('tb-sound') as HTMLButtonElement | null;

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const wideEnough = matchMedia('(min-width: 960px) and (min-height: 560px)');

// ───────── tiny storage helpers (never throw) ─────────
const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* private mode etc. */ } },
};
const readPos = (): Pos | null => {
  try { const p = JSON.parse(store.get('pou:pos') || 'null'); return p && typeof p.bid === 'string' ? p : null; } catch { return null; }
};
let lastSaved = '';
const savePos = (bid: string | null) => {
  if (!bid || bid === lastSaved) return;
  lastSaved = bid;
  const el = source.querySelector<HTMLElement>(`[data-bid="${bid}"]`);
  const sec = el?.closest<HTMLElement>('.bk');
  const label = sec?.dataset.title || '';
  store.set('pou:pos', JSON.stringify({ bid, label, at: Date.now() } satisfies Pos));
};

// ───────── give every block an id so a position survives re-layout ─────────
const sections = Array.from(source.querySelectorAll<HTMLElement>(':scope > .bk'));
sections.forEach((sec, si) => {
  sec.dataset.bid = `${si}`;
  const flow = sec.querySelector<HTMLElement>('[data-flow]');
  const opener = sec.querySelector<HTMLElement>('[data-opener]');
  if (opener) opener.dataset.bid = `${si}.o`;
  if (flow) Array.from(flow.children).forEach((b, bi) => ((b as HTMLElement).dataset.bid = `${si}.${bi}`));
});

// ───────── mode ─────────
type Mode = 'flip' | 'scroll';
const wantsScroll = () => store.get('pou:view') === 'scroll';
const pickMode = (): Mode => (wideEnough.matches && !wantsScroll() ? 'flip' : 'scroll');
let mode: Mode = pickMode();
let opened = false;

// ═════════════════════════ Pagination ═════════════════════════
let pageFlip: PageFlip | null = null;
let pages: HTMLElement[] = [];
let size = { w: 0, h: 0 };

function pageSize() {
  const availH = window.innerHeight - 180;
  const availW = window.innerWidth - 120;
  let h = Math.min(Math.max(availH, 480), 900);
  let w = Math.round(h * 0.69);
  if (w * 2 > availW) { w = Math.floor(availW / 2); h = Math.round(w / 0.69); }
  return { w, h };
}

const isEmptyEl = (el: Element) => !el.textContent?.trim() && !el.querySelector('img,br,svg');

/** Keep words [start, end) of a block, preserving inline formatting. */
function sliceWords(block: HTMLElement, start: number, end: number): HTMLElement {
  const c = block.cloneNode(true) as HTMLElement;
  const walker = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  let idx = 0;
  for (const t of texts) {
    let out = '';
    for (const tok of t.data.split(/(\s+)/)) {
      if (!tok) continue;
      if (/^\s+$/.test(tok)) { if (idx > start && idx < end) out += tok; continue; }
      if (idx >= start && idx < end) out += tok;
      idx++;
    }
    t.data = out;
  }
  c.querySelectorAll('*').forEach((el) => { if (isEmptyEl(el)) el.remove(); });
  return c;
}
const wordCount = (el: HTMLElement) => (el.textContent || '').trim().split(/\s+/).filter(Boolean).length;

function stripIds<T extends HTMLElement>(el: T): T {
  el.removeAttribute('id');
  el.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  el.querySelectorAll('[aria-labelledby]').forEach((n) => n.removeAttribute('aria-labelledby'));
  return el;
}

function makePage(cls: string, head = '') {
  const page = document.createElement('div');
  page.className = `page ${cls}`;
  page.dataset.density = 'soft';
  page.innerHTML = `<div class="page-inner"><div class="running-head"></div><div class="page-content"></div><div class="folio"></div></div>`;
  (page.querySelector('.running-head') as HTMLElement).textContent = head;
  return page;
}

function paginate(room: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  const add = (p: HTMLElement) => { p.classList.add(out.length % 2 === 0 ? 'left' : 'right'); out.push(p); room.append(p); return p; };
  const blank = (cls = 'blank') => {
    const p = makePage(cls);
    const c = p.querySelector('.page-content')!;
    if (cls === 'blank') c.innerHTML = '<p class="fleuron" aria-hidden="true">❦</p>';
    return add(p);
  };
  const fits = (c: HTMLElement) => c.scrollHeight <= c.clientHeight + 1;
  const bookTitle = document.title.split(' · ').pop() || '';

  // Endpaper on the left, the title page opens on the right, like a real book.
  const ep = blank('endpaper');
  ep.querySelector('.page-content')!.innerHTML = `<p class="endpaper-label">for my Nona ♡</p>`;

  for (const sec of sections) {
    const kind = sec.dataset.kind;
    if (kind !== 'chapter' && kind !== 'letter') {
      // One centred page (title, dedication, contents, ending)
      if (kind === 'end' && out.length % 2 === 0) blank();
      const p = makePage(`fixed kind-${kind}`);
      const c = p.querySelector<HTMLElement>('.page-content')!;
      c.classList.add('center');
      c.innerHTML = sec.innerHTML;
      stripIds(c);
      c.dataset.bid = sec.dataset.bid;
      p.dataset.bidStart = sec.dataset.bid;
      p.dataset.anchor = sec.id || `kind-${kind}`;
      add(p);
      if (kind === 'title') blank(); // back of the title page
      continue;
    }

    const title = sec.dataset.title || '';
    // Chapter opener on a left page, text begins on the facing right page.
    if (kind === 'chapter') {
      if (out.length % 2 === 1) blank();
      const opener = sec.querySelector<HTMLElement>('[data-opener]')!;
      const p = makePage('opener');
      const c = p.querySelector<HTMLElement>('.page-content')!;
      c.classList.add('center');
      c.append(stripIds(opener.cloneNode(true) as HTMLElement));
      p.dataset.bidStart = opener.dataset.bid;
      p.dataset.anchor = sec.id;
      add(p);
      if (!fits(c)) c.querySelector('.opener-photo')?.classList.add('squeeze');
    }

    const flow = sec.querySelector<HTMLElement>('[data-flow]')!;
    let page: HTMLElement; let content: HTMLElement;
    const pending: HTMLElement[] = [];
    const fresh = () => {
      page = makePage(kind === 'letter' ? 'text kind-letter' : 'text', out.length % 2 === 0 ? bookTitle : title);
      content = page.querySelector<HTMLElement>('.page-content')!;
      content.classList.add('prose');
      add(page);
      // photos that didn't fit on the previous page go first
      while (pending.length) {
        const f = pending.shift()!;
        content.append(f);
        if (!fits(content)) { f.classList.add('squeeze'); }
      }
    };
    fresh();
    if (kind === 'letter') page!.dataset.anchor = sec.id;

    let guard = 0;
    const queue: HTMLElement[] = Array.from(flow.children).map((b) => stripIds(b.cloneNode(true) as HTMLElement));
    while (queue.length) {
      if (++guard > 5000) { console.warn('pagination stopped early'); break; }
      const block = queue.shift()!;
      content!.append(block);
      if (!page!.dataset.bidStart) page!.dataset.bidStart = block.dataset.bid;
      if (fits(content!)) continue;
      block.remove();

      const isText = block.matches('p, blockquote, li') || (block.matches('ul, ol') === false && !block.matches('figure, .photo-row, aside, h1, h2, h3, hr') && wordCount(block) > 0);
      if (block.tagName === 'P' && isText) {
        const total = wordCount(block);
        let lo = 0, hi = total;
        while (lo < hi) { // largest n words that fit
          const mid = Math.ceil((lo + hi) / 2);
          const part = sliceWords(block, 0, mid);
          content!.append(part);
          const ok = fits(content!);
          part.remove();
          if (ok) lo = mid; else hi = mid - 1;
        }
        // avoid a lonely one- or two-word line at the bottom
        if (lo > 0 && lo < 4 && total > 6) lo = 0;
        if (lo > 0) {
          const head = sliceWords(block, 0, lo);
          head.classList.add('split-head');
          content!.append(head);
          const tail = sliceWords(block, lo, total);
          tail.classList.remove('opening');
          tail.classList.add('cont');
          queue.unshift(tail);
        } else {
          queue.unshift(block);
        }
        fresh();
        continue;
      }

      // Photos / notes / headings
      const emptyPage = content!.children.length === 0;
      if (emptyPage) {
        block.classList.add('squeeze');
        content!.append(block);
        if (!fits(content!)) { /* too big even alone: it is clipped gracefully */ }
        fresh();
      } else if (block.matches('figure, .photo-row')) {
        // try a smaller version first, otherwise tuck it at the top of the next page
        block.classList.add('squeeze');
        content!.append(block);
        if (fits(content!)) continue;
        block.remove();
        block.classList.remove('squeeze');
        pending.push(block);
        if (pending.length > 1 || !queue.length) { const p = pending.splice(0); fresh(); p.forEach((x) => queue.unshift(x)); }
      } else {
        queue.unshift(block);
        fresh();
      }
    }
    if (pending.length) { fresh(); }
    // drop an empty trailing page
    if (content!.children.length === 0 && out[out.length - 1] === page!) { out.pop(); page!.remove(); }
  }

  // closing endpaper so the book "shuts"
  if (out.length % 2 === 1) blank();
  blank('endpaper');

  // folios + table of contents page numbers
  out.forEach((p, i) => {
    const f = p.querySelector('.folio')!;
    if (!p.matches('.blank, .endpaper, .kind-title, .kind-end')) f.textContent = String(i);
  });
  const firstPage = (anchor: string) => out.findIndex((p) => p.dataset.anchor === anchor);
  out.forEach((p) => p.querySelectorAll<HTMLElement>('[data-page-for]').forEach((n) => {
    const i = firstPage(n.dataset.pageFor!); n.textContent = i >= 0 ? String(i) : '';
  }));
  return out;
}

function pageOfBid(bid: string): number {
  // the page containing this block, or the nearest one before it
  const [s, b] = bid.split('.');
  const order = (x?: string) => {
    if (!x) return -1;
    const [xs, xb] = x.split('.');
    return Number(xs) * 10000 + (xb === undefined ? 0 : xb === 'o' ? 1 : Number(xb) + 2);
  };
  const target = order(`${s}${b !== undefined ? '.' + b : ''}`);
  let best = 0;
  for (let i = 0; i < pages.length; i++) {
    const o = order(pages[i].dataset.bidStart);
    if (o === target) return i; // first page where this block starts
    if (o >= 0 && o < target) best = i;
  }
  return best;
}

// ═════════════════════════ Flip mode ═════════════════════════
// Photos must be loaded too, so their real size is known when filling pages.
let imagesReady: Promise<unknown> | null = null;
const loadImages = () =>
  (imagesReady ||= Promise.all(
    Array.from(source.querySelectorAll('img')).map((img) =>
      img.complete && img.naturalWidth ? null : new Promise((r) => {
        img.loading = 'eager';
        img.addEventListener('load', r, { once: true });
        img.addEventListener('error', r, { once: true });
        setTimeout(r, 6000);
      }),
    ),
  ));
// Every font face must be ready before measuring, or pages overflow later.
const loadFonts = () =>
  Promise.all(
    ['400 1em "EB Garamond"', 'italic 400 1em "EB Garamond"', '600 1em "EB Garamond"', '400 1em "Playfair Display"',
     'italic 400 1em "Playfair Display"', '500 1em "Caveat"'].map((f) => document.fonts.load(f).catch(() => null)),
  ).then(() => document.fonts.ready);

async function buildFlip(startBid?: string | null) {
  destroyFlip();
  await loadFonts();
  await loadImages();
  size = pageSize();
  const fs = Math.max(14, Math.min(19.5, size.w * 0.0335));
  const vars = `--pw:${size.w}px;--ph:${size.h}px;--fs:${fs}px;`;
  const room = document.createElement('div');
  room.className = 'measure-room';
  room.setAttribute('aria-hidden', 'true');
  room.style.cssText = vars;
  room.innerHTML = '';
  // measuring pages need their real size
  const styleTag = document.createElement('style');
  styleTag.textContent = `.measure-room .page{width:${size.w}px;height:${size.h}px}`;
  room.append(styleTag);
  document.body.append(room);
  pages = paginate(room);
  styleTag.remove();

  const host = document.createElement('div');
  host.className = 'flip-host';
  hostWrap.style.cssText = vars + `width:${size.w * 2}px;height:${size.h}px;`;
  host.style.cssText = `width:${size.w * 2}px;height:${size.h}px;`;
  hostWrap.replaceChildren(host);
  pages.forEach((p) => host.append(p));
  room.remove();

  pageFlip = new PageFlip(host, {
    width: size.w,
    height: size.h,
    size: 'fixed' as never,
    showCover: false,
    usePortrait: false,
    autoSize: false,
    drawShadow: true,
    maxShadowOpacity: 0.35,
    flippingTime: reduceMotion.matches ? 1 : 850,
    mobileScrollSupport: false,
    clickEventForward: true,
    showPageCorners: !reduceMotion.matches,
    startPage: startBid ? pageOfBid(startBid) : 0,
  });
  pageFlip.loadFromHTML(pages);
  pageFlip.on('flip', () => { updateStatus(); savePos(pages[current()]?.dataset.bidStart || null); });
  pageFlip.on('changeState', (e) => { if (e.data === 'flipping') playFlip(); });
  // links inside pages (table of contents etc.)
  host.addEventListener('click', onBookLink);
  updateStatus();
}

function destroyFlip() {
  if (pageFlip) { try { pageFlip.destroy(); } catch { /* ignore */ } pageFlip = null; }
  hostWrap.replaceChildren();
  pages = [];
}

const current = () => pageFlip?.getCurrentPageIndex() ?? 0;
function updateStatus() {
  if (!pageFlip) return;
  const i = current();
  const left = i % 2 === 0 ? i : i - 1;
  const nums = [left, left + 1].filter((n) => n < pages.length).map((n) => pages[n].querySelector('.folio')?.textContent).filter(Boolean);
  const sec = pages[left + 1]?.querySelector('.running-head')?.textContent || pages[left]?.dataset.anchor || '';
  statusEl.textContent = nums.length ? `Page${nums.length > 1 ? 's' : ''} ${nums.join('–')} of ${pages.length - 2}` : (left === 0 ? 'The beginning' : 'The end, for now');
  void sec;
  prevBtn.disabled = left <= 0;
  nextBtn.disabled = left + 2 >= pages.length;
}
function go(delta: 1 | -1) {
  if (!pageFlip) return;
  if (reduceMotion.matches) {
    const i = current(); const left = i % 2 === 0 ? i : i - 1;
    const t = Math.max(0, Math.min(pages.length - 1, left + delta * 2));
    pageFlip.turnToPage(t); updateStatus(); savePos(pages[t]?.dataset.bidStart || null);
  } else if (delta > 0) pageFlip.flipNext(); else pageFlip.flipPrev();
}
function goToAnchor(anchor: string) {
  if (mode === 'flip' && pageFlip) {
    const i = pages.findIndex((p) => p.dataset.anchor === anchor);
    if (i >= 0) { reduceMotion.matches ? pageFlip.turnToPage(i) : pageFlip.flip(i); setTimeout(updateStatus, 900); updateStatus(); }
  } else {
    document.getElementById(anchor)?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }
}
function onBookLink(e: Event) {
  const t = e.target as HTMLElement;
  const goto = t.closest<HTMLElement>('[data-goto]');
  if (goto) { e.preventDefault(); goToAnchor(goto.dataset.goto!); return; }
  if (t.closest('[data-restart]')) { e.preventDefault(); restart(); }
}
function restart() {
  if (mode === 'flip' && pageFlip) { pageFlip.turnToPage(0); updateStatus(); }
  else window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}

prevBtn.addEventListener('click', () => go(-1));
nextBtn.addEventListener('click', () => go(1));
document.addEventListener('keydown', (e) => {
  if (mode !== 'flip' || !pageFlip || !opened) return;
  const t = e.target as HTMLElement;
  if (t.matches('input, textarea, select') || document.querySelector('dialog[open]') || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
  else if (e.key === 'Home') { e.preventDefault(); pageFlip.turnToPage(0); updateStatus(); }
  else if (e.key === 'End') { e.preventDefault(); pageFlip.turnToPage(pages.length - 1); updateStatus(); }
});

// ═════════════════════════ Scroll mode ═════════════════════════
let scrollTick = 0;
function onScroll() {
  if (mode !== 'scroll' || !opened || scrollTick) return;
  scrollTick = requestAnimationFrame(() => {
    scrollTick = 0;
    const blocks = source.querySelectorAll<HTMLElement>('.bk:not(.chapter):not(.bk-letter), [data-opener], [data-flow] > *');
    let found: string | null = null;
    for (const b of blocks) {
      const r = b.getBoundingClientRect();
      if (r.bottom > 90) { found = b.dataset.bid!; break; }
    }
    savePos(found);
  });
}
addEventListener('scroll', onScroll, { passive: true });
source.addEventListener('click', (e) => { if (mode === 'scroll') onBookLink(e); });

// ═════════════════════════ Switching & opening ═════════════════════════
function currentBid(): string | null {
  if (mode === 'flip' && pageFlip) return pages[current()]?.dataset.bidStart || null;
  return readPos()?.bid || null;
}

async function show(m: Mode, bid?: string | null) {
  mode = m;
  root.dataset.mode = m;
  reader.hidden = false;
  if (m === 'flip') {
    source.hidden = true;
    flipStage.hidden = false;
    await buildFlip(bid);
  } else {
    destroyFlip();
    flipStage.hidden = true;
    source.hidden = false;
    const el = bid ? source.querySelector<HTMLElement>(`[data-bid="${bid}"]`) : null;
    if (el) el.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
    if (el) window.scrollBy(0, -80);
  }
  syncToolbar();
}

function syncToolbar() {
  if (tbContents) tbContents.hidden = !opened;
  if (tbView) {
    tbView.hidden = !opened || !wideEnough.matches;
    const toScroll = mode === 'flip';
    tbView.setAttribute('aria-label', toScroll ? 'Switch to scroll reading' : 'Switch to book view');
    tbView.title = toScroll ? 'Scroll reading' : 'Book view';
    tbView.innerHTML = toScroll ? ICONS.scroll : ICONS.book;
  }
  if (tbSound) {
    tbSound.hidden = !opened || mode !== 'flip';
    tbSound.setAttribute('aria-pressed', String(soundOn));
    tbSound.innerHTML = soundOn ? ICONS.sound : ICONS.mute;
    tbSound.setAttribute('aria-label', soundOn ? 'Page-turn sound on' : 'Page-turn sound off');
  }
}
const svg = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  scroll: svg('<path d="M7 3h10v18H7z"/><path d="M10 7h4M10 11h4M10 15h3"/>'),
  book: svg('<path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6z"/><path d="M12 6v14.5"/>'),
  sound: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mute: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
};

async function openBook(bid?: string | null) {
  if (opened) return;
  opened = true;
  coverStage.classList.add('opening');
  const wait = reduceMotion.matches ? 0 : 1300;
  await new Promise((r) => setTimeout(r, wait));
  coverStage.classList.add('gone');
  mode = pickMode();
  await show(mode, bid);
  (mode === 'flip' ? nextBtn : document.getElementById('main'))?.focus({ preventScroll: true });
}

// reader is hidden behind the cover until opened
reader.hidden = true;
openBtn.addEventListener('click', () => openBook(null));
continueBtn.addEventListener('click', () => openBook(readPos()?.bid));
const pos = readPos();
if (pos && pos.bid !== '0' && pos.bid !== '1') {
  continueBtn.hidden = false;
  continueBtn.querySelector('.continue-where')!.textContent = pos.label || '';
}

tbContents?.addEventListener('click', () => goToAnchor('contents'));
tbView?.addEventListener('click', () => {
  const bid = currentBid();
  const next: Mode = mode === 'flip' ? 'scroll' : 'flip';
  store.set('pou:view', next);
  show(next, bid);
});

// re-layout on resize / when crossing the phone ↔ desktop boundary
let resizeT = 0;
addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = window.setTimeout(() => {
    if (!opened) { mode = pickMode(); return; }
    const want = pickMode();
    const bid = currentBid();
    if (want !== mode) { show(want, bid); return; }
    if (mode === 'flip') {
      const s = pageSize();
      if (Math.abs(s.w - size.w) / size.w > 0.04 || Math.abs(s.h - size.h) / size.h > 0.04) buildFlip(bid);
    }
  }, 250);
});

// ═════════════════════════ Page-turn sound (made on the fly, no audio file) ═════════════════════════
let soundOn = (store.get('pou:sound') ?? (reader.dataset.soundDefault || 'off')) === 'on';
let ctx: AudioContext | null = null;
function playFlip() {
  if (!soundOn) return;
  try {
    ctx ||= new AudioContext();
    const dur = 0.42;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / d.length;
      const env = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.25)), 1.6) * (1 - t * 0.6);
      d[i] = (Math.random() * 2 - 1) * env * (0.6 + 0.4 * Math.sin(t * 38));
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(900, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(3800, ctx.currentTime + dur * 0.8);
    const g = ctx.createGain(); g.gain.value = 0.16;
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start();
  } catch { /* audio not available */ }
}
tbSound?.addEventListener('click', () => {
  soundOn = !soundOn;
  store.set('pou:sound', soundOn ? 'on' : 'off');
  syncToolbar();
  if (soundOn) playFlip();
});

// Pre-warm fonts so the first layout is accurate
document.fonts?.load('1em "EB Garamond"');
syncToolbar();
