import { renderHeader } from '../../atoms/DashBoardHeader/index.js';
import { renderStats } from '../../molecules/DashboardStats/index.js';
import { fetchUserData } from '../../../services/apiService.js';
import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';
import { setupDashboardEventListeners } from '../../../events/index.js';
import { updateUserDisplay } from './helper.js';

export async function renderDashboardPage() {
  const main = document.createElement('main');
  const container = document.createElement('div');
  container.classList.add('dashboard-page');

  const section = document.createElement('section');
  section.classList.add('dashboard');

  section.appendChild(renderHeader());
  section.appendChild(renderStats());

  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main);

  const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  if (!authToken) {
    window.location.href = ROUTES.LOGIN;
    return;
  }

  try {
    const userData = await fetchUserData(authToken);
    updateUserDisplay(userData);
    setupDashboardEventListeners();
  } catch (error) {
    console.error('User fetch failed:', error);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    window.location.href = ROUTES.LOGIN;
  }
}