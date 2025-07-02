export function getScrollParent (el) {
  while (el && el !== document.body) {
    const cs = getComputedStyle(el);
    if (el.scrollHeight > el.clientHeight &&
        /(auto|scroll)/.test(cs.overflowY)) return el;
    el = el.parentElement;
  }
  return window;
}
