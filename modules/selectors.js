export function getAllChatPromptResponseBlocks() {
  const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
  const blocks = [];

  for (let i = 0; i < articles.length - 1; i++) {
    const user = articles[i].querySelector('[data-message-author-role="user"]');
    const assistant = articles[i + 1].querySelector('[data-message-author-role="assistant"]');

    if (user && assistant) {
      const userId = user.getAttribute('data-message-id');
      const assistantId = assistant.getAttribute('data-message-id');

      if (userId && assistantId) {
        blocks.push({
          block1UserPromptId: userId,
          block1ResponseId: assistantId,
          article: articles[i + 1]
        });
        i++;
      }
    }
  }

  return blocks;
}
