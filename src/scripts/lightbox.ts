// Give every tucked-in photo its shape up front (see .polaroid img in global.css).
document.querySelectorAll<HTMLImageElement>('.polaroid img').forEach((img) => {
  const w = Number(img.getAttribute('width')), h = Number(img.getAttribute('height'));
  if (w && h) img.style.setProperty('--r', String(w / h));
});

// Tap any photo (a .photo-open button) to see it large.
const dlg = document.getElementById('lightbox') as HTMLDialogElement | null;
if (dlg) {
  const img = dlg.querySelector('img')!;
  const cap = dlg.querySelector('figcaption')!;
  let opener: HTMLElement | null = null;

  const largest = (el: HTMLImageElement) => {
    const set = el.getAttribute('srcset') || el.closest('picture')?.querySelector('source')?.getAttribute('srcset');
    if (!set) return el.currentSrc || el.src;
    const best = set.split(',').map((s) => s.trim().split(/\s+/)).sort((a, b) => parseFloat(b[1] || '0') - parseFloat(a[1] || '0'))[0];
    return best?.[0] || el.currentSrc || el.src;
  };

  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.photo-open');
    if (!btn) return;
    const src = btn.querySelector('img');
    if (!src) return;
    e.preventDefault();
    opener = btn;
    img.src = largest(src);
    img.alt = src.alt;
    cap.textContent = btn.closest('figure')?.querySelector('figcaption')?.textContent || '';
    dlg.showModal();
  });
  dlg.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === dlg || t.closest('[data-close]')) dlg.close();
  });
  dlg.addEventListener('close', () => { img.removeAttribute('src'); opener?.focus(); });
}
