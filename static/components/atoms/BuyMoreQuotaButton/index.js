import { QUOTA_PER_USDT } from "../../../utils/constants.js";

export function renderBuyQuotaButton(currentQuota, maxQuota) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `<button id="buy-quota-btn" class="buy-quota-btn">Buy Inboxes</button>`;

  setTimeout(() => {
    setupPaymentModal(currentQuota, maxQuota);
  }, 0);

  return wrapper;
}

function setupPaymentModal(currentQuota, maxQuota) {
  const buyBtn = document.getElementById("buy-quota-btn");

  function createModal() {
    const modal = document.createElement("div");
    modal.id = "payment-modal";
    modal.className = "payment-modal";
    modal.style.display = "none";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "qm-title");

    modal.innerHTML = `
      <div class="qm-shell">

        <!-- Step 1: Select -->
        <div class="modal-step" id="step-select">
          <div class="qm-header">
            <div>
              <h2 id="qm-title" class="qm-title">Purchase Inboxes</h2>
              <p class="qm-subtitle">${currentQuota} of ${maxQuota} used</p>
            </div>
            <button class="close-modal" aria-label="Close">&times;</button>
          </div>

          <div class="qm-body">
            <div class="qm-field">
              <label class="qm-label" for="quota-amount">Quantity</label>
              <div class="qm-input-row">
                <input type="number" id="quota-amount" class="qm-input" min="10" step="10" value="100">
                <span class="qm-unit">inboxes</span>
              </div>
            </div>

            <div class="qm-chips">
              <button class="qm-chip" data-quota="10">10</button>
              <button class="qm-chip" data-quota="50">50</button>
              <button class="qm-chip" data-quota="100">100</button>
              <button class="qm-chip" data-quota="500">500</button>
            </div>

            <div class="qm-total-row">
              <span class="qm-total-label">Total</span>
              <span class="qm-total-value"><span id="usdt-cost">10.00</span> USDT</span>
            </div>

            <p class="qm-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              10 inboxes = 1 USDT &nbsp;&middot;&nbsp; requires a Web3 wallet
            </p>

            <div id="select-error" class="qm-error hidden"></div>

            <button id="proceed-payment-btn" class="btn btn-primary btn-full">Continue</button>
          </div>
        </div>

        <!-- Step 2: Confirm -->
        <div class="modal-step hidden" id="step-confirm">
          <div class="qm-header">
            <button id="back-to-select" class="modal-back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <button class="close-modal" aria-label="Close">&times;</button>
          </div>

          <div class="qm-body">
            <h2 class="qm-title">Order summary</h2>

            <div class="qm-receipt">
              <div class="qm-receipt-row">
                <span id="confirm-slots">100 inboxes</span>
                <span id="confirm-unit-cost" class="qm-receipt-muted">10 × 0.10 USDT</span>
              </div>
              <div class="qm-receipt-divider"></div>
              <div class="qm-receipt-row qm-receipt-total">
                <span>Total due</span>
                <span id="confirm-cost">10.00 USDT</span>
              </div>
            </div>

            <p class="qm-hint">Inboxes are available once your transaction confirms on-chain — usually within 1–2 minutes.</p>

            <button id="pay-now-btn" class="btn btn-primary btn-full">Pay with USDT</button>
          </div>
        </div>

        <!-- Step 3: Pay -->
        <div class="modal-step hidden" id="step-pay">
          <div class="qm-header">
            <button id="back-to-confirm" class="modal-back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <button class="close-modal" aria-label="Close">&times;</button>
          </div>

          <div class="qm-body">
            <web3-payment
              id="web3-payment-widget"
              order_amount="10"
              receive_address="0x5C0ed91604E92D7f488d62058293ce603BCC68eF"
              redirect_url="/inboxes.html?payment=success"
            ></web3-payment>
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
    document.body.style.overflow = "hidden";
  });

  function setupModalEvents(modal) {
    const quotaInput = modal.querySelector("#quota-amount");
    const usdtCost = modal.querySelector("#usdt-cost");
    const chips = modal.querySelectorAll(".qm-chip");
    const proceedBtn = modal.querySelector("#proceed-payment-btn");
    const selectError = modal.querySelector("#select-error");
    const stepSelect = modal.querySelector("#step-select");
    const stepConfirm = modal.querySelector("#step-confirm");
    const stepPay = modal.querySelector("#step-pay");
    const confirmSlots = modal.querySelector("#confirm-slots");
    const confirmUnitCost = modal.querySelector("#confirm-unit-cost");
    const confirmCost = modal.querySelector("#confirm-cost");
    const paymentWidget = modal.querySelector("#web3-payment-widget");

    function closeModal() {
      modal.style.display = "none";
      document.body.style.overflow = "";
      resetModal();
    }

    modal.querySelectorAll(".close-modal").forEach(btn =>
      btn.addEventListener("click", closeModal)
    );
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display !== "none") closeModal();
    });

    function snapToMultiple(val) {
      return Math.max(10, Math.round(Math.max(0, val) / 10) * 10);
    }

    function getQty() { return parseInt(quotaInput.value) || 0; }

    function updateCost() {
      const cost = getQty() / QUOTA_PER_USDT;
      usdtCost.textContent = cost.toFixed(2);
      paymentWidget?.setAttribute("order_amount", cost.toString());
    }

    quotaInput.addEventListener("input", () => {
      selectError.classList.add("hidden");
      updateCost();
      const qty = getQty();
      chips.forEach(c => c.classList.toggle("active", parseInt(c.dataset.quota) === qty));
    });

    quotaInput.addEventListener("blur", () => {
      quotaInput.value = snapToMultiple(getQty());
      updateCost();
    });

    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        quotaInput.value = chip.dataset.quota;
        updateCost();
        selectError.classList.add("hidden");
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
      });
    });

    // Step 1 → Step 2
    proceedBtn.addEventListener("click", () => {
      const qty = snapToMultiple(getQty());
      quotaInput.value = qty;
      updateCost();

      if (qty < 10) {
        selectError.textContent = "Minimum purchase is 10 inboxes.";
        selectError.classList.remove("hidden");
        return;
      }

      const cost = qty / QUOTA_PER_USDT;
      confirmSlots.textContent = `${qty} inboxes`;
      confirmUnitCost.textContent = `${qty} × 0.10 USDT`;
      confirmCost.textContent = `${cost.toFixed(2)} USDT`;
      stepSelect.classList.add("hidden");
      stepConfirm.classList.remove("hidden");
    });

    // Step 2 → Step 1
    modal.querySelector("#back-to-select").addEventListener("click", () => {
      stepConfirm.classList.add("hidden");
      stepSelect.classList.remove("hidden");
    });

    // Step 2 → Step 3
    modal.querySelector("#pay-now-btn").addEventListener("click", () => {
      const qty = getQty();
      const cost = qty / QUOTA_PER_USDT;
      paymentWidget.setAttribute("order_amount", cost.toString());
      const redirect = paymentWidget.getAttribute("redirect_url");
      if (!redirect.includes("&quota=")) {
        paymentWidget.setAttribute("redirect_url", `${redirect}&quota=${qty}`);
      }
      stepConfirm.classList.add("hidden");
      stepPay.classList.remove("hidden");
    });

    // Step 3 → Step 2
    modal.querySelector("#back-to-confirm").addEventListener("click", () => {
      stepPay.classList.add("hidden");
      stepConfirm.classList.remove("hidden");
    });

    function resetModal() {
      stepSelect.classList.remove("hidden");
      stepConfirm.classList.add("hidden");
      stepPay.classList.add("hidden");
      quotaInput.value = "100";
      updateCost();
      selectError.classList.add("hidden");
      chips.forEach(c => c.classList.remove("active"));
      modal.querySelector('[data-quota="100"]')?.classList.add("active");
      paymentWidget.setAttribute("redirect_url", "/inboxes.html?payment=success");
    }

    // Init
    quotaInput.value = "100";
    updateCost();
    modal.querySelector('[data-quota="100"]')?.classList.add("active");
  }
}
