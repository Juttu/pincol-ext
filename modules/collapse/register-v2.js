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
    console.debug("[PinCol] MutationObserver detected changes in the DOM");
    muts.forEach((m) => {
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches?.(ARTICLE)) {
          console.debug("[PinCol] Added node matches ARTICLE selector:", n);
          queue(n);
        }
        n.querySelectorAll?.(ARTICLE).forEach((el) => {
          console.debug("[PinCol] Found ARTICLE in added node subtree:", el);
          queue(el);
        });
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
  console.log("[PinCol] Forcing collapse for msgId:", msgId);
  function tryCollapse() {
    const article = document
      .querySelector(`[data-message-id="${msgId}"]`)
      ?.closest('article[data-testid^="conversation-turn"]');

    if (!article) return false;

    const btn = article.closest(".article-wrapper")?.querySelector(".top-collapse-btn");
    if (!btn) return false;

    if (!article.classList.contains("collapsed")) {
      console.log("[PinCol] REGISTERV2 Collapsing reply:", msgId);
      article.classList.add("collapsed");
      btn.textContent = "▶";
    }
    return true;
  }

  if (tryCollapse()) return;

  const mo = new MutationObserver((muts, obs) => {
    console.debug("[PinCol] MutationObserver (forceCollapseById) detected mutations:", muts);
    if (tryCollapse()) {
      console.debug("[PinCol] MutationObserver (forceCollapseById) condition met, disconnecting observer.");
      obs.disconnect();
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });
}
