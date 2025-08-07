import { API_BASE_URL } from '../../../utils/constants.js';

export function renderHeader() {
  const header = document.createElement('div');
  header.classList.add('dashboard-header');
  header.innerHTML = `
    <h1>Welcome to your Dashboard</h1>
    <div class="user-info">
      <div class="wallet-info">
        <span class="wallet-label">Connected Wallet:</span>
        <span id="user-address" class="wallet-address">Loading...</span>
      </div>
      <button id="buy-quota-btn" class="buy-quota-btn">Buy More Quota</button>
      <button id="logout-btn" class="logout-btn">Disconnect</button>
    </div>
  `;

  // Add event listeners
  setTimeout(() => {
    setupPaymentModal();
  }, 0);

  return header;
}

function setupPaymentModal() {
  const buyBtn = document.getElementById('buy-quota-btn');

  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.className = 'payment-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal" style="cursor:pointer;float:right;">&times;</span>
        <h3>Buy Inbox Quota</h3>
        <p>Rate: 10 quota = 1 USDT</p>
        <script src="https://blockonomics.co/js/web3-payment.js"></script>
        <web3-payment
          order_amount="1"
          receive_address="0x5C0ed91604E92D7f488d62058293ce603BCC68eF"
          redirect_url="/dashboard.html?payment=success"
          testnet="1">
        </web3-payment>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  buyBtn?.addEventListener('click', () => {
    let modal = document.getElementById('payment-modal');
    if (!modal) {
      modal = createModal();
      setupModalEvents(modal);
    }
    modal.style.display = 'block';
  });

  function setupModalEvents(modal) {
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const paymentSuccess = params.get('payment');
  const txhash = params.get('txhash');
  const crypto = params.get('crypto');

  if (paymentSuccess === 'success' && txhash && crypto === 'usdt') {
    // Get the API key from storage
    const apiKey = localStorage.getItem('apiKey');
    
    if (!apiKey) {
      console.error('No API key found in localStorage');
      return;
    }

    console.log('Starting payment monitoring for txhash:', txhash);

    fetch(`${API_BASE_URL}/api/payments/monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Send just the API key without "Bearer" prefix if that's what your backend expects
        'Authorization': apiKey  // or keep 'Bearer ' + apiKey if you fix the backend
      },
      body: JSON.stringify({ txhash })
    })
    .then(res => {
      console.log('Response status:', res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('Monitoring started:', data);
    })
    .catch(err => {
      console.error('Error starting monitoring:', err);
    });
  }
});
