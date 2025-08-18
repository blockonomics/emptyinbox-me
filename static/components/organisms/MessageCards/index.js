import { createElement } from "../../../utils/domHelpers.js";
import { createMessagePreview } from "../../molecules/MessagePreview/index.js";
import { fetchMessages } from "../../../services/apiService.js";
import { ROUTES } from "../../../utils/constants.js";

export function createMessageCards() {
  const container = createElement('div', 'messages-container');
  container.id = 'messages-container';
  
  // Load all messages
  setTimeout(async () => {
    await loadAllMessages(container);
  }, 100);
  
  return container;
}

async function loadAllMessages(container) {
  try {
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-animation">
          <div class="loading-spinner"></div>
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="loading-text">Fetching messages...</div>
      </div>
    `;
    
    const messages = await fetchMessages();
    
    displayAllMessages(container, messages || []);
    
  } catch (error) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-animation">
          <span class="error-icon">⚠️</span>
          <div class="error-pulse"></div>
        </div>
        <div class="error-text">Unable to load messages</div>
      </div>
    `;
  }
}

function displayAllMessages(container, messages) {
  // Clear content with smooth transition
  container.style.opacity = '0';
  
  setTimeout(() => {
    container.innerHTML = '';
    
    if (messages.length === 0) {
      const noMessagesDiv = createElement('div', 'stat-card message-card');
      noMessagesDiv.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <div class="empty-text">No messages yet. Head over to your <a href="${ROUTES.INBOXES}">inboxes</a> to copy your email address and start receiving messages here.</div>
        </div>
      `;
      container.appendChild(noMessagesDiv);
    } else {
      // Create a separate card for each message
      messages.forEach((message, index) => {
        const messageCard = createElement('div', 'stat-card message-card');
        const preview = createMessagePreview(message);
        messageCard.appendChild(preview);
        container.appendChild(messageCard);
      });
    }
    
    container.style.opacity = '1';
  }, 150);
}