import { createElement } from "../../../utils/domHelpers.js";
import { createApiKeyDisplay } from "../../molecules/ApiKeyDisplay/index.js";

export function createApiKeyCard() {
  const card = createElement('div', 'stat-card');
  card.innerHTML = '<h3>API Key</h3>';
  card.appendChild(createApiKeyDisplay());
  return card;
}
