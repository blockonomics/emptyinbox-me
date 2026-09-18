import { LOGO } from "../../../utils/constants.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// Inline <svg><use> reference to logo.svg, so the mark inherits
// --logo-ink / --logo-brand from the page instead of its baked-in fallbacks.
export function createBrandLogo(className) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", LOGO.viewBox);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", LOGO.alt);
  svg.setAttribute("class", className);

  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", LOGO.href);
  svg.appendChild(use);
  return svg;
}
