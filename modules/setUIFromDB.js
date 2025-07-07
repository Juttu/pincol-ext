import { loadStateForChat } from "../db/persistence.js";
import { forceCollapseById } from "./collapse/register-v2.js";
import { setPinUIOnly } from "./pin/add-pin.js";
/**
 * Restore UI state (collapsed + pinned) from JSONBin for a chat.
 */
export async function restoreUIForChat(chatId) {
  console.info("[PinCol] Restoring UI for chatId:", chatId);

  try {
    const state = await loadStateForChat(chatId);
    const collapseids = state.collapseids || [];
    const pinids = state.pinids || [];

    console.info("[PinCol] collapseids:", collapseids);
    console.info("[PinCol] pinids:", pinids);

    await new Promise((r) => setTimeout(r, 300)); // Wait for DOM
    // waitAndClickScrollToBottom();

    restoreCollapseUI(collapseids);
    restorePinUI(pinids);
  } catch (err) {
    console.error("[PinCol] Failed to restore UI state:", err);
  }
}

/**
 * Collapse replies from a list of message IDs.
 */
export function restoreCollapseUI(collapseids) {
  collapseids.forEach((id) => {
    console.log("[PinCol] Forcing collapse for msgId:", id);
    forceCollapseById(id);
  });
  console.info(`[PinCol] Applied collapse to ${collapseids.length} replies`);
}

/**
 * Apply pin UI state (future implementation).
 */
export function restorePinUI(pinids = []) {
  console.log("[PinCol] Restoring pin UI for:", pinids);

  pinids.forEach((id) => {
    const div = document.querySelector(`div[data-message-author-role="assistant"][data-message-id="${id}"]`);
    if (div) {
      console.log("[PinCol] Found div for pin:", id);
      setPinUIOnly(id);
    } else {
      console.warn("[PinCol] Div not found for pin:", id);
      // Wait for DOM injection
      const mo = new MutationObserver((_muts, obs) => {
        const div = document.querySelector(`div[data-message-author-role="assistant"][data-message-id="${id}"]`);
        if (div) {
          console.log("[PinCol] MutationObserver: Found div for pin after mutation:", id);
          setPinUIOnly(id);
          obs.disconnect();
        } else {
          console.log("[PinCol] MutationObserver: Div still not found for pin:", id);
        }
      });

      mo.observe(document.body, { childList: true, subtree: true });
    }
  });
}
