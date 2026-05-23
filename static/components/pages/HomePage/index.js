import { renderHomePageHero } from "../../atoms/HomePageHero/index.js";
import { renderFeaturesCarousel } from "../../atoms/FeaturesCarousel/index.js";
import {
  enableImageLightbox,
  renderIntegrationsSection,
} from "../../atoms/IntegrationsSection/index.js";

export function renderHomePage() {
  if (document.querySelector('main')) {
    // Static HTML already in place — attach interactivity only
    const COPY_ICON = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    const CHECK_ICON = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText('npx emptyinbox-mcp');
        this.innerHTML = CHECK_ICON;
        setTimeout(() => { this.innerHTML = COPY_ICON; }, 2000);
      });
    }
    enableImageLightbox();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.querySelectorAll('.feature-card').forEach(card => card.classList.add('visible'));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      document.querySelectorAll('.feature-card').forEach(card => observer.observe(card));
    }

    return;
  }
  const main = document.createElement("main");
  main.appendChild(renderHomePageHero());
  main.appendChild(renderFeaturesCarousel());
  main.appendChild(renderIntegrationsSection());
  document.body.appendChild(main);

  enableImageLightbox();
}
