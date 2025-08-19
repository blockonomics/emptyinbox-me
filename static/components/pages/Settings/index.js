import { renderConnectedWalletCard } from '../../atoms/ConnectedWalletCard/index.js';
import { renderSettingsCards } from '../../molecules/SettingsCards/index.js';
import { fetchUserData } from '../../../services/apiService.js';
import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';
import { setupMessagesEventListeners } from '../../../events/index.js';
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
  const billingSection = document.createElement('section');
  billingSection.classList.add('billing-section');

  const billingHeader = document.createElement('h3');
  billingHeader.textContent = 'Billing Transactions';
  billingHeader.classList.add('billing-header');

  const billingContainer = document.createElement('div');
  billingContainer.id = 'billing-transactions';
  billingContainer.classList.add('quota-display');

  billingSection.appendChild(billingHeader);
  billingSection.appendChild(billingContainer);
  section.appendChild(billingSection);

  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main);


  try {
    const userData = await fetchUserData(authToken);
    updateUserDisplay(userData);
    setupMessagesEventListeners();
  } catch (error) {
    console.error('User fetch failed:', error);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    window.location.href = ROUTES.LOGIN;
  }
}