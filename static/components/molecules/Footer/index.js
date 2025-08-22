import { LOGO, ROUTES } from "../../../utils/constants.js";
import { getApiKey } from "../../../utils/storage.js";

export function createFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";

  const isLoggedIn = Boolean(getApiKey());

  const container = document.createElement("div");
  container.className = "footer-container";

  // Footer content wrapper
  const footerContent = document.createElement("div");
  footerContent.className = "footer-content";

  // Brand section
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
  brandText.textContent =
    "A clutter-free space to help you reset, refocus, and stay in control.";

  logoLink.appendChild(logo);
  brandSection.appendChild(logoLink);
  brandSection.appendChild(brandText);

  // Assemble footer content (no quick links section)
  footerContent.appendChild(brandSection);

  // Footer bottom
  const footerBottom = document.createElement("div");
  footerBottom.className = "footer-bottom";

  const copyright = document.createElement("p");
  copyright.className = "footer-copyright";
  copyright.innerHTML = `&copy; ${new Date().getFullYear()} EmptyInbox.me. All rights reserved.`;

  const footerMeta = document.createElement("div");
  footerMeta.className = "footer-meta";

  const privacyLink = document.createElement("a");
  privacyLink.href = "#privacy";
  privacyLink.className = "footer-meta-link";
  privacyLink.textContent = "Privacy";

  const termsLink = document.createElement("a");
  termsLink.href = "#terms";
  termsLink.className = "footer-meta-link";
  termsLink.textContent = "Terms";

  footerMeta.appendChild(privacyLink);
  footerMeta.appendChild(termsLink);

  footerBottom.appendChild(copyright);
  footerBottom.appendChild(footerMeta);

  // Assemble complete footer
  container.appendChild(footerContent);
  container.appendChild(footerBottom);
  footer.appendChild(container);

  return footer;
}
