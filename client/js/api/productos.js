/* NUVEA — Peticiones de productos */
import { request } from './config.js';

export function getProductos() {
  return request('/productos');
}

export function getProductosPorCategoria(categoria) {
  return request(`/productos/categoria/${encodeURIComponent(categoria)}`);
}

// filtros: { texto, categoria, precioMin, precioMax, soloDisponibles }
export function buscarProductos(filtros) {
  return request('/productos/buscar', { method: 'POST', body: filtros });
}
