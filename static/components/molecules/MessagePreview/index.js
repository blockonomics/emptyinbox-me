import { createElement, extractActivationCode, getContentType, formatTimeAgo, getServiceInfo, truncateText } from "../../../utils/domHelpers.js";

export function createMessagePreview(message) {
  const container = createElement('div', 'message-preview');
  const messageId = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

  // Get content preview for when no activation code is found
  const getContentPreview = (htmlBody, textBody) => {
    let content = '';
    if (textBody) {
      content = textBody.trim();
    } else if (htmlBody) {
      // Strip HTML tags for preview
      content = htmlBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    if (content.length > 120) {
      return content.substring(0, 120) + '...';
    }
    return content || 'No content available';
  };

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
                  <path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
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
    const contentPreview = getContentPreview(message.html_body, message.text_body);
    contentSection = `
      <div class="content-preview-section">
        <div class="content-preview">
          ${contentPreview}
        </div>
      </div>
    `;
  }

  const renderServiceInfo = () => `        
    <div class="service-badge" style="--service-color: ${serviceInfo.color}">
      <span class="service-icon">${serviceInfo.icon}</span>
      <span class="service-name">${serviceInfo.name}</span>
    </div>`;

  container.innerHTML = `
    <div class="message-content">
      <div class="message-body">
        <div class="row">
          <div class="message-to">
            <span class="to-label">From:</span>
            <span class="to-address" title="${message.sender || 'Unknown'}">${senderName}</span>
          </div>
          <div class="message-actions">
            <div class="message-time" title="${new Date((message.timestamp || 0) * 1000).toLocaleString()}">
              ${timeAgo}
            </div>
            <button class="dropdown-arrow" onclick="toggleMessageContent('${messageId}')" title="Show full message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
        </div> 
        <div class="message-to-section">
          <span class="to-label">To:</span>
          <span class="to-address" title="${message.to || message.inbox || 'Unknown'}">${message.to || message.inbox || 'Unknown'}</span>
        </div>
    
        <div class="message-subject" title="${subject}">
          ${truncateText(subject, 60)}
        </div>

        <div class="message-preview-content" id="preview-${messageId}">
          ${contentSection}
        </div>
        
        <div class="full-message-content" id="${messageId}" style="display: none;">
          <div class="full-message-section">
            <h4>Full Message Content:</h4>
            <div class="full-message-body">
              ${message.html_body || message.text_body || 'No content available'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return container;
}

// Global toggle function for message content
window.toggleMessageContent = function(messageId) {
  const fullContent = document.getElementById(messageId);
  const previewContent = document.getElementById(`preview-${messageId}`);
  const arrow = document.querySelector(`button[onclick="toggleMessageContent('${messageId}')"] svg`);
  
  if (fullContent && previewContent && arrow) {
    const isHidden = fullContent.style.display === 'none';
    
    if (isHidden) {
      // Show full message, hide preview content
      fullContent.style.display = 'block';
      previewContent.style.display = 'none';
      arrow.style.transform = 'rotate(180deg)';
      arrow.parentElement.setAttribute('title', 'Hide full message');
    } else {
      // Show preview content, hide full message
      fullContent.style.display = 'none';
      previewContent.style.display = 'block';
      arrow.style.transform = 'rotate(0deg)';
      arrow.parentElement.setAttribute('title', 'Show full message');
    }
  }
};

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