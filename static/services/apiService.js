import { API_BASE_URL } from "../utils/constants.js";
import { getSessionToken } from "../utils/storage.js";

export async function fetchUserData() {
  const sessionToken = getSessionToken();
  if (!sessionToken) return;
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
    credentials: "include",
  });

  if (!response.ok) throw new Error("User fetch failed");
  return await response.json();
}

export async function fetchMessages() {
  const sessionToken = getSessionToken();
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  return response.json();
}

export async function fetchInboxes() {
  const sessionToken = getSessionToken();
  const response = await fetch(`${API_BASE_URL}/api/inboxes`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch inboxes");
  }

  return response.json();
}

export async function createInbox() {
  const sessionToken = getSessionToken();
  const response = await fetch(`${API_BASE_URL}/api/inbox`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return { response, success: response.ok };
}
