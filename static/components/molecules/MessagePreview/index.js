import {
  createElement,
  extractActivationCode,
  getContentType,
  cleanHtmlContent,
} from "../../../utils/domHelpers.js";

const SVG_KEY = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`;
const SVG_CHECK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_LINK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
const SVG_COPY = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const SVG_ARROW = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
const SVG_CHEVRON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

// The rendered email is somebody else's HTML: it assumes a white page, sets no
// margins of its own, and would otherwise inherit nothing from us. Frame it as
// a sheet of paper rather than letting it bleed into the dark card.
const FRAME_MIN_HEIGHT = 48;
const FRAME_MAX_HEIGHT = 520;

const TYPE_LABELS = {
  verification: "Email verification",
  password_reset: "Password reset",
  login_link: "Sign-in link",
};

export function createMessagePreview(message) {
  const container = createElement("div", "message-preview");
  const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const senderFull = message.sender || message.from_email || "Unknown";
  const senderName =
    message.from_name ||
    senderFull.match(/^(.+?)\s*<(.+?)>$/)?.[1]?.trim() ||
    senderFull;
  const senderEmail =
    message.from_email || senderFull.match(/<(.+?)>/)?.[1] || senderFull;
  const senderInitial = senderName.trim().charAt(0).toUpperCase() || "?";

  const date = new Date((message.timestamp || 0) * 1000);
  const subject = message.subject || "No subject";

  // The API extracts the code and the link to click. Older responses don't
  // carry those fields, so fall back to picking them apart here.
  const code = message.code || message.action_url || legacyCode(message);
  const contentType =
    (message.type && message.type !== "general" && message.type) ||
    (code ? getContentType(message.html_body, message.text_body, subject) : null);

  const plainText = message.text || message.text_body || "";

  container.innerHTML = `
    <div class="msg-header">
      <div class="msg-sender-row">
        <span class="msg-avatar" aria-hidden="true">${senderInitial}</span>
        <span class="msg-sender-lines">
          <span class="msg-from-name" title="${escAttr(senderFull)}">${escText(senderName)}</span>
          <span class="msg-from-addr">${escText(senderEmail)}</span>
        </span>
      </div>
      <div class="msg-header-right">
        <time class="msg-date" datetime="${date.toISOString()}" title="${escAttr(date.toLocaleString())}">${formatWhen(date)}</time>
        <span class="msg-chevron" aria-hidden="true">${SVG_CHEVRON}</span>
      </div>
    </div>

    <p class="msg-subject">${escText(subject)}</p>

    <div class="msg-body">
      ${code ? buildCodeSection(code, contentType) : ""}
      ${buildPreviewSection(message, plainText)}
    </div>

    <div class="msg-expanded" id="expanded-${msgId}">
      <div class="msg-expanded-inner">
        <div class="msg-meta">
          <span class="msg-meta-item"><span class="msg-meta-label">To:</span> ${escText(message.inbox || "Unknown")}</span>
          <span class="msg-meta-item"><span class="msg-meta-label">Received:</span> ${escText(date.toLocaleString())}</span>
          ${message.html_body && plainText ? `<button class="msg-view-toggle" data-view-toggle type="button">View as plain text</button>` : ""}
        </div>
        ${message.html_body
          ? `<div class="msg-frame-wrap"><iframe class="msg-email-frame" sandbox="allow-same-origin" title="Email content" tabindex="-1" scrolling="no"></iframe></div>`
          : ""
        }
        <div class="msg-full-body${message.html_body ? " is-hidden" : ""}">
          <p class="msg-text-body">${escText(plainText || "No content available")}</p>
        </div>
      </div>
    </div>
  `;

  container.addEventListener("click", (e) => {
    if (e.target.closest("button, input, a")) return;
    const expanded = container.querySelector(`#expanded-${msgId}`);
    const isExpanded = container.classList.toggle("is-expanded");
    expanded.classList.toggle("is-open", isExpanded);
    if (isExpanded) {
      const frame = container.querySelector(".msg-email-frame");
      if (frame) fitFrame(frame);
    }
  });

  const frame = container.querySelector(".msg-email-frame");
  if (frame && message.html_body) mountEmailFrame(frame, message.html_body);

  const toggle = container.querySelector("[data-view-toggle]");
  if (toggle) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const wrap = container.querySelector(".msg-frame-wrap");
      const text = container.querySelector(".msg-full-body");
      const showingText = wrap.classList.toggle("is-hidden");
      text.classList.toggle("is-hidden", !showingText);
      toggle.textContent = showingText ? "View formatted email" : "View as plain text";
    });
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

