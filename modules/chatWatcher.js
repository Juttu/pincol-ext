/**
 * Registers a watcher that calls `onChatChanged(chatId)` when the chat changes.
 */
export function registerChatSwitchWatcher(onChatChanged) {
  let lastChatId = null;

  function getChatId() {
    const path = location.pathname;
    return path.includes("/c/") ? path.split("/c/").pop() : path.split("/").pop();
  }

  function checkChatChange(source = "unknown") {
    const currentChatId = getChatId();
    if (currentChatId && currentChatId !== lastChatId) {
      console.log(`[PinCol] Chat switched (${source}) →`, currentChatId);
      lastChatId = currentChatId;
      onChatChanged(currentChatId);
    }
  }

  // Patch history methods
  ["pushState", "replaceState"].forEach((fnName) => {
    const original = history[fnName];
    history[fnName] = function (...args) {
      const result = original.apply(this, args);
      setTimeout(() => checkChatChange(fnName), 50);
      return result;
    };
  });

  // Back/forward buttons
  window.addEventListener("popstate", () => setTimeout(() => checkChatChange("popstate"), 50));

  // MutationObserver fallback for UI-triggered changes
  const observer = new MutationObserver(() => checkChatChange("mutation"));
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial call
  checkChatChange("boot");
}
