import { ROUTES } from "../../../utils/constants.js";

export function renderAboutPage() {
  const main = document.createElement('main');
  main.className = 'about-main';

  // Hero section
  const heroSection = document.createElement('section');
  heroSection.className = 'about-hero';


  const heroContent = document.createElement('div');
  heroContent.className = 'about-hero-content';

  const heroTitle = document.createElement('h1');
  heroTitle.className = 'about-hero-title';
  heroTitle.textContent = 'About EmptyInbox.me';

  const heroSubtitle = document.createElement('p');
  heroSubtitle.className = 'about-hero-subtitle';
  heroSubtitle.textContent = 'We believe clarity leads to confidence. Built to help you cut through clutter and rediscover calm.';

  heroContent.appendChild(heroTitle);
  heroContent.appendChild(heroSubtitle);
  heroSection.appendChild(heroContent);

  // Story section
  const storySection = document.createElement('section');
  storySection.className = 'about-story';

  const storyContent = document.createElement('div');
  const storyGrid = document.createElement('div');
  storyGrid.className = 'about-story-grid';

  // Mission card
  const missionCard = document.createElement('div');
  missionCard.className = 'about-card mission-card';

  const missionIcon = document.createElement('div');
  missionIcon.className = 'about-card-icon';
  missionIcon.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7L12 2z"/>
      <path d="M12 8v8"/>
      <path d="M8 12h8"/>
    </svg>
  `;

  const missionTitle = document.createElement('h2');
  missionTitle.className = 'about-card-title';
  missionTitle.textContent = 'Our Mission';

  const missionDescription = document.createElement('p');
  missionDescription.className = 'about-card-description';
  missionDescription.textContent = 'To make simplicity feel powerful. Tools shouldn\'t overwhelm—they should empower you to focus on what truly matters.';

  missionCard.appendChild(missionIcon);
  missionCard.appendChild(missionTitle);
  missionCard.appendChild(missionDescription);

  // Team card
  const teamCard = document.createElement('div');
  teamCard.className = 'about-card team-card';

  const teamIcon = document.createElement('div');
  teamIcon.className = 'about-card-icon';
  teamIcon.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  `;

  const teamTitle = document.createElement('h2');
  teamTitle.className = 'about-card-title';
  teamTitle.textContent = 'Who We Are';

  const teamDescription = document.createElement('p');
  teamDescription.className = 'about-card-description';
  teamDescription.textContent = 'A handful of creators, thinkers, and minimalists who got tired of digital noise. So we made something better. And now it\'s yours.';

  teamCard.appendChild(teamIcon);
  teamCard.appendChild(teamTitle);
  teamCard.appendChild(teamDescription);

  // Values card
  const valuesCard = document.createElement('div');
  valuesCard.className = 'about-card values-card';

  const valuesIcon = document.createElement('div');
  valuesIcon.className = 'about-card-icon';
  valuesIcon.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>
  `;

  const valuesTitle = document.createElement('h2');
  valuesTitle.className = 'about-card-title';
  valuesTitle.textContent = 'Our Values';

  const valuesDescription = document.createElement('p');
  valuesDescription.className = 'about-card-description';
  valuesDescription.textContent = 'Simplicity over complexity. Privacy over profit. Focus over noise. We build tools that respect your time and attention.';

  valuesCard.appendChild(valuesIcon);
  valuesCard.appendChild(valuesTitle);
  valuesCard.appendChild(valuesDescription);

  storyGrid.appendChild(missionCard);
  storyGrid.appendChild(teamCard);
  storyGrid.appendChild(valuesCard);
  storyContent.appendChild(storyGrid);
  storySection.appendChild(storyContent);

  // CTA section
  const ctaSection = document.createElement('section');
  ctaSection.className = 'about-cta';

  const ctaContent = document.createElement('div');
  ctaContent.className = 'about-cta-content';

  const ctaTitle = document.createElement('h2');
  ctaTitle.className = 'about-cta-title';
  ctaTitle.textContent = 'Ready to clear the clutter?';

  const ctaDescription = document.createElement('p');
  ctaDescription.className = 'about-cta-description';
  ctaDescription.textContent = 'Join thousands who\'ve discovered the power of digital minimalism.';

  const ctaButton = document.createElement('a');
  ctaButton.href = ROUTES.LOGIN;
  ctaButton.className = 'btn btn-primary';
  ctaButton.textContent = 'Get Started Today';

  ctaContent.appendChild(ctaTitle);
  ctaContent.appendChild(ctaDescription);
  ctaContent.appendChild(ctaButton);
  ctaSection.appendChild(ctaContent);

  // Assemble the page
  main.appendChild(heroSection);
  main.appendChild(storySection);
  main.appendChild(ctaSection);

  document.body.appendChild(main);
}