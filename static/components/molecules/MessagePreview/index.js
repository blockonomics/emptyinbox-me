import { createElement } from "../../../utils/domHelpers.js";
import { truncateText } from "../../../utils/domHelpers.js";

export function createMessagePreview(message) {
  const container = createElement('div');
  
  if (!message) {
    container.innerHTML = '<div style="color: #6b7280; font-size: 0.9rem;">No messages yet</div>';
    return container;
  }
  
  container.innerHTML = `
    <div style="margin-bottom: 0.5rem;">
      <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.25rem;">From: ${message.inbox}</div>
      <div style="font-weight: 600; color: #1f2937; line-height: 1.3;">${message.subject}</div>
    </div>
    <div style="font-size: 0.9rem; color: #6b7280; line-height: 1.4; max-height: 60px; overflow: hidden;">
      ${message.text_body ? truncateText(message.text_body, 80) : 'No preview available'}
    </div>
  `;
  
  return container;
}