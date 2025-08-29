import { LOCAL_STORAGE_KEYS } from "./constants.js";

export function getSessionToken() {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
}

export function clearAllAuthData() {
  Object.values(LOCAL_STORAGE_KEYS).forEach((item) => {
    localStorage.removeItem(item);
  });
}
