export function renderHeader() {
  const header = document.createElement('div');
  header.classList.add('dashboard-header');
  header.innerHTML = `
    <h1>Welcome to your Dashboard</h1>
    <div class="user-info">
      <div class="wallet-info">
        <span class="wallet-label">Connected Wallet:</span>
        <span id="user-address" class="wallet-address">Loading...</span>
      </div>
      <button id="logout-btn" class="logout-btn">Disconnect</button>
    </div>
  `;
  return header;
}