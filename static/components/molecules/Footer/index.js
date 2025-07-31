export function createFooter() {
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <p>&copy; 2025 EmptyInbox.me. All rights reserved.</p>
  `;
  footer.className = 'site-footer';
  return footer;
}