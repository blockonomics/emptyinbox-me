import { renderHomePageHero } from "../../atoms/HomePageHero/index.js";
import { renderFeaturesCarousel } from "../../atoms/FeaturesCarousel/index.js";
import {
  enableImageLightbox,
  initCarousels,
  renderIntegrationsSection,
} from "../../atoms/IntegrationsSection/index.js";

export function renderHomePage() {
  const main = document.createElement("main");
  main.appendChild(renderHomePageHero());
  main.appendChild(renderFeaturesCarousel());
  main.appendChild(renderIntegrationsSection());
  document.body.appendChild(main);

  initCarousels();
  enableImageLightbox();
}
