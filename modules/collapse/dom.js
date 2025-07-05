import { ARTICLE, ASSIST_QUERY, HEADER_PX } from "./constants.js";
import { getScrollParent, idle, scrollToAssistantMsg, collapseDelay } from "./helpers.js";
import { toggleCollapse } from "./../../db/persistence.js";

const work = new Set();
let queued = false;
export function queue(article) {
  if (article && !work.has(article)) {
    work.add(article);
    schedule();
  }
}

function schedule() {
  if (queued) return;
  queued = true;
  idle(() => {
    queued = false;
    const deadline = performance.now() + 50;
    for (const art of work) {
      enhance(art);
      work.delete(art);
      if (performance.now() > deadline) {
        schedule();
        break;
      }
    }
    updatePositions();
  });
}

function getMsgId(art) {
  return art.querySelector('[data-message-author-role="assistant"]')?.dataset.messageId;
}

/* -------- enhance one reply (buttons etc.) ------------------------- */
function enhance(article) {
  const id = getMsgId(article);
  if (!id) return;
  if (article.parentElement?.classList.contains("article-wrapper")) return;

  const wrap = Object.assign(document.createElement("div"), { className: "article-wrapper" });
  article.before(wrap);
  wrap.appendChild(article);

  const box = Object.assign(document.createElement("div"), { className: `btn-wrapper-${id}` });
  const top = Object.assign(document.createElement("button"), { textContent: "▼" });
  top.className = "top-collapse-btn";
  top.textContent = article.classList.contains("collapsed") ? "▶" : "▼";

  const bot = Object.assign(document.createElement("button"), { textContent: "\u{1F4CC}" });
  bot.className = "bottom-collapse-btn";

  [top, bot].forEach((b) => (b.dataset.msgid = id));
  const getChatId = () => location.pathname.split("/").pop();

  top.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget,
      art = btn.closest(".article-wrapper").querySelector(ARTICLE);
    const chatId = getChatId();
    if (art.classList.contains("collapsed")) {
      /* currently collapsed  → expand instantly */
      art.classList.remove("collapsed");
      btn.textContent = "▼";
      toggleCollapse(chatId, id, false).catch(console.error);
      return;
    }

    /* currently expanded → scroll first … */
    scrollToAssistantMsg(id);

    /* …then collapse after the proper delay */
    const delay = collapseDelay(art); // 100 ms  or  5000 ms
    setTimeout(() => {
      art.classList.add("collapsed");
      btn.textContent = "▶";
      toggleCollapse(chatId, id, true).catch(console.error);
    }, delay);
  });

  bot.addEventListener("click", () => console.log("[Bottom 3]", id));

  box.append(top, bot);
  wrap.prepend(box);
}

/* -------- keep buttons vertically aligned ------------------------- */
export function updatePositions() {
  const vh = window.innerHeight;
  document.querySelectorAll(".article-wrapper").forEach((w) => {
    const art = w.querySelector(ARTICLE);
    const btn = w.querySelector('[class^="btn-wrapper-"]');
    if (!art || !btn) return;
    const r = art.getBoundingClientRect();
    if (r.bottom <= HEADER_PX || r.top >= vh) {
      btn.style.display = "none";
      return;
    }
    btn.style.display = "flex";
    const top = Math.min(Math.max(r.top, HEADER_PX) - r.top, r.height - btn.offsetHeight - 10);
    btn.style.top = top + "px";
  });
}

/* -------- bind scroll on whichever element scrolls ---------------- */
let SCROLLER = window;
export function bindScroll() {
  const first = document.querySelector(ASSIST_QUERY)?.closest("article");
  const tgt = first ? getScrollParent(first) : window;
  if (tgt === SCROLLER) return;
  SCROLLER.removeEventListener("scroll", updatePositions);
  tgt.addEventListener("scroll", updatePositions, { passive: true });
  SCROLLER = tgt;
}
