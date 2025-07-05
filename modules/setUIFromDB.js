import { loadStateForChat } from "../db/persistence.js";
import { forceCollapseById } from "./collapse/register.js";

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
export function restorePinUI(pinids) {
  console.log("[PinCol] (TODO) Pin UI update for:", pinids);
  // implementation pending
}
