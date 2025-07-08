import { HEADER_PX } from "./constants.js";

/* ─── generic helpers ─────────────────────────────────────────────── */
export const idle = (cb) =>
  window.requestIdleCallback ? requestIdleCallback(cb, { timeout: 500 }) : setTimeout(cb, 0);

export function getScrollParent(el) {
  while (el && el !== document.body) {
    const cs = getComputedStyle(el);
    if (el.scrollHeight > el.clientHeight && /(auto|scroll)/.test(cs.overflowY)) return el;
    el = el.parentElement;
  }
  return window;
}

export function scrollToAssistantMsg(msgId) {
  const art = document
    .querySelector(`[data-message-id="${msgId}"]`)
    ?.closest('article[data-testid^="conversation-turn"]');
  if (!art) return;

  const scroller = getScrollParent(art);
  const topInDoc = art.getBoundingClientRect().top + window.pageYOffset;
  const offset =
    scroller === window
      ? topInDoc - HEADER_PX
      : topInDoc - (scroller.getBoundingClientRect().top + window.pageYOffset) + scroller.scrollTop - HEADER_PX;

  (scroller === window ? window : scroller).scrollTo({ top: offset, behavior: "smooth" });
}

/* ≈100 ms if first 2 lines already visible else 1 s */
export function collapseDelay(art) {
  const TWO = 40;
  const r = art.getBoundingClientRect();
  return r.top + TWO > 0 && r.top < TWO + window.innerHeight ? 100 : 1000;
}

export function setupPinTooltip() {
  if (document.getElementById("pin-tooltip-box")) return;

  const init = () => {
    const tooltip = document.createElement("div");
    tooltip.id = "pin-tooltip-box";
    Object.assign(tooltip.style, {
      position: "fixed",
      maxWidth: "600px",
      maxHeight: "25rem",
      overflow: "auto",
      color: "#fff",
      borderRadius: "8px",
      fontSize: "13px",
      zIndex: 10000,
      opacity: 0,
      transform: "translateX(-50%)",
      transition: "opacity 0.15s ease",
      border: "1px solid rgba(255, 255, 255, 0.15",
      backgroundColor: "#212121",
    });
    document.body.appendChild(tooltip);
  };

  if (document.body) init();
  else window.addEventListener("DOMContentLoaded", init);
}

export function getExpandedArticleById(id) {
  const sourceArticle = document.querySelector(`div[data-message-id="${id}"]`)?.closest("article");

  const insideArticle = sourceArticle?.querySelector('div[data-message-author-role="assistant"]');

  if (!sourceArticle || !insideArticle) return null;

  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    maxHeight: "20rem",
  });

  wrapper.appendChild(insideArticle.cloneNode(true));
  return wrapper;
}

export function getPreviousArticleContentDivById(id) {
  // Step 1: Find the <article> containing the message-id
  const sourceArticle = document.querySelector(`div[data-message-id="${id}"]`)?.closest("article");

  if (!sourceArticle) return null;

  // Step 2: Get the parent wrapper div (e.g., class="article-wrapper")
  const parentWrapper = sourceArticle.closest(".article-wrapper");
  if (!parentWrapper) return null;

  // Step 3: Get the previous sibling wrapper (i.e., the one above in DOM)
  const prevWrapper = parentWrapper.previousElementSibling;
  if (!prevWrapper) return null;

  // Step 4: Get the <article> inside that wrapper
  const prevArticle = prevWrapper;

  // Step 5: Get the content div inside that article
  const contentDiv = prevArticle.querySelector("div.text-base");

  // <div data-message-author-role="user"

  const userDiv = contentDiv.querySelector('div[data-message-author-role="user"]');

  // return a clone of the userDiv or null if it doesn't exist
  return userDiv.cloneNode(true) || null;
}

export function monitorNewArticles() {
  console.debug("***** #### monitorNewArticles called");
  if (!document.body) {
    console.debug("***** #### monitorNewArticles: document.body not found, aborting observer setup");
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      for (const node of mut.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        // If it's a new article directly
        if (node.matches?.('div[data-message-author-role="assistant"]')) {
          console.debug("***** #### [Observer] Found new article after regeneration:", node);
          queue(node); // Safely re-enhance
        }

        // Or if it contains new articles inside
        node.querySelectorAll?.('div[data-message-author-role="assistant"]').forEach((art) => {
          console.debug("***** #### [Observer] Found nested article after regeneration:", art);
          queue(art);
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.debug("***** #### monitorNewArticles observer setup complete");
}

