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
      // currentSrc, so the lightbox opens the variant <picture> picked.
      lightboxImage.src = img.currentSrc || img.src;
      overlay.classList.add("active");
    }
  });

  // Close events
  closeBtn.addEventListener("click", () => overlay.classList.remove("active"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
}
