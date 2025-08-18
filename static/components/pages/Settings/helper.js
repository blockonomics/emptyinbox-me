export function updateUserDisplay(userData) {
  // 🔗 Header elements
  const userAddress = document.getElementById('user-address');
  const apiKeyDisplay = document.getElementById('api-key-display');
  const quotaText = document.getElementById('quota-text');

  const address = userData.address || '';
  userAddress.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
  userAddress.title = address;

  // 🔑 API key
  apiKeyDisplay.textContent = userData.api_key || 'Unavailable';

  // 📬 Quota
  const inboxQuaota = userData.inbox_quota || 0;
  quotaText.textContent = `${inboxQuaota} remaining`;
}
