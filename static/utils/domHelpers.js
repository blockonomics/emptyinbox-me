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

export function extractActivationCode(htmlBody, textBody, subject) {
  const allText = [subject || '', htmlBody || '', textBody || ''].join(' ');

  if (!allText.trim()) return null;

  // Extract title content first (often contains the code clearly)
  const titleMatch = htmlBody.match(/<title>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const titleCodeMatch = titleMatch[1].match(/\b\d{6}\b/);
    if (titleCodeMatch) return titleCodeMatch[0];
  }

  // Clean HTML and decode entities
  let cleanText = allText;
  if (allText.includes('<')) {
    cleanText = allText
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Try to extract password reset URLs first
  const resetUrl = extractResetUrl(allText);
  if (resetUrl) return resetUrl;

  // Regex patterns for activation/verification codes
  const patterns = [
    /activation\s+code[^A-Z0-9]*([A-Z0-9]{4,12})/gi,
    /verification\s+code[^A-Z0-9]*([A-Z0-9]{4,12})/gi,
    /confirm\s+code[^A-Z0-9]*([A-Z0-9]{4,12})/gi,
    /your\s+code[^A-Z0-9]*([A-Z0-9]{4,12})/gi,
    /code[^A-Z0-9]*([A-Z0-9]{6,12})/gi,
    /\b\d{6}\b/g, // fallback for numeric codes
    /\b[A-Z0-9]{6,12}\b/g // general fallback
  ];

  for (const pattern of patterns) {
    const matches = cleanText.matchAll(pattern);
    for (const match of matches) {
      let code = match[1] || match[0];
      code = code.replace(/^(activation|verification|confirm|your|code)[:\s]+/gi, '').trim();

      if (isValidCode(code)) {
        return code;
      }
    }
  }

  return null;
}

function extractResetUrl(htmlText) {
  // Look for password reset URLs
  const resetPatterns = [
    // URLs in href attributes
    /href="([^"]*(?:reset|password)[^"]*)"[^>]*>/gi,
    /href='([^']*(?:reset|password)[^']*)'[^>]*>/gi,
    
    // Direct URLs (without quotes)
    /https?:\/\/[^\s<>"']*(?:reset|password)[^\s<>"']*/gi,
  ];

  for (const pattern of resetPatterns) {
    const matches = htmlText.matchAll(pattern);
    for (const match of matches) {
      const url = match[1] || match[0];
      if (url && isValidResetUrl(url)) {
        return url;
      }
    }
  }

  return null;
}

function isValidCode(code) {
  return (
    code &&
    code.length >= 4 &&
    code.length <= 12 &&
    !code.match(/^(HTTP|WWW|GMAIL|YAHOO|OUTLOOK|EMAIL|MAIL|NULL|TRUE|FALSE)/i) &&
    !code.includes('@') &&
    !code.includes('.') &&
    !code.match(/^[0-9]+$/) && // Not just numbers
    !code.match(/^[A-Z]+$/)    // Not just letters
  );
}

function isValidResetUrl(url) {
  return (
    url &&
    url.length > 10 &&
    (url.includes('reset') || url.includes('password')) &&
    (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))
  );
}

export function getContentType(htmlBody, textBody, subject) {
  const allText = [subject || '', htmlBody || '', textBody || ''].join(' ');
  
  // Check for password reset
  if (/reset.*password|password.*reset|forgot.*password/gi.test(allText)) {
    return 'password_reset';
  }
  
  // Check for activation/verification
  if (/activation|activate|verification|verify|confirm/gi.test(allText)) {
    return 'activation';
  }
  
  return 'general';
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
