/* NUVEA — Peticiones de ventas (requieren token) */
import { request } from './config.js';

// productos: [{ producto: <id>, cantidad }]
export function crearVenta(direccion, productos, token) {
  return request('/ventas', { method: 'POST', body: { direccion, productos }, token });
}

export function getVentasUsuario(idUsuario, token) {
  return request(`/ventas/usuario/${idUsuario}`, { token });
}
