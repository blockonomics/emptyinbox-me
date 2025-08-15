import { createElement } from "../../../utils/domHelpers.js";

export function createInboxList(inboxes) {
  const container = createElement('div');

  // Apply scrollable styles
  container.style.maxHeight = '120px'; // Adjust height as needed
  container.style.overflowY = 'auto';
  container.style.paddingRight = '8px'; // Optional: avoids scrollbar overlap

  if (!inboxes || inboxes.length === 0) {
    container.innerHTML = '<div style="color: #6b7280; font-size: 0.9rem;">No inboxes created yet</div>';
    return container;
  }

  container.innerHTML = inboxes.map(inbox => `
    <div style="font-family: 'Monaco', 'Consolas', monospace; font-size: 0.85rem; color: #10b981; margin-bottom: 0.5rem; padding: 0.25rem 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1);">
      ${inbox}
    </div>
  `).join('');

  return container;
}