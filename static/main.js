import { createNavbar } from "../components/molecules/Navbar/index.js";
import { createFooter } from "../components/molecules/Footer/index.js";
import { renderHomePage } from "../components/pages/HomePage/index.js";
import { renderAboutPage } from "../components/pages/About/index.js";
import { renderLoginPage } from "../components/pages/Login/index.js";
import { renderInboxesPage } from "../components/pages/Inboxes/index.js";
import { renderSettingsPage } from "../components/pages/Settings/index.js";
import { renderMessagesPage } from "../components/pages/Messages/index.js";
import { renderApiDocsPage } from "./components/pages/ApiDocs/index.js";
import { renderPricingPage } from "./components/pages/Pricing/index.js";
import { ROUTES } from "./utils/constants.js";

document.addEventListener("DOMContentLoaded", async () => {
  (async () => {
    const navbar = await createNavbar(); // Wait for it to finish
    document.querySelector('.site-navbar')?.remove(); // Remove static navbar
    document.body.prepend(navbar);

    // Add scroll listener after navbar is in the DOM
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
  })();

  const path = location.pathname;

  switch (path) {
    case ROUTES.HOME:
      renderHomePage();
      break;
    case ROUTES.ABOUT:
      renderAboutPage();
      break;
    case ROUTES.LOGIN:
      renderLoginPage();
      break;
    case ROUTES.MESSAGES:
      renderMessagesPage();
      break;
    case ROUTES.PRICING:
      renderPricingPage();
      break;
    case ROUTES.API_DOCS:
      renderApiDocsPage();
      break;
    case ROUTES.INBOXES:
      renderInboxesPage();
      break;
    case ROUTES.SETTINGS:
      renderSettingsPage();
      break;
    case ROUTES.PRIVACY:
    case ROUTES.TERMS:
    case ROUTES.BLOG:
    case ROUTES.USE_CASES:
    case ROUTES.COMPARE:
      // Static pages — no JS render needed
      break;
    default:
      // Directories of hand-written static pages. Anything outside them is a
      // genuinely unknown route and still worth logging.
      const STATIC_DIRS = ["/blog/", "/use-cases/", "/compare/"];
      if (!STATIC_DIRS.some((dir) => path.startsWith(dir))) {
        console.error("Page not found:", path);
      }
  }
  document.querySelector('.site-footer')?.remove(); // Remove static footer
  document.body.appendChild(createFooter());
});
