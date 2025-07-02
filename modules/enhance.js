import { ARTICLE_SELECTOR, ASSISTANT_SELECTOR } from './selectors.js';
import { onTopClick, onBottomClick }            from './buttons.js';

/* return data-message-id for assistant replies, else null */
function getResponseBlockId (article) {
  const a = article.querySelector(ASSISTANT_SELECTOR);
  return a ? a.getAttribute('data-message-id') : null;
}

export function enhanceArticle (article) {
  const msgId = getResponseBlockId(article);
  if (!msgId) return;                                           // skip user msg

  /* already enhanced? */
  if (article.parentElement?.classList.contains('article-wrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'article-wrapper';
  article.parentNode.insertBefore(wrapper, article);
  wrapper.appendChild(article);

  const btnWrap = document.createElement('div');
  btnWrap.className = `btn-wrapper-${msgId}`;

  const bTop = document.createElement('button');
  const bBot = document.createElement('button');
  bTop.textContent = 'Top 3';
  bBot.textContent = 'Bottom 3';
  bTop.dataset.msgid = msgId;
  bBot.dataset.msgid = msgId;

  bTop.addEventListener('click',    onTopClick);
  bBot.addEventListener('click', onBottomClick);

  btnWrap.append(bTop, bBot);
  wrapper.insertBefore(btnWrap, article);
}
