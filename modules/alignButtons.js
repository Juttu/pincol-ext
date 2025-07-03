/* ================================================================
 *  alignButtons.js  – positions every .btn-wrapper-* so its left
 *  edge sits 5 px left of the first “group/conversation-turn” block
 * ================================================================ */
export function registerAligner() {
  /* ----------------------------------------------------------- *
   *  A.  tiny   helpers
   * ----------------------------------------------------------- */
  const ARTICLE_SELECTOR = 'article[data-testid^="conversation-turn"]';

  /** Escaped selector for the inner text container */
  const TEXT_BLOCK = '[class*="group/conversation-turn"]';

  /** Inject (once) the coloured outlines that helped you debug */
  function injectDebugStyle() {
    if (document.getElementById("btn-align-debug-style")) return;
    const dbg = document.createElement("style");
    dbg.id = "btn-align-debug-style";
    // dbg.textContent = `
    //   .article-wrapper{outline:2px dashed lime;outline-offset:4px}
    //   [class^="btn-wrapper-"]{background:#ff737356;padding:2px}
    //   .div31,[class*="group/conversation-turn"]{
    //     outline:2px solid dodgerblue;outline-offset:2px}
    // `;
    document.head.appendChild(dbg);
  }
  // comment this line out in production
  injectDebugStyle();

  /* ----------------------------------------------------------- *
   *  B.  core routine – RUNS FAST
   * ----------------------------------------------------------- */
  function alignChatButtons() {
    console.log("[Align-Buttons] alignChatButtons()");
    document.querySelectorAll(".article-wrapper").forEach((wrap) => {
      const btnBox = wrap.querySelector('[class^="btn-wrapper-"]');
      const article = wrap.querySelector(ARTICLE_SELECTOR);
      const target = article?.querySelector(TEXT_BLOCK);

      if (!btnBox || !target) return;

      const wrapLeft = wrap.getBoundingClientRect().left;
      const targetLeft = target.getBoundingClientRect().left;

      const offset = Math.round(targetLeft - wrapLeft - 5 - 75); // “5 px left”
      if (btnBox.dataset._cachedOffset !== String(offset)) {
        btnBox.style.marginLeft = `${offset}px`;
        btnBox.dataset._cachedOffset = String(offset);
      }
    });
  }

  /* ----------------------------------------------------------- *
   *  C.  expose & keep fresh
   * ----------------------------------------------------------- */
  window.alignChatButtons = alignChatButtons; //  ←  export for others

  // first run
  alignChatButtons();

  // keep aligned on resize / scroll
  window.addEventListener("resize", alignChatButtons, { passive: true });
  window.addEventListener("scroll", alignChatButtons, { passive: true });

  // …and whenever DOM changes (new replies etc.)
  new MutationObserver(alignChatButtons).observe(document.body, { childList: true, subtree: true });
}
