/* NUVEA — Historial de compras del usuario logueado */
import { renderNavbar } from '../components/navbar.js';
import { guardAuth, getUsuario, getToken, cerrarSesion } from '../utils/session.js';
import { formatPrecio, formatFecha, escapeHTML } from '../utils/format.js';
import { getVentasUsuario } from '../api/ventas.js';

if (guardAuth()) {
  renderNavbar();
  cargarCompras();
}

async function cargarCompras() {
  const list = document.getElementById('ordersList');
  list.innerHTML = '<p class="grid-status">Cargando compras…</p>';

  try {
    const ventas = await getVentasUsuario(getUsuario()._id, getToken());
    if (!ventas.length) {
      list.innerHTML = '<p class="grid-status">Todavía no realizaste compras.</p>';
      return;
    }
    list.innerHTML = ventas.map(renderVenta).join('');
  } catch (error) {
    if (error.status === 401) return cerrarSesion('login.html?next=compras.html');
    list.innerHTML = `<p class="grid-status">${escapeHTML(error.message)}</p>`;
  }
}

function renderVenta(venta) {
  const items = venta.productos.map(item => `
    <li>
      <span>${escapeHTML(item.producto?.nombre ?? 'Producto eliminado')} × ${item.cantidad}</span>
      <span>${formatPrecio(item.precioUnitario * item.cantidad)}</span>
    </li>`).join('');

  return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <p class="order-date">${formatFecha(venta.fecha)}</p>
          <p class="order-id">Orden #${venta._id}</p>
        </div>
        <span class="order-status ${venta.pagado ? 'paid' : ''}">${venta.pagado ? 'Pagado' : 'Pendiente'}</span>
      </div>
      <ul class="order-items">${items}</ul>
      <div class="order-foot">
        <span>Envío a ${escapeHTML(venta.direccion)}</span>
        <strong>${formatPrecio(venta.total)}</strong>
      </div>
    </article>`;
}
