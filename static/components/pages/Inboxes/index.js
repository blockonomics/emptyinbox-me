import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';

import { createInboxCards } from '../../organisms/InboxCards/index.js';
import { renderQuotaHeader } from '../../molecules/QuotaHeader/index.js';

export async function renderInboxesPage() {
  const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  if (!authToken) {
    window.location.href = ROUTES.LOGIN;
    return;
  }

  const main = document.createElement('main');
  const container = document.createElement('div');
  container.classList.add('inboxes-page', 'container');

  const section = document.createElement('section');
  section.classList.add('inboxes');

  try {
    const userData = await fetchUserData(authToken);

    // Extract current quota from user data
    const currentQuota = userData.inbox_quota || 0;

    // Calculate max quota from confirmed payments
    const maxQuota = Array.isArray(userData.payments)
      ? userData.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      : 0;

    section.appendChild(renderQuotaHeader(currentQuota, maxQuota));
    section.appendChild(createInboxCards());

    container.appendChild(section);
    main.appendChild(container);
    document.body.appendChild(main);

    updateUserDisplay(userData);
  } catch (error) {
    console.error('User fetch failed:', error);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    window.location.href = ROUTES.LOGIN;
  }
}