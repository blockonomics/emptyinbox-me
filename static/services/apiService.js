import { API_BASE_URL } from '../utils/constants.js';
import { getApiKey } from "../utils/storage.js";

export async function fetchUserData(authToken) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  if (!response.ok) throw new Error('User fetch failed');
  return await response.json();
}

export async function fetchMessages() {
  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  
  return response.json();
}

export async function fetchInboxes() {
  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/inboxes`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch inboxes');
  }
  
  return response.json();
}

export async function createInbox() {
  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/inbox`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  return { response, success: response.ok };
}