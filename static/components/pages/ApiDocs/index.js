export function renderApiDocsPage() {
  const main = document.createElement('main');

  const container = document.createElement('div');
  container.classList.add('api-docs-page');

  container.innerHTML = `
    <!-- Header Section -->
    <div class="docs-header">
      <h1>API Documentation</h1>
      <p>Build powerful integrations with EmptyInbox.me's simple REST API. Create temporary email addresses, retrieve messages, and manage inboxes programmatically.</p>
      <div class="base-url">
        Base URL: https://emptyinbox.me/api
      </div>
    </div>

    <!-- Authentication Section -->
    <div class="docs-section">
      <h2>
        <div class="section-icon">🔐</div>
        Authentication
      </h2>
      <div class="auth-info">
        <h3>API Key Authentication</h3>
        <p>All API requests require authentication using your API key. Include your API key in the Authorization header:</p>
        <div class="code-block" data-lang="http">Authorization: Bearer YOUR_API_KEY</div>
        <p><strong>Note:</strong> You can obtain your API key by connecting your wallet and signing in through the web interface.</p>
      </div>
    </div>

    <!-- Endpoints Section -->
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
          <p class="endpoint-description">Creates a new temporary email inbox. Each inbox is assigned a unique email address that can receive messages.</p>
          
          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl -X POST "https://emptyinbox.me/api/inbox" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <div class="response-example">
            <h4>Response</h4>
            <p><span class="status-code status-201">201 Created</span> - Returns the generated email address</p>
            <div class="code-block" data-lang="text">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>clever.sunny.butterfly@emptyinbox.me</div>
            
            <p><span class="status-code status-403">403 Forbidden</span> - Insufficient inbox quota</p>
            <div class="code-block" data-lang="text">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>Insufficient Inbox quota</div>
          </div>
        </div>
      </div>

      <!-- Get Inboxes -->
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method method-get">GET</span>
          <span class="endpoint-path">/inboxes</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">Retrieves all email addresses associated with your account.</p>
          
          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl -X GET "https://emptyinbox.me/api/inboxes" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <div class="response-example">
            <h4>Response</h4>
            <p><span class="status-code status-200">200 OK</span></p>
            <div class="code-block" data-lang="json">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>[
  "clever.sunny.butterfly@emptyinbox.me",
  "quick.blue.elephant@emptyinbox.me"
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

      <!-- Get Messages -->
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method method-get">GET</span>
          <span class="endpoint-path">/messages</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">Retrieves a list of all messages across all your inboxes, including message IDs, inbox addresses, and subjects.</p>
          
          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl -X GET "https://emptyinbox.me/api/messages" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <div class="response-example">
            <h4>Response</h4>
            <p><span class="status-code status-200">200 OK</span></p>
            <div class="code-block" data-lang="json">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>[
  {
    "id": "a1b2c3d4",
    "inbox": "clever.sunny.butterfly@emptyinbox.me",
    "subject": "Welcome to our service"
  },
  {
    "id": "e5f6g7h8",
    "inbox": "quick.blue.elephant@emptyinbox.me", 
    "subject": "Password Reset Request"
  }
]</div>
          </div>
        </div>
      </div>

      <!-- Get Message -->
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method method-get">GET</span>
          <span class="endpoint-path">/message/{msgid}</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-description">Retrieves the full content of a specific message by its ID.</p>
          
          <table class="parameter-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>msgid</code></td>
                <td>string</td>
                <td><span class="param-required">Required</span></td>
                <td>The unique identifier of the message</td>
              </tr>
            </tbody>
          </table>

          <div class="response-example">
            <h4>Example Request</h4>
            <div class="code-block" data-lang="curl">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>curl -X GET "https://emptyinbox.me/api/message/a1b2c3d4" \\
  -H "Authorization: Bearer YOUR_API_KEY"</div>
          </div>

          <div class="response-example">
            <h4>Response</h4>
            <p><span class="status-code status-200">200 OK</span> - Returns the complete email data as JSON</p>
            <div class="code-block" data-lang="json">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>{
  "recipients": ["clever.sunny.butterfly@emptyinbox.me"],
  "headers": {
    "Subject": "Welcome to our service",
    "From": "noreply@example.com",
    "Date": "Mon, 1 Jan 2024 10:00:00 +0000"
  },
  "content": "Welcome! Thank you for signing up..."
}</div>
            
            <p><span class="status-code status-404">404 Not Found</span> - Message doesn't exist</p>
            <div class="code-block" data-lang="text">
              <button class="copy-button" onclick="copyCode(this)">Copy</button>msgid doesn't exist</div>
          </div>
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
          <tr>
            <th>Status Code</th>
            <th>Description</th>
            <th>Common Causes</th>
          </tr>
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
            <td>Insufficient quota or access denied</td>
          </tr>
          <tr>
            <td><span class="status-code status-404">404</span></td>
            <td>Not Found</td>
            <td>Message ID doesn't exist</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Rate Limits Section -->
    <div class="docs-section">
      <h2>
        <div class="section-icon">⏱️</div>
        Rate Limits & Usage
      </h2>
      <div class="auth-info">
        <h3>Important Notes</h3>
        <ul style="margin-left: 1.5rem; color: #6b7280;">
          <li style="margin-bottom: 0.5rem;">Each account has a limited inbox quota</li>
          <li style="margin-bottom: 0.5rem;">Creating inboxes consumes quota from your account</li>
          <li style="margin-bottom: 0.5rem;">Messages are ordered by timestamp (newest first)</li>
          <li>Email addresses are automatically generated using random adjectives and nouns</li>
        </ul>
      </div>
    </div>
  `;

  main.appendChild(container);
  document.body.appendChild(main);

  // Initialize copy functionality
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
  // Make copyCode function available globally for the onclick handlers
  window.copyCode = copyCode;
}