import { renderHomePageHero } from '../../atoms/HomePageHero/index.js';
import { renderFeaturesCarousel } from '../../atoms/FeaturesCarousel/index.js';

export function renderHomePage() {
  const main = document.createElement('main');
  main.appendChild(renderHomePageHero());
  main.appendChild(renderFeaturesCarousel());
  document.body.appendChild(main);
}