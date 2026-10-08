import { createElement } from "../../../utils/domHelpers.js";
import { keepInbox } from "../../../services/apiService.js";
import { showToast } from "../../atoms/Toast/index.js";
import { KEEP_INBOX_CREDITS } from "../../../utils/constants.js";

const DAY_MS = 86400000;

function lifetimeLabel(inbox) {
  if (inbox.permanent) return { text: "Permanent", tone: "permanent" };
  if (inbox.expired) return { text: "Expired · no longer receiving mail", tone: "expired" };
  const days = Math.ceil((new Date(inbox.expires_at) - Date.now()) / DAY_MS);
  const text = days <= 1 ? "Expires within a day" : `Expires in ${days} days`;
  return { text, tone: days <= 7 ? "soon" : "temporary" };
}

export function createInboxPreview(inbox) {
  const container = createElement("div", "inbox-card");

  const createdDate = new Date(inbox.created_at).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  container.innerHTML = `
    <div class="inbox-header">
      <div class="inbox-email">
        <span class="email-address" title="${inbox.inbox}">${inbox.inbox}</span>
        <button class="copy-email" onclick="copyInboxEmail('${inbox.inbox}', this)" title="Copy email">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        </button>
      </div>
      <div class="inbox-created">Created: ${createdDate}</div>
    </div>
  `;

  // Inboxes from before expiry existed come back without the field; treat
  // them as what they are, permanent.
  if (inbox.permanent === undefined) return container;

  const life = lifetimeLabel(inbox);
  const footer = createElement("div", "inbox-lifetime");
  footer.innerHTML = `<span class="lifetime-badge lifetime-${life.tone}">${life.text}</span>`;
  if (!inbox.permanent) {
    const keep = createElement("button", "keep-inbox-btn");
    keep.type = "button";
    keep.textContent = inbox.expired
      ? `Restore permanently · ${KEEP_INBOX_CREDITS} credits`
      : `Keep permanently · ${KEEP_INBOX_CREDITS} credits`;
    keep.title = "Keep this address receiving mail forever, e.g. for password resets";
    keep.addEventListener("click", () => onKeep(inbox, keep, footer));
    footer.appendChild(keep);
  }
  container.appendChild(footer);

  return container;
}

async function onKeep(inbox, button, footer) {
  if (!confirm(`Keep ${inbox.inbox} permanently for ${KEEP_INBOX_CREDITS} credits?`)) return;
  button.disabled = true;
  try {
    const { status, ok, body } = await keepInbox(inbox.inbox);
    if (ok) {
      footer.innerHTML = `<span class="lifetime-badge lifetime-permanent">Permanent</span>`;
      showToast("Inbox is now permanent");
      return;
    }
    if (status === 402) {
      showToast(`Needs ${KEEP_INBOX_CREDITS} credits, you have ${body.credits_available ?? 0}. Buy more first.`, "error");
      document.getElementById("buy-quota-btn")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      showToast(body.message || "Could not keep inbox", "error");
    }
  } catch {
    showToast("Could not keep inbox", "error");
  }
  button.disabled = false;
}

// Global copy function for inbox email
window.copyInboxEmail = async function (email, button) {
  try {
    await navigator.clipboard.writeText(email);

    const originalContent = button.innerHTML;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
      <span class="copy-text">Copied!</span>
    `;
    button.classList.add("copied");

    setTimeout(() => {
      button.innerHTML = originalContent;
      button.classList.remove("copied");
    }, 1500);
  } catch (err) {
    console.error("Failed to copy inbox email:", err);
  }
};
