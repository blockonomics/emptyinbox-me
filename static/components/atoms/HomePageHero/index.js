import { ROUTES } from '../../../utils/constants.js';

export function renderHomePageHero() {
  const section = document.createElement('section');
  section.className = 'hero';

  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';

  const title = document.createElement('h1');
  title.textContent = 'Disposable Email for AI Agents';

  const subtitle = document.createElement('p');
  subtitle.innerHTML = 'Create inboxes and read email via REST API or MCP.<br>No browser. No passwords. Just an API key.';

  const ctaGroup = document.createElement('div');
  ctaGroup.className = 'hero-cta-group';

  const getKeyBtn = document.createElement('a');
  getKeyBtn.href = ROUTES.LOGIN;
  getKeyBtn.className = 'btn btn-primary';
  getKeyBtn.textContent = 'Get API Key';
  getKeyBtn.setAttribute('role', 'button');

  const docsBtn = document.createElement('a');
  docsBtn.href = '/docs.html';
  docsBtn.className = 'btn btn-secondary';
  docsBtn.textContent = 'View Docs';
  docsBtn.setAttribute('role', 'button');

  const npmSnippet = document.createElement('div');
  npmSnippet.className = 'npm-snippet';

  const copyIcon = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const checkIcon = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;

  npmSnippet.innerHTML = `
    <span class="npm-prompt">$</span>
    <code>npx emptyinbox-mcp</code>
    <button class="copy-btn" title="Copy">${copyIcon}</button>
  `;

  npmSnippet.querySelector('.copy-btn').addEventListener('click', function () {
    navigator.clipboard.writeText('npx emptyinbox-mcp');
    this.innerHTML = checkIcon;
    setTimeout(() => { this.innerHTML = copyIcon; }, 2000);
  });

  ctaGroup.appendChild(getKeyBtn);
  ctaGroup.appendChild(docsBtn);
  heroContent.appendChild(title);
  heroContent.appendChild(subtitle);
  heroContent.appendChild(ctaGroup);
  heroContent.appendChild(npmSnippet);
  section.appendChild(heroContent);

  return section;
}
