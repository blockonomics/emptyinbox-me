import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';
import { createInboxCards } from '../../organisms/InboxCards/index.js';

export async function renderInboxesPage() {
  const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  if (!authToken) {
    window.location.href = ROUTES.LOGIN;
    return;
  }

  const main = document.createElement('main');
  const container = document.createElement('div');
  container.classList.add('inboxes-page');

  const section = document.createElement('section');
  section.classList.add('inboxes');
  section.appendChild(createInboxCards());

  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main);
}