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
        <div class="carousel" data-carousel>
          <div class="carousel-track">
            <img src="../../assets/bash1.jpg" alt="Bash integration screenshot 1">
            <img src="../../assets/bash2.jpg" alt="Bash integration screenshot 2">
          </div>
          <button class="carousel-btn prev" data-carousel-prev>&#10094;</button>
          <button class="carousel-btn next" data-carousel-next>&#10095;</button>
        </div>
      </div>

      <!-- Web Column -->
      <div class="integration">
        <h3 class="integration-title">Web</h3>
        <a href="https://emptyinbox.me/login.html" class="integration-link">Try out</a>
        <div class="carousel" data-carousel>
          <div class="carousel-track">
            <img src="../../assets/web1.jpg" alt="Web integration screenshot 1">
            <img src="../../assets/web2.jpg" alt="Web integration screenshot 2">
          </div>
          <button class="carousel-btn prev" data-carousel-prev>&#10094;</button>
          <button class="carousel-btn next" data-carousel-next>&#10095;</button>
        </div>
      </div>

    </div>
  `;

  return section;
}

export function initCarousels() {
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const slides = Array.from(track.children);
    let index = 0;

    const updateSlide = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
    };

    // Ensure correct initial position
    updateSlide();

    carousel
      .querySelector("[data-carousel-prev]")
      .addEventListener("click", () => {
        index = (index - 1 + slides.length) % slides.length;
        updateSlide();
      });

    carousel
      .querySelector("[data-carousel-next]")
      .addEventListener("click", () => {
        index = (index + 1) % slides.length;
        updateSlide();
      });
  });
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

  // Use event delegation so it works even if images load later
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".carousel-track img");
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
