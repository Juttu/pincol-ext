export function waitAndClickScrollToBottom(timeout = 2000) {
  return new Promise((resolve) => {
    const scrollBtn = document.querySelector('button svg path[d^="M9.33468 3.33333"]')?.closest("button");

    if (scrollBtn) {
      scrollBtn.click();
      return resolve(true);
    }

    const obs = new MutationObserver(() => {
      const btn = document.querySelector('button svg path[d^="M9.33468 3.33333"]')?.closest("button");

      if (btn) {
        btn.click();
        obs.disconnect();
        resolve(true);
      }
    });

    obs.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      obs.disconnect();
      resolve(false); // Timed out
    }, timeout);
  });
}
