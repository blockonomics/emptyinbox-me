export function updateUserDisplay(userData) {
  // 🔗 Header elements
  const userAddress = document.getElementById('user-address');
  const apiKeyDisplay = document.getElementById('api-key-display');
  const billingText = document.getElementById('billing-text');

  const address = userData.address || '';
  userAddress.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
  userAddress.title = address;

  // 🔑 API key
  apiKeyDisplay.textContent = userData.api_key || 'Unavailable';

  // 📬 Billing
  console.log(userData)
  const billingInformation = userData.inbox_quota || 0;
  billingText.textContent = `To show billing information: ${billingInformation}`;
}
