export function renderIntegrationsSection() {
  const section = document.createElement("section");
  section.className = "integrations-section";

  section.innerHTML = `
    <h2 class="integrations-title">Integrations</h2>
    <div class="integrations-grid">
      
      <!-- Bash Column -->
      <div class="integration">
        <h3 class="integration-title">Bash</h3>
        <a href="https://github.com/shivaenigma/tmpmail" class="integration-link">Download from GitHub</a>
        <img src="../../assets/bash.png" alt="Bash integration screenshot" class="integration-img">
      </div>

      <!-- Web Column -->
      <div class="integration">
        <h3 class="integration-title">Web</h3>
        <a href="https://emptyinbox.me/login.html" class="integration-link">Try out</a>
        <div class="integration-images">
          <img src="../../assets/web1.jpg" alt="Web integration screenshot 1" class="integration-img">
          <img src="../../assets/web2.jpg" alt="Web integration screenshot 2" class="integration-img">
        </div>
      </div>

    </div>
  `;

  return section;
}

export function enableImageLightbox() {
  // Create overlay once
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.innerHTML = `
    <img class="lightbox-image" src="" alt="">
    <span class="lightbox-close">&times;</span>
  `;
  document.body.appendChild(overlay);

  const lightboxImage = overlay.querySelector(".lightbox-image");
  const closeBtn = overlay.querySelector(".lightbox-close");

  // Event delegation for any integration image
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".integration-img");
    if (img) {
      lightboxImage.src = img.src;
      overlay.classList.add("active");
    }
  });

  // Close events
  closeBtn.addEventListener("click", () => overlay.classList.remove("active"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
}
