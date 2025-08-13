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

  // Enhanced toggle functionality with outside click
  navToggle.onclick = () => {
    nav.classList.toggle('nav-open');
    navToggle.classList.toggle('nav-toggle-active');
    document.body.classList.toggle('nav-open-body'); // Prevent scrolling
  };

  NAV_LINKS.forEach(({ label, href, external, className, icon }) => {
    const link = document.createElement('a');
    link.href = href;
    link.className = `${className || 'nav-link'}`;

    if (icon) {
      const iconImg = document.createElement('img');
      iconImg.src = icon;
      iconImg.alt = `${label} icon`;
      iconImg.className = 'nav-icon'; // Style this in CSS
      link.appendChild(iconImg);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = label;
    link.appendChild(textSpan);

    if (external) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }

    link.onclick = () => {
      nav.classList.remove('nav-open');
      navToggle.classList.remove('nav-toggle-active');
      document.body.classList.remove('nav-open-body');
    };

    nav.appendChild(link);
  });

  container.appendChild(logoLink);
  container.appendChild(navToggle);
  container.appendChild(nav);
  navbar.appendChild(container);

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && nav.classList.contains('nav-open')) {
      nav.classList.remove('nav-open');
      navToggle.classList.remove('nav-toggle-active');
      document.body.classList.remove('nav-open-body');
    }
  });

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