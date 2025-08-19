import { renderConnectedWalletCard } from '../../atoms/ConnectedWalletCard/index.js';
import { renderSettingsCards } from '../../molecules/SettingsCards/index.js';
import { fetchUserData } from '../../../services/apiService.js';
import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';
import { setupSettingsEventListeners } from '../../../events/index.js';
import { updateUserDisplay } from './helper.js';

export async function renderSettingsPage() {
  const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  if (!authToken) {
    window.location.href = ROUTES.LOGIN;
    return;
  }
  const main = document.createElement('main');
  const container = document.createElement('div');
  container.classList.add('messages-page');

  const section = document.createElement('section');
  section.classList.add('messages');

  section.appendChild(renderConnectedWalletCard());
  section.appendChild(renderSettingsCards());

  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main);


  try {
    const userData = await fetchUserData(authToken);
    updateUserDisplay(userData);
    setupSettingsEventListeners();
  } catch (error) {
    console.error('User fetch failed:', error);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    window.location.href = ROUTES.LOGIN;
  }
}