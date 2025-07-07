import { savePinIdToDB } from "../../db/persistence.js";
import { getTruncatedPreviewById } from "./getTruncatedText.js";
import { removePinIdFromDB } from "../../db/persistence.js";
import {
  scrollToAssistantMsg,
  getExpandedArticleById,
  getPreviousArticleContentDivById,
} from "./../collapse/helpers.js";

export async function addPin(msg = "📌 Pin", id = "") {
  console.log("[PinCol] Adding pin with msg:", msg, "and id:", id);
  const chatId = location.pathname.split("/").pop();
  const btn = document.querySelector(`.bottom-collapse-btn[data-msgid="${id}"]`);
  const isPinned = btn?.dataset.pinned === "true";

  if (isPinned) {
    console.warn(`[PinCol] ❌ Pin already exists for msgId: ${id}`);
    updatePinStyle(id, !isPinned);
    removePinFromUI(id);
    await removePinIdFromDB(chatId, id);
    return;
  }
  console.log(`[PinCol] ✅ FROM Adding pin for msgId: ${id}`);
  addPinToUI(getTruncatedPreviewById(msg), id);
  updatePinStyle(id);
  savePinIdToDB(chatId, id);
}

export function updatePinStyle(msgId, shouldPin = true) {
  function updateButton() {
    const div = document.querySelector(`div[data-message-author-role="assistant"][data-message-id="${msgId}"]`);
    if (!div) {
      console.warn(`[PinCol] ❌ Assistant div not found for msgId: ${msgId}`);
      return false;
    }

    const wrapper = div.closest(".article-wrapper");
    if (!wrapper) {
      console.warn(`[PinCol] ❌ .article-wrapper not found for msgId: ${msgId}`);
      return false;
    }

    const btn = wrapper.querySelector(".bottom-collapse-btn");
    if (!btn) {
      console.warn(`[PinCol] ❌ .bottom-collapse-btn not found for msgId: ${msgId}`);
      return false;
    }

    if (shouldPin) {
      console.log(`[PinCol] ✅ Pinning msgId: ${msgId}`);
      btn.textContent = "";
      const img = document.createElement("img");
      img.src = chrome.runtime.getURL("assets/pin-17.png");
      img.alt = "Pinned";
      Object.assign(img.style, {
        width: "90%",
        height: "18px",
        filter: "brightness(0) invert(0)", // Black pin
        pointerEvents: "none",
        display: "block",
        margin: "0 auto",
      });
      btn.innerHTML = ""; // Clear existing content
      btn.appendChild(img); // Add the image

      btn.style.backgroundColor = "#fff"; // White background
      btn.style.border = "1px solid #fff";

      btn.classList.add("pinned");
      btn.dataset.pinned = "true";
    } else {
      console.log(`[PinCol] 🔄 Unpinning msgId: ${msgId}`);
      btn.textContent = "";
      btn.style.backgroundColor = ""; // Reset background
      btn.style.border = ""; // Reset border

      const img = document.createElement("img");
      img.src = chrome.runtime.getURL("assets/pin-17.png");
      img.alt = "Pin";
      img.className = "pin-img";
      // 🔧 Set styles directly here
      Object.assign(img.style, {
        width: "90%",
        height: "18px",
        filter: "brightness(0) invert(1)",
        pointerEvents: "none", // ensures clicks go to button, not image
        display: "block",
        margin: "0 auto",
        color: "white", // fallback for dark mode
      });

      btn.innerHTML = ""; // Clear existing content
      btn.appendChild(img); // Add the image back

      btn.classList.remove("pinned");
      btn.dataset.pinned = "false";
    }

    return true;
  }

  if (updateButton()) return;

  // Wait for DOM if not yet available
  const observer = new MutationObserver(() => {
    console.debug("[PinCol] MutationObserver detected changes in the DOM for pin update");
    if (updateButton()) {
      console.debug("[PinCol] MutationObserver condition met, disconnecting observer.");
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => updateButton());
  }
}

export function addPinToUI(msg = "📌 Pin", id = "") {
  const pin = document.createElement("div");
  pin.className = "pin-item";
  pin.dataset.id = id;
  pin.textContent = msg;
  pin.addEventListener("click", () => {
    const article = document
      .querySelector(`article[data-testid^="conversation-turn"] div[data-message-id="${id}"]`)
      ?.closest("article");

    if (article) {
      scrollToAssistantMsg(id);
      article.classList.add("flash-highlight");
      setTimeout(() => {
        article.classList.remove("flash-highlight");
      }, 2000);
    }
  });

  pin.classList.add("pin-button");
  Object.assign(pin.style, {
    background: "#2f2f2f",
    color: "#ffffff",
    border: "1px solid #ffffff26",
    borderRadius: "90px",
    fontSize: "12px",
    padding: "4px 10px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transform: "scale(0.9) translateX(-40px)",
    opacity: "0",
    transition: "transform 300ms ease, opacity 300ms ease, background-color 150ms ease",
  });
  // Inject hover CSS once
  if (!document.getElementById("pin-hover-style")) {
    const style = document.createElement("style");
    style.id = "pin-hover-style";
    style.textContent = `
      .pin-item:hover {
        background-color: #3a3a3a;
      }
    `;
    document.head.appendChild(style);
  }

  const container = document.querySelector(".pin-container");
  if (!container) return console.warn("[PinCol] .pin-container not found");

  container.prepend(pin);

  requestAnimationFrame(() => {
    pin.style.transform = "scale(1) translateX(0)";
    pin.style.opacity = "1";
  });

  pin.addEventListener("mouseenter", (e) => {
    const tooltip = document.getElementById("pin-tooltip-box");
    if (!tooltip) return;

    tooltip.innerHTML = "";

    // 1️⃣ Get user prompt
    const userPrompt = getPreviousArticleContentDivById(id);
    const userDiv = document.createElement("div");
    if (userPrompt) {
      userDiv.appendChild(userPrompt.cloneNode(true));
      Object.assign(userDiv.style, {
        // background: "#444654",
        padding: "12px",
        borderRadius: "8px",
        // maxWidth: "48%",
        // alignSelf: "flex-end",
        
        color: "white",
      });
    }

    // 2️⃣ Get GPT response
    const gptResponse = getExpandedArticleById(id);
    const gptDiv = document.createElement("div");
    if (gptResponse) {
      gptDiv.appendChild(gptResponse);
      Object.assign(gptDiv.style, {
        // background: "#343541",
        padding: "20px",
        borderRadius: "8px",
        // maxWidth: "48%",
        // alignSelf: "flex-start",
        color: "white",
      });
    }

    // 3️⃣ Wrap in vertical chat style
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      maxHeight: "22rem",
      overflow: "hidden",
    });

    if (userDiv.childNodes.length) wrapper.appendChild(userDiv);
    if (gptDiv.childNodes.length) wrapper.appendChild(gptDiv);
    tooltip.appendChild(wrapper);

    // 4️⃣ Position the tooltip below header
    const pinRect = e.target.getBoundingClientRect();
    const header = document.querySelector("header.sticky") || document.querySelector("nav");
    const headerBottom = header?.getBoundingClientRect().bottom ?? 0;

    tooltip.style.left = `${pinRect.left + pinRect.width / 2}px`;
    tooltip.style.top = `${headerBottom + 10}px`;
    tooltip.style.opacity = "1";
  });

  pin.addEventListener("mouseleave", () => {
    const tooltip = document.getElementById("pin-tooltip-box");
    if (!tooltip) return;
    tooltip.style.opacity = "0";
    tooltip.innerHTML = ""; // Clean up for next hover
  });
}

export function setPinUIOnly(msgId) {
  console.log("[PinCol] Setting pin UI for msgId from setPinUIOnly:", msgId);
  updatePinStyle(msgId); // changes the button
  addPinToUI(getTruncatedPreviewById(msgId), msgId); // adds to header
}

export function removePinFromUI(id) {
  const container = document.querySelector(".pin-container");
  if (!container) {
    console.warn("[PinCol] ❌ .pin-container not found");
    return;
  }

  const pinElement = container.querySelector(`.pin-item[data-id="${id}"]`);
  if (!pinElement) {
    console.warn(`[PinCol] ⚠️ Pin item not found in header for id: ${id}`);
    return;
  }

  console.log(`[PinCol] 🧹 Removing pin item for id: ${id}`);
  pinElement.remove();
}
