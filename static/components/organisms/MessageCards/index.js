import { createElement } from "../../../utils/domHelpers.js";
import { createMessagePreview } from "../../molecules/MessagePreview/index.js";
import { fetchMessages } from "../../../services/apiService.js";

export function createMessageCards() {
  const card = createElement('div', 'stat-card latest-message-card');
  
  const cardHeader = createElement('div', 'card-header-enhanced');
  cardHeader.innerHTML = `
    <div class="header-left">
      <h3>Latest Messages</h3>
      <div class="live-indicator">
        <div class="live-dot"></div>
        <span>Live</span>
      </div>
    </div>
  `;
  
  const contentDiv = createElement('div', 'message-content-wrapper');
  contentDiv.id = 'latest-message-content';
  
  card.appendChild(cardHeader);
  card.appendChild(contentDiv);
  
  // Load all messages
  setTimeout(async () => {
    await loadAllMessages(contentDiv);
  }, 100);
  
  return card;
}

async function loadAllMessages(contentDiv) {
  try {
    contentDiv.innerHTML = `
      <div class="loading-state">
        <div class="loading-animation">
          <div class="loading-spinner"></div>
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="loading-text">Fetching all messages...</div>
      </div>
    `;
    
    const messages = await fetchMessages();
    
    displayAllMessages(contentDiv, messages || []);
    
  } catch (error) {
    contentDiv.innerHTML = `
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

function displayAllMessages(contentDiv, messages) {
  // Clear content with smooth transition
  contentDiv.style.opacity = '0';
  
  setTimeout(() => {
    contentDiv.innerHTML = '';
    
    if (messages.length === 0) {
      const noMessagesDiv = createElement('div', 'no-messages-state');
      noMessagesDiv.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <div class="empty-text">No messages available</div>
        </div>
      `;
      contentDiv.appendChild(noMessagesDiv);
    } else {
      // Create container for all messages
      const messagesContainer = createElement('div', 'all-messages-container');
      
      // Loop through all messages and create previews
      messages.forEach((message, index) => {
        const messageWrapper = createElement('div', 'message-item-wrapper');
        const preview = createMessagePreview(message);
        messageWrapper.appendChild(preview);
        messagesContainer.appendChild(messageWrapper);
      });
      
      contentDiv.appendChild(messagesContainer);
    }
    
    contentDiv.style.opacity = '1';
  }, 150);
}