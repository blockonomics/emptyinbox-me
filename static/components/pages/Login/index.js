import { API_BASE_URL, LOCAL_STORAGE_KEYS } from "../../../utils/constants.js";

export function renderLoginPage() {
  const main = document.createElement('main');

  const container = document.createElement('div');
  container.classList.add('login-page');

  container.innerHTML = `
    <section class="login">
      <h1>Welcome Back</h1>
      <p>Connect your wallet to continue your journey with EmptyInbox.me</p>
      
      <div class="wallet-connect-section">
        <button id="connect-wallet-btn" type="button" class="wallet-connect-btn">
          <span class="wallet-icon">🔗</span>
          <span class="button-text">Connect Wallet</span>
        </button>
        
        <div id="wallet-status" class="wallet-status hidden">
          <p>Connected: <span id="wallet-address"></span></p>
          <button id="sign-in-btn" type="button" class="sign-in-btn">Sign In</button>
        </div>
        
        <div id="loading" class="loading hidden">
          <p>Connecting to wallet...</p>
        </div>
        
        <div id="error-message" class="error-message hidden">
          <p></p>
        </div>
      </div>

      <div class="supported-wallets">
        <p class="wallet-info">Supported wallets:</p>
        <div class="wallet-icons">
          <span>MetaMask</span>
        </div>
      </div>

      <p class="login-footer">
        New to crypto wallets? <a href="/wallet-guide">Learn how to get started</a>
      </p>
    </section>
  `;

  main.appendChild(container);
  document.body.appendChild(main);
  
  // Initialize wallet connection functionality
  initializeWalletAuth();
}

const requestAccountsWithTimeout = async (timeout = 10000) => {
  return Promise.race([
    window.ethereum.request({ method: 'eth_requestAccounts' }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Wallet unlock timeout')), timeout)
    )
  ]);
};

async function initializeWalletAuth() {
  const connectBtn = document.getElementById('connect-wallet-btn');
  const signInBtn = document.getElementById('sign-in-btn');
  const walletStatus = document.getElementById('wallet-status');
  const walletAddress = document.getElementById('wallet-address');
  const loading = document.getElementById('loading');
  const errorMessage = document.getElementById('error-message');

  let userAddress = null;
  let challenge = null;
  let isConnecting = false;

  // Helper function to update connect button state
  function updateConnectButtonState(state) {
    const buttonText = connectBtn.querySelector('.button-text');
    const walletIcon = connectBtn.querySelector('.wallet-icon');
    
    switch(state) {
      case 'connecting':
        connectBtn.disabled = true;
        buttonText.textContent = 'Connecting...';
        walletIcon.textContent = '⏳';
        connectBtn.classList.add('connecting');
        break;
        
      case 'error':
      case 'idle':
      default:
        connectBtn.disabled = false;
        buttonText.textContent = 'Connect Wallet';
        walletIcon.textContent = '🔗';
        connectBtn.classList.remove('connecting');
        break;
    }
  }

  // Helper function to update sign-in button state
  function updateSignInButtonState(isLoading) {
    signInBtn.disabled = isLoading;
    signInBtn.textContent = isLoading ? 'Signing In...' : 'Sign In';
  }

  // Check if wallet is already connected
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        showConnectedState(accounts[0]);
      }
    } catch (error) {
      console.log('No wallet connected');
    }
  }

  connectBtn.addEventListener('click', async () => {
    if (isConnecting) {
      showError('Connection already in progress. Please wait...');
      return;
    }

    if (!window.ethereum) {
      showError('No crypto wallet detected. Please install MetaMask or another Web3 wallet.');
      return;
    }

    try {
      isConnecting = true;
      updateConnectButtonState('connecting');
      showLoading(true);
      hideError();

      const existingAccounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (existingAccounts.length > 0) {
        showConnectedState(existingAccounts[0]);
        return;
      }

      const accounts = await requestAccountsWithTimeout();
      if (accounts.length > 0) {
        showConnectedState(accounts[0]);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);

      switch (error.code) {
        case -32002:
          showError('Wallet connection request is already pending. Please check your wallet and approve the connection.');
          break;
        case 4001:
          showError('Wallet connection was rejected by user.');
          break;
        case 'TIMEOUT':
          showError('Still waiting for wallet unlock… Please check your MetaMask extension and enter your password.');
          break;
        default:
          showError('Failed to connect wallet: ' + error.message);
      }
    } finally {
      isConnecting = false;
      updateConnectButtonState('idle');
      showLoading(false);
    }
  });

  signInBtn.addEventListener('click', async () => {
    if (!userAddress) return;

    try {
      updateSignInButtonState(true);
      showLoading(true);
      hideError();
      
      // Get challenge from backend
      challenge = await getAuthChallenge(userAddress);
      
      // Sign the challenge
      const signature = await signMessage(challenge.message);
      
      // Verify signature with backend
      const authResult = await verifySignature(userAddress, signature, challenge.message);
      
      if (authResult.success) {
        const { token, api_key: apiKey } = authResult;
        // Store auth token and redirect
        localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, authResult.token);
        localStorage.setItem(LOCAL_STORAGE_KEYS.API_KEY, apiKey);
        window.location.href = '/dashboard.html';
      } else {
        showError('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      if (error.code === 4001) {
        showError('Message signing was rejected by user.');
      } else {
        showError('Sign in failed: ' + error.message);
      }
    } finally {
      updateSignInButtonState(false);
      showLoading(false);
    }
  });

  // Listen for account changes
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        showConnectedState(accounts[0]);
      } else {
        // Wallet disconnected
        userAddress = null;
        connectBtn.classList.remove('hidden');
        walletStatus.classList.add('hidden');
        updateConnectButtonState('idle');
      }
    });

    // Listen for chain changes
    window.ethereum.on('chainChanged', () => {
      // Reload the page when chain changes
      window.location.reload();
    });
  }

  function showConnectedState(address) {
    userAddress = address;
    walletAddress.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
    connectBtn.classList.add('hidden');
    walletStatus.classList.remove('hidden');
    hideError();
  }

  function showLoading(show) {
    loading.classList.toggle('hidden', !show);
  }

  function showError(message) {
    errorMessage.querySelector('p').textContent = message;
    errorMessage.classList.remove('hidden');
  }

  function hideError() {
    errorMessage.classList.add('hidden');
  }
}

async function getAuthChallenge(address) {
  const response = await fetch(`${API_BASE_URL}/api/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  
  if (!response.ok) {
    throw new Error('Failed to get authentication challenge');
  }
  
  return response.json();
}

async function signMessage(message) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return await signer.signMessage(message);
}

async function verifySignature(address, signature, message) {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, message })
  });
  
  if (!response.ok) {
    throw new Error('Failed to verify signature');
  }
  
  return response.json();
}