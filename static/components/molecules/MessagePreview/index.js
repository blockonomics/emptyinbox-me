import { createElement, extractActivationCode, formatTimeAgo, getServiceInfo, truncateText } from "../../../utils/domHelpers.js";

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
  
  // Search for activation codes in both subject and content
  const searchText = (message.subject || '') + ' ' + (message.content || '');
  const code = extractActivationCode(searchText);
  
  const timeAgo = formatTimeAgo(message.timestamp || Date.now() / 1000);
  const subject = message.subject || 'No subject';

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
          <span class="to-label">To:</span>
          <span class="to-address">${message.inbox}</span>
        </div>
        
        <div class="message-subject" title="${subject}">
          ${truncateText(subject, 60)}
        </div>
        
        ${code ? `
          <div class="activation-code-section">
            <div class="code-container">
              <div class="code-header">
                <span class="code-icon">🔑</span>
                <span class="code-label">Activation Code</span>
              </div>
              <div class="code-display">
                <span class="code-value">${code}</span>
                <button class="code-copy" onclick="copyActivationCode('${code}', this)" title="Copy code">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ` : `
          <div class="no-code-section">
            <div class="no-code-content">
              <span class="no-code-icon">🔍</span>
              <span class="no-code-text">No activation code found</span>
            </div>
          </div>
        `}
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