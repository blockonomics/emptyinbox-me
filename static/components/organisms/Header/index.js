export function createHeader() {
  const header = document.createElement('header');
  header.className = 'site-header';

  const container = document.createElement('div');
  container.className = 'header-container';

  const logo = document.createElement('img');
  logo.src = '../assets/emptyinboxlogo.png'; // Replace with your actual icon path
  logo.alt = 'Logo';
  logo.className = 'site-logo';

  const navToggle = document.createElement('button');
  navToggle.className = 'nav-toggle';
  navToggle.innerHTML = '&#9776;'; // Hamburger icon
  navToggle.onclick = () => nav.classList.toggle('open');

  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  ['Home', 'About', 'Contact'].forEach(text => {
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = text;
    nav.appendChild(link);
  });

  container.appendChild(logo);
  container.appendChild(navToggle);
  container.appendChild(nav);
  header.appendChild(container);

  return header;
}