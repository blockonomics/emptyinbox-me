import {
  API_BASE_URL,
  LOCAL_STORAGE_KEYS,
  ROUTES,
} from "../../../utils/constants.js";
import { clearAllAuthData } from "../../../utils/storage.js";

export function renderLogoutButton() {
  const header = document.createElement("div");
  header.innerHTML = `
    <button id="logout-btn" class="logout-btn">Log Out</button>
  `;

  // Add event listeners
  setTimeout(() => {
    logout();
  }, 0);

  return header;
}

function logout() {
  const logoutBtn = document.getElementById("logout-btn");

  logoutBtn?.addEventListener("click", async () => {
    try {
      // Disable button during logout
      logoutBtn.disabled = true;
      logoutBtn.textContent = "Logging Out...";

      // 1. Call backend logout
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      // 2. Clear all local storage
      clearAllAuthData();

      // 3. Redirect to login/home page
      window.location.href = ROUTES.HOME;
    } catch (error) {
      console.error("Logout error:", error);

      // Even if backend call fails, still clear local data and redirect
      clearAllAuthData();
      window.location.href = ROUTES.HOME;
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const paymentSuccess = params.get("payment");
  const txhash = params.get("txhash");
  const crypto = params.get("crypto");
  const quotaAmount = params.get("quota");

  if (paymentSuccess === "success" && txhash && crypto === "usdt") {
    const sessionToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);

    if (!sessionToken) {
      console.error("No Session Token found in localStorage");
      return;
    }

    console.log("Starting payment monitoring for txhash:", txhash);
    console.log("Quota amount:", quotaAmount);

    fetch(`${API_BASE_URL}/api/payments/monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: sessionToken,
      },
      credentials: "include",
      body: JSON.stringify({
        txhash,
        quotaAmount: quotaAmount ? parseInt(quotaAmount) : null,
      }),
    })
      .then((res) => {
        console.log("Response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        // Remove query parameters from URL on success
        console.log("Removing query parameters from URL");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        return res.json();
      })
      .then((data) => {
        console.log("Monitoring started:", data);
      })
      .catch((err) => {
        console.error("Error starting monitoring:", err);
      });
  }
});
