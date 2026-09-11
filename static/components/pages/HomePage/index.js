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
    // Each copy button takes its text from the panel it sits in, so the
    // command and the thing copied cannot drift apart.
    document.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const source = this.closest('[data-copy]');
        const text = source ? source.dataset.copy : 'npx emptyinbox-mcp';
        navigator.clipboard.writeText(text);
        this.innerHTML = CHECK_ICON;
        setTimeout(() => { this.innerHTML = COPY_ICON; }, 2000);
      });
    });

    const tabs = Array.from(document.querySelectorAll('.snippet-tab'));
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((other) => {
          const selected = other === tab;
          other.classList.toggle('is-active', selected);
          other.setAttribute('aria-selected', String(selected));
          const panel = document.getElementById(other.getAttribute('aria-controls'));
          if (panel) panel.hidden = !selected;
        });
      });
    });
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
