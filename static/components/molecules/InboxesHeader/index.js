import { renderBuyQuotaButton } from "../../atoms/BuyMoreQuotaButton/index.js";
import { createInboxButtonWithLogic } from "../InboxButtonWithLogic/index.js";

export function renderQuotaHeader(currentQuota, maxQuota) {
  const quotaHeader = document.createElement("div");
  quotaHeader.classList.add("inboxes-header");

  const title = document.createElement("h2");
  title.textContent = "All Inboxes";

  const quotaText = document.createElement("span");
  quotaText.classList.add("quota-text");
  quotaText.textContent = `${currentQuota}/${maxQuota}`;

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
