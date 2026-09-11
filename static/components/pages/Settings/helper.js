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
  // inbox_quota is the credit balance left, not the count consumed.
  const remaining = Math.max(0, typeof inboxQuota === "number" ? inboxQuota : 0);
  const totalQuota = Math.max(maxQuota, remaining);
  const usedQuota = Math.max(0, totalQuota - remaining);
  const pct = totalQuota > 0 ? Math.min(100, (usedQuota / totalQuota) * 100) : 0;

  const remainingEl = document.getElementById("quota-remaining-display");
  const suffixEl = document.getElementById("quota-suffix");
  const fillEl = document.getElementById("quota-fill");
  const lowCta = document.getElementById("quota-low-cta");

  if (remainingEl) remainingEl.textContent = remaining;
  if (suffixEl) suffixEl.textContent = `of ${totalQuota} inboxes available`;

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
    const isBtc = payment.currency === "BTC";
    const usdValue =
      typeof payment.usd === "number"
        ? payment.usd
        : payment.amount / QUOTA_PER_USDT;
    const cost = isBtc
      ? `$${usdValue.toFixed(2)} in BTC`
      : `${usdValue.toFixed(2)} USDT`;
    const txhash = payment.txhash || "";
    const shortHash = txhash
      ? txhash.slice(0, 10) + "…" + txhash.slice(-6)
      : "—";
    const addr = payment.address || "";
    const txLink = isBtc
      ? `https://www.blockonomics.co/#/search?q=${txhash}${addr ? `&addr=${addr}` : ""}`
      : `https://etherscan.io/tx/${txhash}`;
    const explorer = isBtc ? "Blockonomics" : "Etherscan";
    // Zero-conf credit: quota is already granted, confirmation still pending.
    const pending = isBtc && payment.settled === false;

    const row = document.createElement("div");
    row.className = "billing-row";
    row.innerHTML = `
      <div class="billing-row-left">
        <span class="billing-date">${formattedDate}</span>
        <span class="billing-amount">${payment.amount} inboxes${pending ? " (confirming)" : ""}</span>
      </div>
      <div class="billing-row-right">
        <span class="billing-cost">${cost}</span>
        ${txhash ? `<a href="${txLink}" target="_blank" rel="noopener noreferrer" class="billing-tx" aria-label="View transaction on ${explorer}">${shortHash}</a>` : ""}
      </div>
    `;
    container.appendChild(row);
  });
}
