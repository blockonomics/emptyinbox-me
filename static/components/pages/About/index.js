export function renderAboutPage() {
  const main = document.createElement('main');

  // Create a container div for padding
  const container = document.createElement('div');
  container.classList.add('container');

  container.innerHTML = `
    <section class="about">
      <h1>About EmptyInbox.me</h1>
      <p>We believe clarity leads to confidence. EmptyInbox.me was built to help you cut through clutter and rediscover calm—whether you're taming your inbox or sorting your thoughts.</p>

      <h2>Our Mission</h2>
      <p>To make simplicity feel powerful. Tools shouldn’t overwhelm—they should empower.</p>

      <h2>Who We Are</h2>
      <p>Just a handful of creators, thinkers, and minimalists who got tired of digital noise. So we made something better. And now it’s yours.</p>
    </section>
  `;

  main.appendChild(container);
  document.body.appendChild(main);
}