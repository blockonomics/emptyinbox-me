import {
  createElement,
  extractActivationCode,
  getContentType,
  truncateText,
  cleanHtmlContent,
} from "../../../utils/domHelpers.js";

const SVG_KEY = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`;
const SVG_CHECK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_LINK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
const SVG_COPY = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const SVG_ARROW = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
const SVG_CHEVRON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

export function createMessagePreview(message) {
  const container = createElement("div", "message-preview");
  const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const senderFull = message.sender || "Unknown";
  const senderName =
    senderFull.match(/^(.+?)\s*<(.+?)>$/)?.[1]?.trim() || senderFull;
  const senderInitial = senderName.charAt(0).toUpperCase() || "?";

  const date = new Date((message.timestamp || 0) * 1000);
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

  const code = extractActivationCode(
    message.html_body,
    message.text_body,
    message.subject
  );
  const contentType = code
    ? getContentType(message.html_body, message.text_body, message.subject)
    : null;
  const subject = message.subject || "No subject";

  container.innerHTML = `
    <div class="msg-header">
      <div class="msg-sender-row">
        <span class="msg-avatar" aria-hidden="true">${senderInitial}</span>
        <span class="msg-from-label">From:</span>
        <span class="msg-from-name" title="${escAttr(senderFull)}">${escText(senderName)}</span>
      </div>
      <div class="msg-header-right">
        <time class="msg-date" datetime="${date.toISOString()}">${dateStr}</time>
        <span class="msg-chevron" aria-hidden="true">${SVG_CHEVRON}</span>
      </div>
    </div>

    <div class="msg-body">
      ${code ? buildCodeSection(code, contentType) : buildPreviewSection(message.html_body, message.text_body)}
    </div>

    <div class="msg-expanded" id="expanded-${msgId}">
      <div class="msg-expanded-inner">
        <div class="msg-meta">
          <span class="msg-meta-item"><span class="msg-meta-label">To:</span> ${escText(message.inbox || "Unknown")}</span>
          <span class="msg-meta-item"><span class="msg-meta-label">Subject:</span> ${escText(subject)}</span>
        </div>
        <div class="msg-full-body">
          ${message.html_body
            ? `<iframe class="msg-email-frame" sandbox="allow-same-origin" title="Email content" tabindex="-1"></iframe>`
            : `<p class="msg-text-body">${escText(message.text_body || "No content available")}</p>`
          }
        </div>
      </div>
    </div>
  `;

  container.addEventListener("click", (e) => {
    if (e.target.closest("button, input, a")) return;
    const expanded = container.querySelector(`#expanded-${msgId}`);
    const isExpanded = container.classList.toggle("is-expanded");
    expanded.classList.toggle("is-open", isExpanded);
  });

  if (message.html_body) {
    const iframe = container.querySelector(".msg-email-frame");
    if (iframe) iframe.srcdoc = message.html_body;
  }

  container.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const success = await copyToClipboard(btn.dataset.copy);
      updateCopyFeedback(btn, success);
    });
  });

  return container;
}

function safeUrl(url) {
  return /^https?:\/\//i.test(url) || url.startsWith("/") ? url : "#";
}

function buildCodeSection(code, contentType) {
  const isUrl = /^https?:\/\//i.test(code) || code.startsWith("/");
  const safeCode = escAttr(code);
  const safeHref = escAttr(safeUrl(code));

  if (isUrl && contentType === "email_verification") {
    return `
      <div class="msg-code-section msg-code-section--verify">
        <div class="msg-code-type">${SVG_CHECK} Email verification</div>
        <div class="msg-code-actions">
          <a href="${safeHref}" class="msg-verify-btn" target="_blank" rel="noopener noreferrer">
            Verify email ${SVG_ARROW}
          </a>
          <button class="msg-copy-btn" data-copy="${safeCode}">
            ${SVG_COPY} <span>Copy link</span>
          </button>
        </div>
      </div>`;
  }

  if (isUrl && contentType === "password_reset") {
    const display = code.length > 48 ? code.substring(0, 40) + "…" : code;
    return `
      <div class="msg-code-section msg-code-section--reset">
        <div class="msg-code-type">${SVG_LINK} Password reset</div>
        <div class="msg-code-actions">
          <a href="${safeHref}" class="msg-reset-link" target="_blank" rel="noopener noreferrer">
            <span>${escText(display)}</span> ${SVG_ARROW}
          </a>
          <button class="msg-copy-btn" data-copy="${safeCode}">
            ${SVG_COPY}
          </button>
        </div>
      </div>`;
  }

  return `
    <div class="msg-code-section">
      <div class="msg-code-type">${SVG_KEY} Verification code</div>
      <div class="msg-code-display">
        <span class="msg-code-value">${escText(code)}</span>
        <button class="msg-copy-btn" data-copy="${safeCode}">
          ${SVG_COPY} <span>Copy</span>
        </button>
      </div>
    </div>`;
}

function buildPreviewSection(htmlBody, textBody) {
  let content =
    textBody?.trim() || cleanHtmlContent(htmlBody) || "No preview available";
  if (content.length > 140) content = content.substring(0, 140) + "…";
  return `<p class="msg-preview-text">${escText(content)}</p>`;
}

function escAttr(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escText(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;left:-999999px;top:-999999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(ta);
  }
}

function updateCopyFeedback(btn, success) {
  const original = btn.innerHTML;
  btn.innerHTML = success
    ? `${SVG_CHECK} <span>Copied!</span>`
    : `${SVG_COPY} <span>Failed</span>`;
  btn.classList.add("is-copied");
  setTimeout(() => {
    btn.innerHTML = original;
    btn.classList.remove("is-copied");
  }, 1500);
}
