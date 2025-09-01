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
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return { response, success: response.ok };
}

// Username check API call
export async function checkUsername(username) {
  const response = await fetch(`${API_BASE_URL}/api/auth/check-username`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    throw new Error("Failed to check username");
  }

  return response.json();
}

// Passkey Authentication API calls
export async function getRegistrationOptions(username) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/passkey/register/begin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get registration options");
  }

  return response.json();
}

export async function registerCredential(credential) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/passkey/register/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to register credential");
  }

  return response.json();
}

export async function getAuthenticationOptions() {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/passkey/authenticate/begin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get authentication options");
  }

  return response.json();
}

export async function verifyAuthentication(credentials) {

  const response = await fetch(
    `${API_BASE_URL}/api/auth/passkey/authenticate/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to verify authentication: ${errorData}`);
  }

  return response.json();
}
