import { FEATURES } from '../../../utils/constants.js';

export function renderFeaturesCarousel() {
  const section = document.createElement('section');
  section.className = 'features-carousel';

  FEATURES.forEach(({ title, description }) => {
    const featureDiv = document.createElement('div');
    featureDiv.className = 'feature';
    featureDiv.innerHTML = `
      <h2>${title}</h2>
      <p>${description}</p>
    `;
    section.appendChild(featureDiv);
  });

  return section;
}