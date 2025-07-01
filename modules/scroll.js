export function scrollToMessageId(id) {
  const el = document.querySelector(`[data-message-id="${id}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }
  console.warn("No element found for ID:", id);
  return false;
}

export function waitForScrollEnd(callback, timeout = 1000) {
  let lastY = window.scrollY;
  let idleFrames = 0;

  function check() {
    const nowY = window.scrollY;
    if (Math.abs(nowY - lastY) < 1) {
      idleFrames++;
    } else {
      idleFrames = 0;
    }

    if (idleFrames >= 3) {
      callback();
    } else {
      lastY = nowY;
      requestAnimationFrame(check);
    }
  }

  requestAnimationFrame(check);
}
