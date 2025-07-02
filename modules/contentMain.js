/* modules/contentMain.js
 * ============================================================= *
 *  Main module – inject “Top 3 / Bottom 3” buttons for every    *
 *  assistant reply and keep them visible while scrolling        *
 * ============================================================= */

import { ARTICLE_SELECTOR, ASSISTANT_SELECTOR } from './selectors.js';
import { enhanceArticle }                       from './enhance.js';

/* -------------------------------------------------------------- *
 *  internal helpers                                              *
 * -------------------------------------------------------------- */

/* 1.  Detect the sticky header height once (fallback = 56 px) */
function getHeaderHeight () {
  const hdr =
    document.querySelector('header') ||
    document.querySelector('[data-headlessui-state]'); // future-proof
  if (hdr) return hdr.getBoundingClientRect().height;
  const cssVar = parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--header-height')
      .trim(),
    10
  );
  return Number.isNaN(cssVar) ? 56 : cssVar;
}

/* 2.  Return the element that actually scrolls (usually <html>) */
function getScrollRoot () {
  return document.scrollingElement || document.documentElement;
}

/* 3.  Re-position all visible button wrappers */
function updateButtonPositions () {
  const HEADER = getHeaderHeight();
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
      const visible = Math.max(r.top, HEADER) - r.top;       // px scrolled inside
      const max     = r.height - btn.offsetHeight - 10;      // stay inside article
      btn.style.top = Math.min(visible, max) + 'px';
    }
  });
}

/* -------------------------------------------------------------- *
 *  Bootstrap (called from content.js)                            *
 * -------------------------------------------------------------- */
export function bootstrap () {
  console.log('[Float-Buttons] bootstrap');

  /* A.  Enhance every assistant article that already exists */
  document.querySelectorAll(ARTICLE_SELECTOR).forEach(enhanceArticle);
  updateButtonPositions();

  /* B.  Global listeners (scroll + resize)                   */
  getScrollRoot().addEventListener('scroll',  updateButtonPositions, { passive: true });
  window.addEventListener('resize',           updateButtonPositions);

  /* C.  MutationObserver – catch hydration replacements + new replies */
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;                     // ELEMENT_NODE
        if (node.matches?.(ARTICLE_SELECTOR)) enhanceArticle(node);
        node
          .querySelectorAll?.(ARTICLE_SELECTOR)
          .forEach(enhanceArticle);
      });
    });
    updateButtonPositions();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  /* D.  Extra safeguard – run one more pass 1 s after load
         (covers any late re-hydration quirks)                */
  setTimeout(() => {
    console.log('[Float-Buttons] late pass');
    document.querySelectorAll(ARTICLE_SELECTOR).forEach(enhanceArticle);
    updateButtonPositions();
  }, 1000);

  console.log('[Float-Buttons] ready ✓');
}
