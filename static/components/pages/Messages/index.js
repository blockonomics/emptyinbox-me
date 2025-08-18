import { renderHeader } from '../../atoms/MessagesHeader/index.js';
import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';
import { setupMessagesEventListeners } from '../../../events/index.js';

export async function renderMessagesPage() {
  const main = document.createElement('main');
  const container = document.createElement('div');
  container.classList.add('messages-page');

  const section = document.createElement('section');
  section.classList.add('messages');

  section.appendChild(renderHeader());

  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main);

  const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  if (!authToken) {
    window.location.href = ROUTES.LOGIN;
    return;
  }

  try {
    setupMessagesEventListeners();
  } catch (error) {
    console.error('User fetch failed:', error);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    window.location.href = ROUTES.LOGIN;
  }
}