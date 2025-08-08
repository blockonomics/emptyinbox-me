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
      <div id="api-key-display" class="stat-text api-key api-key-hidden">Loading...</div>
      <button id="toggle-api-key" class="api-key-toggle" title="Toggle API key visibility">👁️</button>
    </div>
  `;
  return card;
}
