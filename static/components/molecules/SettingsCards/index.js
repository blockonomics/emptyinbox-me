import { createElement } from "../../../utils/domHelpers.js";
import { createStatCard } from "../../atoms/StatCard/index.js";
import { createApiKeyCard } from "../../organisms/ApiKeyCard/index.js";

export function renderSettingsCards() {
  const section = document.createElement('section');
  section.classList.add('messages-stats');

  // 🔹 Create Billing Section (your custom markup)
  const billingSection = document.createElement('section');
  billingSection.classList.add('messages-stats');

  const billingHeader = document.createElement('h3');
  billingHeader.textContent = 'Billing Transactions';
  billingHeader.classList.add('billing-header');

  const billingContainer = document.createElement('div');
  billingContainer.id = 'billing-transactions';
  billingContainer.classList.add('quota-display');

  billingSection.appendChild(billingHeader);
  billingSection.appendChild(billingContainer);

  // 🔹 Append other cards if needed
  section.appendChild(createApiKeyCard());
  section.appendChild(billingSection); // 👈 Your billing section goes here

  return section;
}