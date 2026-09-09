import { createElement } from "../../../utils/domHelpers.js";

export function createInboxList(inboxes) {
  const container = createElement('div');

  // Apply scrollable styles
  container.style.maxHeight = '300px'; // Adjust height as needed
  container.style.overflowY = 'auto';
  container.style.paddingRight = '8px'; // Optional: avoids scrollbar overlap

  if (!inboxes || inboxes.length === 0) {
    container.innerHTML = '<div style="color: var(--color-text-secondary); font-size: 0.9rem;">No inboxes created yet</div>';
    return container;
  }

  container.innerHTML = inboxes.map(inbox => `
    <div style="font-family: 'Monaco', 'Consolas', monospace; font-size: 0.85rem; color: var(--color-primary); margin-bottom: 0.5rem; padding: 0.25rem 0; border-bottom: 1px solid var(--color-primary-border);">
      ${inbox}
    </div>
  `).join('');

  return container;
}