// Generates soft placeholder photos in /photos so the book has something to show.
// Run with: npm run placeholders   (safe to delete these files once you add real photos)
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const out = new URL('../photos/', import.meta.url);
mkdirSync(out, { recursive: true });

const palettes = [
  ['#e9c9c5', '#b98a94'],
  ['#d7dbe8', '#5b6a8f'],
  ['#f3e3d3', '#c9a07f'],
  ['#e6d2dc', '#8f6a86'],
  ['#dfe5df', '#7d917f'],
  ['#f0d9c8', '#c48478'],
];
const shapes = [
  [1600, 1200], [1200, 1600], [1400, 1400], [1600, 1066], [1200, 1500], [1600, 1200],
  [1200, 1600], [1500, 1500], [1600, 1100], [1200, 1600], [1600, 1200], [1300, 1600],
];

for (let i = 0; i < shapes.length; i++) {
  const [w, h] = shapes[i];
  const [a, b] = palettes[i % palettes.length];
  const n = String(i + 1).padStart(2, '0');
  const s = Math.min(w, h);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
      </linearGradient>
      <radialGradient id="l" cx="0.3" cy="0.25" r="0.8">
        <stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#l)"/>
    <g transform="translate(${w / 2} ${h / 2 - s * 0.06}) scale(${s / 900})" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
      <rect x="-150" y="-95" width="300" height="200" rx="28"/>
      <path d="M-60 -95 l25 -40 h70 l25 40"/>
      <circle cx="0" cy="5" r="62"/>
      <path d="M0 -12 c-10 -22 -46 -16 -40 10 c4 18 40 38 40 38 s36 -20 40 -38 c6 -26 -30 -32 -40 -10z" fill="#fff" stroke="none" opacity="0.9"/>
    </g>
    <text x="50%" y="${h / 2 + s * 0.2}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${s * 0.055}" fill="#fff" opacity="0.95">your photo here</text>
    <text x="50%" y="${h / 2 + s * 0.27}" text-anchor="middle" font-family="Georgia, serif" font-size="${s * 0.03}" letter-spacing="${s * 0.006}" fill="#fff" opacity="0.8">PLACEHOLDER ${n}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(new URL(`placeholder-${n}.jpg`, out).pathname);
}
console.log(`Made ${shapes.length} placeholder photos in /photos`);
