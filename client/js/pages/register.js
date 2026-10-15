/* NUVEA — Registro contra la API (la contraseña se encripta en el servidor) */
import { initNav } from '../components/navbar.js';
import { registrar } from '../api/usuarios.js';
import { isLoggedIn } from '../utils/session.js';

if (isLoggedIn()) window.location.replace('index.html');

initNav();

const form    = document.getElementById('registerForm');
const errorEl = document.getElementById('registerError');
const button  = form.querySelector('button[type="submit"]');
const CAMPOS  = ['nombre', 'apellido', 'email', 'password', 'fechaNacimiento'];

function mostrarError(mensaje) {
  errorEl.textContent = mensaje;
  errorEl.classList.add('visible');
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const nombre          = document.getElementById('nombre').value.trim();
  const apellido        = document.getElementById('apellido').value.trim();
  const email           = document.getElementById('email').value.trim();
  const contraseña      = document.getElementById('password').value;
  const fechaNacimiento = document.getElementById('fechaNacimiento').value;

  if (!nombre || !apellido) return mostrarError('Por favor completá nombre y apellido.');
  if (!email)               return mostrarError('Por favor ingresá tu correo.');
  if (contraseña.length < 8) return mostrarError('La contraseña debe tener al menos 8 caracteres.');
  if (!fechaNacimiento)     return mostrarError('Por favor ingresá tu fecha de nacimiento.');

  button.disabled = true;
  try {
    await registrar({ nombre, apellido, email, contraseña, fechaNacimiento });
    document.getElementById('successModal').classList.add('active');
  } catch (error) {
    mostrarError(error.message);
  } finally {
    button.disabled = false;
  }
});

CAMPOS.forEach(id => {
  document.getElementById(id).addEventListener('input', () => errorEl.classList.remove('visible'));
});
