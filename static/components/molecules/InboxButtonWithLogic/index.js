import { createCreateInboxButton } from "../../atoms/CreateInboxButton/index.js";
import { createInbox } from "../../../services/apiService.js";
import { ButtonStates } from "../../molecules/ButtonStates/index.js";
import { fetchUserData } from "../../../services/apiService.js";
import {
  LOCAL_STORAGE_KEYS,
  USER_STARTING_QUOTA,
} from "../../../utils/constants.js";
import { renderQuotaHeader } from "../../molecules/InboxesHeader/index.js";
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
    const currentQuota =
      typeof userData.inbox_quota === "number" ? userData.inbox_quota : 0;
    const maxQuota = Array.isArray(userData.payments)
      ? userData.payments.reduce(
          (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
          USER_STARTING_QUOTA
        )
      : USER_STARTING_QUOTA;

    // Find and update the header
    const existingHeader = document.querySelector(".inboxes-header");
    if (existingHeader) {
      const newHeader = renderQuotaHeader(currentQuota, maxQuota);
      existingHeader.parentNode.replaceChild(newHeader, existingHeader);
    }

    // Find and update the inbox cards
    const inboxesSection = document.querySelector(".inboxes");
    const existingCards = inboxesSection.querySelector(
      '.inbox-cards, [class*="inbox-cards"]'
    );
    if (existingCards) {
      const newCards = createInboxCards();
      existingCards.parentNode.replaceChild(newCards, existingCards);
    }
  } catch (error) {
    console.error("Failed to refresh inboxes data:", error);
  }
}
