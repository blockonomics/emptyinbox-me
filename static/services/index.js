import { API_BASE_URL } from '../utils/constants.js';

export async function fetchUserData(authToken) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  if (!response.ok) throw new Error('User fetch failed');
  return await response.json();
}