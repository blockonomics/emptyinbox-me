import { createElement } from "../../../utils/domHelpers.js";

export function createInboxPreview(inbox) {
  const container = createElement('div', 'inbox-preview');

  // const createdDate = new Date(inbox.created_at * 1000).toLocaleString('en-US', {
  //   day: '2-digit',
  //   month: 'short',
  //   year: 'numeric',
  //   hour: '2-digit',
  //   minute: '2-digit',
  // });

  container.innerHTML = `
    <div class="inbox-header">
      <div class="inbox-email">
        <span class="email-address" title="${inbox.email}">${inbox.email}</span>
        <button class="copy-email" onclick="copyInboxEmail('${inbox.email}', this)" title="Copy email">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        </button>
      </div>
      <div class="inbox-created">Created: ${'N/A'}</div>
    </div>
  `;

  return container;
}

// Global copy function for inbox email
window.copyInboxEmail = async function(email, button) {
  try {
    await navigator.clipboard.writeText(email);

    const originalContent = button.innerHTML;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
    console.error('Failed to copy inbox email:', err);
  }
};