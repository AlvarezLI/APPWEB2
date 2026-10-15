/* NUVEA — Funciones de formato de uso común */

export function formatPrecio(valor) {
  return '$' + Number(valor).toLocaleString('es-AR');
}

export function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Evita inyectar HTML al renderizar datos que vienen del servidor
export function escapeHTML(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
