import { fetchUserData } from "../../../services/apiService.js";
import { NAV_LINKS, LOGO, ROUTES } from "../../../utils/constants.js";
import { clearAllAuthData } from "../../../utils/storage.js";
import { renderLogoutButton } from "../../atoms/LogoutButton/index.js";

// In your navbar creation function
export async function createNavbar() {
  const navbar = document.createElement("navbar");
  navbar.className = "site-navbar";

  const container = document.createElement("div");
  container.className = "navbar-container";

  // Logo section
  const logoLink = document.createElement("a");
  logoLink.href = ROUTES.HOME;
  logoLink.className = "logo-link";

  const logo = document.createElement("img");
  logo.src = LOGO.src;
  logo.alt = LOGO.alt;
  logo.className = "site-logo";
  logoLink.appendChild(logo);

  // Mobile menu toggle
  const navToggle = document.createElement("button");
  navToggle.className = "nav-toggle";
  navToggle.setAttribute("aria-label", "Toggle navigation menu");
  navToggle.innerHTML = `
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
  `;

  // Navigation
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Main navigation");

  navToggle.onclick = () => {
    nav.classList.toggle("nav-open");
    navToggle.classList.toggle("nav-toggle-active");
    document.body.classList.toggle("nav-open-body"); // Prevent scrolling
  };

  // Check auth before rendering nav links
  const authStatus = await checkAuthStatus();

  let linksToRender;
  if (authStatus.isAuthenticated) {
    // Logged in → show all except Login
    linksToRender = NAV_LINKS.filter((link) => link.label !== "Login");
  } else {
    // Not logged in → show all except Inboxes, Settings, Messages
    linksToRender = NAV_LINKS.filter(
      (link) => !["Inboxes", "Settings", "Messages"].includes(link.label)
    );
  }

  linksToRender.forEach(({ label, href, external, className, icon }) => {
    const link = document.createElement("a");
    link.href = href;
    link.className = `${className || "nav-link"}`;

    if (icon) {
      const iconImg = document.createElement("img");
      iconImg.src = icon;
      iconImg.alt = `${label} icon`;
      iconImg.className = "nav-icon";
      link.appendChild(iconImg);
    }

    const textSpan = document.createElement("span");
    textSpan.textContent = label;
    link.appendChild(textSpan);

    if (external) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }

    link.onclick = () => {
      nav.classList.remove("nav-open");
      navToggle.classList.remove("nav-toggle-active");
      document.body.classList.remove("nav-open-body");
    };

    nav.appendChild(link);
  });

  nav.appendChild(renderLogoutButton());

  container.appendChild(logoLink);
  container.appendChild(navToggle);
  container.appendChild(nav);
  navbar.appendChild(container);

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && nav.classList.contains("nav-open")) {
      nav.classList.remove("nav-open");
      navToggle.classList.remove("nav-toggle-active");
      document.body.classList.remove("nav-open-body");
    }
  });

  return navbar;
}

// Add scroll effect to navbar
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".site-navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

async function checkAuthStatus() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return { isAuthenticated: false };
  }

  try {
    // Verify token with backend
    const response = await fetchUserData(token);

    if (response?.address) {
      return { isAuthenticated: true };
    } else {
      // Token is invalid, clear it
      clearAllAuthData();
      return { isAuthenticated: false };
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    clearAllAuthData();
    return { isAuthenticated: false };
  }
}
