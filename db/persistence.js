/* modules/persistence.js */
const API_KEY = "$2a$10$PsC5d/adIkIJuZbMeQB9eeCmRHIouSkl1hNxC9KwMfVbTsmxEDYIu"; // 🔒 keep private
const BIN_ID = "686884b18561e97a5031b930";

const ROOT = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const LATEST = `${ROOT}/latest`;

let cache = null; // in-memory cache of entire bin

/* ----- fetch the entire JSONBin document ----------------------------- */
async function fetchAll() {
  if (cache) return cache;

  const r = await fetch(LATEST, {
    headers: {
      "X-Master-Key": API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!r.ok) throw new Error("JSONBin " + r.status);

  const { record } = await r.json();
  cache = Array.isArray(record) ? record : [];
  return cache;
}

/* ----- overwrite the document and reset cache ------------------------ */
async function saveAll(arr) {
  await fetch(ROOT, {
    method: "PUT",
    headers: {
      "X-Master-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arr),
  });

  cache = arr; // update in-memory cache
}

/* =======  PUBLIC API  ================================================= */

/**
 * Load state for a chat. If it doesn't exist, create it and save to bin.
 */
export async function loadStateForChat(chatId) {
  const all = await fetchAll();
  let chat = all.find((x) => x.chatid === chatId);

  if (!chat) {
    console.info("[persistence] Creating new state entry for chat:", chatId);
    chat = { chatid: chatId, collapseids: [], pinids: [] };
    all.push(chat);
    await saveAll(all);
  }

  return chat;
}

/**
 * Toggle collapse state and persist the updated record.
 */
export async function toggleCollapse(chatId, msgId, shouldCollapse) {
  const all = await fetchAll();
  let chat = all.find((x) => x.chatid === chatId);

  if (!chat) {
    console.warn("[persistence] toggleCollapse: chat not found, creating...");
    chat = { chatid: chatId, collapseids: [], pinids: [] };
    all.push(chat);
  }

  const set = new Set(chat.collapseids);
  const action = shouldCollapse ? "collapsing" : "expanding";
  console.debug(`[persistence] toggleCollapse: ${action} msgId=${msgId} for chatId=${chatId}`);

  shouldCollapse ? set.add(msgId) : set.delete(msgId);
  chat.collapseids = [...set];

  console.debug("[persistence] toggleCollapse: updated collapseids:", chat.collapseids);

  await saveAll(all);
  console.debug("[persistence] toggleCollapse: state saved");
}
