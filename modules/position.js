import { ARTICLE_SELECTOR } from './selectors.js';

const HEADER = 56;   // px – adjust or read CSS var if you prefer

export function updateButtonPositions () {
  const wrappers = document.querySelectorAll('.article-wrapper');
  const vh = window.innerHeight;

  wrappers.forEach(w => {
    const art = w.querySelector(ARTICLE_SELECTOR);
    const btn = w.querySelector('[class^="btn-wrapper-"]');
    if (!art || !btn) return;

    const r = art.getBoundingClientRect();

    if (r.bottom <= HEADER || r.top >= vh) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'flex';
      const visible   = Math.max(r.top, HEADER) - r.top;
      const maxOffset = r.height - btn.offsetHeight - 10;
      btn.style.top   = Math.min(visible, maxOffset) + 'px';
    }
  });
}
