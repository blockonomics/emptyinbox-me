import {
  QUOTA_PER_USDT,
  USER_STARTING_QUOTA,
} from "../../../utils/constants.js";

export async function renderPricingPage() {
  const main = document.createElement("main");
  const container = document.createElement("div");
  container.classList.add("pricing-page");

  // Hero Section
  const heroSection = document.createElement("section");
  heroSection.classList.add("pricing-hero");

  const heroContent = document.createElement("div");
  heroContent.classList.add("pricing-hero-content");

  const heroTitle = document.createElement("h1");
  heroTitle.classList.add("pricing-hero-title");
  heroTitle.textContent = "Simple Pricing";

  const heroSubtitle = document.createElement("p");
  heroSubtitle.classList.add("pricing-hero-subtitle");
  heroSubtitle.textContent =
    `You start with ${USER_STARTING_QUOTA} aliases included. ` +
    `Need more? Add ${QUOTA_PER_USDT} aliases for 1 USDT — scale up as your need grow.`;

  heroContent.appendChild(heroTitle);
  heroContent.appendChild(heroSubtitle);
  heroSection.appendChild(heroContent);
  container.appendChild(heroSection);

  // Pricing Cards Section
  const cardSection = document.createElement("section");
  cardSection.classList.add("pricing-card-section");

  const pricingOptions = [
    { qty: `${QUOTA_PER_USDT} aliases`, price: "1 USDT" },
  ];

  pricingOptions.forEach((option) => {
    const card = document.createElement("div");
    card.classList.add("pricing-card");

    const cardTitle = document.createElement("h2");
    cardTitle.classList.add("pricing-card-title");
    cardTitle.textContent = option.qty;

    const cardDescription = document.createElement("p");
    cardDescription.classList.add("pricing-card-description");
    cardDescription.textContent = `Only ${option.price} • Instant activation`;

    card.appendChild(cardTitle);
    card.appendChild(cardDescription);
    cardSection.appendChild(card);
  });

  container.appendChild(cardSection);

  main.appendChild(container);
  document.body.appendChild(main);
}
