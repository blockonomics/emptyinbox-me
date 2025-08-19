import { createElement } from "../../../utils/domHelpers.js";
import { createInboxPreview } from "../../molecules/InboxPreview/index.js";
import { fetchInboxes } from "../../../services/apiService.js";

export function createInboxCards() {
  const container = createElement('div', 'inboxes-container');
  container.id = 'inboxes-container';

  setTimeout(async () => {
    await loadAllInboxes(container);
  }, 100);

  return container;
}

async function loadAllInboxes(container) {
  try {
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-animation">
          <div class="loading-spinner"></div>
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="loading-text">Fetching inboxes...</div>
      </div>
    `;

    const inboxes = await fetchInboxes();

    displayAllInboxes(container, inboxes || []);
  } catch (error) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-animation">
          <span class="error-icon">⚠️</span>
          <div class="error-pulse"></div>
        </div>
        <div class="error-text">Unable to load inboxes</div>
      </div>
    `;
  }
}

function displayAllInboxes(container, inboxes) {
  container.style.opacity = '0';

  setTimeout(() => {
    container.innerHTML = '';

    if (inboxes.length === 0) {
      const noInboxesDiv = createElement('div', 'no-inboxes-state');
      noInboxesDiv.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📂</span>
          <div class="empty-text">No inboxes available</div>
        </div>
      `;
      container.appendChild(noInboxesDiv);
    } else {
      inboxes.forEach((inbox, index) => {
        const preview = createInboxPreview(inbox);
        inboxCard.appendChild(preview);
      });
    }

    container.style.opacity = '1';
  }, 150);
}