export function renderStats() {
  const statsContainer = document.createElement('div');
  statsContainer.classList.add('dashboard-stats');

  statsContainer.appendChild(createStatCard('Wallet Address', 'full-address', 'Loading...'));
  statsContainer.appendChild(createApiKeyCard());
  statsContainer.appendChild(createQuotaCard());
  statsContainer.appendChild(createStatCard('Last Login', 'last-login', 'Loading...'));
  statsContainer.appendChild(createStatCard('Session Status', null, '<span class="status-active">Connected</span>'));
  statsContainer.appendChild(createStatCard('Session Expires', 'session-expires', 'Loading...'));

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
      <div id="api-key-display" class="stat-text api-key api-key-hidden">Loading...</div>
      <button id="toggle-api-key" class="api-key-toggle" title="Toggle API key visibility">👁️</button>
    </div>
  `;
  return card;
}

function createQuotaCard() {
  const card = document.createElement('div');
  card.classList.add('stat-card');
  card.innerHTML = `
    <h3>Inbox Quota</h3>
    <div class="quota-display">
      <div class="quota-bar">
        <div id="quota-fill" class="quota-fill" style="width: 0%"></div>
      </div>
      <div id="quota-text" class="quota-text">0 / 0</div>
    </div>
    <div id="quota-remaining" class="quota-remaining" style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">0 remaining</div>
  `;
  return card;
}