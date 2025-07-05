(async () => {
  console.info("[PinCol] Boot script starting...");

  // 1. Import modules
  const { registerCollapse, forceCollapseById } = await import(
    chrome.runtime.getURL("modules/collapse/register.js")
  );
  const { registerAligner } = await import(chrome.runtime.getURL("modules/alignButtons.js"));

  // 2. Align buttons + collapse UI

  console.info("[PinCol] Running registerCollapse...");
  await registerCollapse(); // DOM is now enhanced

  console.info("[PinCol] Running registerAligner...");
  registerAligner();

  const { registerChatSwitchWatcher } = await import(chrome.runtime.getURL("modules/chatWatcher.js"));
  const { restoreUIForChat } = await import(chrome.runtime.getURL("modules/setUIFromDB.js"));

  registerChatSwitchWatcher(async (chatId) => {
    console.info("[PinCol] Chat switch detected, restoring UI for chatId:", chatId);
    await restoreUIForChat(chatId);
  });
})();
