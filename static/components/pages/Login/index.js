import { LOCAL_STORAGE_KEYS } from "../../../utils/constants.js";
import {
  checkUsername,
  registerCredential,
  getAuthenticationOptions,
  verifyAuthentication,
  checkPasskeySupport,
} from "../../../services/apiService.js";

export function renderLoginPage() {
  const main = document.createElement("main");

  const container = document.createElement("div");
  container.classList.add("login-page");

  container.innerHTML = `
    <section class="login">
      <h1>Welcome to EmptyInbox</h1>
      <p>Enter your username to get started creating your passkey.</p>
      <a href="https://support.apple.com/en-us/102195" target="_blank" class="learn-more">Learn more about passkeys.</a>
      
      <div class="form-group">
        <label for="username-input">Username</label>
        <input 
          type="text" 
          id="username-input" 
          placeholder="Choose your username"
          autocomplete="username"
          required
        />
      </div>

      <button id="continue-btn" type="button" class="primary-btn">
        Continue
      </button>

      <div class="divider">
        <span>Or</span>
      </div>

      <button id="sign-in-btn" type="button" class="secondary-btn">
        <span>🔐</span>
        <span>Sign in with a passkey</span>
      </button>

      <div id="loading" class="loading hidden">
        Processing...
      </div>

      <div id="error-message" class="error-message hidden">
        <p></p>
      </div>

      <div class="passkey-info">
        <p class="passkey-description">Your account will be secured with a passkey using your device's biometrics or PIN.</p>
        <div class="supported-methods">
          <span>Face ID</span>
          <span>Touch ID</span>
          <span>Windows Hello</span>
          <span>Android Biometric</span>
        </div>
      </div>
      
      <div id="debug-info" class="debug-info hidden">
        <p><strong>Debug Info:</strong></p>
        <p id="platform-info"></p>
        <p id="passkey-support"></p>
      </div>
    </section>
  `;

  main.appendChild(container);
  document.body.appendChild(main);

  // Initialize login functionality
  initializeLogin();
}

async function initializeLogin() {
  const usernameInput = document.getElementById("username-input");
  const continueBtn = document.getElementById("continue-btn");
  const signInBtn = document.getElementById("sign-in-btn");
  const loading = document.getElementById("loading");
  const errorMessage = document.getElementById("error-message");
  const debugInfo = document.getElementById("debug-info");
  const platformInfo = document.getElementById("platform-info");
  const passkeySupport = document.getElementById("passkey-support");

  let isProcessing = false;

  // Check passkey support and show debug info
  try {
    const supportInfo = checkPasskeySupport();
    platformInfo.textContent = `Platform: ${supportInfo.platform}`;
    passkeySupport.textContent = `Passkey Support: ${
      supportInfo.isSupported ? "Yes" : "No"
    } | Conditional Mediation: ${
      supportInfo.isConditionalMediationSupported ? "Yes" : "No"
    }`;

    // Show debug info in development or when there are issues
    if (
      !supportInfo.isSupported ||
      !supportInfo.isConditionalMediationSupported
    ) {
      debugInfo.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error checking passkey support:", error);
  }

  // Check if WebAuthn is supported
  if (!window.PublicKeyCredential) {
    showError(
      "Passkeys are not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox."
    );
    continueBtn.disabled = true;
    signInBtn.disabled = true;
    return;
  }

  // Continue button (create account flow)
  continueBtn.addEventListener("click", async () => {
    if (isProcessing) return;

    const username = usernameInput.value.trim();

    if (!username) {
      showError("Please enter a username");
      return;
    }

    if (username.length < 3) {
      showError("Username must be at least 3 characters long");
      return;
    }

    try {
      isProcessing = true;
      updateButtonState(continueBtn, true, "Checking username...");
      showLoading(true);
      hideError();

      // Check if username is available
      const usernameCheck = await checkUsername(username);

      if (usernameCheck.exists) {
        if (usernameCheck.has_passkey) {
          showError(
            "This username already has a passkey. Please sign in instead."
          );
        } else {
          showError(
            "This username is already taken. Please choose a different one."
          );
        }
        return;
      }

      // Username is available, proceed with registration
      updateButtonState(continueBtn, true, "Creating passkey...");

      const result = await registerCredential(username);

      if (result.success) {
        console.log("Registration successful");
        localStorage.setItem(LOCAL_STORAGE_KEYS.IS_LOGGED_IN, true);
        window.location.href = "/messages.html";
      } else {
        showError("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showError(error.message || "Registration failed. Please try again.");
    } finally {
      isProcessing = false;
      updateButtonState(continueBtn, false, "Continue");
      showLoading(false);
    }
  });

  // Sign in button
  signInBtn.addEventListener("click", async () => {
    if (isProcessing) return;

    try {
      isProcessing = true;
      updateButtonState(signInBtn, true, "Authenticating...");
      showLoading(true);
      hideError();
      
      // For sign-in, the backend should derive username from the credential
      const authResult = await verifyAuthentication();

      if (authResult.success) {
        console.log("Logged in successfully");
        localStorage.setItem(LOCAL_STORAGE_KEYS.IS_LOGGED_IN, true);
        window.location.href = "/messages.html";
      } else {
        showError("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Sign in error:", error);

      if (error.name === "NotAllowedError") {
        showError("Authentication was cancelled or failed. Please try again.");
      } else if (error.name === "InvalidStateError") {
        showError("No passkey found. Please create an account first.");
      } else if (error.name === "NotSupportedError") {
        showError(
          "No passkeys found on this device. Please create an account first."
        );
      } else if (error.name === "SecurityError") {
        showError(
          "Security error occurred. Please ensure you're using HTTPS or localhost."
        );
      } else if (error.name === "AbortError") {
        showError("Authentication timed out. Please try again.");
      } else {
        showError("Sign in failed: " + error.message);
      }
    } finally {
      isProcessing = false;
      updateButtonState(signInBtn, false, "🔐 Sign in with a passkey");
      showLoading(false);
    }
  });

  // Username input handlers
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      continueBtn.click();
    }
  });

  usernameInput.addEventListener("input", () => {
    hideError();
  });

  // Helper functions
  function updateButtonState(button, isLoading, text) {
    if (isLoading) {
      button.disabled = true;
      button.textContent = text || "Processing...";
    } else {
      button.disabled = false;
      button.innerHTML = text;
    }
  }

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
