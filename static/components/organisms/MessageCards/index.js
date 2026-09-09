import { createElement } from "../../../utils/domHelpers.js";
import { createMessagePreview } from "../../molecules/MessagePreview/index.js";
import { fetchMessages } from "../../../services/apiService.js";
import { ROUTES } from "../../../utils/constants.js";

export function createMessageCards() {
  const container = createElement("div", "messages-container");
  container.id = "messages-container";
  loadAllMessages(container);
  return container;
}

async function loadAllMessages(container) {
  container.innerHTML = buildSkeletonHTML();
  try {
    const messages = await fetchMessages();
    displayAllMessages(container, messages || []);
  } catch {
    container.innerHTML = buildErrorHTML();
  }
}

const SKELETON_CARD = `
  <div class="msg-skeleton-card">
    <div class="msg-skel-header">
      <div class="skel skel-avatar"></div>
      <div class="skel skel-line skel-line-md"></div>
      <div class="skel skel-line skel-line-sm" style="margin-left:auto"></div>
    </div>
    <div class="skel skel-block"></div>
  </div>`;

function buildSkeletonHTML() {
  return `<div class="msg-skeleton">${SKELETON_CARD}${SKELETON_CARD}${SKELETON_CARD}</div>`;
}

function buildErrorHTML() {
  return `
    <div class="msg-state-container">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="msg-state-icon msg-state-icon--error" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="msg-state-title">Couldn't load messages</p>
      <p class="msg-state-sub">Check your connection and refresh the page.</p>
    </div>`;
}

function buildEmptyHTML() {
  return `
    <div class="msg-state-container">
      <svg class="msg-empty-svg" width="88" height="72" viewBox="0 0 88 72" fill="none" aria-hidden="true">
        <rect class="msg-empty-envelope" x="8" y="22" width="72" height="46" rx="6" stroke-width="1.5"/>
        <path class="msg-empty-flap" d="M8 32L44 54L80 32" stroke-width="1.5" stroke-linejoin="round"/>
        <path class="msg-empty-tick" d="M32 8L56 8" stroke-width="1.5" stroke-linecap="round"/>
        <path class="msg-empty-tick" d="M40 2L48 2" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <p class="msg-state-title">No messages yet</p>
      <p class="msg-state-sub">Share an inbox address to start receiving mail.</p>
      <a href="${ROUTES.INBOXES}" class="msg-state-cta">View Inboxes</a>
    </div>`;
}

function displayAllMessages(container, messages) {
  container.innerHTML = "";
  if (messages.length === 0) {
    container.innerHTML = buildEmptyHTML();
    return;
  }
  messages.forEach((message, index) => {
    const card = createElement("div", "message-card");
    card.style.setProperty("--card-i", index);
    card.appendChild(createMessagePreview(message));
    container.appendChild(card);
  });
}
