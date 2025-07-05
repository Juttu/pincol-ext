import { ARTICLE } from "./constants.js";
import { injectCollapseStyle } from "./style.js";
import { queue, bindScroll, updatePositions } from "./dom.js";

export function registerCollapse() {
  console.log("[collapse] registerCollapse()");
  injectCollapseStyle();

  /* enhance existing replies */
  document.querySelectorAll(ARTICLE).forEach(queue);
  bindScroll();
  updatePositions();

  /* observe future DOM mutations */
  new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches?.(ARTICLE)) queue(n);
        n.querySelectorAll?.(ARTICLE).forEach(queue);
      });
    });
    bindScroll();
  }).observe(document.body, { childList: true, subtree: true });
}

export function forceCollapseById(msgId) {
  collapseWhenAvailable(msgId);
}

/**
 * Collapse the assistant reply whose data-message-id equals `msgId`.
 * If the reply is not in the DOM yet, we install a one-shot
 * MutationObserver that collapses it the moment it appears.
 */
function collapseWhenAvailable(msgId) {
  // Helper to update button label
  function updateButton(article, label) {
    const wrapper = article.closest(".article-wrapper");
    const btn = wrapper?.querySelector(".top-collapse-btn");
    if (btn) btn.textContent = label;
  }

  // Try collapsing immediately
  const article = document
    .querySelector(`[data-message-id="${msgId}"]`)
    ?.closest('article[data-testid^="conversation-turn"]');

  if (article) {
    if (!article.classList.contains("collapsed")) {
      article.classList.add("collapsed");
      updateButton(article, "▶");
    }
    return;
  }

  // Otherwise, observe and wait
  const mo = new MutationObserver((_muts, obs) => {
    const art = document
      .querySelector(`[data-message-id="${msgId}"]`)
      ?.closest('article[data-testid^="conversation-turn"]');

    if (art && !art.classList.contains("collapsed")) {
      art.classList.add("collapsed");
      updateButton(art, "▶");
      obs.disconnect();
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });
}
