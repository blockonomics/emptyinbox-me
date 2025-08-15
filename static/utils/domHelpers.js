export function createElement(tag, className, innerHTML = '') {
  const element = document.createElement(tag);
  if (className) {
    className.split(' ').forEach(cls => element.classList.add(cls));
  }
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}
export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function extractActivationCode(text) {
  if (!text) return null;

  // Enhanced regex patterns for various activation codes
  const patterns = [
    /\b[A-Z0-9]{6,12}\b/g,                    // Standard codes like ABC123DEF
    /\b\d{4,8}\b/g,                           // Numeric codes 123456
    /(?:verification|code|token)[:\s]+([A-Z0-9]{4,12})/gi,  // "Code: ABC123"
    /(?:activate|confirm)[:\s]+([A-Z0-9]{4,12})/gi,         // "Activate: DEF456"
    /[A-Z0-9]{4}-[A-Z0-9]{4}/g,              // Hyphenated codes ABC1-DEF2
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      let code = matches[0];
      // Clean up if it includes the label
      code = code.replace(/^(verification|code|token|activate|confirm)[:\s]+/gi, '').trim();
      if (code.length >= 4) return code;
    }
  }

  return null;
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown time';
  
  const now = Date.now();
  const messageTime = timestamp * 1000; // Convert to milliseconds if needed
  const diffInSeconds = Math.floor((now - messageTime) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return new Date(messageTime).toLocaleDateString();
}

export function getServiceInfo(inbox) {
  // Extract service info from inbox email
  if (!inbox || !inbox.includes('@')) return { name: 'Unknown', icon: '📧' };
  
  const domain = inbox.split('@')[1].toLowerCase();
  
  // Common services mapping
  const services = {
    'gmail.com': { name: 'Gmail', icon: '📧', color: '#ea4335' },
    'yahoo.com': { name: 'Yahoo', icon: '💜', color: '#720e9e' },
    'outlook.com': { name: 'Outlook', icon: '📨', color: '#0078d4' },
    'hotmail.com': { name: 'Hotmail', icon: '📨', color: '#0078d4' },
    'apple.com': { name: 'Apple', icon: '🍎', color: '#007aff' },
    'icloud.com': { name: 'iCloud', icon: '☁️', color: '#007aff' },
    'proton.me': { name: 'ProtonMail', icon: '🔒', color: '#6d4aff' },
    'discord.com': { name: 'Discord', icon: '🎮', color: '#5865f2' },
    'github.com': { name: 'GitHub', icon: '🐙', color: '#24292f' },
    'twitter.com': { name: 'Twitter', icon: '🐦', color: '#1da1f2' },
    'facebook.com': { name: 'Facebook', icon: '👥', color: '#1877f2' },
    'instagram.com': { name: 'Instagram', icon: '📷', color: '#e4405f' },
    'linkedin.com': { name: 'LinkedIn', icon: '💼', color: '#0a66c2' },
    'netflix.com': { name: 'Netflix', icon: '🎬', color: '#e50914' },
    'spotify.com': { name: 'Spotify', icon: '🎵', color: '#1db954' },
    'amazon.com': { name: 'Amazon', icon: '📦', color: '#ff9900' },
    'paypal.com': { name: 'PayPal', icon: '💳', color: '#0070ba' },
    'stripe.com': { name: 'Stripe', icon: '💰', color: '#635bff' },
  };
  
  return services[domain] || { 
    name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1), 
    icon: '📧', 
    color: '#6b7280' 
  };
}
