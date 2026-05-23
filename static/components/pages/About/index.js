import { ROUTES } from "../../../utils/constants.js";

export function renderAboutPage() {
  if (document.querySelector('main')) return;

  const main = document.createElement("main");
  main.className = "about-main";

  /* ---------- Page Header ---------- */
  const header = document.createElement("header");
  header.className = "about-header";

  const headerInner = document.createElement("div");
  headerInner.className = "about-header-inner";

  const label = document.createElement("span");
  label.className = "about-page-label";
  label.textContent = "About";

  const headline = document.createElement("h1");
  headline.className = "about-headline";
  headline.innerHTML = "Built for developers<br>who hate email clutter";

  headerInner.appendChild(label);
  headerInner.appendChild(headline);
  header.appendChild(headerInner);

  /* ---------- Why Section ---------- */
  const whySection = document.createElement("section");
  whySection.className = "about-section about-why";

  const whyInner = document.createElement("div");
  whyInner.className = "about-section-inner";

  const whyTitle = document.createElement("h2");
  whyTitle.className = "about-section-title";
  whyTitle.textContent = "Why EmptyInbox";

  const statBlock = document.createElement("div");
  statBlock.className = "about-stat-block";

  const statNum = document.createElement("span");
  statNum.className = "about-stat-number";
  statNum.textContent = "99%";

  const statLabel = document.createElement("span");
  statLabel.className = "about-stat-label";
  statLabel.textContent = "of inbox storage filled with emails that are never read again";

  statBlock.appendChild(statNum);
  statBlock.appendChild(statLabel);

  const whyText = document.createElement("div");
  whyText.className = "about-why-text";

  const whyPara1 = document.createElement("p");
  whyPara1.textContent =
    "We are in 2026, yet email inboxes are clunky, pesky and filled with trash. The drudgery of copying activation codes and reset‑password links still exists.";

  const whyPara2 = document.createElement("p");
  whyPara2.textContent =
    "As developers at a SaaS startup, we frequently sign up to different web services and need to automate and test emails. We created EmptyInbox to streamline this flow and have a digitally minimal inbox. Hope you find it useful!";

  whyText.appendChild(whyPara1);
  whyText.appendChild(whyPara2);

  whyInner.appendChild(whyTitle);
  whyInner.appendChild(statBlock);
  whyInner.appendChild(whyText);
  whySection.appendChild(whyInner);

  /* ---------- How to Use Section ---------- */
  const howSection = document.createElement("section");
  howSection.className = "about-section about-how";

  const howInner = document.createElement("div");
  howInner.className = "about-section-inner";

  const howTitle = document.createElement("h2");
  howTitle.className = "about-section-title";
  howTitle.textContent = "How to use";

  const steps = [
    "For each new web service you sign up to, create a new inbox. Use your browser's password manager to remember the password and email address for each service.",
    "Use “See Messages” to view emails and quickly access activation codes.",
    "Use our Bash extension or API for developer testing and automation.",
  ];

  const stepList = document.createElement("ol");
  stepList.className = "about-steps";

  steps.forEach((text, i) => {
    const li = document.createElement("li");
    li.className = "about-step";

    const num = document.createElement("span");
    num.className = "step-num";
    num.textContent = String(i + 1).padStart(2, "0");

    const p = document.createElement("p");
    p.textContent = text;

    li.appendChild(num);
    li.appendChild(p);
    stepList.appendChild(li);
  });

  howInner.appendChild(howTitle);
  howInner.appendChild(stepList);
  howSection.appendChild(howInner);

  /* ---------- Meta Section (Contact + Credits) ---------- */
  const metaSection = document.createElement("section");
  metaSection.className = "about-section about-meta";

  const metaInner = document.createElement("div");
  metaInner.className = "about-section-inner about-meta-grid";

  const contactItem = document.createElement("div");
  contactItem.className = "about-meta-item";

  const contactTitle = document.createElement("h2");
  contactTitle.className = "about-section-title";
  contactTitle.textContent = "Contact";

  const contactP = document.createElement("p");
  contactP.innerHTML =
    'Log an issue or contribute on <a href="https://github.com/blockonomics/emptyinbox-me/" target="_blank" rel="noopener">GitHub</a>.';

  contactItem.appendChild(contactTitle);
  contactItem.appendChild(contactP);

  const creditsItem = document.createElement("div");
  creditsItem.className = "about-meta-item";

  const creditsTitle = document.createElement("h2");
  creditsTitle.className = "about-section-title";
  creditsTitle.textContent = "Credits";

  const creditsP = document.createElement("p");
  creditsP.innerHTML =
    'Supported and maintained by <a href="https://www.blockonomics.co/merchants" target="_blank" rel="noopener">Blockonomics</a> — the easiest way to accept crypto payments on your e‑commerce website.';

  creditsItem.appendChild(creditsTitle);
  creditsItem.appendChild(creditsP);

  metaInner.appendChild(contactItem);
  metaInner.appendChild(creditsItem);
  metaSection.appendChild(metaInner);

  /* ---------- Assemble ---------- */
  main.appendChild(header);
  main.appendChild(whySection);
  main.appendChild(howSection);
  main.appendChild(metaSection);

  document.body.appendChild(main);
}
