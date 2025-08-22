import { QUOTA_PER_USDT } from "../../../utils/constants.js";

export function renderBuyQuotaButton() {
  const header = document.createElement("div");
  header.innerHTML = `
    <button id="buy-quota-btn" class="buy-quota-btn">Buy More Quota</button>
  `;

  // Add event listeners
  setTimeout(() => {
    setupPaymentModal();
  }, 0);

  return header;
}

function setupPaymentModal() {
  const buyBtn = document.getElementById("buy-quota-btn");

  function createModal() {
    const modal = document.createElement("div");
    modal.id = "payment-modal";
    modal.className = "payment-modal";
    modal.style.display = "none";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>💳 Buy Quota</h2>
          <button class="close-modal">&times;</button>
        </div>
        
        <div class="quota-selection">
          <div class="amount-section">
            <label class="amount-label">How much quota do you need?</label>
            <div class="amount-input-wrapper">
              <input type="number" id="quota-amount" min="10" step="10" value="100" class="amount-input">
              <span class="unit-label">quota</span>
            </div>
          </div>

          <div class="cost-display">
            <div class="cost-breakdown">
              <span class="cost-label">Total Cost</span>
              <span class="cost-value"><span id="usdt-cost">10.00</span> USDT</span>
            </div>
            <div class="rate-hint">10 quota = 1 USDT</div>
          </div>

          <div class="preset-grid">
            <button class="preset-card" data-quota="10">
              <div class="preset-amount">10</div>
              <div class="preset-cost">$1</div>
            </button>
            <button class="preset-card" data-quota="50">
              <div class="preset-amount">50</div>
              <div class="preset-cost">$5</div>
            </button>
            <button class="preset-card active" data-quota="100">
              <div class="preset-amount">100</div>
              <div class="preset-cost">$10</div>
            </button>
            <button class="preset-card" data-quota="500">
              <div class="preset-amount">500</div>
              <div class="preset-cost">$50</div>
            </button>
          </div>
        </div>

        <div class="payment-section">
          <button id="proceed-payment-btn" class="proceed-btn">
            <span class="btn-icon">🚀</span>
            Continue to Payment
          </button>
          <div id="payment-widget-container" style="display:none;">
            <script src="https://blockonomics.co/js/web3-payment.js"></script>
            <web3-payment
              id="web3-payment-widget"
              order_amount="10"
              receive_address="0x5C0ed91604E92D7f488d62058293ce603BCC68eF"
              redirect_url="/inboxes.html?payment=success"
              testnet="0">
            </web3-payment>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  buyBtn?.addEventListener("click", () => {
    let modal = document.getElementById("payment-modal");
    if (!modal) {
      modal = createModal();
      setupModalEvents(modal);
    }
    modal.style.display = "flex";
  });

  function setupModalEvents(modal) {
    const closeBtn = modal.querySelector(".close-modal");
    const quotaInput = modal.querySelector("#quota-amount");
    const usdtCost = modal.querySelector("#usdt-cost");
    const presetBtns = modal.querySelectorAll(".preset-card");
    const proceedBtn = modal.querySelector("#proceed-payment-btn");
    const paymentContainer = modal.querySelector("#payment-widget-container");

    // Close modal events
    closeBtn?.addEventListener("click", () => {
      modal.style.display = "none";
      resetModal();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
        resetModal();
      }
    });

    // Calculate cost function
    function updateCost() {
      const quotaAmount = parseInt(quotaInput.value) || 0;
      const cost = quotaAmount / QUOTA_PER_USDT;
      usdtCost.textContent = cost.toFixed(2);

      // Update the web3-payment widget amount
      const paymentWidget = modal.querySelector("web3-payment");
      if (paymentWidget) {
        paymentWidget.setAttribute("order_amount", cost.toString());
      }
    }

    // Input change event
    quotaInput?.addEventListener("input", updateCost);

    // Preset button events
    presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const quotaAmount = btn.dataset.quota;
        quotaInput.value = quotaAmount;
        updateCost();

        // Remove active class from all buttons
        presetBtns.forEach((b) => b.classList.remove("active"));
        // Add active class to clicked button
        btn.classList.add("active");
      });
    });

    // Proceed to payment
    proceedBtn?.addEventListener("click", () => {
      const quotaAmount = parseInt(quotaInput.value);

      if (!quotaAmount || quotaAmount < 10) {
        alert("Please enter a valid quota amount (minimum 10)");
        return;
      }

      // Hide the selection section and show payment widget
      modal.querySelector(".quota-selection").style.display = "none";
      proceedBtn.style.display = "none";
      paymentContainer.style.display = "block";

      // Update the redirect URL to include the quota amount
      const paymentWidget = modal.querySelector("web3-payment");
      const currentRedirect = paymentWidget.getAttribute("redirect_url");
      const newRedirect = `${currentRedirect}&quota=${quotaAmount}`;
      paymentWidget.setAttribute("redirect_url", newRedirect);
    });

    function resetModal() {
      // Reset the modal to initial state
      modal.querySelector(".quota-selection").style.display = "block";
      proceedBtn.style.display = "block";
      paymentContainer.style.display = "none";
      quotaInput.value = "10";
      updateCost();
      presetBtns.forEach((b) => b.classList.remove("active"));
    }

    // Initialize with default selection
    quotaInput.value = "100";
    updateCost();
    const defaultPreset = modal.querySelector('[data-quota="100"]');
    if (defaultPreset) defaultPreset.classList.add("active");
  }
}
