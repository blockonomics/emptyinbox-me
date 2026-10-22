import { API_BASE_URL } from "../../../utils/constants.js";
import { formatCredits, getCreditBalance } from "../../../utils/credits.js";

export function renderBuyQuotaButton() {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `<button id="buy-quota-btn" class="buy-quota-btn">Buy credits</button>`;

  setTimeout(() => {
    setupPaymentModal();
  }, 0);

  return wrapper;
}

// Read on every open, not when the modal is built: the modal outlives the
// header, and the balance moves as inboxes are created and kept.
function balanceLine() {
  const n = getCreditBalance();
  return `${n !== null ? `${formatCredits(n)} left · ` : ""}1 credit = 1 inbox for 30 days`;
}

const HINT_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

const METHOD_HINTS = {
  btc: "Any Bitcoin wallet &nbsp;&middot;&nbsp; credited within seconds of sending",
  usdt: "USDT on Ethereum &nbsp;&middot;&nbsp; needs a browser wallet such as MetaMask",
};

function setupPaymentModal() {
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
              <h2 id="qm-title" class="qm-title">Buy credits</h2>
              <p class="qm-subtitle" id="qm-balance"></p>
            </div>
            <button class="close-modal" aria-label="Close">&times;</button>
          </div>

          <div class="qm-body">
            <div class="qm-field">
              <span class="qm-label">Bundle</span>
              <div class="qm-bundles" id="bundles"></div>
            </div>

            <div class="qm-field">
              <span class="qm-label">Pay with</span>
              <div class="qm-methods" role="radiogroup" aria-label="Payment method">
                <button class="qm-method active" data-method="btc" role="radio" aria-checked="true">Bitcoin</button>
                <button class="qm-method" data-method="usdt" role="radio" aria-checked="false">USDT</button>
              </div>
            </div>

            <div class="qm-total-row">
              <span class="qm-total-label">Total</span>
              <span class="qm-total-value" id="total">—</span>
            </div>

            <p class="qm-hint">${HINT_ICON}<span id="method-hint">${METHOD_HINTS.btc}</span></p>

            <div id="select-error" class="qm-error hidden"></div>

            <button id="proceed-payment-btn" class="btn btn-primary btn-full" disabled>Continue</button>
          </div>
        </div>

        <!-- Step 2: Confirm (USDT) -->
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
                <span id="confirm-slots">50 credits</span>
                <span id="confirm-bundle" class="qm-receipt-muted">starter bundle</span>
              </div>
              <div class="qm-receipt-divider"></div>
              <div class="qm-receipt-row qm-receipt-total">
                <span>Total due</span>
                <span id="confirm-cost">5.00 USDT</span>
              </div>
            </div>

            <p class="qm-hint">Credits are added once your transaction confirms on-chain — usually within 1–2 minutes.</p>

            <button id="pay-now-btn" class="btn btn-primary btn-full">Pay with USDT</button>
          </div>
        </div>

        <!-- Step 3: Pay (USDT) -->
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
              order_amount="5"
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
    modal.querySelector("#qm-balance").textContent = balanceLine();
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  });

  function setupModalEvents(modal) {
    const bundlesEl = modal.querySelector("#bundles");
    const methodBtns = modal.querySelectorAll(".qm-method");
    const total = modal.querySelector("#total");
    const methodHint = modal.querySelector("#method-hint");
    const proceedBtn = modal.querySelector("#proceed-payment-btn");
    const selectError = modal.querySelector("#select-error");
    const stepSelect = modal.querySelector("#step-select");
    const stepConfirm = modal.querySelector("#step-confirm");
    const stepPay = modal.querySelector("#step-pay");
    const confirmSlots = modal.querySelector("#confirm-slots");
    const confirmBundle = modal.querySelector("#confirm-bundle");
    const confirmCost = modal.querySelector("#confirm-cost");
    const paymentWidget = modal.querySelector("#web3-payment-widget");

    // One price list for both coins, loaded from the server so the modal
    // never drifts from what a payment is actually credited at. Bitcoin is
    // the default: it works from any wallet, where USDT needs a browser one.
    let bundles = [];
    let defaultBundle = null;
    let bundle = null;
    let method = "btc";

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

    function showError(text) {
      selectError.textContent = text;
      selectError.classList.remove("hidden");
    }

    function render() {
      bundlesEl.querySelectorAll(".qm-bundle").forEach(el =>
        el.classList.toggle("active", el.dataset.id === bundle?.id)
      );
      methodBtns.forEach(b => {
        const on = b.dataset.method === method;
        b.classList.toggle("active", on);
        b.setAttribute("aria-checked", String(on));
      });
      total.textContent = !bundle ? "—" : method === "btc" ? `$${bundle.usd}` : `${bundle.usd.toFixed(2)} USDT`;
      methodHint.innerHTML = METHOD_HINTS[method];
      proceedBtn.disabled = !bundle;
    }

    methodBtns.forEach(b => b.addEventListener("click", () => {
      method = b.dataset.method;
      selectError.classList.add("hidden");
      render();
    }));

    async function loadBundles() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/bundles`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        bundles = data.bundles;
        bundlesEl.innerHTML = bundles.map(b => `
          <button class="qm-bundle" data-id="${b.id}">
            <span class="qm-bundle-qty">${b.quota} credits</span>
            <span class="qm-bundle-price">$${b.usd}</span>
          </button>`).join("");
        bundlesEl.querySelectorAll(".qm-bundle").forEach((el, i) =>
          el.addEventListener("click", () => {
            bundle = bundles[i];
            selectError.classList.add("hidden");
            render();
          })
        );
        defaultBundle = bundles.find(b => b.id === data.default) || bundles[0];
        bundle = defaultBundle;
        render();
      } catch {
        showError("Could not load prices. Close this and try again in a moment.");
      }
    }

    async function payWithBitcoin() {
      proceedBtn.disabled = true;
      proceedBtn.textContent = "Creating payment…";
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ bundle: bundle.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.pay_url) throw new Error(data.error || data.message || "");
        // The pay page polls for the credit itself and links back here.
        window.location.href = `${data.pay_url}&from=web`;
      } catch (e) {
        showError(e.message || "Could not create the payment. Try again in a moment.");
        proceedBtn.disabled = false;
        proceedBtn.textContent = "Continue";
      }
    }

    // Step 1 → Bitcoin pay page, or Step 2 for USDT
    proceedBtn.addEventListener("click", () => {
      if (!bundle) return;
      if (method === "btc") return payWithBitcoin();

      confirmSlots.textContent = `${bundle.quota} credits`;
      confirmBundle.textContent = `${bundle.id} bundle`;
      confirmCost.textContent = `${bundle.usd.toFixed(2)} USDT`;
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
      paymentWidget.setAttribute("order_amount", bundle.usd.toString());
      paymentWidget.setAttribute("redirect_url", `/inboxes.html?payment=success&quota=${bundle.quota}`);
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
      selectError.classList.add("hidden");
      paymentWidget.setAttribute("redirect_url", "/inboxes.html?payment=success");
      proceedBtn.textContent = "Continue";
      bundle = defaultBundle;
      method = "btc";
      render();
    }

    // Init
    loadBundles();
  }
}
