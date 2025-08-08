export function renderStats() {
  const statsContainer = document.createElement('div');
  statsContainer.classList.add('dashboard-stats');
  statsContainer.appendChild(createApiKeyCard());
  statsContainer.appendChild(createStatCard('Inbox Quota', 'quota-text', '0 remaining'));
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
          // Show checkmark feedback
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
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = apiKey;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          // Show checkmark feedback
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
      }
    });
  }, 0);
  
  return card;
}