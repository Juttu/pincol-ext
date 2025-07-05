import { HEADER_PX } from './constants.js';

export function injectCollapseStyle() {
  if (document.getElementById('floating-btn-style')) return;

  const css = document.createElement('style');
  css.id  = 'floating-btn-style';
  css.textContent = `
    .article-wrapper{position:relative}
    [class^="btn-wrapper-"]{
      position:absolute;left:0;top:0;
      display:flex;flex-direction:column;gap:5px;z-index:10}
    [class^="btn-wrapper-"] button{
      background:#2f2f2f;color:#fff;border:1px solid #ffffff26;
      border-radius:8px;font-size:12px;padding:4px 8px;cursor:pointer}
    [class^="btn-wrapper-"] button:hover{background:#4e4e4e}
    .collapsed{
      max-height:3.5em;overflow:hidden;text-overflow:ellipsis}
  `;
  document.head.appendChild(css);

  console.debug(`[collapse] style injected (header = ${HEADER_PX}px)`);
}
