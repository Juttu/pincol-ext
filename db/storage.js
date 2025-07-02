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

export async function saveCollapseIdToDB(chatId, responseId) {
  try {
    const url = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
    const res = await fetch(url, { headers });
    const json = await res.json();

    let data = json.record || [];

    // Try to find the chat
    let chat = data.find((entry) => entry.chatid === chatId);

    if (!chat) {
      // ✅ Create new chat entry if not found
      chat = {
        chatid: chatId,
        collapseids: [],
        pinids: [],
      };
      data.push(chat);
      console.warn(`Created new entry for chatId: ${chatId}`);
    }

    // Avoid duplicates
    if (!chat.collapseids.includes(responseId)) {
      chat.collapseids.push(responseId);
    }

    // PUT back the updated data
    const updateUrl = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
    await fetch(updateUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    console.log(`✅ Added collapse ID '${responseId}' to chat '${chatId}'`);
  } catch (err) {
    console.error("❌ Error saving collapse ID:", err);
  }
}

export async function removeCollapseIdFromDB(chatId, responseId) {
  try {
    const url = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
    const res = await fetch(url, { headers });
    const json = await res.json();

    const data = json.record || [];

    // Find the chat entry
    const chat = data.find((entry) => entry.chatid === chatId);
    if (!chat) {
      console.warn(`Chat ID ${chatId} not found`);
      return;
    }

    // Remove the responseId
    chat.collapseids = chat.collapseids.filter((id) => id !== responseId);

    // PUT back updated array
    const updateUrl = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
    await fetch(updateUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    console.log(`❌ Removed collapse ID '${responseId}' from chat '${chatId}'`);
  } catch (err) {
    console.error("❌ Error removing collapse ID:", err);
  }
}
