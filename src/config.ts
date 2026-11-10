/**
 * ─────────────────────────────────────────────────────────────
 *  Pages of Us: the settings for the whole book.
 *  Change anything here, save, and the site updates.
 * ─────────────────────────────────────────────────────────────
 */
export const book = {
  title: 'Pages of Us',
  subtitle: 'Volume I · The First Nine Months',
  /** Shown on the cover as “Cheena & Akam”. */
  names: ['Cheena', 'Akam'] as const,
  /** Who wrote it (used on the title page and closing letter). */
  author: 'Akam',
  /** Small line at the bottom of the cover. */
  coverNote: 'A love story, still being written',

  /** The day you officially started dating (YYYY-MM-DD). Used for “Day 1, Day 2…”. */
  togetherSince: '2026-05-21',

  /** Shown on the very last page. Change it when Volume II is on its way. */
  toBeContinued: 'To be continued…',
  nextVolumeNote: 'Volume II is still being lived.',
};

/**
 * The locked-diary gate.
 * Capital letters, spaces and punctuation are ignored, so
 * “Chimney Sizzlers”, “chimney sizzlers” and “chimneysizzlers!” all work.
 * Only a scrambled fingerprint (hash) of the answer ends up on the website.
 * Set `enabled: false` to remove the gate entirely.
 */
export const gate = {
  enabled: true,
  question: 'Where did we go on our first official date?',
  hint: 'The restaurant, my love.',
  answer: 'Chimney Sizzlers',
  /** Stay unlocked on her device after the first time. */
  rememberDevice: true,
};

/** Turn the extra sections on or off. */
export const sections = {
  timeline: true,
  map: true,
  gallery: true,
};

/** Defaults for the reading controls (she can change them herself). */
export const reading = {
  /** Page-turn sound starts switched off. */
  soundOnByDefault: false,
  /** 'paper' (day) or 'night' (dark sepia). */
  defaultTheme: 'paper' as 'paper' | 'night',
};
