import { createElement } from "../../../utils/domHelpers.js";
import { createMessagePreview } from "../../molecules/MessagePreview/index.js";
import { fetchMessages } from "../../../services/apiService.js";

let currentMessages = [];
let currentMessageIndex = 0;

export function createLatestMessageCard() {
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
    <div class="header-right">
      <div class="message-counter" id="message-counter">
        <span id="current-index">0</span> of <span id="total-messages">0</span>
      </div>
      <div class="navigation-controls" id="nav-controls" style="display: none;">
        <button class="nav-button" id="prev-btn" onclick="navigateMessage(-1)" title="Previous message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        <button class="nav-button" id="next-btn" onclick="navigateMessage(1)" title="Next message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>
      </div>
      <button class="refresh-button" onclick="refreshLatestMessage()" title="Refresh messages">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      </button>
    </div>
  `;
  
  const contentDiv = createElement('div', 'message-content-wrapper');
  contentDiv.id = 'latest-message-content';
  contentDiv.appendChild(createMessagePreview(null));
  
  card.appendChild(cardHeader);
  card.appendChild(contentDiv);
  
  // Load latest messages
  setTimeout(async () => {
    await loadLatestMessages(contentDiv);
  }, 100);
  
  return card;
}

async function loadLatestMessages(contentDiv) {
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
    currentMessages = messages || [];
    currentMessageIndex = 0;
    
    updateMessageDisplay(contentDiv);
    updateNavigationControls();
    
  } catch (error) {
    currentMessages = [];
    currentMessageIndex = 0;
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
    updateNavigationControls();
  }
}

function updateMessageDisplay(contentDiv) {
  const currentMessage = currentMessages.length > 0 ? currentMessages[currentMessageIndex] : null;
  const preview = createMessagePreview(currentMessage);
  
  // Add smooth transition
  contentDiv.style.opacity = '0';
  setTimeout(() => {
    contentDiv.innerHTML = '';
    contentDiv.appendChild(preview);
    contentDiv.style.opacity = '1';
  }, 150);
}

function updateNavigationControls() {
  const counter = document.getElementById('message-counter');
  const navControls = document.getElementById('nav-controls');
  const currentIndexEl = document.getElementById('current-index');
  const totalMessagesEl = document.getElementById('total-messages');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (currentMessages.length > 0) {
    // Show controls
    counter.style.display = 'flex';
    navControls.style.display = 'flex';
    
    // Update counter
    currentIndexEl.textContent = currentMessageIndex + 1;
    totalMessagesEl.textContent = currentMessages.length;
    
    // Update button states
    if (prevBtn) {
      prevBtn.disabled = currentMessageIndex === 0;
      prevBtn.classList.toggle('disabled', currentMessageIndex === 0);
    }
    
    if (nextBtn) {
      nextBtn.disabled = currentMessageIndex === currentMessages.length - 1;
      nextBtn.classList.toggle('disabled', currentMessageIndex === currentMessages.length - 1);
    }
    
    // Hide controls if only one message
    if (currentMessages.length === 1) {
      navControls.style.display = 'none';
    }
  } else {
    // Hide controls when no messages
    counter.style.display = 'none';
    navControls.style.display = 'none';
  }
}

// Global navigation function
window.navigateMessage = function(direction) {
  if (currentMessages.length === 0) return;
  
  const newIndex = currentMessageIndex + direction;
  
  if (newIndex >= 0 && newIndex < currentMessages.length) {
    currentMessageIndex = newIndex;
    
    const contentDiv = document.getElementById('latest-message-content');
    if (contentDiv) {
      updateMessageDisplay(contentDiv);
      updateNavigationControls();
    }
  }
};

// Global refresh function
window.refreshLatestMessage = async function() {
  const contentDiv = document.getElementById('latest-message-content');
  const refreshBtn = document.querySelector('.refresh-button');
  
  if (refreshBtn) {
    refreshBtn.classList.add('spinning');
    refreshBtn.disabled = true;
  }
  
  await loadLatestMessages(contentDiv);
  
  setTimeout(() => {
    if (refreshBtn) {
      refreshBtn.classList.remove('spinning');
      refreshBtn.disabled = false;
    }
  }, 500);
};

// Keyboard navigation support
document.addEventListener('keydown', function(event) {
  // Only handle if the latest message card is visible and focused area
  const card = document.querySelector('.latest-message-card');
  if (!card || currentMessages.length <= 1) return;
  
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    navigateMessage(-1);
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    navigateMessage(1);
  }
});