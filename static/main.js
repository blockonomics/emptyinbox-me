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
    default:
      console.error("Page not found:", path);
  }
  document.body.appendChild(createFooter());
});
