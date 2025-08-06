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
      <div class="quota-info">
        <span class="quota-label">Inbox Quota:</span>
        <span id="user-quota" class="quota-value">Loading...</span>
        <button id="buy-quota-btn" class="buy-quota-btn">Buy More Quota</button>
      </div>
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
  let currentPaymentId = null;

  // Create modal and append to body (not inside header)
  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.className = 'payment-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h3>Buy Inbox Quota</h3>
        <p>Rate: 10 quota = 1 USDT</p>
        
        <div class="payment-form">
          <label for="usdt-amount">USDT Amount:</label>
          <input type="number" id="usdt-amount" min="1" step="0.1" value="1">
          <p>You will get: <span id="quota-preview">10</span> quota</p>
          
          <button id="create-payment-btn" class="primary-btn">Create Payment</button>
        </div>

        <div id="payment-instructions" style="display: none;">
          <h4>Payment Instructions</h4>
          <p><strong>Send USDT to:</strong></p>
          <p id="payment-address" class="address-display"></p>
          <p><strong>Amount:</strong> <span id="payment-amount"></span> USDT</p>
          <p><strong>Network:</strong> Ethereum (or testnet)</p>
          
          <div class="verification-section">
            <label for="tx-hash">Transaction Hash:</label>
            <input type="text" id="tx-hash" placeholder="0x...">
            <button id="verify-payment-btn" class="primary-btn">Verify Payment</button>
          </div>
          
          <p class="payment-id">Payment ID: <span id="current-payment-id"></span></p>
        </div>

        <div id="payment-success" style="display: none;">
          <h4>✅ Payment Successful!</h4>
          <p>Your quota has been updated.</p>
          <button id="close-modal-btn" class="primary-btn">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }

  // Open modal
  buyBtn?.addEventListener('click', () => {
    let modal = document.getElementById('payment-modal');
    if (!modal) {
      modal = createModal();
      setupModalEvents(modal);
    }
    modal.style.display = 'block';
    resetModal();
  });

  function setupModalEvents(modal) {
    const closeBtn = modal.querySelector('.close-modal');
    const usdtInput = modal.querySelector('#usdt-amount');
    const quotaPreview = modal.querySelector('#quota-preview');
    const createPaymentBtn = modal.querySelector('#create-payment-btn');
    const verifyPaymentBtn = modal.querySelector('#verify-payment-btn');
    const closeModalBtn = modal.querySelector('#close-modal-btn');

    // Close modal
    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    closeModalBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
      location.reload(); // Refresh to update quota display
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Update quota preview
    usdtInput?.addEventListener('input', () => {
      const amount = parseFloat(usdtInput.value) || 0;
      quotaPreview.textContent = Math.floor(amount * 10);
    });

    // Create payment
    createPaymentBtn?.addEventListener('click', async () => {
      const amount = parseFloat(usdtInput.value);
      if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      try {
        const apiKey = localStorage.getItem('apiKey');
        const response = await fetch(`${API_BASE_URL}/api/payments/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            amount_usdt: amount
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          currentPaymentId = data.payment_id;
          showPaymentInstructions(data);
        } else {
          alert('Error: ' + data.error);
        }
      } catch (error) {
        alert('Network error: ' + error.message);
      }
    });

    // Verify payment
    verifyPaymentBtn?.addEventListener('click', async () => {
      const txHash = modal.querySelector('#tx-hash').value;
      if (!txHash || !currentPaymentId) {
        alert('Please enter transaction hash');
        return;
      }

      try {
        const apiKey = localStorage.getItem('apiKey');
        const response = await fetch(`${API_BASE_URL}/api/payments/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            payment_id: currentPaymentId,
            tx_hash: txHash
          })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          showPaymentSuccess();
        } else {
          alert('Verification failed: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Network error: ' + error.message);
      }
    });

    function resetModal() {
      modal.querySelector('#payment-instructions').style.display = 'none';
      modal.querySelector('#payment-success').style.display = 'none';
      modal.querySelector('.payment-form').style.display = 'block';
      modal.querySelector('#tx-hash').value = '';
      currentPaymentId = null;
    }

    function showPaymentInstructions(paymentData) {
      modal.querySelector('.payment-form').style.display = 'none';
      modal.querySelector('#payment-instructions').style.display = 'block';
      
      modal.querySelector('#payment-address').textContent = paymentData.recipient_address;
      modal.querySelector('#payment-amount').textContent = paymentData.amount_usdt;
      modal.querySelector('#current-payment-id').textContent = paymentData.payment_id;
    }

    function showPaymentSuccess() {
      modal.querySelector('#payment-instructions').style.display = 'none';
      modal.querySelector('#payment-success').style.display = 'block';
    }
  }
}
