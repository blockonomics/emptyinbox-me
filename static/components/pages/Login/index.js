export function renderLoginPage() {
  const main = document.createElement('main');

  const container = document.createElement('div');
  container.classList.add('container', 'login-page'); // extra class if you need specific styling

  container.innerHTML = `
    <section class="login">
      <h1>Welcome Back</h1>
      <p>Log in to continue your journey with EmptyInbox.me</p>
      
      <form class="login-form">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required placeholder="you@example.com" />

        <label for="password">Password</label>
        <input type="password" id="password" name="password" required placeholder="••••••••" />

        <button type="submit">Login</button>
      </form>

      <p class="login-footer">
        Don’t have an account? <a href="/signup">Sign up</a>
      </p>
    </section>
  `;

  main.appendChild(container);
  document.body.appendChild(main);
}