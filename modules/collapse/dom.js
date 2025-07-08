import { ARTICLE, ASSIST_QUERY, HEADER_PX } from "./constants.js";
import { getScrollParent, idle, scrollToAssistantMsg, collapseDelay } from "./helpers.js";
import { toggleCollapse } from "./../../db/persistence.js";
import { addPin } from "./../pin/add-pin.js";

const work = new Set();
let queued = false;
export function queue(article) {
  console.debug("[PinCol] Queuing article for enhancement:", article);
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
      console.debug("[PinCol] Enhancing article :", art);
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
  const id = art.querySelector('[data-message-author-role="assistant"]')?.dataset.messageId;
  return id || null; // don't check for placeholder here
}

/* -------- enhance one reply (buttons etc.) ------------------------- */
export function enhance(article) {
  const id = getMsgId(article);
  if (article.parentElement?.classList.contains("article-wrapper")) return;

  // ⛔ Still loading? Schedule re-check
  if (!id || id.startsWith("placeholder-request-")) {
    const observer = new MutationObserver((_mutations, obs) => {
      console.debug("[PinCol] MutationObserver detected ID change in article:", article);
      const newId = getMsgId(article);

      if (newId && !newId.startsWith("placeholder-request-")) {
        console.log("[PinCol] Retrying enhancement with real ID:", newId);

        // Avoid double enhancement
        if (!article.parentElement?.classList.contains("article-wrapper")) {
          queueMicrotask(() => {
            requestIdleCallback(() => {
              try {
                enhance(article); // ✅ Retry safely
              } catch (err) {
                console.error("[PinCol] Retry enhance failed:", err);
              }
            });
          });
        }

        obs.disconnect();
      }
    });

    observer.observe(article, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["data-message-id"], // 🎯 Observe only ID change
    });

    // ⏳ Optional: Auto-cleanup in case ID never updates (e.g., 10s timeout)
    setTimeout(() => observer.disconnect(), 10000);

    return;
  }

  if (article.parentElement?.classList.contains("article-wrapper")) return;

  const wrap = Object.assign(document.createElement("div"), { className: "article-wrapper" });
  article.before(wrap);
  wrap.appendChild(article);

  const box = Object.assign(document.createElement("div"), { className: `btn-wrapper-${id}` });
  const top = Object.assign(document.createElement("button"), { textContent: "▼" });
  top.className = "top-collapse-btn";

  top.textContent = article.classList.contains("collapsed") ? "▶" : "▼";

  // const bot = Object.assign(document.createElement("button"), { textContent: "\u{1F4CC}" });
  // bot.className = "bottom-collapse-btn";

  const bot = document.createElement("button");
  bot.className = "bottom-collapse-btn";

  // add text to "" because we are using image below
  // bot.textContent = "";


  
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("assets/pin-17.png");
  img.alt = "Pin";
  img.className = "pin-img";
  // 🔧 Set styles directly here
  Object.assign(img.style, {
    width: "90%",
    height: "18px",
    filter: "brightness(0) invert(1)",
    pointerEvents: "none", // ensures clicks go to button, not image
    display: "block",
    margin: "0 auto",
    color: "white", // fallback for dark mode
  });

  bot.appendChild(img);

  // bot.innerHTML = `<img src="assets/pin-17.png" alt="Pin" class="pin-img">`;

  [top, bot].forEach((b) => (b.dataset.msgid = id));
  const getChatId = () => location.pathname.split("/").pop();

  top.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget,
      art = btn.closest(".article-wrapper").querySelector(ARTICLE);
    const chatId = getChatId();
    if (art.classList.contains("collapsed")) {
      /* currently collapsed  → expand instantly */
      art.classList.remove("collapsed");
      art.classList.remove("custom-collapsed");

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
      art.classList.add("custom-collapsed");

      btn.textContent = "▶";
      toggleCollapse(chatId, id, true).catch(console.error);
    }, delay);
  });

  bot.addEventListener("click", () => {
    const getId = getMsgId(article);
    console.log("[PinCol] Adding pin for msgId:", getId);
    addPin(getId, getId);
  });

  box.append(top, bot);
  wrap.prepend(box);
}

/* -------- keep buttons vertically aligned ------------------------- */
export function updatePositions() {
  console.debug("[PinCol] updatePositions Updating button positions");
  const vh = window.innerHeight;
  document.querySelectorAll(".article-wrapper").forEach((w) => {
    console.debug("[PinCol] updatePositions forEach article wrapper:", w);
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
  console.debug("[PinCol] bindScroll Binding scroll event to the correct scroller");
  const first = document.querySelector(ASSIST_QUERY)?.closest("article");
  const tgt = first ? getScrollParent(first) : window;
  if (tgt === SCROLLER) return;
  SCROLLER.removeEventListener("scroll", updatePositions);
  tgt.addEventListener("scroll", updatePositions, { passive: true });
  SCROLLER = tgt;
}
