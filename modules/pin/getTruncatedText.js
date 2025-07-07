export function getTruncatedPreviewById(msgId, maxLength = 10) {
  console.log("NEW msgID:", msgId);
  const container = document.querySelector(
    `div[data-message-author-role="assistant"][data-message-id="${msgId}"]`
  );

  if (!container) {
    console.warn("[PinCol] Assistant message not found for ID:", msgId);
    return "(Not found)";
  }

  const firstParagraph = container.querySelector("p, li, code, pre");
  if (!firstParagraph) return "(Empty reply)";

  const text = firstParagraph.innerText.trim();

  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength).trim() + "…";
}
