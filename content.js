(async () => {
  const src = chrome.runtime.getURL("modules/contentMain.js");
  const module = await import(src);
  module.main();
})();
