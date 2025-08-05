export function updateUserDisplay(userData) {
  // 🔗 Header elements
  const userAddress = document.getElementById('user-address');

  // 📊 Stat elements
  const fullAddress = document.getElementById('full-address');
  const apiKeyDisplay = document.getElementById('api-key-display');
  const quotaFill = document.getElementById('quota-fill');
  const quotaText = document.getElementById('quota-text');
  const quotaRemaining = document.getElementById('quota-remaining');
  const lastLogin = document.getElementById('last-login');
  const sessionExpires = document.getElementById('session-expires');

  // ✂️ Truncate and display wallet address
  const address = userData.address || '';
  userAddress.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
  userAddress.title = address;
  fullAddress.textContent = address;

  // 🔑 API key
  apiKeyDisplay.textContent = userData.api_key || 'Unavailable';

  // 📬 Quota
  const usedQuota = userData.inbox_quota || 0;
  const remainingQuota = userData.remaining_quota ?? 100;
  const totalQuota = usedQuota + remainingQuota;
  const quotaPercentage = totalQuota > 0 ? (usedQuota / totalQuota) * 100 : 0;

  quotaFill.style.width = `${quotaPercentage}%`;
  quotaText.textContent = `${usedQuota} / ${totalQuota}`;
  quotaRemaining.textContent = `${remainingQuota} remaining`;

  // ⏱ Last login
  if (userData.login_time) {
    const loginTime = new Date(userData.login_time * 1000);
    lastLogin.textContent = formatDateTime(loginTime);
  }

  // ⌛ Session expiry
  if (userData.session_expires_at) {
    const expiresTime = new Date(userData.session_expires_at);
    sessionExpires.textContent = formatDateTime(expiresTime);
  } else {
    sessionExpires.textContent = 'Session valid';
  }
}

export function formatDateTime(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}