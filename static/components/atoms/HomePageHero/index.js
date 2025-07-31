export function renderHomePageHero() {
  const section = document.createElement('section');
  section.className = 'hero';

  section.innerHTML = `
    <h1>Welcome to EmptyInbox.me</h1>
    <p>A clutter-free space to help you reset, refocus, and stay in control. Whether you're managing emails, tasks, or ideas—we're here to simplify the noise.</p>
    <button>Get Started</button>
  `;

  return section;
}