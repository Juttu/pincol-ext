import { HEADER_PX } from './constants.js';

/* ─── generic helpers ─────────────────────────────────────────────── */
export const idle = cb =>
  window.requestIdleCallback ? requestIdleCallback(cb, {timeout:500})
                             : setTimeout(cb,0);

export function getScrollParent(el){
  while (el && el !== document.body){
    const cs = getComputedStyle(el);
    if (el.scrollHeight>el.clientHeight && /(auto|scroll)/.test(cs.overflowY))
      return el;
    el = el.parentElement;
  }
  return window;
}

export function scrollToAssistantMsg(msgId){
  const art = document
    .querySelector(`[data-message-id="${msgId}"]`)
    ?.closest('article[data-testid^="conversation-turn"]');
  if (!art) return;

  const scroller = getScrollParent(art);
  const topInDoc = art.getBoundingClientRect().top + window.pageYOffset;
  const offset   = (scroller===window)
                   ? topInDoc - HEADER_PX
                   : topInDoc - (scroller.getBoundingClientRect().top + window.pageYOffset)
                     + scroller.scrollTop - HEADER_PX;

  (scroller===window ? window : scroller).scrollTo({top:offset,behavior:'smooth'});
}

/* ≈100 ms if first 2 lines already visible else 1 s */
export function collapseDelay(art){
  const TWO = 40;
  const r   = art.getBoundingClientRect();
  return ((r.top+TWO>0)&&(r.top<TWO+window.innerHeight)) ? 100 : 1000;
}
