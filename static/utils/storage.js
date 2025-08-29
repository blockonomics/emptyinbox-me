import { LOCAL_STORAGE_KEYS } from "./constants.js";

export function getIsLoggedIn() {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.IS_LOGGED_IN);
}

export function clearAllAuthData() {
  Object.values(LOCAL_STORAGE_KEYS).forEach((item) => {
    localStorage.removeItem(item);
  });
}
