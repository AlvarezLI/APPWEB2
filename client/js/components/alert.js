/* NUVEA — Alert Component (notificación reutilizable) */

let container;

// type: 'success' | 'error'
export function showAlert(message, type = 'success', duration = 3000) {
  if (!container) {
    container = document.createElement('div');
    container.className = 'alert-stack';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.appendChild(alert);

  requestAnimationFrame(() => alert.classList.add('visible'));
  setTimeout(() => {
    alert.classList.remove('visible');
    setTimeout(() => alert.remove(), 300);
  }, duration);
}
