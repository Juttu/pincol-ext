// collapseUtils.js
// Utility functions for collapse button actions

import { scrollToMessageId } from "./scroll.js";

// 1. Get the response block ID from the article element
export function getResponseBlockId(article) {
  const assistant = article.querySelector('[data-message-author-role="assistant"]');
  return assistant ? assistant.getAttribute("data-message-id") : null;
}

// 2. Scroll to the response block by ID
export function scrollToResponseBlock(responseId) {
  return scrollToMessageId(responseId);
}

export function toggleCollapseResponseBlock(article) {
  const markdown = article.querySelector(".markdown");
  if (!markdown) return;

  const isCollapsed = markdown.classList.contains("collapsed");

  if (isCollapsed) {
    // EXPAND
    markdown.classList.remove("collapsed");
    markdown.style.maxHeight = "";
    markdown.style.overflow = "";
    markdown.style.maskImage = "";
    markdown.style.marginBottom = "";

    // Restore parent styling
    article.style.minHeight = "";
    article.style.paddingBottom = "";
    article.style.marginBottom = "";
  } else {
    // COLLAPSE
    markdown.classList.add("collapsed");
    markdown.style.maxHeight = "120px";
    // markdown.style.overflow = "hidden";
    markdown.style.maskImage = "linear-gradient(to bottom, black 60%, transparent 100%)";
    markdown.style.marginBottom = "0px";

    // Minimize parent spacing
    article.style.minHeight = "0px";
    article.style.paddingBottom = "0px";
    article.style.marginBottom = "0px";
    // Remove hidden flex fillers or overlays
  }
}
