import { NAV_LINKS, LOGO, ROUTES } from '../../../utils/constants.js';

export function createHeader() {
  const header = document.createElement('header');
  header.className = 'site-header';

  const container = document.createElement('div');
  container.className = 'header-container';

  const logoLink = document.createElement('a');
  logoLink.href = ROUTES.HOME; // fallback to index.html if ROUTES.HOME is just '/'

  const logo = document.createElement('img');
  logo.src = LOGO.src;
  logo.alt = LOGO.alt;
  logo.className = 'site-logo';
  logoLink.appendChild(logo);


  const navToggle = document.createElement('button');
  navToggle.className = 'nav-toggle';
  navToggle.innerHTML = '&#9776;';

  const nav = document.createElement('nav');
  nav.className = 'site-nav';

  navToggle.onclick = () => nav.classList.toggle('open');

  NAV_LINKS.forEach(({ label, href }) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    nav.appendChild(link);
  });

  container.appendChild(logoLink);
  container.appendChild(navToggle);
  container.appendChild(nav);
  header.appendChild(container);

  return header;
}