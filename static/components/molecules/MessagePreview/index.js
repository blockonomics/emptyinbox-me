import {
  createElement,
  extractActivationCode,
  getContentType,
  formatTimeAgo,
  getServiceInfo,
  truncateText,
  cleanHtmlContent,
  sanitizeHtmlContent,
} from "../../../utils/domHelpers.js";

export function createMessagePreview(message) {
  const container = createElement("div", "message-preview");
  const messageId = `message-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const serviceInfo = getServiceInfo(message.inbox);

  // Extract sender name
  const senderName =
    message.sender?.match(/^(.+?)\s*<(.+?)>$/)?.[1]?.trim() ||
    message.sender ||
    "Unknown";

  // Get content info
  const extractedContent = extractActivationCode(
    message.html_body,
    message.text_body,
    message.subject
  );
  const contentType = getContentType(
    message.html_body,
    message.text_body,
    message.subject
  );
  const timeAgo = formatTimeAgo(message.timestamp || Date.now() / 1000);
  const subject = message.subject || "No subject";

  // Create content section
  const contentSection = extractedContent
    ? createActivationSection(extractedContent, contentType)
    : createContentPreview(message.html_body, message.text_body);

  container.innerHTML = `
    <div class="message-content">
      <div class="message-body">
        <div class="row">
          <div class="message-to">
            <span class="to-label">From:</span>
            <span class="to-address" title="${
              message.sender || "Unknown"
            }">${senderName}</span>
          </div>
          <div class="message-actions">
            <div class="message-time" title="${new Date(
              (message.timestamp || 0) * 1000
            ).toLocaleString()}">
              ${timeAgo}
            </div>
          </div>
        </div> 
        
        <div class="message-to-section" style="display: none;" id="to-${messageId}">
          <span class="to-label">To:</span>
          <span class="to-address" title="${
            message.to || message.inbox || "Unknown"
          }">${message.to || message.inbox || "Unknown"}</span>
        </div>
    
        <div class="message-subject" title="${subject}" style="display: none;" id="subject-${messageId}">
          ${truncateText(subject, 60)}
        </div>

        <div class="message-preview-content" id="preview-${messageId}">
          ${contentSection}
        </div>
        
        <div class="full-message-content" id="${messageId}" style="display: none;">
          <div class="full-message-section">
            <h4>Full Message Content:</h4>
            <div class="full-message-body isolated-content">
              ${
                sanitizeHtmlContent(message.html_body) ||
                message.text_body ||
                "No content available"
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Toggle on card click, but ignore clicks on buttons/inputs
  container.addEventListener("click", (e) => {
    if (
      e.target.closest("button") ||
      e.target.closest("input") ||
      e.target.closest("a")
    ) {
      return; // Don't toggle if clicking interactive elements
    }
    toggleMessageContent(messageId);
  });

  return container;
}

// Helper functions
function createActivationSection(content, contentType) {
  const isUrl = content.startsWith("http") || content.startsWith("/");

  if (contentType === "email_verification" && isUrl) {
    return `
      <div class="activation-code-section verification-section">
        <div class="code-container">
          <div class="code-header">
            <span class="code-icon">✅</span>
            <span class="code-label">Email Verification</span>
          </div>
          <div class="verification-actions">
            <a href="${content}" class="verify-button" target="_blank" rel="noopener noreferrer">
              <span class="button-text">Verify Email Address</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </a>
            <button class="code-copy" onclick="copyActivationCode('${content.replace(
              /'/g,
              "\\'"
            )}', this)" title="Copy verification link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span class="copy-text">Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const isPasswordReset = contentType === "password_reset" && isUrl;

  if (isPasswordReset) {
    const displayText =
      content.length > 50 ? content.substring(0, 40) + "..." : content;
    return `
      <div class="activation-code-section reset-url-section">
        <div class="code-container">
          <div class="code-header">
            <span class="code-icon">🔗</span>
            <span class="code-label">Reset Password Link</span>
          </div>
          <div class="url-display">
            <a href="${content}" class="reset-link" target="_blank" rel="noopener noreferrer">
              <span class="link-text">${displayText}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </a>
            <button class="code-copy" onclick="copyActivationCode('${content.replace(
              /'/g,
              "\\'"
            )}', this)" title="Copy link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span class="copy-text">Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="activation-code-section">
      <div class="code-container">
        <div class="code-header">
          <span class="code-icon">🔑</span>
          <span class="code-label">Verification Code</span>
        </div>
        <div class="code-display">
          <span class="code-value">${content}</span>
          <button class="code-copy" onclick="copyActivationCode('${content.replace(
            /'/g,
            "\\'"
          )}', this)" title="Copy code">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <span class="copy-text">Copy Code</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function createContentPreview(htmlBody, textBody) {
  let content =
    textBody?.trim() || cleanHtmlContent(htmlBody) || "No content available";
  if (content.length > 120) {
    content = content.substring(0, 120) + "...";
  }
  return `
    <div class="content-preview-section">
      <div class="content-preview">${content}</div>
    </div>
  `;
}

window.toggleMessageContent = function (messageId) {
  const elements = {
    full: document.getElementById(messageId),
    subject: document.getElementById(`subject-${messageId}`),
    to: document.getElementById(`to-${messageId}`),
    preview: document.getElementById(`preview-${messageId}`),
  };

  if (!elements.full || !elements.preview) return;

  const isHidden = elements.full.style.display === "none";
  const display = isHidden ? "block" : "none";
  const previewDisplay = isHidden ? "none" : "block";

  elements.full.style.display = display;
  elements.to.style.display = display;
  elements.subject.style.display = display;
  elements.preview.style.display = previewDisplay;
};

// Global functions
window.copyActivationCode = async function (code, button) {
  const success = await copyToClipboard(code);
  updateButtonFeedback(button, success);
};

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.cssText = "position:fixed;left:-999999px;top:-999999px";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}

function updateButtonFeedback(button, success) {
  const originalContent = button.innerHTML;
  const message = success ? "Copied!" : "Copy Failed";
  const icon = success
    ? '<polyline points="20,6 9,17 4,12"></polyline>'
    : '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>';

  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      ${icon}
    </svg>
    <span class="copy-text">${message}</span>
  `;

  if (success) button.classList.add("copied");

  setTimeout(() => {
    button.innerHTML = originalContent;
    button.classList.remove("copied");
  }, 1500);
}
