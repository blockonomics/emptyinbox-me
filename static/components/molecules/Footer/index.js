import { LOGO, ROUTES, FOOTER_LINKS } from "../../../utils/constants.js";
import { getIsLoggedIn } from "../../../utils/storage.js";

export function createFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";

  const isLoggedIn = getIsLoggedIn();

  const container = document.createElement("div");
  container.className = "footer-container";

  const footerContent = document.createElement("div");
  footerContent.className = "footer-content";

  // Brand
  const brandSection = document.createElement("div");
  brandSection.className = "footer-brand";

  const logoLink = document.createElement("a");
  logoLink.href = isLoggedIn ? ROUTES.MESSAGES : "/";
  logoLink.className = "footer-logo-link";

  const logo = document.createElement("img");
  logo.src = LOGO.src;
  logo.alt = LOGO.alt;
  logo.className = "footer-logo";

  const brandText = document.createElement("p");
  brandText.className = "footer-brand-text";
  brandText.textContent = "A clutter-free space to help you reset, refocus, and stay in control.";

  logoLink.appendChild(logo);
  brandSection.appendChild(logoLink);
  brandSection.appendChild(brandText);

  // Link columns
  const columns = [
    { title: "Product", links: FOOTER_LINKS.product, className: "footer-links" },
    { title: "Company", links: FOOTER_LINKS.company, className: "footer-connect" },
  ];

  const colEls = columns.map(({ title, links, className }) => {
    const col = document.createElement("div");
    col.className = className;

    const heading = document.createElement("h3");
    heading.className = "footer-section-title";
    heading.textContent = title;

    const nav = document.createElement("nav");
    nav.className = "footer-nav";

    links.forEach(({ label, href, external }) => {
      const a = document.createElement("a");
      a.href = href;
      a.className = "footer-link";
      a.textContent = label;
      if (external) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
      nav.appendChild(a);
    });

    col.appendChild(heading);
    col.appendChild(nav);
    return col;
  });

  footerContent.appendChild(brandSection);
  colEls.forEach((el) => footerContent.appendChild(el));

  // Bottom bar
  const footerBottom = document.createElement("div");
  footerBottom.className = "footer-bottom";

  const copyright = document.createElement("p");
  copyright.className = "footer-copyright";
  copyright.innerHTML = `&copy; ${new Date().getFullYear()} EmptyInbox.me. All rights reserved.`;

  const footerMeta = document.createElement("div");
  footerMeta.className = "footer-meta";

  FOOTER_LINKS.legal.forEach(({ label, href }) => {
    const a = document.createElement("a");
    a.href = href;
    a.className = "footer-meta-link";
    a.textContent = label;
    footerMeta.appendChild(a);
  });

  footerBottom.appendChild(copyright);
  footerBottom.appendChild(footerMeta);

  container.appendChild(footerContent);
  container.appendChild(footerBottom);
  footer.appendChild(container);

  return footer;
}
