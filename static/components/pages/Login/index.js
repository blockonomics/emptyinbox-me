import { API_BASE_URL, LOCAL_STORAGE_KEYS } from "../../../utils/constants.js";

export function renderLoginPage() {
  const main = document.createElement("main");

  const container = document.createElement("div");
  container.classList.add("login-page");

  container.innerHTML = `
    <section class="login">
      <h1>Welcome Back</h1>
      <p>Sign in securely with your passkey to continue your journey with EmptyInbox.me</p>
      
      <div class="passkey-auth-section">
        <button id="signin-passkey-btn" type="button" class="passkey-btn">
          <span class="passkey-icon">🔐</span>
          <span class="button-text">Sign in with Passkey</span>
        </button>
        
        <button id="register-passkey-btn" type="button" class="passkey-btn secondary">
          <span class="passkey-icon">➕</span>
          <span class="button-text">Create New Passkey</span>
        </button>
        
        <div id="loading" class="loading hidden">
          <p>Processing...</p>
        </div>
        
        <div id="error-message" class="error-message hidden">
          <p></p>
        </div>
      </div>

      <div class="passkey-info">
        <p class="passkey-description">Passkeys provide secure, password-free authentication using your device's biometrics or PIN.</p>
        <div class="supported-methods">
          <span>Face ID</span>
          <span>Touch ID</span>
          <span>Windows Hello</span>
          <span>Android Biometric</span>
        </div>
      </div>

      <p class="login-footer">
        New to passkeys? <a href="https://support.apple.com/en-us/102195" target="_blank">Learn more about passkeys</a>
      </p>
    </section>
  `;

  main.appendChild(container);
  document.body.appendChild(main);

  // Initialize passkey authentication functionality
  initializePasskeyAuth();
}

async function initializePasskeyAuth() {
  const signinBtn = document.getElementById("signin-passkey-btn");
  const registerBtn = document.getElementById("register-passkey-btn");
  const loading = document.getElementById("loading");
  const errorMessage = document.getElementById("error-message");

  let isProcessing = false;

  // Check if WebAuthn is supported
  if (!window.PublicKeyCredential) {
    showError(
      "Passkeys are not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox."
    );
    signinBtn.disabled = true;
    registerBtn.disabled = true;
    return;
  }

  // Helper function to update button states
  function updateButtonState(button, isLoading) {
    const buttonText = button.querySelector(".button-text");
    const icon = button.querySelector(".passkey-icon");

    if (isLoading) {
      button.disabled = true;
      buttonText.textContent = "Processing...";
      icon.textContent = "⏳";
      button.classList.add("processing");
    } else {
      button.disabled = false;
      button.classList.remove("processing");

      if (button.id === "signin-passkey-btn") {
        buttonText.textContent = "Sign in with Passkey";
        icon.textContent = "🔐";
      } else {
        buttonText.textContent = "Create New Passkey";
        icon.textContent = "➕";
      }
    }
  }

  // Sign in with existing passkey
  signinBtn.addEventListener("click", async () => {
    if (isProcessing) return;

    try {
      isProcessing = true;
      updateButtonState(signinBtn, true);
      showLoading(true);
      hideError();

      // Get authentication options from backend
      const authOptions = await getAuthenticationOptions();

      // Create WebAuthn request
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: base64urlToBuffer(authOptions.challenge),
          allowCredentials: authOptions.allowCredentials?.map((cred) => ({
            id: base64urlToBuffer(cred.id),
            type: cred.type,
          })),
          userVerification: "preferred",
          timeout: 60000,
        },
      });

      if (!credential) {
        throw new Error("No credential returned");
      }

      // Verify authentication with backend
      const authResult = await verifyAuthentication({
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        response: {
          authenticatorData: bufferToBase64url(
            credential.response.authenticatorData
          ),
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
          signature: bufferToBase64url(credential.response.signature),
          userHandle: credential.response.userHandle
            ? bufferToBase64url(credential.response.userHandle)
            : null,
        },
        type: credential.type,
      });

      if (authResult.success) {
        // Store auth token and redirect
        localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, authResult.token);
        window.location.href = "/messages.html";
      } else {
        showError("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Passkey sign in error:", error);

      if (error.name === "NotAllowedError") {
        showError("Authentication was cancelled or failed. Please try again.");
      } else if (error.name === "InvalidStateError") {
        showError(
          "This passkey is not recognized. Please try registering a new one."
        );
      } else {
        showError("Sign in failed: " + error.message);
      }
    } finally {
      isProcessing = false;
      updateButtonState(signinBtn, false);
      showLoading(false);
    }
  });

  // Register new passkey
  registerBtn.addEventListener("click", async () => {
    if (isProcessing) return;

    try {
      isProcessing = true;
      updateButtonState(registerBtn, true);
      showLoading(true);
      hideError();

      // Get registration options from backend
      const regOptions = await getRegistrationOptions();

      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: base64urlToBuffer(regOptions.challenge),
          rp: regOptions.rp,
          user: {
            id: base64urlToBuffer(regOptions.user.id),
            name: regOptions.user.name,
            displayName: regOptions.user.displayName,
          },
          pubKeyCredParams: regOptions.pubKeyCredParams,
          timeout: 60000,
          attestation: "none",
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
            requireResidentKey: false,
          },
        },
      });

      if (!credential) {
        throw new Error("No credential created");
      }

      // Register credential with backend
      const regResult = await registerCredential({
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        response: {
          attestationObject: bufferToBase64url(
            credential.response.attestationObject
          ),
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
        },
        type: credential.type,
      });

      if (regResult.success) {
        // Store auth token and redirect
        localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, regResult.token);
        window.location.href = "/messages.html";
      } else {
        showError("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Passkey registration error:", error);

      if (error.name === "NotAllowedError") {
        showError("Registration was cancelled. Please try again.");
      } else if (error.name === "InvalidStateError") {
        showError(
          "A passkey already exists for this device. Try signing in instead."
        );
      } else {
        showError("Registration failed: " + error.message);
      }
    } finally {
      isProcessing = false;
      updateButtonState(registerBtn, false);
      showLoading(false);
    }
  });

  function showLoading(show) {
    loading.classList.toggle("hidden", !show);
  }

  function showError(message) {
    errorMessage.querySelector("p").textContent = message;
    errorMessage.classList.remove("hidden");
  }

  function hideError() {
    errorMessage.classList.add("hidden");
  }
}

// API functions
async function getRegistrationOptions() {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/passkey/register/begin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get registration options");
  }

  return response.json();
}

async function registerCredential(credential) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/passkey/register/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to register credential");
  }

  return response.json();
}

async function getAuthenticationOptions() {
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

async function verifyAuthentication(credential) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/passkey/authenticate/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to verify authentication");
  }

  return response.json();
}

// Utility functions for base64url encoding/decoding
function base64urlToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
