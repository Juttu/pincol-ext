import { injectToolbarButtons } from "./injectToolbar.js";
import {getCurrentChatId} from "./../utils/utils.js";
import { fetchChatPrefs } from "./../db/storage.js";
export async function main() {
  // Fetch and print chatId, collapseids, and pinids
  const chatId = getCurrentChatId();
  if (chatId) {
    const prefs = await fetchChatPrefs(chatId);
    if (prefs) {
      console.log("collapseids:", prefs.collapseids);
      console.log("pinids:", prefs.pinids);
    } else {
      console.log("No preferences found for chatId:", chatId);
    }
  } else {
    console.log("No chatId found in URL.");
  }

  injectToolbarButtons();

  const observer = new MutationObserver(() => {
    injectToolbarButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("✅ ChatGPT Extension with ES Modules is running");
}