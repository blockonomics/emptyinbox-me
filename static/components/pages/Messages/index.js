import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';
import { createMessageCards } from '../../organisms/MessageCards/index.js';

export async function renderMessagesPage() {
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
  section.appendChild(createMessageCards());


  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main);

}