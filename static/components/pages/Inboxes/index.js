import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';
import { createInboxCards } from '../../organisms/InboxCards/index.js';
import { renderQuotaHeader } from '../../molecules/QuotaHeader/index.js';
import { fetchUserData } from '../../../services/apiService.js';

export async function renderInboxesPage() {
  const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  if (!authToken) {
    window.location.href = ROUTES.LOGIN;
    return;
  }

  // Create layout immediately
  const main = document.createElement('main');
  const container = document.createElement('div');
  container.classList.add('inboxes-page', 'container');

  const section = document.createElement('section');
  section.classList.add('inboxes');

  // Add a temporary loading message
  const loadingMessage = document.createElement('p');
  loadingMessage.textContent = 'Loading your inboxes...';
  loadingMessage.classList.add('loading-message');
  section.appendChild(loadingMessage);

  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main); // Append early to avoid layout shift

  try {
    const userData = await fetchUserData(authToken);

    // Extract current quota from user data
    const currentQuota = typeof userData.inbox_quota === 'number' ? userData.inbox_quota : 0;

    // Calculate max quota from confirmed payments
    const maxQuota = Array.isArray(userData.payments)
      ? userData.payments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0)
      : 0;

    // Clear loading message
    section.innerHTML = '';

    // Render actual content
    section.appendChild(renderQuotaHeader(currentQuota, maxQuota));
    section.appendChild(createInboxCards());
  } catch (error) {
    console.error('User fetch failed:', error);

    section.innerHTML = '';
    const errorMessage = document.createElement('p');
    errorMessage.textContent = 'We couldn’t load your inboxes. Redirecting to login...';
    errorMessage.classList.add('error-message');
    section.appendChild(errorMessage);

    setTimeout(() => {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      window.location.href = ROUTES.LOGIN;
    }, 3000);
  }
}