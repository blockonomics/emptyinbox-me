import { createElement } from "../../../utils/domHelpers.js";
import { createStatCard } from "../../atoms/StatCard/index.js";
import { createApiKeyCard } from "../../organisms/ApiKeyCard/index.js";

export function renderSettingsCards() {
  const statsContainer = createElement('div', 'messages-stats');
  
  // Add all stat cards
  statsContainer.appendChild(createApiKeyCard());
  statsContainer.appendChild(createStatCard('Billing Transactions', 'Still need to be implemented', 'quota-text'));
  
  return statsContainer;
}