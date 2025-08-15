import { createElement } from "../../../utils/domHelpers.js";

export function createStatCard(title, content, id = null) {
  const card = createElement('div', 'stat-card');
  card.innerHTML = `
    <h3>${title}</h3>
    <div ${id ? `id="${id}"` : ''} class="stat-text">${content}</div>
  `;
  return card;
}