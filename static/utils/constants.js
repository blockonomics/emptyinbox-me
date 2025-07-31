// Site-wide constants

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about.html',
  LOGIN: '/login.html',
};

export const TEXT = {
  SITE_NAME: 'EmptyInbox.me',
  TAGLINE: 'A clutter-free space to help you reset, refocus, and stay in control.',
};

export const FEATURES = [
  { title: 'Simple', description: 'No distractions, no fuss—just what matters.' },
  { title: 'Secure', description: 'Your data stays yours. Always private, always protected.' },
  { title: 'Efficient', description: 'Spend less time organizing, more time doing.' },
];

export const NAV_LINKS = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'About', href: ROUTES.ABOUT },
  { label: 'Login', href: ROUTES.LOGIN },
];

export const LOGO = {
  src: '../assets/emptyinboxlogo.png',
  alt: 'EmptyInbox Logo',
};