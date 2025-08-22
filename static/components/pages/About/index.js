import { ROUTES } from "../../../utils/constants.js";

export function renderAboutPage() {
  const main = document.createElement("main");
  main.className = "about-main";

  /* ---------- Why EmptyInbox ---------- */
  const whySection = document.createElement("section");
  whySection.className = "about-section";

  const whyTitle = document.createElement("h2");
  whyTitle.textContent = "Why EmptyInbox";

  const whyPara1 = document.createElement("p");
  whyPara1.textContent =
    "We are in 2025, yet email inboxes are clunky, pesky and filled with trash. The drudgery of copying activation codes and reset‑password links still exists. 99% of inbox storage is filled with email that are never to be read again!";

  const whyPara2 = document.createElement("p");
  whyPara2.textContent =
    "As developers in a SAAS startup, we frequently signup to different web services and also need to automate / test emails. We created EmptyInbox to streamline this flow and have a digitally minimal inbox. Hope you find this service useful! ";

  whySection.appendChild(whyTitle);
  whySection.appendChild(whyPara1);
  whySection.appendChild(whyPara2);

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
  main.appendChild(whySection);
  main.appendChild(howSection);
  main.appendChild(contactSection);
  main.appendChild(creditsSection);

  document.body.appendChild(main);
}
