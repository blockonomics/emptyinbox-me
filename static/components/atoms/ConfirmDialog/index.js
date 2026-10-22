// A styled stand-in for window.confirm, on the same shell as the buy modal.
// Resolves true on confirm, false on cancel, Escape or a backdrop click.
export function confirmDialog({ title, body, confirmText = "Confirm", cancelText = "Cancel" }) {
  return new Promise((resolve) => {
    const previousFocus = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "payment-modal confirm-dialog";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "cd-title");
    overlay.setAttribute("aria-describedby", "cd-body");

    overlay.innerHTML = `
      <div class="qm-shell">
        <div class="qm-header">
          <h2 id="cd-title" class="qm-title"></h2>
        </div>
        <div class="qm-body">
          <div id="cd-body" class="cd-body"></div>
          <div class="cd-actions">
            <button type="button" class="btn btn-secondary" data-action="cancel"></button>
            <button type="button" class="btn btn-primary" data-action="confirm"></button>
          </div>
        </div>
      </div>
    `;
    // Text set separately so caller strings (addresses) are never parsed as HTML,
    // except body, which callers pass as trusted markup for emphasis.
    overlay.querySelector("#cd-title").textContent = title;
    overlay.querySelector("#cd-body").innerHTML = body;
    overlay.querySelector('[data-action="cancel"]').textContent = cancelText;
    overlay.querySelector('[data-action="confirm"]').textContent = confirmText;

    function close(result) {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      document.body.style.overflow = "";
      previousFocus?.focus?.();
      resolve(result);
    }

    function onKey(e) {
      if (e.key === "Escape") close(false);
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) return close(false);
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (action) close(action === "confirm");
    });
    document.addEventListener("keydown", onKey);

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    overlay.querySelector('[data-action="confirm"]').focus();
  });
}
