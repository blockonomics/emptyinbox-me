import { createHeader } from '../../organisms/Header/index.js';
import { createFooter } from '../../organisms/Footer/index.js';

export function renderHomePage() {
  const main = document.createElement('main');
  main.innerHTML = `
    <section class="hero">
      <h1>Welcome to EmptyInbox.me</h1>
      <p>A clutter-free space to help you reset, refocus, and stay in control. Whether you're managing emails, tasks, or ideas—we're here to simplify the noise.</p>
      <button>Get Started</button>
    </section>

    <section class="features-carousel">
      <div class="feature">
        <h2>Simple</h2>
        <p>No distractions, no fuss—just what matters.</p>
      </div>
      <div class="feature">
        <h2>Secure</h2>
        <p>Your data stays yours. Always private, always protected.</p>
      </div>
      <div class="feature">
        <h2>Efficient</h2>
        <p>Spend less time organizing, more time doing.</p>
      </div>
    </section>
  `;

  document.body.appendChild(createHeader());
  document.body.appendChild(main);
  document.body.appendChild(createFooter());
}