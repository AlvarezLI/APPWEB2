/* NUVEA — Sesión del usuario (token JWT + datos básicos) */

const _S = 'nuvea_session';

export function guardarSesion({ token, usuario }) {
  localStorage.setItem(_S, JSON.stringify({ token, usuario }));
}

export function getSesion() {
  try { return JSON.parse(localStorage.getItem(_S)); } catch { return null; }
}

export function getToken() {
  return getSesion()?.token ?? null;
}

export function getUsuario() {
  return getSesion()?.usuario ?? null;
}

export function isLoggedIn() {
  return !!getToken();
}

export function cerrarSesion(redirect = 'login.html') {
  localStorage.removeItem(_S);
  if (redirect) window.location.href = redirect;
}

// Para páginas que requieren login: redirige al login y vuelve a esta página después
export function guardAuth() {
  if (isLoggedIn()) return true;
  const actual = window.location.pathname.split('/').pop();
  window.location.replace(`login.html?next=${encodeURIComponent(actual)}`);
  return false;
}
