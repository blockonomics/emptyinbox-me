import { LOCAL_STORAGE_KEYS, ROUTES } from '../../../utils/constants.js';

export async function renderInboxesPage() {
  const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  if (!authToken) {
    window.location.href = ROUTES.LOGIN;
    return;
  }


}