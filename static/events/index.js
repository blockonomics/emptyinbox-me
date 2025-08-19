import { API_BASE_URL, LOCAL_STORAGE_KEYS, ROUTES } from '../utils/constants.js';

export function setupSettingsEventListeners() {
  const logoutBtn = document.getElementById('logout-btn');
  const apiKeyDisplay = document.getElementById('api-key-display');

  // 🔓 Logout functionality
  logoutBtn?.addEventListener('click', async () => {
    try {
      const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      window.location.href = ROUTES.LOGIN;
    }
  });
}
