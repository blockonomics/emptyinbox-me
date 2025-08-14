import { API_BASE_URL, LOCAL_STORAGE_KEYS } from "../../../utils/constants.js";

export function renderStats() {
  const statsContainer = document.createElement('div');
  statsContainer.classList.add('dashboard-stats');
  
  // Add all stat cards
  statsContainer.appendChild(createApiKeyCard());
  statsContainer.appendChild(createStatCard('Inbox Quota', 'quota-text', '0 remaining'));
  statsContainer.appendChild(createLatestMessageCard());
  statsContainer.appendChild(createInboxManagementCard());
  
  return statsContainer;
}

function createStatCard(title, id, content) {
  const card = document.createElement('div');
  card.classList.add('stat-card');
  card.innerHTML = `
    <h3>${title}</h3>
    <div ${id ? `id="${id}"` : ''} class="stat-text">${content}</div>
  `;
  return card;
}

function createApiKeyCard() {
  const card = document.createElement('div');
  card.classList.add('stat-card');
  card.innerHTML = `
    <h3>API Key</h3>
    <div class="api-key-container">
      <span id="api-key-display" class="api-key">Loading...</span>
      <button id="copy-api-key" class="api-key-copy" title="Copy API key">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Add copy functionality
  setTimeout(() => {
    const copyBtn = card.querySelector('#copy-api-key');
    const apiKeyDisplay = card.querySelector('#api-key-display');
    
    copyBtn?.addEventListener('click', async () => {
      const apiKey = apiKeyDisplay.textContent;
      
      if (apiKey && apiKey !== 'Loading...') {
        try {
          await navigator.clipboard.writeText(apiKey);
          showCopyFeedback(copyBtn);
        } catch (err) {
          fallbackCopy(apiKey, copyBtn);
        }
      }
    });
  }, 0);
  
  return card;
}

function createLatestMessageCard() {
  const card = document.createElement('div');
  card.classList.add('stat-card');
  card.innerHTML = `
    <h3>Latest Message</h3>
    <div id="latest-message-content" class="stat-text">
      <div style="color: #6b7280; font-size: 0.9rem;">No messages yet</div>
    </div>
  `;
  
  // Load latest message
  setTimeout(async () => {
    await loadLatestMessage();
  }, 0);
  
  return card;
}

function createInboxManagementCard() {
  const card = document.createElement('div');
  card.classList.add('stat-card');
  card.innerHTML = `
    <h3>Email Inboxes</h3>
    <div id="inbox-list" class="stat-text" style="margin-bottom: 1rem;">
      <div style="color: #6b7280; font-size: 0.9rem;">Loading inboxes...</div>
    </div>
    <button id="create-inbox-btn" class="create-inbox-btn" title="Create new inbox">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      Create New Inbox
    </button>
  `;
  
  // Load inboxes and add create functionality
  setTimeout(() => {
    loadInboxes();
    setupCreateInboxButton();
  }, 0);
  
  return card;
}

// Helper function for copy feedback
function showCopyFeedback(copyBtn) {
  copyBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;
  copyBtn.style.color = '#10b981';
  setTimeout(() => {
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copyBtn.style.color = '';
  }, 1000);
}

// Fallback copy for older browsers
function fallbackCopy(text, copyBtn) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  showCopyFeedback(copyBtn);
}

// Load latest message from API
async function loadLatestMessage() {
  const contentDiv = document.getElementById('latest-message-content');
  
  try {
    const apiKey = getApiKey();
    
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const messages = await response.json();
      
      if (messages && messages.length > 0) {
        const latest = messages[0]; // Messages are ordered by timestamp (newest first)
        contentDiv.innerHTML = `
          <div style="margin-bottom: 0.5rem;">
            <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.25rem;">From: ${latest.inbox}</div>
            <div style="font-weight: 600; color: #1f2937; line-height: 1.3;">${latest.subject}</div>
          </div>
          <div style="font-size: 0.9rem; color: #6b7280; line-height: 1.4; max-height: 60px; overflow: hidden;">
            ${latest.text_body ? truncateText(latest.text_body, 80) : 'No preview available'}
          </div>
        `;
      } else {
        contentDiv.innerHTML = '<div style="color: #6b7280; font-size: 0.9rem;">No messages yet</div>';
      }
    } else {
      contentDiv.innerHTML = '<div style="color: #ef4444; font-size: 0.9rem;">Error loading messages</div>';
    }
  } catch (error) {
    contentDiv.innerHTML = '<div style="color: #ef4444; font-size: 0.9rem;">Error loading messages</div>';
  }
}

// Load inboxes from API
async function loadInboxes() {
  const listDiv = document.getElementById('inbox-list');
  
  try {
    const apiKey = getApiKey();
    
    const response = await fetch(`${API_BASE_URL}/api/inboxes`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const inboxes = await response.json();
      
      if (inboxes && inboxes.length > 0) {
        listDiv.innerHTML = inboxes.map(inbox => `
          <div style="font-family: 'Monaco', 'Consolas', monospace; font-size: 0.85rem; color: #10b981; margin-bottom: 0.5rem; padding: 0.25rem 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1);">
            ${inbox}
          </div>
        `).join('');
      } else {
        listDiv.innerHTML = '<div style="color: #6b7280; font-size: 0.9rem;">No inboxes created yet</div>';
      }
    } else {
      listDiv.innerHTML = '<div style="color: #ef4444; font-size: 0.9rem;">Error loading inboxes</div>';
    }
  } catch (error) {
    listDiv.innerHTML = '<div style="color: #ef4444; font-size: 0.9rem;">Error loading inboxes</div>';
  }
}

// Setup create inbox button
function setupCreateInboxButton() {
  const createBtn = document.getElementById('create-inbox-btn');
  
  createBtn?.addEventListener('click', async () => {
    createBtn.disabled = true;
    createBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      Creating...
    `;
    
    try {
      const apiKey = getApiKey();
      
      const response = await fetch(`${API_BASE_URL}/inbox`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const newInbox = await response.text();
        // Refresh the inbox list
        await loadInboxes();
        // Show success feedback
        createBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          Created!
        `;
        createBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        setTimeout(() => {
          createBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Create New Inbox
          `;
          createBtn.style.background = '';
          createBtn.disabled = false;
        }, 2000);
      } else if (response.status === 403) {
        createBtn.innerHTML = 'Quota Exceeded';
        createBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        setTimeout(() => {
          createBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Create New Inbox
          `;
          createBtn.style.background = '';
          createBtn.disabled = false;
        }, 3000);
      } else {
        throw new Error('Failed to create inbox');
      }
    } catch (error) {
      createBtn.innerHTML = 'Error';
      createBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      setTimeout(() => {
        createBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Create New Inbox
        `;
        createBtn.style.background = '';
        createBtn.disabled = false;
      }, 3000);
    }
  });
}

// Helper function to truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function getApiKey() {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.API_KEY);
}