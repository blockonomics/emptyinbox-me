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

// Lucide icons (MIT licensed — lucide.dev)
function getFeatureIcon(index) {
  const icons = [
    // MCP Server — plug-2
    `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 2v6"/><path d="M15 2v6"/><path d="M12 17v5"/><path d="M5 8h14"/><path d="M6 11V8h12v3a6 6 0 1 1-12 0Z"/></svg>`,

    // OpenAPI / GPT Actions — braces {}
    `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>`,

    // Email Polling — mail-search
    `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 12.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h7.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="m22 22-1.5-1.5"/></svg>`,

    // API Key Auth — key-round
    `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>`,

    // Crypto Payments — coins
    `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>`,

    // Auto-Delete — timer
    `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>`,
  ];

  return icons[index] ?? icons[0];
}

export const FEATURES = [
  {
    title: "MCP Server",
    description:
      "Install in Claude, Claude Code, or any MCP-compatible agent with one line: npx emptyinbox-mcp.",
  },
  {
    title: "OpenAPI / GPT Actions",
    description:
      "Import the OpenAPI spec directly into OpenAI GPTs, LangChain, CrewAI, or any OpenAPI-compatible framework.",
  },
  {
    title: "Email Polling",
    description:
      "Block until a verification email arrives. The primitive every agent needs for signup and OTP flows — via the wait_for_message MCP tool.",
  },
  {
    title: "API Key Auth",
    description:
      "No passkeys, no browser sessions. Authenticate with a static API key — works headlessly from any environment.",
  },
  {
    title: "Crypto Payments",
    description:
      "Top up inbox quota with USDT via Blockonomics. No credit card, no KYC.",
  },
  {
    title: "Auto-Delete in 7 Days",
    description:
      "Messages are automatically purged. No cleanup needed after your agent finishes a task.",
  },
];
