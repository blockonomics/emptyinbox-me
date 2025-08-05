import { createNavbar } from '../molecules/Navbar';
import { createFooter } from '../molecules/Footer';

export function createLayout(content) {
  document.body.innerHTML = ''; // Clear previous content

  document.body.appendChild(createNavbar());
  document.body.appendChild(content);
  document.body.appendChild(createFooter());
}