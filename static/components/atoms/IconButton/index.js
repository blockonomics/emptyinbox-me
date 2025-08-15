import { createElement } from "../../../utils/domHelpers.js";

export function createIconButton(iconSvg, title, className = '') {
  const button = createElement('button', `${className}`, '');
  button.title = title;
  button.innerHTML = iconSvg;
  return button;
}