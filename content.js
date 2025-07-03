/* eslint-disable prefer-arrow-callback, no-console */
(() => {
  /* ──────────────────────────────  CONFIG  ───────────────────────────── */
  const ARTICLE = 'article[data-testid^="conversation-turn"]';
  const ASSIST_QUERY = `${ARTICLE} [data-message-author-role="assistant"]`;
  const HEADER_PX = 56; // ChatGPT fixed header height
  
  /* ─────────────────────────────  IMPORT ALIGNER  ─────────────────────── */
  (async () => {
    // build a safe URL that works inside the extension
    const url = chrome.runtime.getURL("modules/alignButtons.js");

    try {
      const { registerAligner } = await import(url); // ⟵ dynamic import
      registerAligner(); // ⟵ start it
      console.info("[btn-align] helper loaded");
    } catch (err) {
      console.error("[btn-align] failed to load:", err);
    }
  })();

  /* ────────────────────────────  STYLE  (once)  ──────────────────────── */
  if (!document.getElementById("floating-btn-style")) {
    const css = document.createElement("style");
    css.id = "floating-btn-style";
    css.textContent = `
      /* wrappers & buttons */
      .article-wrapper{ position:relative }
      [class^="btn-wrapper-"]{
        position:absolute;left:0;top:0;
        display:flex;flex-direction:column;gap:5px;z-index:10;
        




        
        }
      [class^="btn-wrapper-"] button{
        background:#2f2f2f;color:#fff;border:1px solid #ffffff26;
        border-radius:8px;font-size:12px;padding:4px 8px;cursor:pointer
      }
      [class^="btn-wrapper-"] button:hover{ background:#4e4e4e }
      /* collapsed answer */
      .collapsed{
        max-height:3.5em;
        overflow:hidden;
        text-overflow:ellipsis;
      }`;
    document.head.appendChild(css);
  }

  /* ─────────────────────────────  HELPERS  ───────────────────────────── */
  const idle = (cb) =>
    window.requestIdleCallback ? requestIdleCallback(cb, { timeout: 500 }) : setTimeout(cb, 0);

  function getScrollParent(el) {
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (el.scrollHeight > el.clientHeight && /(auto|scroll)/.test(cs.overflowY)) return el;
      el = el.parentElement;
    }
    return window;
  }

  function scrollToMessageStart(msgId) {
    const art = document.querySelector(`[data-message-id="${msgId}"]`)?.closest("article");
    if (!art) return;
    const y = art.getBoundingClientRect().top + window.scrollY - HEADER_PX;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ──────────────  COLLAPSE / EXPAND  (TOP BUTTON ONLY)  ────────────── */
  function getCollapseDelay(article) {
    const TWO_LINES_PX = 40; // ≈ height of two text lines
    const rect = article.getBoundingClientRect();
    const vpHeight = window.innerHeight;

    // The slice that represents the first two lines of the reply
    const sliceTop = rect.top;
    const sliceBottom = rect.top + TWO_LINES_PX;

    // Do those pixels intersect the viewport?
    const firstLinesVisible = sliceBottom > 0 && sliceTop < vpHeight;

    return firstLinesVisible ? 100 : 1000;
  }
  function onTopCollapseClick(ev) {
    const btn = ev.currentTarget; // the top button itself
    const wrap = btn.closest(".article-wrapper");
    const article = wrap.querySelector(ARTICLE); // ARTICLE = selector const
    const msgId = btn.dataset.msgid;

    const isCollapsed = article.classList.contains("collapsed");

    /* 1. If it is currently collapsed → expand immediately ------------- */
    if (isCollapsed) {
      article.classList.remove("collapsed");
      btn.textContent = "▼ Collapse"; // new label
      /* OPTIONAL – focus back on the beginning of the answer you expanded
       scrollToAssistantMsg(msgId); */
      return;
    }

    /* 2. If it is expanded → scroll first, THEN collapse --------------- */
    scrollToAssistantMsg(msgId); // helper from previous answer

    /*  wait one animation-frame so the browser can apply the scroll,
      then toggle the collapsed class.   */
    const delay = getCollapseDelay(article);
    setTimeout(() => {
      article.classList.add("collapsed");
      btn.textContent = "▶ Expand";
    }, delay);
  }
  function scrollToAssistantMsg(msgId, headerOffsetPx = 56) {
    /* 1. Locate the <article> that contains this message ---------------- */
    const article = document
      .querySelector(`[data-message-id="${msgId}"]`)
      ?.closest('article[data-testid^="conversation-turn"]');

    if (!article) {
      console.warn("scrollToAssistantMsg › no element for id:", msgId);
      return;
    }

    /* 2. Find the element that actually scrolls ------------------------- */
    const scroller = getScrollParent(article);

    /* 3. Compute the Y coordinate inside that scroller ------------------ */
    const articleRect = article.getBoundingClientRect();

    // Y position of article relative to the scroller’s content top
    const articleTopInDoc = articleRect.top + window.pageYOffset;

    let targetY;
    if (scroller === window) {
      // Whole document scrolls
      targetY = articleTopInDoc - headerOffsetPx;
    } else {
      // Inner scroll container – need its own offset
      const scrollerRect = scroller.getBoundingClientRect();
      const scrollerTopInDoc = scrollerRect.top + window.pageYOffset;
      const currentScroll = scroller.scrollTop;

      targetY =
        articleTopInDoc -
        scrollerTopInDoc + // distance from container top
        currentScroll - // plus current scroll
        headerOffsetPx; // minus header
    }

    /* 4. Do the scroll --------------------------------------------------- */
    if (scroller === window) {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    } else {
      scroller.scrollTo({ top: targetY, behavior: "smooth" });
    }
  }

  /* ────────────────────────────  WORK QUEUE  ─────────────────────────── */
  const workQueue = new Set();
  let queueScheduled = false;
  function scheduleQueue() {
    if (queueScheduled) return;
    queueScheduled = true;
    idle(() => {
      queueScheduled = false;
      const deadline = performance.now() + 50;
      for (const art of workQueue) {
        enhance(art);
        workQueue.delete(art);
        if (performance.now() > deadline) {
          scheduleQueue();
          break;
        }
      }
      updatePositions();
    });
  }
  const queueArticle = (a) => {
    if (a && !workQueue.has(a)) {
      workQueue.add(a);
      scheduleQueue();
    }
  };

  const getMsgId = (art) =>
    art.querySelector('[data-message-author-role="assistant"]')?.getAttribute("data-message-id");

  /* ─────────────────────────  ENHANCE ONE ARTICLE  ───────────────────── */
  function enhance(article) {
    const id = getMsgId(article);
    if (!id) return; // user prompt / error
    if (article.parentElement?.classList.contains("article-wrapper")) return;

    /* wrapper */
    const wrap = document.createElement("div");
    wrap.className = "article-wrapper";
    article.before(wrap);
    wrap.appendChild(article);

    /* button container */
    const box = document.createElement("div");
    box.className = `btn-wrapper-${id}`;

    /* ─── TOP button (collapse) ─────────────────── */
    const topBtn = document.createElement("button");
    topBtn.textContent = "▼ Collapse";
    topBtn.className = "top-collapse-btn";
    topBtn.dataset.msgid = id;
    topBtn.onclick = onTopCollapseClick;

    /* ─── BOTTOM button (independent) ───────────── */
    const botBtn = document.createElement("button");
    botBtn.textContent = "Bottom 3";
    botBtn.className = "bottom-action-btn";
    botBtn.dataset.msgid = id;
    botBtn.onclick = () => console.log("[Bottom 3] msg-id =", id);

    box.append(topBtn, botBtn);
    wrap.prepend(box);
  }

  /* ─────────────────────────  POSITION UPDATER  ──────────────────────── */
  function updatePositions() {
    const vh = window.innerHeight;
    document.querySelectorAll(".article-wrapper").forEach((w) => {
      const art = w.querySelector(ARTICLE);
      const btn = w.querySelector('[class^="btn-wrapper-"]');
      if (!art || !btn) return;
      const r = art.getBoundingClientRect();
      if (r.bottom <= HEADER_PX || r.top >= vh) {
        btn.style.display = "none";
      } else {
        btn.style.display = "flex";
        const visible = Math.max(r.top, HEADER_PX) - r.top;
        const max = r.height - btn.offsetHeight - 10;
        btn.style.top = Math.min(visible, max) + "px";
      }
    });
  }

  /* ──────────────────────────  SCROLL HANDLING  ──────────────────────── */
  let scrollEl = window;
  function bindScroll() {
    const firstAssistant = document.querySelector(ASSIST_QUERY)?.closest("article");
    const target = firstAssistant ? getScrollParent(firstAssistant) : window;
    if (target === scrollEl) return;
    scrollEl.removeEventListener("scroll", updatePositions);
    target.addEventListener("scroll", updatePositions, { passive: true });
    scrollEl = target;
  }

  /* ─────────────────────────────  BOOTSTRAP  ─────────────────────────── */
  function boot() {
    document.querySelectorAll(ARTICLE).forEach(queueArticle);
    bindScroll();
    updatePositions();
  }

  /* ─────────────────────────  MUTATION OBSERVER  ─────────────────────── */
  new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches?.(ARTICLE)) queueArticle(n);
        n.querySelectorAll?.(ARTICLE).forEach(queueArticle);
      });
    });
    bindScroll();
  }).observe(document.body, { childList: true, subtree: true });

  /* ───────────────────────  START WHEN DOM READY  ────────────────────── */
  document.readyState === "loading" ? window.addEventListener("DOMContentLoaded", boot, { once: true }) : boot();
})();
