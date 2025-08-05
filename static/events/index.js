import { API_BASE_URL, ROUTES } from '../utils/constants.js';

export function setupDashboardEventListeners() {
  const logoutBtn = document.getElementById('logout-btn');
  const toggleApiKeyBtn = document.getElementById('toggle-api-key');
  const apiKeyDisplay = document.getElementById('api-key-display');

  // 🔓 Logout functionality
  logoutBtn?.addEventListener('click', async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      window.location.href = ROUTES.LOGIN;
    }
  });

  // 👁️ Toggle API key visibility
  let apiKeyVisible = false;
  toggleApiKeyBtn?.addEventListener('click', () => {
    apiKeyVisible = !apiKeyVisible;

    apiKeyDisplay?.classList.toggle('api-key-hidden', !apiKeyVisible);
    toggleApiKeyBtn.textContent = apiKeyVisible ? '🙈' : '👁️';
    toggleApiKeyBtn.title = apiKeyVisible ? 'Hide API key' : 'Show API key';
  });
}