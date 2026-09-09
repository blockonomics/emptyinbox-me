import { ROUTES } from "../../../utils/constants.js";
import { getIsLoggedIn } from "../../../utils/storage.js";

const CHECK_ICON = `<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;

const MAIL_ICON = `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 5 10-5"/></svg>`;

const BTC_ICON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#F7931A"/><g stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7.4v11.2"/><path d="M9 7.4h4.3a2.6 2.6 0 0 1 0 5.2H9"/><path d="M9 12.6h5a2.7 2.7 0 0 1 0 5.4H9"/><path d="M11 5v2.4M14 5v2.4M11 18.6V21M14 18.6V21"/></g></svg>`;

const USDT_ICON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.4754 10.6182V12.4151C13.003 12.4388 12.5089 12.4518 12.0001 12.4518C11.4474 12.4518 10.9124 12.4367 10.4035 12.4083V10.9736H10.4032V10.6237C7.5798 10.7596 5.48975 11.2478 5.48975 11.8293C5.48975 12.5162 8.40454 13.0727 12.0002 13.0727C15.5957 13.0727 18.5107 12.5162 18.5107 11.8293C18.5106 11.2392 16.3602 10.7457 13.4754 10.6182Z" fill="#26A17B"/><path d="M12.0001 0C5.37271 0 0 5.3724 0 11.9999C0 18.6272 5.37271 24.0001 12.0001 24.0001C18.6274 24.0001 24 18.6272 24 11.9999C24 5.3724 18.6273 0 12.0001 0ZM13.4751 14.0373V19.3305H10.403V14.0301C7.11427 13.8398 4.65412 13.0749 4.65412 12.1596C4.65412 11.2446 7.11427 10.4798 10.403 10.2892V8.80597H6.22063V5.73391H17.6579V8.80597H13.4751L13.4753 10.2821C16.8253 10.4603 19.3462 11.2334 19.3462 12.1596C19.3461 13.0861 16.8253 13.8593 13.4751 14.0373Z" fill="#26A17B"/></svg>`;

const LOCK_ICON = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

// Mirrors QUOTA_BUNDLES in api/constants.py. The static prerender in
// static/pricing.html carries the same list — update both when prices move.
const BUNDLES = [
  { name: "Starter", quota: 50, usd: 5, unit: "$0.10 per inbox" },
  { name: "Standard", quota: 200, usd: 15, unit: "$0.075 per inbox" },
  { name: "Bulk", quota: 750, usd: 40, unit: "$0.053 per inbox", best: true },
];

const FREE_FEATURES = [
  "5 inbox credits — create 5 inboxes total",
  "REST API &amp; MCP server access",
  "Email polling via <code>wait_for_message</code>",
  "Auto-delete after 7 days",
  "API key auth — no browser needed",
];

const PAID_FEATURES = [
  "Everything in Free",
  "Three bundle sizes — up to 47% less per inbox",
  "Pay with Bitcoin or USDT — no KYC, no card",
  "Credits never expire",
  "Priority email delivery",
  "OpenAPI spec for GPT Actions &amp; LangChain",
];

function featureItem(text) {
  return `
    <li class="card-feature">
      <span class="feature-check">${CHECK_ICON}</span>
      <span>${text}</span>
    </li>`;
}

function bundleTile({ name, quota, usd, unit, best }) {
  return `
    <div class="bundle-tile${best ? " best" : ""}">
      ${best ? `<span class="bundle-badge">Best value</span>` : ""}
      <p class="bundle-name">${name}</p>
      <div class="bundle-price">$${usd}</div>
      <p class="bundle-quota">${quota} inbox credits</p>
      <p class="bundle-unit">${unit}</p>
    </div>`;
}

export async function renderPricingPage() {
  if (document.querySelector('main')) return;

  const isLoggedIn = getIsLoggedIn();
  const freeCTA = isLoggedIn ? ROUTES.INBOXES : ROUTES.LOGIN;
  const buyCTA = isLoggedIn ? ROUTES.INBOXES : ROUTES.LOGIN;

  const main = document.createElement("main");
  main.className = "pricing-page";

  main.innerHTML = `
    <div class="pricing-inner">

      <header class="pricing-header">
        <span class="pricing-eyebrow">Pricing</span>
        <h1 class="pricing-title">Simple, honest pricing</h1>
        <p class="pricing-subtitle">Start free. Top up with Bitcoin or USDT when you need more inboxes. No subscriptions, no credit card.</p>
      </header>

      <div class="pricing-cards">

        <!-- Free -->
        <div class="pricing-card">
          <div class="card-top">
            <div class="card-meta">
              <h2 class="card-name">Free</h2>
              <p class="card-tagline">For testing &amp; exploration</p>
            </div>
            <div class="card-icon-wrap">${MAIL_ICON}</div>
          </div>

          <div class="card-price-wrap">
            <div class="card-price">$0</div>
            <p class="card-price-detail">Forever free</p>
          </div>

          <ul class="card-features">
            ${FREE_FEATURES.map(featureItem).join("")}
          </ul>

          <div class="card-cta">
            <a href="${freeCTA}" class="btn btn-secondary btn-full">Get started free</a>
          </div>
        </div>

        <!-- Pay as you go -->
        <div class="pricing-card featured">
          <span class="card-badge">Pay-as-you-go</span>

          <div class="card-top">
            <div class="card-meta">
              <h2 class="card-name">Top-up</h2>
              <p class="card-tagline">For production &amp; automation</p>
            </div>
            <div class="card-icon-wrap">${BTC_ICON}</div>
          </div>

          <div class="card-price-wrap">
            <div class="card-price">From $5</div>
            <p class="card-price-detail">50 inbox credits · BTC or USDT · no expiry</p>
          </div>

          <ul class="card-features">
            ${PAID_FEATURES.map(featureItem).join("")}
          </ul>

          <div class="card-cta">
            <a href="${buyCTA}" class="btn btn-primary btn-full">Buy inboxes</a>
          </div>
        </div>

      </div>

      <section class="pricing-bundles-section">
        <div class="bundles-header">
          <h2 class="bundles-title">Bitcoin bundles</h2>
          <p class="bundles-note">Bundles start at $5 because on-chain fees make dollar-sized Bitcoin payments impractical. Paying in USDT instead? Send any amount — $1 buys 10 credits.</p>
        </div>

        <div class="bundle-tiles">
          ${BUNDLES.map(bundleTile).join("")}
        </div>
      </section>

      <p class="pricing-credit-note">Each inbox creation consumes one credit. Credits don't expire — buy once, use when you need them.</p>

      <p class="pricing-payment-note">
        <span>Payments processed via Blockonomics</span>
        <span class="payment-icon">${BTC_ICON}<span>Bitcoin (on-chain)</span></span>
        <span class="payment-icon">${USDT_ICON}<span>USDT (ERC-20)</span></span>
        <span class="payment-icon">${LOCK_ICON}<span>No credit card</span></span>
      </p>

    </div>
  `;

  document.body.appendChild(main);
}