function legacyCode(message) {
  return extractActivationCode(
    message.html_body,
    message.text_body,
    message.subject
  );
}

/** Render the email inside a light "paper" document sized to its content. */
function mountEmailFrame(iframe, htmlBody) {
  iframe.addEventListener("load", () => {
    fitFrame(iframe);
    // Images arrive after load and change the height under us.
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      [...doc.images].forEach((img) => {
        if (!img.complete) img.addEventListener("load", () => fitFrame(iframe), { once: true });
      });
    } catch {
      /* cross-origin document — the fallback height in fitFrame applies */
    }
  });
  iframe.srcdoc = wrapEmailHtml(htmlBody);
}

function fitFrame(iframe) {
  let height = null;
  try {
    const doc = iframe.contentDocument;
    if (doc && doc.body) {
      // Measured off the body and the root's box, never the root's
      // scrollHeight: that is floored at the iframe's own viewport height, so
      // a one-line email could only ever grow the frame, never shrink it.
      height = Math.ceil(
        Math.max(
          doc.body.scrollHeight,
          doc.body.offsetHeight,
          doc.documentElement?.getBoundingClientRect().height || 0
        )
      );
    }
  } catch {
    height = null;
  }
  if (!height) {
    iframe.style.height = "320px";
    return;
  }
  const clamped = Math.min(Math.max(height, FRAME_MIN_HEIGHT), FRAME_MAX_HEIGHT);
  iframe.style.height = `${clamped}px`;
  // Only the overflowing case gets a scrollbar, and only one.
  iframe.setAttribute("scrolling", height > FRAME_MAX_HEIGHT ? "auto" : "no");
}

function wrapEmailHtml(htmlBody) {
  return `<!doctype html><html><head><meta charset="utf-8">
<base target="_blank">
<style>
  :root { color-scheme: light; }
  html, body { margin: 0; background: #ffffff; }
  body {
    padding: 16px;
    color: #1a1a1a;
    font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    word-break: break-word;
  }
  body > :first-child { margin-top: 0; }
  body > :last-child { margin-bottom: 0; }
  img { max-width: 100%; height: auto; }
  table { max-width: 100%; }
  a { color: #1a56db; }
</style></head><body>${htmlBody}</body></html>`;
}

function safeUrl(url) {
  return /^https?:\/\//i.test(url) || url.startsWith("/") ? url : "#";
}

function buildCodeSection(code, contentType) {
  const isUrl = /^https?:\/\//i.test(code) || code.startsWith("/");
  const safeCode = escAttr(code);
  const safeHref = escAttr(safeUrl(code));

  if (isUrl && contentType === "password_reset") {
    const display = code.length > 48 ? code.substring(0, 40) + "…" : code;
    return `
      <div class="msg-code-section msg-code-section--reset">
        <div class="msg-code-type">${SVG_LINK} ${TYPE_LABELS.password_reset}</div>
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

  if (isUrl) {
    const label = TYPE_LABELS[contentType] || "Link to open";
    return `
      <div class="msg-code-section msg-code-section--verify">
        <div class="msg-code-type">${SVG_CHECK} ${escText(label)}</div>
        <div class="msg-code-actions">
          <a href="${safeHref}" class="msg-verify-btn" target="_blank" rel="noopener noreferrer">
            Open link ${SVG_ARROW}
          </a>
          <button class="msg-copy-btn" data-copy="${safeCode}">
            ${SVG_COPY} <span>Copy link</span>
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

function buildPreviewSection(message, plainText) {
  let content =
    message.preview ||
    plainText.trim() ||
    cleanHtmlContent(message.html_body) ||
    "No preview available";
  content = content.replace(/\s+/g, " ").trim();
  if (content.length > 140) content = content.substring(0, 140) + "…";
  return `<p class="msg-preview-text">${escText(content)}</p>`;
}

function formatWhen(date) {
  const seconds = (Date.now() - date.getTime()) / 1000;
  if (!Number.isFinite(seconds) || seconds < 0) return dateLabel(date);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return dateLabel(date);
}

function dateLabel(date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
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
