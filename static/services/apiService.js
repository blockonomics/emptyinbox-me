import { API_BASE_URL } from "../utils/constants.js";
import { getIsLoggedIn } from "../utils/storage.js";

export async function fetchUserData() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });

  if (!response.ok) throw new Error("User fetch failed");
  return await response.json();
}

export async function fetchMessages() {
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    headers: {
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
  const response = await fetch(`${API_BASE_URL}/api/inboxes`, {
    headers: {
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
  const response = await fetch(`${API_BASE_URL}/api/inbox`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return { response, success: response.ok };
}
