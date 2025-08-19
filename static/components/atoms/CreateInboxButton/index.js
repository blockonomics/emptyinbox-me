import { createElement } from "../../../utils/domHelpers.js";

export function createCreateInboxButton() {
  const button = createElement('button', 'create-inbox-btn container');
  button.title = 'Create new inbox';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
    Create New Inbox
  `;
  return button;
}