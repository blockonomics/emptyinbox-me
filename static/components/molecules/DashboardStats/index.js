import { createElement } from "../../../utils/domHelpers.js";
import { createStatCard } from "../../atoms/StatCard/index.js";
import { createApiKeyCard } from "../../organisms/ApiKeyCard/index.js";
import { createLatestMessageCard } from "../../organisms/LatestMessageCard/index.js";
import { createInboxManagementCard } from "../../organisms/InboxManagementCard/index.js";

export function renderStats() {
  const statsContainer = createElement('div', 'dashboard-stats');
  
  // Add all stat cards
  statsContainer.appendChild(createApiKeyCard());
  statsContainer.appendChild(createStatCard('Inbox Quota', '0 remaining', 'quota-text'));
  statsContainer.appendChild(createLatestMessageCard());
  statsContainer.appendChild(createInboxManagementCard());
  
  return statsContainer;
}