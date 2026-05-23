import {
  LOCAL_STORAGE_KEYS,
  ROUTES,
  USER_STARTING_QUOTA,
} from "../../../utils/constants.js";
import { createInboxCards } from "../../organisms/InboxCards/index.js";
import { renderInboxesHeader } from "../../molecules/InboxesHeader/index.js";
import { fetchUserData } from "../../../services/apiService.js";

export async function renderInboxesPage() {
  const isLoggedIn = localStorage.getItem(LOCAL_STORAGE_KEYS.IS_LOGGED_IN);
  if (!isLoggedIn) {
    window.location.href = ROUTES.LOGIN;
    return;
  }

  // Create layout immediately
  const main = document.createElement("main");
  const container = document.createElement("div");
  container.classList.add("inboxes-page", "container");

  const section = document.createElement("section");
  section.classList.add("inboxes");

  // Add a temporary loading message
  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Loading your inboxes...";
  loadingMessage.classList.add("loading-message");
  section.appendChild(loadingMessage);

  container.appendChild(section);
  main.appendChild(container);
  document.body.appendChild(main); // Append early to avoid layout shift

  // Payment success: show pending banner and register with backend
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get("payment");

  try {
    const userData = await fetchUserData();

    // Extract current quota from user data
    const maxQuota = Array.isArray(userData.payments)
      ? userData.payments.reduce(
          (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
          USER_STARTING_QUOTA
        )
      : USER_STARTING_QUOTA;

    const inboxQuota =
      typeof userData.inbox_quota === "number" ? userData.inbox_quota : 0;

    const currentQuota = maxQuota - inboxQuota;

    // Clear loading message
    section.innerHTML = "";

    // Payment pending banner
    if (paymentStatus === "success") {
      const banner = document.createElement("div");
      banner.className = "alert alert-info payment-pending-banner";
      banner.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span><strong>Payment submitted.</strong> Your inboxes will be credited once the transaction confirms on-chain — usually within 1–2 minutes. Refresh to see your updated count.</span>
        <button class="banner-dismiss" aria-label="Dismiss">&times;</button>
      `;
      banner.querySelector(".banner-dismiss").addEventListener("click", () => banner.remove());
      section.appendChild(banner);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Render actual content
    section.appendChild(renderInboxesHeader(currentQuota, maxQuota));
    section.appendChild(createInboxCards());
  } catch (error) {
    console.error("User fetch failed:", error);
    section.innerHTML = "";
    if (error.status === 401) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.IS_LOGGED_IN);
      window.location.href = ROUTES.LOGIN;
    } else {
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "Couldn’t load your inboxes. Please refresh.";
      errorMessage.classList.add("error-message");
      section.appendChild(errorMessage);
    }
  }
}
