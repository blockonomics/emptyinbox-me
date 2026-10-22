import { renderBuyQuotaButton } from "../../atoms/BuyMoreQuotaButton/index.js";
import { createInboxButtonWithLogic } from "../InboxButtonWithLogic/index.js";
import { formatCredits } from "../../../utils/credits.js";

export function renderInboxesHeader(remaining) {
  const quotaHeader = document.createElement("div");
  quotaHeader.classList.add("inboxes-header");

  const title = document.createElement("h2");
  title.textContent = "All Inboxes";

  const quotaText = document.createElement("span");
  quotaText.classList.add("quota-text");
  quotaText.id = "credit-balance";
  quotaText.title = "1 credit creates 1 inbox for 30 days";
  quotaText.dataset.credits = String(remaining);
  quotaText.textContent = `${formatCredits(remaining)} left`;

  // Add title and createInboxButtonWithLogic to left group
  const leftGroup = document.createElement("div");
  leftGroup.classList.add("quota-left");
  leftGroup.appendChild(title);
  leftGroup.appendChild(createInboxButtonWithLogic());

  // Add Quota Text and buy quotabutton to right group
  const rightGroup = document.createElement("div");
  rightGroup.classList.add("quota-right");
  rightGroup.appendChild(quotaText);
  rightGroup.appendChild(renderBuyQuotaButton());

  quotaHeader.appendChild(leftGroup);
  quotaHeader.appendChild(rightGroup);

  return quotaHeader;
}
