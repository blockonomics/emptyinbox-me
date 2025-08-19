import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';
import { createInboxButtonWithLogic } from '../../molecules/InboxButtonWithLogic/index.js';
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

  // Create and style the heading
  const heading = document.createElement('h1');
  heading.classList.add('inboxes-title');
  heading.textContent = 'All inboxes';

  const section = document.createElement('section');
  section.classList.add('inboxes');

  section.appendChild(heading); // Add heading before inbox cards
  section.appendChild(createInboxButtonWithLogic());
  section.appendChild(createInboxCards());

  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main);
}