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
  heroTitle.textContent = "Simple, One‑Time Pricing";

  const heroSubtitle = document.createElement("p");
  heroSubtitle.classList.add("pricing-hero-subtitle");
  heroSubtitle.textContent =
    `You start with ${USER_STARTING_QUOTA} aliases included. ` +
    `Need more? Choose the pack that fits — pay once, keep them forever.`;

  heroContent.appendChild(heroTitle);
  heroContent.appendChild(heroSubtitle);
  heroSection.appendChild(heroContent);
  container.appendChild(heroSection);

  // Pricing Cards Section
  const cardSection = document.createElement("section");
  cardSection.classList.add("pricing-card-section");

  const pricingOptions = [
    {
      name: `${QUOTA_PER_USDT} Aliases`,
      price: "1 USDT",
      tagline: "Starter Pack — for occasional use.",
      features: ["Instant activation", "No expiry date", "Yours to keep"],
    },
    {
      name: `${QUOTA_PER_USDT * 10} Aliases`,
      price: "10 USDT",
      tagline: "Regular Pack — for steady, ongoing needs.",
      features: ["Instant activation", "No expiry date", "Yours to keep"],
    },
    {
      name: `${QUOTA_PER_USDT * 50} Aliases`,
      price: "50 USDT",
      tagline: "Bulk Pack — for heavy users or teams.",
      features: ["Instant activation", "No expiry date", "Yours to keep"],
    },
  ];

  pricingOptions.forEach((option) => {
    const card = document.createElement("div");
    card.classList.add("pricing-card");

    const cardHeader = document.createElement("div");
    cardHeader.classList.add("pricing-card-header");

    const cardTitle = document.createElement("h2");
    cardTitle.classList.add("pricing-card-title");
    cardTitle.textContent = option.name;

    const cardTagline = document.createElement("p");
    cardTagline.classList.add("pricing-card-tagline");
    cardTagline.textContent = option.tagline;

    cardHeader.appendChild(cardTitle);
    cardHeader.appendChild(cardTagline);

    const priceBlock = document.createElement("div");
    priceBlock.classList.add("pricing-card-price-block");

    const price = document.createElement("div");
    price.classList.add("pricing-card-price");
    price.textContent = option.price;

    priceBlock.appendChild(price);

    const featureList = document.createElement("ul");
    featureList.classList.add("pricing-feature-list");
    option.features.forEach((feat) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="checkmark">✔</span> ${feat}`;
      featureList.appendChild(li);
    });

    card.appendChild(cardHeader);
    card.appendChild(priceBlock);
    card.appendChild(featureList);

    cardSection.appendChild(card);
  });

  container.appendChild(cardSection);

  // Footer note
  const footerNote = document.createElement("p");
  footerNote.classList.add("pricing-footer-note");
  footerNote.textContent =
    "All prices are in USDT. Pay once, aliases are yours to keep.";
  container.appendChild(footerNote);

  main.appendChild(container);
  document.body.appendChild(main);
}
