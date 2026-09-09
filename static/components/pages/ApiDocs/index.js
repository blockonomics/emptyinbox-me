export function renderApiDocsPage() {
  initializeCopyButtons(); // Always needed — sets window.copyCode for onclick handlers
  if (document.querySelector('main')) return;

  const main = document.createElement('main');

  const container = document.createElement('div');
  container.classList.add('api-docs-page');

  container.innerHTML = `
    <!-- Header Section -->
    <div class="docs-header">
      <h1>API Documentation</h1>
      <p>Disposable email inboxes for AI agents and developers. Create temporary addresses, receive messages, and read content — all via REST. No browser required.</p>
      <div class="base-url">
        Base URL: https://emptyinbox.me/api
      </div>
    </div>

    <!-- Quick Start Section -->
    <div class="docs-section">
      <h2>
        <div class="section-icon">🚀</div>
        Quick Start (Agents)
      </h2>
      <div class="auth-info">
        <h3>Zero-config with MCP</h3>
        <p>Add to your MCP config and the server auto-registers on first run — no setup needed:</p>
        <div class="code-block" data-lang="json">
          <button class="copy-button" onclick="copyCode(this)">Copy</button>{
  "mcpServers": {
    "emptyinbox": {
      "command": "npx",
      "args": ["-y", "emptyinbox-mcp"]
    }
  }
}</div>

        <h3 style="margin-top: 1.5rem;">REST API workflow</h3>
        <ol style="margin-left: 1.5rem; color: var(--color-text-secondary); line-height: 2;">
          <li>Call <code>POST /auth/register</code> to get an API key (one-time setup)</li>
          <li>Call <code>POST /inbox</code> to create a disposable address</li>
          <li>Trigger signup/verification using that address</li>
          <li>Poll <code>GET /messages</code> until the email arrives</li>
          <li>Read <code>code</code> or <code>action_url</code> straight off the message — no parsing needed</li>
        </ol>
      </div>
    </div>

    <!-- Authentication Section -->
    <div class="docs-section">
      <h2>
        <div class="section-icon">🔐</div>
        Authentication
      </h2>
      <div class="auth-info">
        <h3>API Key</h3>
        <p>All endpoints except <code>POST /auth/register</code> require an API key in the Authorization header:</p>
        <div class="code-block" data-lang="http">Authorization: Bearer YOUR_API_KEY</div>
        <p style="margin-top: 1rem;"><strong>Agents:</strong> call <code>POST /auth/register</code> below to get a key programmatically.<br>
        <strong>Humans:</strong> get your key at <a href="/settings.html" style="color: var(--color-primary);">Settings</a>.</p>
      </div>
    </div>

    <!-- Account Section -->
    <div class="docs-section">
      <h2>
        <div class="section-icon">👤</div>
        Account
      </h2>

      <!-- Register -->
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method method-post">POST</span>
          <span class="endpoint-path">/auth/register</span>
          <span style="margin-left: auto; font-size: 0.75rem; color: var(--color-text-secondary); font-family: monospace;">No auth required</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">Create a new account and get an API key. Agent accounts start with 5 inbox quota, the same as human accounts. Rate limited to 3 registrations per IP per 24 hours.</p>

          <h4>Request Body</h4>
          <table class="parameter-table">
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
              <tr>
                <td><code>username</code></td>
                <td>string</td>
                <td><span class="param-required">Required</span></td>
                <td>3–32 chars, letters/numbers/hyphens/underscores</td>
              </tr>
            </tbody>
          </table>

          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl -X POST "https://emptyinbox.me/api/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "my-agent"}'</div>
          </div>

          <div class="response-example">
            <h4>Response</h4>
            <p><span class="status-code status-200">200 OK</span></p>
            <div class="code-block" data-lang="json">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>{
  "api_key": "eiXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "username": "my-agent",
  "inbox_quota": 5
}</div>
            <p><span class="status-code status-400">400 Bad Request</span> – Invalid or taken username</p>
            <p><span class="status-code status-429">429 Too Many Requests</span> – Rate limit exceeded</p>
          </div>
        </div>
      </div>

      <!-- Get Quota -->
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method method-get">GET</span>
          <span class="endpoint-path">/auth/me</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">Returns the authenticated account's username and remaining inbox quota.</p>

          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl "https://emptyinbox.me/api/auth/me" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <div class="response-example">
            <h4>Response</h4>
            <p><span class="status-code status-200">200 OK</span></p>
            <div class="code-block" data-lang="json">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>{
  "username": "my-agent",
  "inbox_quota": 5
}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Inbox Management Section -->
    <div class="docs-section">
      <h2>
        <div class="section-icon">📧</div>
        Inbox Management
      </h2>

      <!-- Create Inbox -->
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method method-post">POST</span>
          <span class="endpoint-path">/inbox</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">Creates a new disposable email inbox. Returns the email address as plain text. Each inbox consumes 1 from your quota. All accounts start with 5 inboxes. When quota runs out this returns <strong>402</strong> with links for buying more with Bitcoin. Humans can also buy at <a href="/inboxes.html" style="color: var(--color-primary);">emptyinbox.me/inboxes.html</a>.</p>

          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl -X POST "https://emptyinbox.me/api/inbox" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <div class="response-example">
            <h4>Response</h4>
            <p><span class="status-code status-201">201 Created</span> – Returns the email address as plain text</p>
            <div class="code-block" data-lang="text">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>clever.sunny.butterfly@emptyinbox.me</div>
            <p><span class="status-code status-402">402 Payment Required</span> – Inbox quota exhausted; body carries <code>bundles_url</code> and <code>quote_url</code></p>
          </div>
        </div>
      </div>

      <!-- List Inboxes -->
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method method-get">GET</span>
          <span class="endpoint-path">/inboxes</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">Returns all inboxes on this account, newest first.</p>

          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl "https://emptyinbox.me/api/inboxes" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <div class="response-example">
            <h4>Response</h4>
            <p><span class="status-code status-200">200 OK</span></p>
            <div class="code-block" data-lang="json">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>[
  {
    "inbox": "clever.sunny.butterfly@emptyinbox.me",
    "created_at": "2024-01-01T10:00:00"
  },
  {
    "inbox": "quick.blue.elephant@emptyinbox.me",
    "created_at": "2024-01-01T09:00:00"
  }
]</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages Section -->
    <div class="docs-section">
      <h2>
        <div class="section-icon">📬</div>
        Message Management
      </h2>

      <!-- List Messages -->
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method method-get">GET</span>
          <span class="endpoint-path">/messages</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">
            Messages across all inboxes, newest first, each one already parsed: the one-time
            code, the link to open and the body as plain text come back extracted, so there
            is no HTML to pick apart. Messages are automatically deleted after 7 days.
          </p>

          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl "https://emptyinbox.me/api/messages?inbox=clever.sunny.butterfly@emptyinbox.me&since=1711234000" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <h4>Query Parameters</h4>
          <table class="parameter-table">
            <thead>
              <tr><th>Parameter</th><th>Type</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><code>inbox</code></td><td>string</td><td>Only messages delivered to this address</td></tr>
              <tr><td><code>since</code></td><td>integer</td><td>Only messages received after this Unix timestamp — poll with it so each call returns just what is new</td></tr>
              <tr><td><code>limit</code></td><td>integer</td><td>Max messages to return (default 50, max 200)</td></tr>
              <tr><td><code>include_body</code></td><td>boolean</td><td>Set <code>false</code> to drop <code>text</code>, <code>text_body</code> and <code>html_body</code> from the response</td></tr>
            </tbody>
          </table>

          <h4>Response Fields (per message)</h4>
          <table class="parameter-table">
            <thead>
              <tr><th>Field</th><th>Type</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><code>id</code></td><td>string</td><td>Unique message identifier</td></tr>
              <tr><td><code>inbox</code></td><td>string</td><td>Email address that received the message</td></tr>
              <tr><td><code>subject</code></td><td>string</td><td>Email subject line</td></tr>
              <tr><td><code>sender</code></td><td>string</td><td>Raw From header</td></tr>
              <tr><td><code>from_name</code> / <code>from_email</code></td><td>string</td><td>From header split into display name and address</td></tr>
              <tr><td><code>timestamp</code></td><td>integer</td><td>Unix timestamp</td></tr>
              <tr><td><code>received_at</code></td><td>string</td><td>Same moment as an ISO 8601 UTC string</td></tr>
              <tr><td><code>type</code></td><td>string</td><td><code>verification</code>, <code>password_reset</code>, <code>login_link</code> or <code>general</code></td></tr>
              <tr><td><code>code</code></td><td>string | null</td><td>Extracted one-time code</td></tr>
              <tr><td><code>codes</code></td><td>array</td><td>All candidates, most confident first</td></tr>
              <tr><td><code>action_url</code></td><td>string | null</td><td>The one link worth opening for this message type</td></tr>
              <tr><td><code>links</code></td><td>array</td><td>Every link with its anchor text; list-management links are flagged <code>unsubscribe</code></td></tr>
              <tr><td><code>preview</code></td><td>string</td><td>First 200 characters of the plain-text body</td></tr>
              <tr><td><code>text</code></td><td>string</td><td>Body as plain text — the HTML flattened when there is no text part</td></tr>
              <tr><td><code>text_body</code> / <code>html_body</code></td><td>string</td><td>Raw MIME parts, unchanged</td></tr>
            </tbody>
          </table>

          <h4>Example Response</h4>
          <div class="code-block" data-lang="json">
            <button class="copy-button" onclick="copyCode(this)">Copy</button>[
  {
    "id": "a1b2c3d4",
    "inbox": "clever.sunny.butterfly@emptyinbox.me",
    "subject": "Confirm your email address",
    "sender": "Example App <noreply@example.com>",
    "from_name": "Example App",
    "from_email": "noreply@example.com",
    "timestamp": 1711234567,
    "received_at": "2024-03-23T21:36:07Z",
    "type": "verification",
    "code": "482910",
    "codes": ["482910"],
    "action_url": "https://example.com/verify?token=abc123",
    "links": [
      { "url": "https://example.com/verify?token=abc123", "text": "Verify your email" }
    ],
    "preview": "Your verification code is 482910. It expires in 10 minutes.",
    "text": "Your verification code is 482910. It expires in 10 minutes.",
    "text_body": "",
    "html_body": "<p>Your verification code is <strong>482910</strong></p>"
  }
]</div>
        </div>
      </div>

      <!-- Get Message -->
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method method-get">GET</span>
          <span class="endpoint-path">/message/{msgid}</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">
            One message, in the same parsed shape as the list. <code>format=text</code>
            returns the whole mail flattened to text, ready to drop straight into a prompt;
            <code>format=raw</code> returns the untouched stored MIME parts and headers.
          </p>

          <table class="parameter-table">
            <thead><tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
              <tr>
                <td><code>msgid</code></td>
                <td>string</td>
                <td><span class="param-required">Required</span></td>
                <td>Message ID from <code>GET /messages</code></td>
              </tr>
              <tr>
                <td><code>format</code></td>
                <td>string</td>
                <td>Optional</td>
                <td><code>json</code> (default), <code>text</code> or <code>raw</code></td>
              </tr>
            </tbody>
          </table>

          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl "https://emptyinbox.me/api/message/a1b2c3d4?format=text" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <h4>Response Fields</h4>
          <p class="endpoint-description">
            Same fields as <code>GET /messages</code>, plus <code>headers</code> — the raw
            email headers, which the listing omits because DKIM and ARC signature blobs run
            to kilobytes per message. <code>format=raw</code> instead returns <code>recipients</code>,
            <code>headers</code>, <code>text_body</code>, <code>html_body</code> and
            <code>sender</code> exactly as delivered.
          </p>

          <h4>Example Response (format=text)</h4>
          <div class="code-block" data-lang="text">
            <button class="copy-button" onclick="copyCode(this)">Copy</button>From: Example App &lt;noreply@example.com&gt;
To: clever.sunny.butterfly@emptyinbox.me
Date: 2024-03-23T21:36:07Z
Subject: Confirm your email address
Code: 482910
Action URL: https://example.com/verify?token=abc123

Your verification code is 482910. It expires in 10 minutes.</div>

          <p><span class="status-code status-404">404 Not Found</span> – Message not found</p>
        </div>
      </div>
    </div>

    <!-- Error Codes Section -->
    <div class="docs-section">
      <h2>
        <div class="section-icon">⚠️</div>
        Error Codes
      </h2>

      <table class="parameter-table">
        <thead>
          <tr><th>Status</th><th>Description</th><th>Common Causes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="status-code status-401">401</span></td>
            <td>Unauthorized</td>
            <td>Missing or invalid API key</td>
          </tr>
          <tr>
            <td><span class="status-code status-402">402</span></td>
            <td>Payment Required</td>
            <td>Inbox quota exhausted &mdash; buy more via POST /payments/quote</td>
          </tr>
          <tr>
            <td><span class="status-code status-404">404</span></td>
            <td>Not Found</td>
            <td>Message ID doesn't exist</td>
          </tr>
          <tr>
            <td><span class="status-code status-429">429</span></td>
            <td>Too Many Requests</td>
            <td>Registration rate limit exceeded (3 per IP per 24 hours)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Rate Limits Section -->
    <div class="docs-section">
      <h2>
        <div class="section-icon">⏱️</div>
        Limits & Notes
      </h2>
      <div class="auth-info">
        <ul style="margin-left: 1.5rem; color: var(--color-text-secondary);">
          <li style="margin-bottom: 0.5rem;">All accounts start with <strong>5 inbox quota</strong></li>
          <li style="margin-bottom: 0.5rem;">Creating an inbox consumes 1 quota unit — agents buy more with Bitcoin via <code>POST /api/payments/quote</code>; humans at <a href="/inboxes.html" style="color: var(--color-primary);">emptyinbox.me/inboxes.html</a></li>
          <li style="margin-bottom: 0.5rem;">Messages are automatically deleted after <strong>7 days</strong></li>
          <li style="margin-bottom: 0.5rem;">Registration is limited to <strong>3 new accounts per IP per 24 hours</strong></li>
          <li>Full OpenAPI 3.1 spec available at <a href="/openapi.yaml" style="color: var(--color-primary);">/openapi.yaml</a></li>
        </ul>
      </div>
    </div>
  `;

  main.appendChild(container);
  document.body.appendChild(main);

  initializeCopyButtons();
}

function copyCode(button) {
  const codeBlock = button.parentNode;
  const code = codeBlock.textContent.replace('Copy', '').trim();

  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = 'var(--color-primary-soft-strong)';
    button.style.color = 'var(--color-primary)';

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = 'oklch(1 0 0 / 0.07)';
      button.style.color = 'oklch(0.62 0.01 248)';
    }, 2000);
  });
}

function initializeCopyButtons() {
  window.copyCode = copyCode;
}
