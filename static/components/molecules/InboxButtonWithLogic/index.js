import { createCreateInboxButton } from "../../atoms/CreateInboxButton/index.js";
import { createInbox } from "../../../services/apiService.js";
import { ButtonStates } from "../../molecules/ButtonStates/index.js";
import { fetchUserData } from "../../../services/apiService.js";
import {
  LOCAL_STORAGE_KEYS,
  USER_STARTING_QUOTA,
} from "../../../utils/constants.js";
import { renderInboxesHeader } from "../../molecules/InboxesHeader/index.js";
import { createInboxCards } from "../../organisms/InboxCards/index.js";

export function createInboxButtonWithLogic() {
  const button = createCreateInboxButton();
  button.id = "create-inbox-btn";

  const originalContent = button.innerHTML;

  button.addEventListener("click", async () => {
    const loadingState = ButtonStates.loading("Creating...");
    button.innerHTML = loadingState.content;
    button.disabled = loadingState.disabled;

    try {
      const { response, success } = await createInbox();

      if (success) {
        const successState = ButtonStates.success("Created!");
        button.innerHTML = successState.content;
        button.style.background = successState.background;

        // Refresh the page data after successful creation
        await refreshInboxesData();

        setTimeout(() => {
          const defaultState = ButtonStates.default(originalContent);
          button.innerHTML = defaultState.content;
          button.style.background = defaultState.background;
          button.disabled = defaultState.disabled;
        }, 2000);
      } else if (response.status === 403) {
        const errorState = ButtonStates.error("Quota Exceeded");
        button.innerHTML = errorState.content;
        button.style.background = errorState.background;

        setTimeout(() => {
          const defaultState = ButtonStates.default(originalContent);
          button.innerHTML = defaultState.content;
          button.style.background = defaultState.background;
          button.disabled = defaultState.disabled;
        }, 3000);
      } else {
        throw new Error("Failed to create inbox");
      }
    } catch (error) {
      const errorState = ButtonStates.error("Error");
      button.innerHTML = errorState.content;
      button.style.background = errorState.background;

      setTimeout(() => {
        const defaultState = ButtonStates.default(originalContent);
        button.innerHTML = defaultState.content;
        button.style.background = defaultState.background;
        button.disabled = defaultState.disabled;
      }, 3000);
    }
  });

  return button;
}

// Helper function to refresh the inboxes data
async function refreshInboxesData() {
  try {
    const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (!authToken) return;

    const userData = await fetchUserData(authToken);

    // Calculate quotas
    const maxQuota = Array.isArray(userData.payments)
      ? userData.payments.reduce(
          (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
          USER_STARTING_QUOTA
        )
      : USER_STARTING_QUOTA;

    const inboxQuota =
      typeof userData.inbox_quota === "number" ? userData.inbox_quota : 0;

    const currentQuota = maxQuota - inboxQuota;

    // Find and update the header
    const existingHeader = document.querySelector(".inboxes-header");
    if (existingHeader) {
      const newHeader = renderInboxesHeader(currentQuota, maxQuota);
      existingHeader.parentNode.replaceChild(newHeader, existingHeader);
    }

    // Find and update the inbox cards
    const inboxesSection = document.querySelector(".inboxes");
    if (inboxesSection) {
      // Look for the existing inbox container
      let existingCards = inboxesSection.querySelector("#inboxes-container");

      // If we can't find the container by ID, look for the element after the header
      if (!existingCards) {
        const header = inboxesSection.querySelector(".inboxes-header");
        if (header && header.nextElementSibling) {
          existingCards = header.nextElementSibling;
        }
      }

      if (existingCards) {
        // Create new cards container and replace
        const newCards = createInboxCards();
        existingCards.parentNode.replaceChild(newCards, existingCards);
      } else {
        // If no existing cards container found, just append new cards
        const newCards = createInboxCards();
        inboxesSection.appendChild(newCards);
      }
    }
  } catch (error) {
    console.error("Failed to refresh inboxes data:", error);
  }
}
