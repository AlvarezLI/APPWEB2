/* NUVEA — Peticiones de usuarios (registro y login) */
import { request } from './config.js';

export function login(email, contraseña) {
  return request('/usuarios/login', { method: 'POST', body: { email, contraseña } });
}

// datos: { nombre, apellido, email, contraseña, fechaNacimiento }
export function registrar(datos) {
  return request('/usuarios/registro', { method: 'POST', body: datos });
}
