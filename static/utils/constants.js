// Site-wide constants
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about.html",
  LOGIN: "/login.html",
  INBOXES: "/inboxes.html",
  SETTINGS: "/settings.html",
  PRICING: "/pricing.html",
  MESSAGES: "/messages.html",
  API_DOCS: "/docs.html",
  BLOG: "/blog/",
  PRIVACY: "/privacy.html",
  TERMS: "/terms.html",
};

export const TEXT = {
  SITE_NAME: "EmptyInbox.me",
  TAGLINE:
    "A clutter-free space to help you reset, refocus, and stay in control.",
};

export const NAV_LINKS = [
  { label: "Login", href: ROUTES.LOGIN },
  { label: "Messages", href: ROUTES.MESSAGES },
  { label: "Inboxes", href: ROUTES.INBOXES },
  { label: "Settings", href: ROUTES.SETTINGS },
  { label: "Pricing", href: ROUTES.PRICING },
];

export const FOOTER_LINKS = {
  product: [
    { label: "Pricing", href: ROUTES.PRICING },
    { label: "API Docs", href: ROUTES.API_DOCS },
  ],
  company: [
    { label: "About", href: ROUTES.ABOUT },
    { label: "Blog", href: ROUTES.BLOG },
    { label: "GitHub", href: "https://github.com/blockonomics/emptyinbox-me", external: true },
  ],
  legal: [
    { label: "Privacy", href: ROUTES.PRIVACY },
    { label: "Terms", href: ROUTES.TERMS },
  ],
};

export const LOGO = {
  src: "../assets/emptyinboxlogo.png",
  alt: "EmptyInbox Logo",
};

export const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === ""
    ? "http://localhost:5000"
    : "https://emptyinbox.me";

export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
};

export const LOCAL_STORAGE_KEYS = {
  IS_LOGGED_IN: "isLoggedIn",
};

export const QUOTA_PER_USDT = 10;

export const USER_STARTING_QUOTA = 5;
