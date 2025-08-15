import { LOCAL_STORAGE_KEYS } from "./constants.js";

export function getApiKey() {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.API_KEY);
}
