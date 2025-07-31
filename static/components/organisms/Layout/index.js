import { createHeader } from '../molecules/Header';
import { createFooter } from '../molecules/Footer';

export function createLayout(content) {
  document.body.innerHTML = ''; // Clear previous content

  document.body.appendChild(createHeader());
  document.body.appendChild(content);
  document.body.appendChild(createFooter());
}