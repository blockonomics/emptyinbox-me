export function renderApiDocsPage() {
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
        <ol style="margin-left: 1.5rem; color: #6b7280; line-height: 2;">
          <li>Call <code>POST /auth/register</code> to get an API key (one-time setup)</li>
          <li>Call <code>POST /inbox</code> to create a disposable address</li>
          <li>Trigger signup/verification using that address</li>
          <li>Poll <code>GET /messages</code> until the email arrives</li>
          <li>Read the code or link from <code>text_body</code></li>
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
        <strong>Humans:</strong> get your key at <a href="/settings.html" style="color: #10b981;">Settings</a>.</p>
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
          <span style="margin-left: auto; font-size: 0.75rem; color: #6b7280; font-family: monospace;">No auth required</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">Create a new account and get an API key. Agent accounts start with 1 inbox quota. Rate limited to 3 registrations per IP per 24 hours.</p>

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
  "inbox_quota": 1
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
  "inbox_quota": 1
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
          <p class="endpoint-description">Creates a new disposable email inbox. Returns the email address as plain text. Each inbox consumes 1 from your quota. Agent accounts start with 1 inbox; human accounts start with 5. Buy more at <a href="/inboxes.html" style="color:#10b981;">emptyinbox.me/inboxes.html</a>.</p>

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
            <p><span class="status-code status-403">403 Forbidden</span> – Insufficient inbox quota</p>
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
            Returns all messages across all inboxes, newest first. Messages are automatically deleted after 7 days. Poll this endpoint after triggering a signup or verification flow.
          </p>

          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl "https://emptyinbox.me/api/messages" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <h4>Response Fields (per message)</h4>
          <table class="parameter-table">
            <thead>
              <tr><th>Field</th><th>Type</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><code>id</code></td><td>string</td><td>Unique message identifier</td></tr>
              <tr><td><code>inbox</code></td><td>string</td><td>Email address that received the message</td></tr>
              <tr><td><code>subject</code></td><td>string</td><td>Email subject line</td></tr>
              <tr><td><code>sender</code></td><td>string</td><td>Sender email address</td></tr>
              <tr><td><code>timestamp</code></td><td>integer</td><td>Unix timestamp</td></tr>
              <tr><td><code>text_body</code></td><td>string</td><td>Plain text body</td></tr>
              <tr><td><code>html_body</code></td><td>string</td><td>HTML body</td></tr>
            </tbody>
          </table>

          <h4>Example Response</h4>
          <div class="code-block" data-lang="json">
            <button class="copy-button" onclick="copyCode(this)">Copy</button>[
  {
    "id": "a1b2c3d4",
    "inbox": "clever.sunny.butterfly@emptyinbox.me",
    "subject": "Confirm your email address",
    "sender": "noreply@example.com",
    "timestamp": 1711234567,
    "text_body": "Your verification code is 482910",
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
            Returns the full content of a specific message including all headers.
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
            </tbody>
          </table>

          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl "https://emptyinbox.me/api/message/a1b2c3d4" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <h4>Response Fields</h4>
          <table class="parameter-table">
            <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td><code>recipients</code></td><td>array</td><td>Recipient email addresses</td></tr>
              <tr><td><code>headers</code></td><td>object</td><td>Raw email headers (Subject, From, Date, etc.)</td></tr>
              <tr><td><code>text_body</code></td><td>string</td><td>Plain text body</td></tr>
              <tr><td><code>html_body</code></td><td>string</td><td>HTML body</td></tr>
              <tr><td><code>sender</code></td><td>string</td><td>Sender email address</td></tr>
            </tbody>
          </table>

          <h4>Example Response</h4>
          <div class="code-block" data-lang="json">
            <button class="copy-button" onclick="copyCode(this)">Copy</button>{
  "recipients": ["clever.sunny.butterfly@emptyinbox.me"],
  "headers": {
    "Subject": "Confirm your email address",
    "From": "noreply@example.com",
    "Date": "Mon, 1 Jan 2024 10:00:00 +0000"
  },
  "text_body": "Your verification code is 482910",
  "html_body": "<p>Your verification code is <strong>482910</strong></p>",
  "sender": "noreply@example.com"
}</div>

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
            <td><span class="status-code status-403">403</span></td>
            <td>Forbidden</td>
            <td>Insufficient inbox quota</td>
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
        <ul style="margin-left: 1.5rem; color: #6b7280;">
          <li style="margin-bottom: 0.5rem;">Agent accounts start with <strong>1 inbox quota</strong>; human accounts start with <strong>5</strong></li>
          <li style="margin-bottom: 0.5rem;">Creating an inbox consumes 1 quota unit — buy more at <a href="/inboxes.html" style="color:#10b981;">emptyinbox.me/inboxes.html</a></li>
          <li style="margin-bottom: 0.5rem;">Messages are automatically deleted after <strong>7 days</strong></li>
          <li style="margin-bottom: 0.5rem;">Registration is limited to <strong>3 new accounts per IP per 24 hours</strong></li>
          <li>Full OpenAPI 3.1 spec available at <a href="/openapi.yaml" style="color:#10b981;">/openapi.yaml</a></li>
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
    button.style.background = 'rgba(16, 185, 129, 0.2)';
    button.style.color = '#10b981';

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = 'rgba(255, 255, 255, 0.1)';
      button.style.color = '#9ca3af';
    }, 2000);
  });
}

function initializeCopyButtons() {
  window.copyCode = copyCode;
}
