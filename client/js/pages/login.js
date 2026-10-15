/* NUVEA — Login contra la API (recibe y guarda el JWT) */
import { initNav } from '../components/navbar.js';
import { login } from '../api/usuarios.js';
import { guardarSesion, isLoggedIn } from '../utils/session.js';

// Solo se permite volver a páginas propias (evita redirecciones a otros sitios)
const next = new URLSearchParams(window.location.search).get('next');
const destino = next && /^[\w-]+\.html$/.test(next) ? next : 'index.html';

if (isLoggedIn()) window.location.replace(destino);

initNav();

const form    = document.getElementById('loginForm');
const errorEl = document.getElementById('loginError');
const button  = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const email      = document.getElementById('email').value.trim();
  const contraseña = document.getElementById('password').value;

  if (!email || !contraseña) {
    errorEl.textContent = 'Completá correo y contraseña.';
    errorEl.classList.add('visible');
    return;
  }

  button.disabled = true;
  try {
    const sesion = await login(email, contraseña);
    guardarSesion(sesion);
    window.location.href = destino;
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.add('visible');
  } finally {
    button.disabled = false;
  }
});

['email', 'password'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => errorEl.classList.remove('visible'));
});
