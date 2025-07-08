(async () => {
  console.info("[PinCol] Boot script starting...");

  // const { monitorNewArticles } = await import(chrome.runtime.getURL("modules/collapse/helpers.js"));
  // monitorNewArticles();

  const { setupPinTooltip } = await import(chrome.runtime.getURL("modules/collapse/helpers.js"));

  setupPinTooltip();

  // const { startEnhancerObserver } = await import(chrome.runtime.getURL("modules/observers.js"));
  // console.info("[PinCol] Starting enhancer observer...");
  // startEnhancerObserver();
  // 1. Import modules
  const { registerCollapse } = await import(chrome.runtime.getURL("modules/collapse/register-v2.js"));
  console.log("[PinCol] Imported collapse module");
  const { registerAligner } = await import(chrome.runtime.getURL("modules/alignButtons.js"));
  const { observeAndInsertPinContainer } = await import(chrome.runtime.getURL("modules/pin/pin-inserter.js"));
  console.info("[PinCol] Imported pin inserter module");
  const { registerChatSwitchWatcher } = await import(chrome.runtime.getURL("modules/chatWatcher.js"));
  const { restoreUIForChat } = await import(chrome.runtime.getURL("modules/setUIFromDB.js"));

  // 2. Initial enhancement on page load
  console.info("[PinCol] Running registerCollapse...");
  await registerCollapse();

  console.info("[PinCol] Running registerAligner...");
  registerAligner();

  console.info("[PinCol] Inserting pin container...");
  observeAndInsertPinContainer();

  // 3. Watch for chat switches
  registerChatSwitchWatcher(async (chatId) => {
    console.info("[PinCol] Chat switch detected, restoring UI for chatId:", chatId);

    // Reapply enhancements for new chat DOM
    await registerCollapse();
    registerAligner();
    observeAndInsertPinContainer();

    // Restore collapse & pin state from DB
    await restoreUIForChat(chatId);
  });
})();
