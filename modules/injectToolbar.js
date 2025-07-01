import { getAllChatPromptResponseBlocks } from "./selectors.js";
import { scrollToMessageId } from "./scroll.js";
import { getResponseBlockId, scrollToResponseBlock, toggleCollapseResponseBlock } from "./collapseUtils.js";

function createCollapseButton(article) {
  const btn = document.createElement("button");
  btn.className = "chatgpt-collapse-btn";
  btn.innerText = "–";

  btn.onclick = () => {
    const responseId = getResponseBlockId(article);
    if (responseId) {
      // Then toggle the collapse
      scrollToResponseBlock(responseId);
      setTimeout(() => {
        toggleCollapseResponseBlock(article);
        console.log("Collapse toggled for", article, "Response ID:", responseId);
      }, 800);
    } else {
      console.warn("No response block ID found for article", article);
    }
  };

  return btn;
}

function createPinButton(responseId) {
  const btn = document.createElement("button");
  btn.className = "chatgpt-pin-btn";
  btn.innerText = "📌";

  btn.onclick = () => {
    console.log("Pin clicked for", responseId);
  };

  return btn;
}

function createToolbar(article, responseId) {
  const toolbar = document.createElement("div");
  toolbar.className = "chatgpt-toolbar";

  const collapseBtn = createCollapseButton(article);
  const pinBtn = createPinButton(responseId);

  toolbar.appendChild(collapseBtn);
  toolbar.appendChild(pinBtn);
  return toolbar;
}

export function injectToolbarButtons() {
  const blocks = getAllChatPromptResponseBlocks();

  blocks.forEach(({ block1ResponseId, article }) => {
    if (article.querySelector(".chatgpt-toolbar-top")) return; // prevent duplicates

    const topToolbar = createToolbar(article, block1ResponseId);
    topToolbar.classList.add("chatgpt-toolbar-top");

    const bottomToolbar = createToolbar(article, block1ResponseId);
    bottomToolbar.classList.add("chatgpt-toolbar-bottom");

    // Place top toolbar at start of article
    article.insertBefore(topToolbar, article.firstChild);

    // Place bottom toolbar at end of article
    article.appendChild(bottomToolbar);

    article.style.position = "relative";
  });
}
