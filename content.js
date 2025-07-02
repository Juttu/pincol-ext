/* content.js – ChatGPT floating buttons (MutationObserver edition)
   ©2025  —  drop-in for manifest-v3                                                   */
/* eslint-disable prefer-arrow-callback, no-console */
(() => {

  /** -------- 0. GLOBAL CLICK HANDLERS --------------------------------- **/
  function onTopClick   (ev) { console.log('[Top 3]    msg-id =', ev.currentTarget.dataset.msgid); }
  function onBottomClick(ev) { console.log('[Bottom 3] msg-id =', ev.currentTarget.dataset.msgid); }

  /** -------- 1. STYLE (insert once) ----------------------------------- **/
  if (!document.getElementById('floating-btn-style')) {
    const s = document.createElement('style');
    s.id = 'floating-btn-style';
    s.textContent = `
      .article-wrapper{position:relative}
      [class^="btn-wrapper-"]{
        position:absolute;left:0;top:0;display:flex;flex-direction:column;
        gap:5px;z-index:10}
      [class^="btn-wrapper-"] button{
        background:#2f2f2f;color:#fff;border:1px solid #ffffff26;border-radius:8px;
        font-size:12px;padding:4px 8px;cursor:pointer}
      [class^="btn-wrapper-"] button:hover{background:#4e4e4e}
    `;
    document.head.appendChild(s);
  }

  /** -------- 2. UTILITIES --------------------------------------------- **/
  const ARTICLE_SEL = 'article[data-testid^="conversation-turn"]';
  const ASSIST_SEL  = `${ARTICLE_SEL} [data-message-author-role="assistant"]`;

  function getScrollParent(el) {
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (
        el.scrollHeight > el.clientHeight &&
        /(auto|scroll)/.test(cs.overflowY)
      ) return el;
      el = el.parentElement;
    }
    return window;
  }

  function getMsgId(article){
    return article
      .querySelector('[data-message-author-role="assistant"]')
      ?.getAttribute('data-message-id') || null;
  }

  /** -------- 3. ENHANCE ONE ASSISTANT ARTICLE ------------------------- **/
  function enhanceArticle(article){
    const id = getMsgId(article);           // skip user prompts
    if(!id) return;

    if(article.parentElement?.classList.contains('article-wrapper')) return;

    console.log('[Enhance] assistant message-id →', id);

    const wrapper = document.createElement('div');
    wrapper.className = 'article-wrapper';
    article.parentNode.insertBefore(wrapper, article);
    wrapper.appendChild(article);

    const btnWrap = document.createElement('div');
    btnWrap.className = `btn-wrapper-${id}`;

    const bTop = document.createElement('button');
    const bBot = document.createElement('button');
    bTop.textContent='Top 3';   bTop.dataset.msgid=id;
    bBot.textContent='Bottom 3';bBot.dataset.msgid=id;

    bTop.addEventListener('click', onTopClick);
    bBot.addEventListener('click', onBottomClick);

    btnWrap.append(bTop,bBot);
    wrapper.insertBefore(btnWrap, article);
  }

  /** -------- 4. POSITION UPDATER (header-aware) ----------------------- **/
  function updateBtnPositions(){
    const HEADER=56;                     // px – adjust if OpenAI changes UI
    const vh=window.innerHeight;

    document.querySelectorAll('.article-wrapper').forEach(w=>{
      const art = w.querySelector(ARTICLE_SEL);
      const btn = w.querySelector('[class^="btn-wrapper-"]');
      if(!art||!btn) return;

      const r=art.getBoundingClientRect();
      if(r.bottom<=HEADER||r.top>=vh){
        btn.style.display='none';
      }else{
        btn.style.display='flex';
        const visibleTop = Math.max(r.top,HEADER)-r.top;
        const max = r.height - btn.offsetHeight - 10;
        btn.style.top = Math.min(visibleTop,max)+'px';
      }
    });
  }

  /** -------- 5. MAIN BOOTSTRAP --------------------------------------- **/
  function bootstrap(){
    console.log('[Float-Buttons] bootstrap');

    // decorate all current assistant replies
    document.querySelectorAll(ARTICLE_SEL).forEach(enhanceArticle);
    updateBtnPositions();

    const firstAssistant = document.querySelector(ASSIST_SEL)?.closest('article');
    const scrollArea = getScrollParent(firstAssistant);

    scrollArea.addEventListener('scroll', updateBtnPositions, {passive:true});
    window.addEventListener('resize', updateBtnPositions);
    window.addEventListener('load',   updateBtnPositions);

    // observe future DOM changes (new replies, regenerated blocks, etc.)
    const root = scrollArea===window?document.body:scrollArea;
    new MutationObserver(muts=>{
      muts.forEach(m=>{
        m.addedNodes.forEach(n=>{
          if(n.nodeType!==1) return;
          if(n.matches?.(ARTICLE_SEL))           enhanceArticle(n);
          n.querySelectorAll?.(ARTICLE_SEL).forEach(enhanceArticle);
        });
      });
      updateBtnPositions();
    }).observe(root,{childList:true,subtree:true});

    console.log('✅ floating buttons ready');
  }
  
  /** -------- 6. WAIT UNTIL FIRST ASSISTANT REPLY (no polling) -------- **/
  function waitWithMutationObserver(){
    // fast-path: already loaded?
    const first = document.querySelector(ASSIST_SEL);
    if(first){ bootstrap(); return; }

    // otherwise observe until one appears
    const mo = new MutationObserver(muts=>{
      for(const m of muts){
        for(const n of m.addedNodes){
          if(n.nodeType!==1) continue;
          if(n.matches?.(ASSIST_SEL)||n.querySelector?.(ASSIST_SEL)){
            mo.disconnect();
            bootstrap();
            return;
          }
        }
      }
    });
    mo.observe(document.body,{childList:true,subtree:true});
  }

  // kick-off
  waitWithMutationObserver();

})();
