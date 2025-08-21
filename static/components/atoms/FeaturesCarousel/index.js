export function renderFeaturesCarousel() {
  const section = document.createElement("section");
  section.className = "features-section";

  // Features container
  const container = document.createElement("div");
  container.className = "features-container";

  const carousel = document.createElement("div");
  carousel.className = "features-carousel";

  FEATURES.forEach(({ title, description }, index) => {
    const featureCard = document.createElement("div");
    featureCard.className = "feature-card";
    featureCard.style.animationDelay = `${index * 0.1}s`;

    // Icon placeholder - you can add specific icons later
    const iconDiv = document.createElement("div");
    iconDiv.className = "feature-icon";
    iconDiv.innerHTML = getFeatureIcon(index);

    const contentDiv = document.createElement("div");
    contentDiv.className = "feature-content";

    const featureTitle = document.createElement("h3");
    featureTitle.className = "feature-title";
    featureTitle.textContent = title;

    const featureDescription = document.createElement("p");
    featureDescription.className = "feature-description";
    featureDescription.textContent = description;

    contentDiv.appendChild(featureTitle);
    contentDiv.appendChild(featureDescription);
    featureCard.appendChild(iconDiv);
    featureCard.appendChild(contentDiv);
    carousel.appendChild(featureCard);
  });

  container.appendChild(carousel);
  section.appendChild(container);

  return section;
}

function getFeatureIcon(index) {
  const icons = [
    // Multiple Aliases
    `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 7l3 3-3 3"/>
      <path d="M21 7l-3 3 3 3"/>
      <path d="M9 6h6"/>
      <path d="M9 18h6"/>
    </svg>`,

    // Auto-Delete in 7 Days
    `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>`,

    // Pay with USDT Only
    `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <text x="12" y="16" text-anchor="middle" font-size="10" font-family="Arial" fill="currentColor">T</text>
    </svg>`,

    // Smart Integrations
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="6" r="2"/>
      <circle cx="18" cy="6" r="2"/>
      <circle cx="6" cy="18" r="2"/>
      <circle cx="18" cy="18" r="2"/>
      <path d="M6 6 C12 6, 12 18, 18 18"/>
      <path d="M18 6 C12 6, 12 18, 6 18"/>
    </svg>`,
  ];

  return icons[index % icons.length];
}

export const FEATURES = [
  {
    title: "Multiple Inboxes",
    description:
      "Create new inbox to sign up to each new website. Inboxes are permanent and never deleted.",
  },
  {
    title: "Auto-Delete in 7 Days",
    description:
      "Emails are automatically deleted after 7 days. No storage, no clutter.",
  },
  {
    title: "Privacy-First Payments",
    description: "Use USDT for login and payment.",
  },
  {
    title: "Simple Integrations",
    description:
      "Browser extension and command-line tools help automation and productivity",
  },
];
