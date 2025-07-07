// pin-inserter.js

export function observeAndInsertPinContainer() {
  const observer = new MutationObserver(() => {
    console.debug("[PinCol] MutationObserver detected changes in the DOM for pin container insertion");
    const header = document.querySelector("#page-header");
    const alreadyInserted = document.querySelector(".pin-container");
    console.debug("[PinCol] header found:", !!header, "alreadyInserted:", !!alreadyInserted);
    if (header && !alreadyInserted) {
      console.debug("[PinCol] Condition met: header exists and pin container not inserted yet");
      insertPinContainer(header);
      observer.disconnect(); // Stop once inserted
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function insertPinContainer(header) {
  const container = document.createElement("div");
  container.className = "pin-container";

  Object.assign(container.style, {
    position: "absolute",
    left: "160px",
    right: "180px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    gap: "6px",
    overflowX: "auto",
    whiteSpace: "nowrap",
    height: "fit-content",
    pointerEvents: "auto",
    alignItems: "center",
    scrollbarWidth: "none",
  });

  container.innerHTML = `<style>
    .pin-container::-webkit-scrollbar {
      display: none;
    }
  </style>`;

  header.appendChild(container);
  console.info("[PinCol] ✅ Pin container inserted");
}
