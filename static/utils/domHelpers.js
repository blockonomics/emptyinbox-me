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

export function extractActivationCode(text) {
  if (!text) return null;

  // Match codes like ABC123, 123456, or longer secure tokens
  const codeRegex = /\b[A-Z0-9]{6,}\b/g;
  const matches = text.match(codeRegex);

  return matches ? matches[0] : null; // Return first match
}