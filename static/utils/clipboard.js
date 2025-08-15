export async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    showCopyFeedback(button);
  } catch (err) {
    fallbackCopy(text, button);
  }
}

function fallbackCopy(text, button) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  showCopyFeedback(button);
}

function showCopyFeedback(button) {
  const originalContent = button.innerHTML;
  const originalColor = button.style.color;
  
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;
  button.style.color = '#10b981';
  
  setTimeout(() => {
    button.innerHTML = originalContent;
    button.style.color = originalColor;
  }, 1000);
}