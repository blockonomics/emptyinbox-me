import { ROUTES } from "../../../utils/constants.js";

export function renderAboutPage() {
  const main = document.createElement("main");
  main.className = "about-main";

  /* ---------- Hero Section ---------- */
  const heroSection = document.createElement("section");
  heroSection.className = "about-section";

  const heroContent = document.createElement("div");
  heroContent.className = "about-hero-content";

  const heroTitle = document.createElement("h1");
  heroTitle.className = "about-hero-title";
  heroTitle.textContent = "About EmptyInbox.me";

  const heroSubtitle = document.createElement("p");
  heroSubtitle.className = "about-hero-subtitle";
  heroSubtitle.textContent =
    "We believe clarity leads to confidence. Built to help you cut through clutter and rediscover calm.";

  heroContent.appendChild(heroTitle);
  heroContent.appendChild(heroSubtitle);
  heroSection.appendChild(heroContent);

  /* ---------- Why EmptyInbox ---------- */
  const whySection = document.createElement("section");
  whySection.className = "about-section";

  const whyTitle = document.createElement("h2");
  whyTitle.textContent = "Why EmptyInbox";

  const whyDescription = document.createElement("p");
  whyDescription.textContent =
    "Isn't it frustrating that even in 2025, you might still lose 30 minutes each week copying and pasting activation codes or hunting down reset‑password links? Probably 90% of your email storage is taken up by newsletters and marketing emails! Temporary email services try to solve this, but they have problems — they’re blacklisted by many websites, and their emails expire. If you sign up to a service using disposable addresses, you risk losing access to your account. We’ve personally dealt with these issues, so we built EmptyInbox to fix them. We hope you find it useful!";

  whySection.appendChild(whyTitle);
  whySection.appendChild(whyDescription);

  /* ---------- How to Use ---------- */
  const howSection = document.createElement("section");
  howSection.className = "about-section";

  const howTitle = document.createElement("h2");
  howTitle.textContent = "How to Use EmptyInbox";

  const howList = document.createElement("ul");

  const steps = [
    "For each new web service you sign up to, create a new inbox. Use your browser’s password manager to remember the password and email address for each service.",
    "Use “See Messages” to view emails and quickly access activation codes.",
    "Use our Bash extension or API for developer testing and automation.",
  ];

  steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    howList.appendChild(li);
  });

  howSection.appendChild(howTitle);
  howSection.appendChild(howList);

  /* ---------- Contact ---------- */
  const contactSection = document.createElement("section");
  contactSection.className = "about-section";

  const contactTitle = document.createElement("h2");
  contactTitle.textContent = "Contact";

  const contactDescription = document.createElement("p");
  contactDescription.innerHTML =
    'You can log an issue or contribute on <a href="https://github.com/blockonomics/emptyinbox-me/" target="_blank" rel="noopener">GitHub</a>.';

  contactSection.appendChild(contactTitle);
  contactSection.appendChild(contactDescription);

  /* ---------- Credits ---------- */
  const creditsSection = document.createElement("section");
  creditsSection.className = "about-section";

  const creditsTitle = document.createElement("h2");
  creditsTitle.textContent = "Credits";

  const creditsDescription = document.createElement("p");
  creditsDescription.innerHTML =
    'EmptyInbox is supported and maintained by <a href="https://www.blockonomics.co/merchants" target="_blank" rel="noopener">Blockonomics</a> — the easiest way to accept crypto payments on your e‑commerce website.';

  creditsSection.appendChild(creditsTitle);
  creditsSection.appendChild(creditsDescription);

  /* ---------- Assemble Page ---------- */
  main.appendChild(heroSection);
  main.appendChild(whySection);
  main.appendChild(howSection);
  main.appendChild(contactSection);
  main.appendChild(creditsSection);

  document.body.appendChild(main);
}
