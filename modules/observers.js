// import { ARTICLE_SELECTOR } from "./selectors.js";
// import { enhance } from "./../modules/collapse/dom.js";

// export function startEnhancerObserver() {
//   console.info("[EnhancerObserver] Starting mutation observer...");

//   const observer = new MutationObserver((mutations) => {
//     console.debug(`[EnhancerObserver] Detected ${mutations.length} mutations`);

//     for (const mutation of mutations) {
//       for (const node of mutation.addedNodes) {
//         if (!(node instanceof HTMLElement)) continue;

//         // Direct article node
//         if (node.matches?.(ARTICLE_SELECTOR)) {
//           console.debug("[EnhancerObserver] Enhancing direct article node:", node);
//           enhance(node);
//           continue;
//         }

//         // Nested articles inside added node
//         const nestedArticles = node.querySelectorAll?.(ARTICLE_SELECTOR);
//         if (nestedArticles && nestedArticles.length) {
//           console.debug(`[EnhancerObserver] Found ${nestedArticles.length} nested articles`);
//           nestedArticles.forEach((a) => {
//             console.debug("[EnhancerObserver] Enhancing nested article node:", a);
//             enhance(a);
//           });
//         }
//       }
//     }
//   });

//   observer.observe(document.body, { childList: true, subtree: true });
//   console.info("[EnhancerObserver] Observer attached to <body>");
// }
