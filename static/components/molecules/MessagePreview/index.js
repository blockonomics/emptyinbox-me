import { createElement, extractActivationCode, getContentType, formatTimeAgo, getServiceInfo, truncateText } from "../../../utils/domHelpers.js";

export function createMessagePreview(message) {
  const container = createElement('div', 'message-preview');

  if (!message) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-animation">
          <div class="empty-icon">📬</div>
          <div class="pulse-ring"></div>
        </div>
        <div class="empty-text">No messages yet</div>
        <div class="empty-subtext">Your latest messages will appear here</div>
      </div>
    `;
    return container;
  }

  const serviceInfo = getServiceInfo(message.inbox);
  
  // Extract sender info for display
  let senderName = 'Unknown';
  if (message.sender) {
    const senderMatch = message.sender.match(/^(.+?)\s*<(.+?)>$/);
    if (senderMatch) {
      senderName = senderMatch[1].trim();
    } else {
      senderName = message.sender;
    }
  }
  
  // Search for activation codes or tokens in subject and message content
  const extractedContent = extractActivationCode(message.html_body, message.text_body, message.subject);
  const contentType = getContentType(message.html_body, message.text_body, message.subject);
  
  const timeAgo = formatTimeAgo(message.timestamp || Date.now() / 1000);
  const subject = message.subject || 'No subject';

  // Determine content display based on type and extracted content
  let contentSection = '';
  
  if (extractedContent) {
    const isLongUrl = extractedContent.length > 50;
    const isUrl = extractedContent.startsWith('http') || extractedContent.startsWith('/');
    
    if (contentType === 'password_reset' && isUrl) {
      contentSection = `
        <div class="activation-code-section reset-url-section">
          <div class="code-container">
            <div class="code-header">
              <span class="code-icon">🔗</span>
              <span class="code-label">Reset Password Link</span>
            </div>
            <div class="url-display">
              <a href="${extractedContent}" class="reset-link" target="_blank" rel="noopener noreferrer">
                <span class="link-text">
                  ${isLongUrl ? extractedContent.substring(0, 40) + '...' : extractedContent}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </a>
              <button class="code-copy" onclick="copyActivationCode('${extractedContent}', this)" title="Copy link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      contentSection = `
        <div class="activation-code-section">
          <div class="code-container">
            <div class="code-header">
              <span class="code-icon">🔑</span>
              <span class="code-label">Activation Code</span>
            </div>
            <div class="code-display">
              <span class="code-value">${extractedContent}</span>
              <button class="code-copy" onclick="copyActivationCode('${extractedContent}', this)" title="Copy code">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }
  } else {
    contentSection = `
      <div class="no-code-section">
        <div class="no-code-content">
          <span class="no-code-icon">🔍</span>
          <span class="no-code-text">No ${contentType === 'password_reset' ? 'reset link' : 'activation code'} found</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="message-content">
      <div class="message-header">
        <div class="service-badge" style="--service-color: ${serviceInfo.color}">
          <span class="service-icon">${serviceInfo.icon}</span>
          <span class="service-name">${serviceInfo.name}</span>
        </div>
        <div class="message-time" title="${new Date((message.timestamp || 0) * 1000).toLocaleString()}">
          ${timeAgo}
        </div>
      </div>
      
      <div class="message-body">
        <div class="message-to">
          <span class="to-label">From:</span>
          <span class="to-address" title="${message.sender || 'Unknown'}">${senderName}</span>
        </div>
        
        <div class="message-subject" title="${subject}">
          ${truncateText(subject, 60)}
        </div>
        
        ${contentSection}
      </div>
    </div>
  `;

  return container;
}

// Global copy function
window.copyActivationCode = async function(code, button) {
  try {
    await navigator.clipboard.writeText(code);
    
    // Success feedback
    const originalContent = button.innerHTML;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
    `;
    button.classList.add('copied');
    
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.classList.remove('copied');
    }, 1500);
    
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    button.classList.add('copied');
    setTimeout(() => button.classList.remove('copied'), 1500);
  }
};