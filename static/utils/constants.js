// Site-wide constants

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about.html',
  LOGIN: '/login.html',
  DASHBOARD: '/dashboard.html',
};

export const TEXT = {
  SITE_NAME: 'EmptyInbox.me',
  TAGLINE: 'A clutter-free space to help you reset, refocus, and stay in control.',
};

export const NAV_LINKS = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'About', href: ROUTES.ABOUT },
  { label: 'Login', href: ROUTES.LOGIN },
  {
    label: 'Fork on GitHub',
    href: 'https://github.com/blockonomics/emptyinbox-me',
    external: true, 
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
    className: 'fork-button'
  },
];

export const LOGO = {
  src: '../assets/emptyinboxlogo.png',
  alt: 'EmptyInbox Logo',
};

export const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://emptyinbox.me';

  export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info'
  }

  export const LOCAL_STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    API_KEY: 'apiKey'
  }