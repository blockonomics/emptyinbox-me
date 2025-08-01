export function renderHomePageHero() {
  const section = document.createElement('section');
  section.className = 'hero';

  section.innerHTML = `
    <div class="hero-content">
      <h1>Clear the clutter. Embrace calm.</h1>
      <p>Your digital reset starts here—focus on what matters and leave the noise behind.</p>
      <button class="btn btn-primary">Get Started</button>
    </div>
  `;

  return section;
}