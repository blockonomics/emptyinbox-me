import { createElement } from "../../../utils/domHelpers.js";
import { createMessagePreview } from "../../molecules/MessagePreview/index.js";
import { fetchMessages } from "../../../services/apiService.js";

export function createLatestMessageCard() {
  const card = createElement('div', 'stat-card latest-message-card');
  
  const cardHeader = createElement('div', 'card-header-enhanced');
  cardHeader.innerHTML = `
    <div class="header-left">
      <h3>Latest Message</h3>
      <div class="live-indicator">
        <div class="live-dot"></div>
        <span>Live</span>
      </div>
    </div>
    <button class="refresh-button" onclick="refreshLatestMessage()" title="Refresh messages">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>
    </button>
  `;
  
  const contentDiv = createElement('div', 'message-content-wrapper');
  contentDiv.id = 'latest-message-content';
  contentDiv.appendChild(createMessagePreview(null));
  
  card.appendChild(cardHeader);
  card.appendChild(contentDiv);
  
  // Load latest message
  setTimeout(async () => {
    await loadLatestMessage(contentDiv);
  }, 100);
  
  return card;
}

async function loadLatestMessage(contentDiv) {
  try {
    contentDiv.innerHTML = `
      <div class="loading-state">
        <div class="loading-animation">
          <div class="loading-spinner"></div>
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="loading-text">Fetching latest messages...</div>
      </div>
    `;
    
    const messages = await fetchMessages();
    const latestMessage = messages && messages.length > 0 ? messages[0] : null;
    const preview = createMessagePreview(latestMessage);
    
    contentDiv.innerHTML = '';
    contentDiv.appendChild(preview);
    
  } catch (error) {
    contentDiv.innerHTML = `
      <div class="error-state">
        <div class="error-animation">
          <span class="error-icon">⚠️</span>
          <div class="error-pulse"></div>
        </div>
        <div class="error-text">Unable to load messages</div>
        <button class="retry-button" onclick="refreshLatestMessage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Try Again
        </button>
      </div>
    `;
  }
}

// Global refresh function
window.refreshLatestMessage = async function() {
  const contentDiv = document.getElementById('latest-message-content');
  const refreshBtn = document.querySelector('.refresh-button');
  
  if (refreshBtn) {
    refreshBtn.classList.add('spinning');
    refreshBtn.disabled = true;
  }
  
  await loadLatestMessage(contentDiv);
  
  setTimeout(() => {
    if (refreshBtn) {
      refreshBtn.classList.remove('spinning');
      refreshBtn.disabled = false;
    }
  }, 500);
};