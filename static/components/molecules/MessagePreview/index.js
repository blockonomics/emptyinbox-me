import { createElement } from "../../../utils/domHelpers.js";
import { extractActivationCode } from "../../../utils/domHelpers.js";

export function createMessagePreview(message) {
  const container = createElement('div');

  if (!message) {
    container.innerHTML = '<div style="color: #6b7280; font-size: 0.9rem;">No messages yet</div>';
    return container;
  }

  const sender = message.from || 'Unknown sender';
  const timestamp = message.created_at
    ? new Date(message.created_at).toLocaleString()
    : 'Unknown time';
  const code = extractActivationCode(message.text_body);

  container.innerHTML = `
    <div style="margin-bottom: 0.5rem;">
      <div style="font-size: 0.85rem; color: #6b7280;">From: ${sender}</div>
      <div style="font-size: 0.85rem; color: #6b7280;">Received: ${timestamp}</div>
    </div>
    <div style="font-size: 1rem; color: #1f2937; font-weight: 600;">
      ${code ? `Activation Code: <span style="background-color:#fef3c7; padding:2px 6px; border-radius:4px;">${code}</span>` : 'No activation code found'}
    </div>
  `;

  return container;
}