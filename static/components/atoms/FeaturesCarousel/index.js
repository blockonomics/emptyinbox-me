import { FEATURES } from '../../../utils/constants.js';

export function renderFeaturesCarousel() {
  const section = document.createElement('section');
  section.className = 'features-section';

  // Section header
  const header = document.createElement('div');
  header.className = 'features-header';
  
  const title = document.createElement('h2');
  title.className = 'features-title';
  title.textContent = 'Why Choose EmptyInbox.me';
  
  const subtitle = document.createElement('p');
  subtitle.className = 'features-subtitle';
  subtitle.textContent = 'Simple, secure, and efficient tools to help you stay focused.';
  
  header.appendChild(title);
  header.appendChild(subtitle);

  // Features container
  const container = document.createElement('div');
  container.className = 'features-container';

  const carousel = document.createElement('div');
  carousel.className = 'features-carousel';

  FEATURES.forEach(({ title, description }, index) => {
    const featureCard = document.createElement('div');
    featureCard.className = 'feature-card';
    featureCard.style.animationDelay = `${index * 0.1}s`;

    // Icon placeholder - you can add specific icons later
    const iconDiv = document.createElement('div');
    iconDiv.className = 'feature-icon';
    iconDiv.innerHTML = getFeatureIcon(index);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'feature-content';

    const featureTitle = document.createElement('h3');
    featureTitle.className = 'feature-title';
    featureTitle.textContent = title;

    const featureDescription = document.createElement('p');
    featureDescription.className = 'feature-description';
    featureDescription.textContent = description;

    contentDiv.appendChild(featureTitle);
    contentDiv.appendChild(featureDescription);
    featureCard.appendChild(iconDiv);
    featureCard.appendChild(contentDiv);
    carousel.appendChild(featureCard);
  });

  container.appendChild(carousel);
  section.appendChild(header);
  section.appendChild(container);

  return section;
}

// Simple icon function - you can customize these or use an icon library
function getFeatureIcon(index) {
  const icons = [
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"/>
      <path d="M19 11h-4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"/>
      <path d="M7 9V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/>
    </svg>`, // Simple/Clean icon
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <circle cx="12" cy="16" r="1"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>`, // Secure icon
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="16,12 12,8 8,12"/>
      <line x1="12" y1="16" x2="12" y2="8"/>
    </svg>` // Efficient icon
  ];
  return icons[index % icons.length];
}