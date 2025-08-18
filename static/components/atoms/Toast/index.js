import { TOAST_TYPES } from '../../../utils/constants.js'

// toast.js
export function createToast() {
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'messages-toast';

  // Base styles
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.padding = '1rem 1.5rem';
  toast.style.borderRadius = '16px';
  toast.style.color = 'white';
  toast.style.fontSize = '0.95rem';
  toast.style.fontWeight = '600';
  toast.style.backdropFilter = 'blur(16px)';
  toast.style.webkitBackdropFilter = 'blur(16px)';
  toast.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  toast.style.zIndex = '9999';
  toast.style.pointerEvents = 'none';
  toast.style.maxWidth = '320px';
  toast.style.textAlign = 'center';

  document.body.appendChild(toast);
  return toast;
}

export function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = createToast();
  }

  // Set gradient background based on type
  const gradients = {
    [TOAST_TYPES.SUCCESS]: 'linear-gradient(135deg, #10b981, #059669)',
    [TOAST_TYPES.ERROR]: 'linear-gradient(135deg, #ef4444, #dc2626)',
    [TOAST_TYPES.INFO]: 'linear-gradient(135deg, #3b82f6, #2563eb)'
  };
  toast.style.background = gradients[type] || gradients[TOAST_TYPES.SUCCESS];

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  toast.style.pointerEvents = 'auto';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.pointerEvents = 'none';
  }, 4000);
}