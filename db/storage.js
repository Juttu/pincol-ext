const JSONBIN_API_KEY = "$2a$10$r7B2yZ.dycvgPqM0pcALueqNNZ.9aFlOggfWgd75mgra0gpLhE5Em"; // 🔒 keep private
const BIN_ID = "6863a4998561e97a502f863d";

const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": "$2a$10$r7B2yZ.dycvgPqM0pcALueqNNZ.9aFlOggfWgd75mgra0gpLhE5Em",
};

export async function fetchChatPrefs(chatId) {
  try {
    const url = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.error("Failed to fetch from JSONBin");
      return null;
    }

    const json = await res.json();
    const data = json.record || [];

    const entry = data.find((item) => item.chatid === chatId);
    return (
      entry || {
        chatid: chatId,
        collapseids: [],
        pinids: [],
      }
    );
  } catch (err) {
    console.error("Error fetching chat prefs:", err);
    return null;
  }
}
