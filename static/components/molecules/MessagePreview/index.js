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
              <button class="code-copy" onclick="copyActivationCode('${extractedContent.replace(/'/g, "\\'")}', this)" title="Copy link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
                <span class="copy-text">Copy Link</span>
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
              <button class="code-copy" onclick="copyActivationCode('${extractedContent.replace(/'/g, "\\'")}', this)" title="Copy code">
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

// Global copy function with improved feedback
window.copyActivationCode = async function(code, button) {
  try {
    await navigator.clipboard.writeText(code);
    
    // Success feedback
    const originalContent = button.innerHTML;
    const copyText = button.querySelector('.copy-text');
    const originalText = copyText ? copyText.textContent : '';
    
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
      <span class="copy-text">Copied!</span>
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
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      
      // Success feedback for fallback
      const originalContent = button.innerHTML;
      const copyText = button.querySelector('.copy-text');
      
      button.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
        <span class="copy-text">Copied!</span>
      `;
      button.classList.add('copied');
      
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.remove('copied');
      }, 1500);
      
    } catch (fallbackErr) {
      console.error('Failed to copy:', fallbackErr);
      
      // Error feedback
      const copyText = button.querySelector('.copy-text');
      if (copyText) {
        const originalText = copyText.textContent;
        copyText.textContent = 'Copy Failed';
        setTimeout(() => {
          copyText.textContent = originalText;
        }, 1500);
      }
    }
    
    document.body.removeChild(textArea);
  }
};