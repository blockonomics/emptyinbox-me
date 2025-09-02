import { API_BASE_URL } from "../utils/constants.js";

// 🔧 Helpers for base64url encoding/decoding
function bufferDecode(value) {
  return Uint8Array.from(
    atob(value.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );
}

function bufferEncode(value) {
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
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
// Frontend-heavy approach - mimics the HTML file more closely

function getRpId() {
  const hostname = window.location.hostname;
  
  if (hostname === "localhost" || hostname.startsWith("127.") || hostname.startsWith("192.168.")) {
    return hostname;
  }
  
  if (hostname.endsWith(".emptyinbox.me")) {
    return "emptyinbox.me";
  } else if (hostname === "emptyinbox.me") {
    return "emptyinbox.me";
  }
  
  return hostname;
}

// Simplified server call - only gets challenge
async function getChallenge(username) {
  const response = await fetch(`${API_BASE_URL}/api/auth/passkey/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, operation: 'registration' }),
  });
  if (!response.ok) throw new Error("Failed to get challenge");
  return response.json(); // Returns { challenge: "base64url", challengeId: "id" }
}

export async function registerCredential(username) {
  try {
    // Get only the challenge from server
    const { challenge, challengeId } = await getChallenge(username);
    
    // Generate the rest in frontend (like your HTML file)
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);
    
    const rpId = getRpId();
    
    const publicKey = {
      challenge: bufferDecode(challenge),
      rp: {
        name: "EmptyBox", // or get from constants
        id: rpId,
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      timeout: 120000,
      attestation: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform", // or omit for cross-platform
        userVerification: "preferred",
        residentKey: "preferred",
      },
    };

    const credential = await navigator.credentials.create({ publicKey });

    if (!credential) {
      throw new Error("No credential returned from authenticator");
    }

    const credentialData = {
      id: credential.id,
      rawId: bufferEncode(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferEncode(credential.response.clientDataJSON),
        attestationObject: bufferEncode(credential.response.attestationObject),
      },
      username,
      challengeId, // Include this for server verification
      userId: bufferEncode(userId), // Send the generated user ID
    };

    const response = await fetch(
      `${API_BASE_URL}/api/auth/passkey/register/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentialData),
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Registration failed: ${errorText}`);
    }

    return await response.json();
    
  } catch (error) {
    if (error.name === "NotAllowedError") {
      throw new Error("Registration was cancelled. Please try again.");
    } else if (error.name === "InvalidStateError") {
      throw new Error("A passkey already exists for this account.");
    } else if (error.name === "NotSupportedError") {
      throw new Error("Passkeys are not supported on this device.");
    } else {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
}

// 🔐 Passkey Authentication
export async function getAuthenticationOptions() {
  try {
    console.log("Getting authentication options");

    const response = await fetch(
      `${API_BASE_URL}/api/auth/passkey/authenticate/begin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to get auth options:", errorText);
      throw new Error("Failed to get authentication options");
    }

    const options = await response.json();
    console.log("Authentication options received:", options);
    return options;
  } catch (error) {
    console.error("Error getting auth options:", error);
    throw error;
  }
}

export async function verifyAuthentication() {
  try {
    console.log("Starting passkey authentication");

    const options = await getAuthenticationOptions();

    const publicKey = {
      ...options,
      challenge: bufferDecode(options.challenge),
      allowCredentials:
        options.allowCredentials?.map((cred) => ({
          ...cred,
          id: bufferDecode(cred.id),
        })) || [],
    };

    console.log("Authentication options prepared:", publicKey);

    // Remove mediation for better compatibility across platforms
    console.log("Requesting credential");

    const credential = await navigator.credentials.get({
      publicKey
    });

    if (!credential) {
      throw new Error("No credential returned from authenticator");
    }

    console.log("Credential retrieved successfully:", credential);

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

    console.log("Sending authentication data to server");

    const response = await fetch(
      `${API_BASE_URL}/api/auth/passkey/authenticate/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentialData),
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Authentication verification failed:", errorData);
      throw new Error(`Failed to verify authentication: ${errorData}`);
    }

    const result = await response.json();
    console.log("Authentication completed successfully:", result);
    return result;
  } catch (error) {
    console.error("Authentication error:", error);

    // Provide more specific error messages for common issues
    if (error.name === "NotAllowedError") {
      throw new Error(
        "Authentication was cancelled or failed. Please try again."
      );
    } else if (error.name === "InvalidStateError") {
      throw new Error("No passkey found. Please create an account first.");
    } else if (error.name === "NotSupportedError") {
      throw new Error(
        "No passkeys found on this device. Please create an account first."
      );
    } else if (error.name === "SecurityError") {
      throw new Error(
        "Security error occurred. Please ensure you're using HTTPS and the correct domain."
      );
    } else if (error.name === "AbortError") {
      throw new Error("Authentication timed out. Please try again.");
    } else {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
}

// 🔧 Utility function to check passkey support
export function checkPasskeySupport() {
  const isSupported = window.PublicKeyCredential !== undefined;
  const isConditionalMediationSupported =
    window.PublicKeyCredential?.isConditionalMediationAvailable?.() || false;

  console.log("Passkey support check:", {
    isSupported,
    isConditionalMediationSupported,
    userAgent: navigator.userAgent,
  });

  return {
    isSupported,
    isConditionalMediationSupported,
    platform: getPlatform(),
  };
}

// 🔍 Platform detection for better debugging
function getPlatform() {
  const userAgent = navigator.userAgent;

  if (/Windows/.test(userAgent)) {
    return "Windows";
  } else if (/Mac/.test(userAgent)) {
    return "macOS";
  } else if (/Linux/.test(userAgent)) {
    return "Linux";
  } else if (/Android/.test(userAgent)) {
    return "Android";
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    return "iOS";
  } else {
    return "Unknown";
  }
}