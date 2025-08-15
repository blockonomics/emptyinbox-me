export function createElement(tag, className, innerHTML = '') {
  const element = document.createElement(tag);
  if (className) element.classList.add(className);
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}

export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}