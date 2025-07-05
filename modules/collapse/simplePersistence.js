/* eslint-env browser, webextensions */
const STORAGE_KEY = (prefix) => `chat:${prefix}`; // → chat:6862cdf8-…

/* ─── helpers ─────────────────────────────────────────────────── */
export function getChatId() {
  // URL ends with “…/c/<uuid>” in both chat.openai.com & chatgpt.com
  return location.pathname.split("/").pop();
}

/* promise → array<string>  (collapse-ids) */
export async function loadCollapse(chatId = getChatId()) {
  const { [STORAGE_KEY(chatId)]: ids = [] } = await chrome.storage.local.get();
  return ids; // always an array
}

/* void  (persist immediately, fire-and-forget) */
export function saveCollapse(ids, chatId = getChatId()) {
  chrome.storage.local.set({ [STORAGE_KEY(chatId)]: ids });
}

/* waits until the reply is in DOM, then collapses once  */
export function collapseWhenReady(msgId) {
  /* helper – finds the <article> that owns this message-id */
  const findArticle = () =>
    document.querySelector(`[data-message-id="${msgId}"]`)?.closest('article[data-testid^="conversation-turn"]');

  /* 1. try immediately ------------------------------------------------- */
  const art = findArticle();
  if (art) {
    if (!art.classList.contains("collapsed")) {
      art.classList.add("collapsed");

      const topBtn = art.parentElement?.querySelector(".top-collapse-btn");
      if (topBtn) topBtn.textContent = "▶ Expand";
    }
    return; // done, no need to watch the DOM
  }

  /* 2. not there yet → observe once ----------------------------------- */
  const mo = new MutationObserver((_muts, obs) => {
    const a = findArticle();
    if (!a) return; // still missing – wait a bit longer

    if (!a.classList.contains("collapsed")) {
      a.classList.add("collapsed");

      const topBtn = a.parentElement?.querySelector(".top-collapse-btn");
      if (topBtn) topBtn.textContent = "▶ Expand";
    }
    obs.disconnect(); // clean up – job finished
  });

  mo.observe(document.body, { childList: true, subtree: true });
}
