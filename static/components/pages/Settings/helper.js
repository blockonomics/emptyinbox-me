import { QUOTA_PER_USDT, USER_STARTING_QUOTA } from "../../../utils/constants.js";

export function updateUserDisplay(userData) {
  _renderUsername(userData.username);
  _renderApiKey(userData.api_key);
  _renderQuota(userData.payments, userData.inbox_quota);
  _renderBilling(userData.payments);
}

function _renderUsername(username) {
  const el = document.getElementById("username-display");
  if (el) {
    el.textContent = username || "Unknown";
    el.classList.remove("skeleton-inline");
  }
}

function _renderApiKey(apiKey) {
  const el = document.getElementById("api-key-display");
  if (el) el.textContent = apiKey || "Unavailable";
}

function _renderQuota(payments, inboxQuota) {
  const paymentList = Array.isArray(payments) ? payments : [];
  const maxQuota = paymentList.reduce(
    (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
    USER_STARTING_QUOTA
  );
  const usedQuota = typeof inboxQuota === "number" ? inboxQuota : 0;
  const remaining = Math.max(0, maxQuota - usedQuota);
  const pct = maxQuota > 0 ? Math.min(100, (usedQuota / maxQuota) * 100) : 0;

  const remainingEl = document.getElementById("quota-remaining-display");
  const suffixEl = document.getElementById("quota-suffix");
  const fillEl = document.getElementById("quota-fill");
  const lowCta = document.getElementById("quota-low-cta");

  if (remainingEl) remainingEl.textContent = remaining;
  if (suffixEl) suffixEl.textContent = `of ${maxQuota} inboxes available`;

  if (fillEl) {
    fillEl.style.width = `${pct}%`;
    if (pct >= 100) {
      fillEl.classList.add("quota-fill--danger");
    } else if (pct >= 80) {
      fillEl.classList.add("quota-fill--warning");
    }
  }

  if (lowCta && pct >= 80) {
    lowCta.classList.remove("hidden");
  }
}

function _renderBilling(payments) {
  const container = document.getElementById("billing-transactions");
  if (!container) return;

  const paymentList = Array.isArray(payments) ? payments : [];

  if (paymentList.length === 0) {
    container.innerHTML = `<div class="billing-empty">No transactions yet — <a href="/pricing.html">view pricing</a></div>`;
    return;
  }

  container.innerHTML = "";
  paymentList.forEach((payment) => {
    const date = new Date(payment.created_at);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const usdt = (payment.amount / QUOTA_PER_USDT).toFixed(2);
    const txhash = payment.txhash || "";
    const shortHash = txhash
      ? txhash.slice(0, 10) + "…" + txhash.slice(-6)
      : "—";
    const txLink = `https://etherscan.io/tx/${txhash}`;

    const row = document.createElement("div");
    row.className = "billing-row";
    row.innerHTML = `
      <div class="billing-row-left">
        <span class="billing-date">${formattedDate}</span>
        <span class="billing-amount">${payment.amount} inboxes</span>
      </div>
      <div class="billing-row-right">
        <span class="billing-cost">${usdt} USDT</span>
        ${txhash ? `<a href="${txLink}" target="_blank" rel="noopener noreferrer" class="billing-tx" aria-label="View transaction on Etherscan">${shortHash}</a>` : ""}
      </div>
    `;
    container.appendChild(row);
  });
}
