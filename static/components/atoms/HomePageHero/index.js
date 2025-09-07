import { ROUTES } from '../../../utils/constants.js';

export function renderHomePageHero() {
  const section = document.createElement('section');
  section.className = 'hero';

  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';

  const title = document.createElement('h1');
  title.textContent = 'POOF... And it\'s Gone!';

  const subtitle = document.createElement('p');
  subtitle.innerHTML = 'Emails vanish in 7 days. Stay private.<br>Login with Passkey.';

  const ctaButton = document.createElement('a');
  ctaButton.href = ROUTES.LOGIN;
  ctaButton.className = 'btn btn-primary';
  ctaButton.textContent = 'Get Started';
  ctaButton.setAttribute('role', 'button');

  heroContent.appendChild(title);
  heroContent.appendChild(subtitle);
  heroContent.appendChild(ctaButton);
  section.appendChild(heroContent);

  return section;
}
