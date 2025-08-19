import { createElement } from "../../../utils/domHelpers.js";
import { createStatCard } from "../../atoms/StatCard/index.js";
import { createApiKeyCard } from "../../organisms/ApiKeyCard/index.js";

export function renderSettingsCards() {
  const statsContainer = createElement('div', 'messages-stats');

  // Create billing content container
  const billingContent = createElement('div', 'billing-text');
  billingContent.id = 'billing-transactions';
  billingContent.textContent = 'Still need to be implemented'; // Optional placeholder

  // Add all stat cards
  statsContainer.appendChild(createApiKeyCard());
  statsContainer.appendChild(createStatCard('Billing Transactions', billingContent));

  return statsContainer;
}