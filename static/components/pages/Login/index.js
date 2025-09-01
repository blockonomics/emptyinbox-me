import { LOCAL_STORAGE_KEYS } from "../../../utils/constants.js";
import {
  checkUsername,
  getRegistrationOptions,
  registerCredential,
  getAuthenticationOptions,
  verifyAuthentication,
} from "../../../services/apiService.js";

export function renderLoginPage() {
  const main = document.createElement("main");

  const container = document.createElement("div");
  container.classList.add("login-page");

  container.innerHTML = `
    <section class="login">
      <h1>Welcome to EmptyInbox.me</h1>
      <p>Enter your username to continue</p>
      
      <!-- Username Step -->
      <div id="username-step" class="auth-step">
        <div class="input-group">
          <input 
            type="text" 
            id="username-input" 
            placeholder="Enter your username"
            autocomplete="username"
            required
          />
          <button id="continue-btn" type="button" class="primary-btn">
            Continue
          </button>
        </div>
        
        <div id="username-error" class="error-message hidden">
          <p></p>
        </div>
      </div>
      
      <!-- Passkey Step -->
      <div id="passkey-step" class="auth-step hidden">
        <div class="user-welcome">
          <h2 id="welcome-message"></h2>
          <p id="auth-instruction"></p>
        </div>
        
        <div class="passkey-auth-section">
          <button id="signin-passkey-btn" type="button" class="passkey-btn hidden">
            <span class="passkey-icon">🔐</span>
            <span class="button-text">Sign in with Passkey</span>
          </button>
          
          <button id="register-passkey-btn" type="button" class="passkey-btn secondary hidden">
            <span class="passkey-icon">➕</span>
            <span class="button-text">Create New Passkey</span>
          </button>
          
          <button id="back-btn" type="button" class="back-btn">
            ← Back to username
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
      </div>

      <p id="passkey-help" class="login-footer hidden">
        New to passkeys? <a href="https://support.apple.com/en-us/102195" target="_blank">Learn more about passkeys</a>
      </p>
    </section>
  `;

  main.appendChild(container);
  document.body.appendChild(main);

  // Initialize login functionality
  initializeLogin();
}

async function initializeLogin() {
  const usernameStep = document.getElementById("username-step");
  const passkeyStep = document.getElementById("passkey-step");
  const usernameInput = document.getElementById("username-input");
  const continueBtn = document.getElementById("continue-btn");
  const backBtn = document.getElementById("back-btn");
  const usernameError = document.getElementById("username-error");
  const passkeyHelp = document.getElementById("passkey-help");

  const welcomeMessage = document.getElementById("welcome-message");
  const authInstruction = document.getElementById("auth-instruction");
  const signinBtn = document.getElementById("signin-passkey-btn");
  const registerBtn = document.getElementById("register-passkey-btn");
  const loading = document.getElementById("loading");
  const errorMessage = document.getElementById("error-message");

  let currentUsername = "";
  let isProcessing = false;

  // Check if WebAuthn is supported
  if (!window.PublicKeyCredential) {
    showUsernameError(
      "Passkeys are not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox."
    );
    continueBtn.disabled = true;
    return;
  }

  // Username input event listeners
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      continueBtn.click();
    }
  });

  usernameInput.addEventListener("input", () => {
    hideUsernameError();
  });

  // Continue button - check username and determine next step
  continueBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();

    if (!username) {
      showUsernameError("Please enter a username");
      return;
    }

    if (username.length < 3) {
      showUsernameError("Username must be at least 3 characters long");
      return;
    }

    try {
      continueBtn.disabled = true;
      continueBtn.textContent = "Checking...";
      hideUsernameError();

      const result = await checkUsername(username);
      currentUsername = username;

      // Show passkey step
      usernameStep.classList.add("hidden");
      passkeyStep.classList.remove("hidden");

      if (result.exists && result.hasPasskey) {
        // Existing user with passkey - show sign in option
        welcomeMessage.textContent = `Welcome back, ${username}!`;
        authInstruction.textContent = "Sign in with your passkey to continue.";
        signinBtn.classList.remove("hidden");
        registerBtn.classList.add("hidden");
        passkeyHelp.classList.add("hidden");
      } else if (result.exists && !result.hasPasskey) {
        // Existing user without passkey - show create passkey option
        welcomeMessage.textContent = `Welcome back, ${username}!`;
        authInstruction.textContent =
          "Create a passkey to secure your account.";
        signinBtn.classList.add("hidden");
        registerBtn.classList.remove("hidden");
        passkeyHelp.classList.remove("hidden");
      } else {
        // New user - show create passkey option
        welcomeMessage.textContent = `Welcome, ${username}!`;
        authInstruction.textContent =
          "Let's create your first passkey to get started.";
        signinBtn.classList.add("hidden");
        registerBtn.classList.remove("hidden");
        passkeyHelp.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Username check error:", error);
      showUsernameError("Unable to check username. Please try again.");
    } finally {
      continueBtn.disabled = false;
      continueBtn.textContent = "Continue";
    }
  });

  // Back button - return to username step
  backBtn.addEventListener("click", () => {
    passkeyStep.classList.add("hidden");
    usernameStep.classList.remove("hidden");
    passkeyHelp.classList.add("hidden");
    hideError();
    usernameInput.focus();
  });

  // Initialize passkey authentication
  initializePasskeyAuth(() => currentUsername);

  function showUsernameError(message) {
    usernameError.querySelector("p").textContent = message;
    usernameError.classList.remove("hidden");
  }

  function hideUsernameError() {
    usernameError.classList.add("hidden");
  }
}

async function initializePasskeyAuth(getCurrentUsername) {
  const signinBtn = document.getElementById("signin-passkey-btn");
  const registerBtn = document.getElementById("register-passkey-btn");
  const loading = document.getElementById("loading");
  const errorMessage = document.getElementById("error-message");

  let isProcessing = false;

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

    const username = getCurrentUsername();
    if (!username) {
      showError("Username is required");
      return;
    }

    try {
      isProcessing = true;
      updateButtonState(signinBtn, true);
      showLoading(true);
      hideError();

      // Get authentication options from backend
      const authOptions = await getAuthenticationOptions(username);

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

      // Verify authentication with backend - FIXED: separate credential and username parameters
      const credentialData = {
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
      };

      // Pass credential and username as separate parameters
      const authResult = await verifyAuthentication(credentialData, username);
      if (authResult.success) {
        console.log("Logged in");
        localStorage.setItem(LOCAL_STORAGE_KEYS.IS_LOGGED_IN, true);
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

    const username = getCurrentUsername();
    if (!username) {
      showError("Username is required");
      return;
    }

    try {
      isProcessing = true;
      updateButtonState(registerBtn, true);
      showLoading(true);
      hideError();

      // Get registration options from backend
      const regOptions = await getRegistrationOptions(username);

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
        username: username,
      });

      if (regResult.success) {
        // Store auth token and redirect
        localStorage.setItem(LOCAL_STORAGE_KEYS.IS_LOGGED_IN, true);
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

  // Return current username function
  return;
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
