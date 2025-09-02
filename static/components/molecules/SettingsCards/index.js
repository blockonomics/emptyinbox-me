import { createElement } from "../../../utils/domHelpers.js";
import { createStatCard } from "../../atoms/StatCard/index.js";
import { createApiKeyCard } from "../../organisms/ApiKeyCard/index.js";

export function renderSettingsCards() {
  const section = document.createElement('section');
  section.classList.add('messages-stats');

  // 👤 Username Section
  const usernameSection = document.createElement('section');
  usernameSection.classList.add('stat-card');

  const usernameHeader = document.createElement('h3');
  usernameHeader.textContent = 'Username';
  usernameHeader.classList.add('username-header');

  const usernameValue = document.createElement('div');
  usernameValue.id = 'username-display';
  usernameValue.classList.add('quota-display'); // reuse same style as API key value

  usernameSection.appendChild(usernameHeader);
  usernameSection.appendChild(usernameValue);

  // 💳 API Key Section
  const apiKeyCard = createApiKeyCard();

  // 🧾 Billing Section
  const billingSection = document.createElement('section');
  billingSection.classList.add('stat-card');

  const billingHeader = document.createElement('h3');
  billingHeader.textContent = 'Billing Transactions';
  billingHeader.classList.add('billing-header');

  const billingContainer = document.createElement('div');
  billingContainer.id = 'billing-transactions';
  billingContainer.classList.add('quota-display');

  billingSection.appendChild(billingHeader);
  billingSection.appendChild(billingContainer);

  // Append in order: Username → API Key → Billing
  section.appendChild(usernameSection);
  section.appendChild(apiKeyCard);
  section.appendChild(billingSection);

  return section;
}