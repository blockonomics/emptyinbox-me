import { createElement } from "../../../utils/domHelpers.js";
import { createCopyButton } from "../../atoms/CopyButton/index.js";
import { copyToClipboard } from "../../../utils/clipboard.js";

export function createApiKeyDisplay() {
  const container = createElement('div', 'api-key-container');
  const display = createElement('span', 'api-key', 'Loading...');
  display.id = 'api-key-display';
  
  const copyButton = createCopyButton();
  copyButton.id = 'copy-api-key';
  
  container.appendChild(display);
  container.appendChild(copyButton);
  
  // Add copy functionality
  setTimeout(() => {
    copyButton.addEventListener('click', async () => {
      const apiKey = display.textContent;
      if (apiKey && apiKey !== 'Loading...') {
        await copyToClipboard(apiKey, copyButton);
      }
    });
  }, 0);
  
  return container;
}