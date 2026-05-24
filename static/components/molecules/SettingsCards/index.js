import { createElement } from "../../../utils/domHelpers.js";
import { createApiKeyDisplay } from "../../molecules/ApiKeyDisplay/index.js";
import { ROUTES } from "../../../utils/constants.js";

export function renderSettingsCards() {
  const section = document.createElement('section');
  section.classList.add('messages-stats');

  section.appendChild(buildApiKeyCard());
  section.appendChild(buildQuotaCard());
  section.appendChild(buildAccountCard());
  section.appendChild(buildBillingCard());
  section.appendChild(buildLogoutSection());

  return section;
}

function buildApiKeyCard() {
  const card = createElement('div', 'stat-card');
  const heading = document.createElement('h3');
  heading.textContent = 'API Key';
  card.appendChild(heading);
  card.appendChild(createApiKeyDisplay());
  return card;
}

function buildQuotaCard() {
  const card = createElement('div', 'stat-card');
  card.innerHTML = `
    <h3>Inbox Quota</h3>
    <div class="quota-summary">
      <span id="quota-remaining-display" class="quota-count">—</span>
      <span id="quota-suffix" class="quota-suffix">of — inboxes available</span>
    </div>
    <div class="quota-bar" style="margin-top: 12px;">
      <div class="quota-fill" id="quota-fill" style="width: 0%"></div>
    </div>
    <div id="quota-low-cta" class="quota-low-cta hidden">
      Running low — <a href="${ROUTES.PRICING}" class="quota-buy-link">buy more inboxes</a>
    </div>
  `;
  return card;
}

function buildAccountCard() {
  const card = createElement('div', 'stat-card stat-card--account');
  card.innerHTML = `
    <h3>Account</h3>
    <div id="username-display" class="account-username skeleton-inline">—</div>
  `;
  return card;
}

function buildBillingCard() {
  const card = createElement('div', 'stat-card');
  card.innerHTML = `
    <h3>Billing History</h3>
    <div id="billing-transactions" class="billing-list">
      <div class="billing-empty">Loading...</div>
    </div>
  `;
  return card;
}

function buildLogoutSection() {
  const wrapper = createElement('div', 'settings-logout');
  wrapper.innerHTML = `<button id="logout-btn" class="btn btn-secondary">Log Out</button>`;
  return wrapper;
}
