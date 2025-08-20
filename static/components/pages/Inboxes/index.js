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

  // Example quota values — replace with actual logic
  const currentQuota = 10;
  const maxQuota = 200;

  section.appendChild(renderQuotaHeader(currentQuota, maxQuota));
  section.appendChild(createInboxCards());

  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main);
}