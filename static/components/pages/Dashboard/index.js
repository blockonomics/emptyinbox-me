import { API_BASE_URL, ROUTES } from "../../../utils/constants.js";

export function renderDashboardPage() {
  const main = document.createElement('main');

  const container = document.createElement('div');
  container.classList.add('container', 'dashboard-page');

  container.innerHTML = `
    <section class="dashboard">
      <div class="dashboard-header">
        <h1>Welcome to your Dashboard</h1>
        <div class="user-info">
          <div class="wallet-info">
            <span class="wallet-label">Connected Wallet:</span>
            <span id="user-address" class="wallet-address">Loading...</span>
          </div>
          <button id="logout-btn" class="logout-btn">Disconnect</button>
        </div>
      </div>

      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>Wallet Address</h3>
          <div id="full-address" class="stat-text">Loading...</div>
        </div>
        <div class="stat-card">
          <h3>Last Login</h3>
          <div id="last-login" class="stat-text">Loading...</div>
        </div>
        <div class="stat-card">
          <h3>Account Status</h3>
          <div class="stat-text">Active</div>
        </div>
      </div>

      <div class="user-profile">
        <h2>Account Information</h2>
        <div class="profile-details">
          <div class="profile-item">
            <label>Wallet Address:</label>
            <div class="profile-value">
              <span id="profile-address">Loading...</span>
              <button id="copy-address-btn" class="copy-btn">Copy</button>
            </div>
          </div>
          <div class="profile-item">
            <label>Login Time:</label>
            <div class="profile-value" id="profile-login-time">Loading...</div>
          </div>
          <div class="profile-item">
            <label>Session Status:</label>
            <div class="profile-value">
              <span class="status-active">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  main.appendChild(container);
  document.body.appendChild(main);
  
  // Initialize dashboard functionality
  initializeDashboard();
}

async function initializeDashboard() {
  const authToken = localStorage.getItem('authToken');
  
  if (!authToken) {
    // Redirect to login if no auth token
    window.location.href = ROUTES.LOGIN;
    return;
  }

  // Load user info
  await loadUserInfo();
  
  // Set up event listeners
  setupEventListeners();
}

async function loadUserInfo() {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const userData = await response.json();
      updateUserDisplay(userData);
    } else {
      throw new Error('Failed to load user info');
    }
  } catch (error) {
    console.error('Error loading user info:', error);
    // If auth fails, redirect to login
    localStorage.removeItem('authToken');
    window.location.href = ROUTES.LOGIN;
  }
}

function updateUserDisplay(userData) {
  const userAddress = document.getElementById('user-address');
  const fullAddress = document.getElementById('full-address');
  const profileAddress = document.getElementById('profile-address');
  const lastLogin = document.getElementById('last-login');
  const profileLoginTime = document.getElementById('profile-login-time');
  
  // Display truncated wallet address in header
  const address = userData.address;
  userAddress.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
  userAddress.title = address; // Show full address on hover
  
  // Display full address in stats and profile
  fullAddress.textContent = address;
  profileAddress.textContent = address;
  
  // Format last login time
  const loginTime = new Date(userData.login_time * 1000);
  const formattedTime = loginTime.toLocaleDateString() + ' ' + loginTime.toLocaleTimeString();
  lastLogin.textContent = formattedTime;
  profileLoginTime.textContent = formattedTime;
}

function setupEventListeners() {
  const logoutBtn = document.getElementById('logout-btn');
  const copyAddressBtn = document.getElementById('copy-address-btn');

  logoutBtn.addEventListener('click', async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      window.location.href = ROUTES.LOGIN;
    }
  });

  copyAddressBtn.addEventListener('click', () => {
    const address = document.getElementById('profile-address').textContent;
    copyToClipboard(address);
  });
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show temporary feedback
    const feedback = document.createElement('div');
    feedback.textContent = 'Address copied to clipboard!';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      document.body.removeChild(feedback);
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}