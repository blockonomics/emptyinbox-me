export function formatCredits(n) {
  return `${n} ${n === 1 ? "credit" : "credits"}`;
}

// The balance shown in the inboxes header is the one place the page keeps it,
// so anything that spends or adds credits updates it here rather than
// reloading the page.
export function getCreditBalance() {
  const n = Number(document.getElementById("credit-balance")?.dataset.credits);
  return Number.isFinite(n) ? n : null;
}

export function setCreditBalance(n) {
  const el = document.getElementById("credit-balance");
  if (!el) return;
  el.dataset.credits = String(n);
  el.textContent = `${formatCredits(n)} left`;
}
