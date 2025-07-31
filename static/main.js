import { createHeader } from '../components/molecules/Header/index.js';
import { createFooter } from '../components/molecules/Footer/index.js';
import { renderHomePage } from '../components/pages/HomePage/index.js';
import { renderAboutPage } from '../components/pages/About/index.js';
import { renderLoginPage } from '../components/pages/Login/index.js';
import { renderDashboardPage } from '../components/pages/Dashboard/index.js';
import { ROUTES } from './utils/constants.js';

document.addEventListener('DOMContentLoaded', () => {
  document.body.prepend(createHeader());
  
  const path = location.pathname;
  
  switch (path) {
    case ROUTES.HOME:
      renderHomePage();
      break;
    case ROUTES.ABOUT:
      renderAboutPage();
      break;
    case ROUTES.LOGIN:
      renderLoginPage();
      break;
    case ROUTES.DASHBOARD:
      renderDashboardPage();
      break;
    default:
      console.error('Page not found:', path);
  }
  document.body.appendChild(createFooter());
});