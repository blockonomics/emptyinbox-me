import { ROUTES } from '../../../utils/constants.js';

const COPY_ICON = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_ICON = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;

export function renderHomePageHero() {
  const section = document.createElement('section');
  section.className = 'hero hero-split';

  section.innerHTML = `
    <div class="hero-split-inner">

      <div class="hero-content">
        <div class="hero-eyebrow">
          <span class="hero-eyebrow-dot"></span>
          <span>REST API &amp; MCP Server</span>
        </div>
        <h1>Disposable Email<br>for <span class="hero-accent">AI Agents</span></h1>
        <p>Create inboxes and read email via REST API or MCP.<br>No browser. No passwords. Just an API key.</p>
        <div class="hero-cta-group">
          <a href="${ROUTES.LOGIN}" class="btn btn-primary" role="button">Get API Key</a>
          <a href="/docs.html" class="btn btn-secondary" role="button">View Docs</a>
        </div>
        <div class="npm-snippet">
          <span class="npm-prompt">$</span>
          <code>npx emptyinbox-mcp</code>
          <button class="copy-btn" title="Copy">${COPY_ICON}</button>
        </div>
      </div>

      <div class="hero-demo" aria-hidden="true">
        <div class="demo-card">
          <div class="demo-chrome">
            <span class="chrome-dot chrome-red"></span>
            <span class="chrome-dot chrome-yellow"></span>
            <span class="chrome-dot chrome-green"></span>
            <span class="demo-chrome-title">terminal</span>
          </div>
          <div class="demo-body">
            <div class="demo-line demo-comment" style="--delay:0.3s"># 1. Create a disposable inbox</div>
            <div class="demo-line" style="--delay:0.6s"><span class="demo-method">POST</span> <span class="demo-path">/api/inbox</span></div>
            <div class="demo-line demo-response" style="--delay:1.1s">→ <span class="demo-key">"address"</span>: <span class="demo-string">"fox12@emptyinbox.me"</span></div>

            <div class="demo-spacer"></div>

            <div class="demo-line demo-comment" style="--delay:1.8s"># 2. Poll until email arrives</div>
            <div class="demo-line" style="--delay:2.1s"><span class="demo-method">GET</span>  <span class="demo-path">/api/messages</span></div>
            <div class="demo-line demo-response" style="--delay:2.7s">→ <span class="demo-key">"from"</span>: <span class="demo-string">"noreply@github.com"</span></div>
            <div class="demo-line demo-response" style="--delay:3.0s">   <span class="demo-key">"subject"</span>: <span class="demo-string">"Verify your email"</span></div>
            <div class="demo-line demo-response" style="--delay:3.3s">   <span class="demo-key">"code"</span>: <span class="demo-string">"847291"</span></div>

            <div class="demo-badge" style="--delay:3.9s">
              ${CHECK_ICON}
              Done in 3.9s
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  const copyBtn = section.querySelector('.copy-btn');
  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText('npx emptyinbox-mcp');
    this.innerHTML = CHECK_ICON;
    setTimeout(() => { this.innerHTML = COPY_ICON; }, 2000);
  });

  return section;
}
