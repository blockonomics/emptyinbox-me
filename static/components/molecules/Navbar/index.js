import { NAV_LINKS, LOGO, ROUTES } from '../../../utils/constants.js';

export function createNavbar() {
  const navbar = document.createElement('navbar');
  navbar.className = 'site-navbar';

  const container = document.createElement('div');
  container.className = 'navbar-container';

  // Logo section
  const logoLink = document.createElement('a');
  logoLink.href = ROUTES.HOME;
  logoLink.className = 'logo-link';

  const logo = document.createElement('img');
  logo.src = LOGO.src;
  logo.alt = LOGO.alt;
  logo.className = 'site-logo';
  logoLink.appendChild(logo);

  // Mobile menu toggle
  const navToggle = document.createElement('button');
  navToggle.className = 'nav-toggle';
  navToggle.setAttribute('aria-label', 'Toggle navigation menu');
  navToggle.innerHTML = `
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
  `;

  // Navigation
  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // Toggle functionality with animation
  navToggle.onclick = () => {
    nav.classList.toggle('nav-open');
    navToggle.classList.toggle('nav-toggle-active');
  };

  // Create nav links
  NAV_LINKS.forEach(({ label, href }) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    link.className = 'nav-link';
    
    // Close mobile menu when link is clicked
    link.onclick = () => {
      nav.classList.remove('nav-open');
      navToggle.classList.remove('nav-toggle-active');
    };
    
    nav.appendChild(link);
  });

  container.appendChild(logoLink);
  container.appendChild(navToggle);
  container.appendChild(nav);
  navbar.appendChild(container);

  return navbar;
}

// Add scroll effect to navbar
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.site-navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});