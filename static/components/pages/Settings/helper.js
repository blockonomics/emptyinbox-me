import { QUOTA_PER_USDT } from "../../../utils/constants.js";

export function updateUserDisplay(userData) {
  const usernameDisplay = document.getElementById("username-display");
  const apiKeyDisplay = document.getElementById("api-key-display");
  const billingContainer = document.getElementById("billing-transactions");

  // 👤 Username
  if (usernameDisplay) {
    usernameDisplay.textContent = userData.username || "Unknown";
  }

  // 🔑 API key
  apiKeyDisplay.textContent = userData.api_key || "Unavailable";

  // 🧾 Billing transactions
  billingContainer.innerHTML = "";
  if (userData.payments && userData.payments.length > 0) {
    userData.payments.forEach((payment) => {
      const date = new Date(payment.created_at);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const quota = payment.amount;
      const usdt = quota / QUOTA_PER_USDT;
      const txhash = payment.txhash;
      const txLink = `https://etherscan.io/tx/${txhash}`;

      const entry = document.createElement("div");
      entry.className = "billing-text";
      entry.innerHTML = `${formattedDate}   ${quota} quota for ${usdt} USDT via <a href="${txLink}" target="_blank" rel="noopener noreferrer">${txhash.slice(0, 24)}...</a>`;
      billingContainer.appendChild(entry);
    });
  } else {
    billingContainer.innerHTML = '<div class="billing-text">No transactions found</div>';
  }
}