export function createElement(tag, className, innerHTML = "") {
  const element = document.createElement(tag);
  if (className) {
    className.split(" ").forEach((cls) => element.classList.add(cls));
  }
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}
export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function cleanHtmlContent(htmlContent) {
  if (!htmlContent) return "";

  return (
    htmlContent
      // Remove CSS styles (between <style> tags and inline styles)
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/style\s*=\s*["'][^"']*["']/gi, "")

      // Remove script tags
      .replace(/<script[^>]*>.*?<\/script>/gis, "")

      // Remove common metadata tags
      .replace(/<(head|meta|title|link)[^>]*>.*?<\/\1>/gis, "")
      .replace(/<(meta|link|br|hr|img)[^>]*\/?>/gi, "")

      // Convert common HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&hellip;/g, "...")

      // Remove all remaining HTML tags
      .replace(/<[^>]*>/g, " ")

      // Clean up CSS properties that leaked through
      .replace(
        /\b(background|margin|padding|color|font|width|height|border|display|position|top|left|right|bottom)[\s]*[:=][^;}\s]*[;}]?/gi,
        ""
      )

      // Remove common CSS values and units
      .replace(/\b\d+px\b/g, "")
      .replace(/\b(#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\))\b/gi, "")

      // Clean up whitespace and formatting
      .replace(/\s+/g, " ")
      .replace(/[{};]/g, " ")
      .trim()
  );
}


export function extractActivationCode(htmlBody, textBody, subject) {
  const allText = [subject || "", htmlBody || "", textBody || ""].join(" ");

  if (!allText.trim()) return null;

  // Extract title content first (often contains the code clearly)
  const titleMatch = htmlBody && htmlBody.match(/<title>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const titleCodeMatch = titleMatch[1].match(/\b\d{6}\b/);
    if (titleCodeMatch) return titleCodeMatch[0];
  }

  // Clean HTML and decode entities
  let cleanText = allText;
  if (allText.includes("<")) {
    cleanText = allText
      .replace(/<[^>]*>/g, " ") // Remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Try to extract password reset URLs first
  const resetUrl = extractResetUrl(allText);
  if (resetUrl) return resetUrl;

  // Try to extract verification URLs next
  const verificationUrl = extractVerificationUrl(allText);
  if (verificationUrl) return verificationUrl;

  // Common false positives to skip
  const blacklist = new Set([
    "EXPIRED",
    "EXPIRES",
    "MINUTES",
    "HOURS",
    "DAYS",
    "SECONDS",
  ]);

  // Regex patterns for activation/verification codes
  const patterns = [
    /activation\s+code\b(?:\s*[:\-]|\s*\n+)\s*([A-Z0-9]{4,12})\b/gi,
    /verification\s+code\b(?:\s*[:\-]|\s*\n+)\s*([A-Z0-9]{4,12})\b/gi,
    /confirm\s+code\b(?:\s*[:\-]|\s*\n+)\s*([A-Z0-9]{4,12})\b/gi,
    /your\s+code\b(?:\s*[:\-]|\s*\n+)\s*([A-Z0-9]{4,12})\b/gi,
    /code\b(?:\s*[:\-]|\s*\n+)\s*([A-Z0-9]{6,12})\b/gi,
    /\b\d{6}\b/g, // numeric-only fallback
    /\b[A-Z0-9]{6,12}\b/g, // uppercase letters + digits only
  ];

  for (const pattern of patterns) {
    const matches = cleanText.matchAll(pattern);
    for (const match of matches) {
      let code = match[1] || match[0];
      code = code
        .replace(/^(activation|verification|confirm|your|code)[:\s\-]+/gi, "")
        .trim();

      if (blacklist.has(code.toUpperCase())) continue; // skip bad words

      if (isValidCode(code)) {
        return code;
      }
    }
  }

  return null;
}

function extractVerificationUrl(text) {
  const verificationPatterns = [
    /https?:\/\/[^\s<>"']*email-verification[^\s<>"']*/gi,
    /https?:\/\/[^\s<>"']*verify[^\s<>"']*/gi,
    /https?:\/\/[^\s<>"']*confirmation[^\s<>"']*/gi,
  ];

  for (const pattern of verificationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const url = match[0];
      if (url && isValidVerificationUrl(url)) {
        return url;
      }
    }
  }
  return null;
}

function isValidVerificationUrl(url) {
  return (
    url &&
    url.length > 20 &&
    (url.includes("verification") ||
      url.includes("verify") ||
      url.includes("confirmation")) &&
    url.startsWith("http")
  );
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
  if (!code) return false;

  const blacklist = new Set([
    "EXPIRED",
    "EXPIRES",
    "MINUTES",
    "HOURS",
    "DAYS",
    "SECONDS",
    "HTTP",
    "WWW",
    "GMAIL",
    "YAHOO",
    "OUTLOOK",
    "EMAIL",
    "MAIL",
    "NULL",
    "TRUE",
    "FALSE",
  ]);

  const upper = code.toUpperCase();

  return (
    code.length >= 4 &&
    code.length <= 12 &&
    !blacklist.has(upper) &&
    !code.includes("@") &&
    !code.includes(".") &&
    /^[A-Z0-9]+$/.test(code) &&
    /\d/.test(code) // must contain at least one digit — rejects pure-word false positives
  );
}

function isValidResetUrl(url) {
  return (
    url &&
    url.length > 10 &&
    (url.includes("reset") || url.includes("password")) &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/"))
  );
}

export function getContentType(htmlBody, textBody, subject) {
  const allText = [subject || "", htmlBody || "", textBody || ""].join(" ");

  // Check for email verification
  if (/email.verification|verify.*email|confirm.*email/gi.test(allText)) {
    return "email_verification";
  }

  // Check for password reset
  if (/reset.*password|password.*reset|forgot.*password/gi.test(allText)) {
    return "password_reset";
  }

  // Check for activation/verification
  if (/activation|activate|verification|verify|confirm/gi.test(allText)) {
    return "activation";
  }

  return "general";
}

