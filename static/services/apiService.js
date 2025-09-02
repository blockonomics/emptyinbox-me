import { API_BASE_URL } from "../utils/constants.js";

// 🔧 Helpers for base64url encoding/decoding
function bufferDecode(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

function bufferEncode(value) {
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 🧑‍💻 Fetch user data
export async function fetchUserData() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("User fetch failed");
  return await response.json();
}

// 📬 Fetch messages
export async function fetchMessages() {
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
}

// 📥 Fetch inboxes
export async function fetchInboxes() {
  const response = await fetch(`${API_BASE_URL}/api/inboxes`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch inboxes");
  return response.json();
}

// 📤 Create inbox
export async function createInbox() {
  const response = await fetch(`${API_BASE_URL}/api/inbox`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return { response, success: response.ok };
}

// 🔍 Check username
export async function checkUsername(username) {
  const response = await fetch(`${API_BASE_URL}/api/auth/check-username`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) throw new Error("Failed to check username");
  return response.json();
}

// 🛠️ Passkey Registration
export async function getRegistrationOptions(username) {
  const response = await fetch(`${API_BASE_URL}/api/auth/passkey/register/begin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) throw new Error("Failed to get registration options");
  return response.json();
}

export async function registerCredential(username) {
  const options = await getRegistrationOptions(username);

  const publicKey = {
    ...options,
    challenge: bufferDecode(options.challenge),
    user: {
      ...options.user,
      id: bufferDecode(options.user.id),
    },
  };

  const credential = await navigator.credentials.create({ publicKey });

  const credentialData = {
    id: credential.id,
    rawId: bufferEncode(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferEncode(credential.response.clientDataJSON),
      attestationObject: bufferEncode(credential.response.attestationObject),
    },
    username,
  };

  const response = await fetch(`${API_BASE_URL}/api/auth/passkey/register/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentialData),
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to register credential");
  return response.json();
}

// 🔐 Passkey Authentication
export async function getAuthenticationOptions() {
  const response = await fetch(`${API_BASE_URL}/api/auth/passkey/authenticate/begin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to get authentication options");
  return response.json();
}

export async function verifyAuthentication() {
  const options = await getAuthenticationOptions();

  const publicKey = {
    ...options,
    challenge: bufferDecode(options.challenge),
    allowCredentials: options.allowCredentials?.map(cred => ({
      ...cred,
      id: bufferDecode(cred.id),
    })),
  };

  const credential = await navigator.credentials.get({ publicKey });

  const credentialData = {
    id: credential.id,
    rawId: bufferEncode(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferEncode(credential.response.clientDataJSON),
      authenticatorData: bufferEncode(credential.response.authenticatorData),
      signature: bufferEncode(credential.response.signature),
      userHandle: credential.response.userHandle
        ? bufferEncode(credential.response.userHandle)
        : null,
    },
  };

  const response = await fetch(`${API_BASE_URL}/api/auth/passkey/authenticate/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentialData),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to verify authentication: ${errorData}`);
  }

  return response.json();
}