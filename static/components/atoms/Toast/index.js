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
  toast.style.color = 'var(--color-text-inverse)';
  toast.style.fontSize = '0.95rem';
  toast.style.fontWeight = '600';
  toast.style.backdropFilter = 'blur(16px)';
  toast.style.webkitBackdropFilter = 'blur(16px)';
  toast.style.boxShadow = 'var(--shadow-lg)';
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
    [TOAST_TYPES.SUCCESS]: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
    [TOAST_TYPES.ERROR]: 'linear-gradient(135deg, var(--color-danger), var(--color-danger-dark))',
    [TOAST_TYPES.INFO]: 'linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark))'
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