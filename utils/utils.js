export function getCurrentChatId() {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1] || null;
}
