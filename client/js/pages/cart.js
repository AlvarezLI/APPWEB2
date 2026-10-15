/* NUVEA — Carrito y finalización de compra
   Usar el carrito requiere sesión iniciada (igual que comprar), por eso la página
   completa está protegida con guardAuth(), igual que compras.html. */
import { renderNavbar } from '../components/navbar.js';
import { showAlert } from '../components/alert.js';
import { cartGet, cartChangeQty, cartRemove, cartClear, cartTotal } from '../utils/cart.js';
import { guardAuth, getToken, cerrarSesion } from '../utils/session.js';
import { formatPrecio, escapeHTML } from '../utils/format.js';
import { crearVenta } from '../api/ventas.js';

if (guardAuth()) {
  renderNavbar();
  initCartPage();
}

function initCartPage() {
  const emptyEl    = document.getElementById('cartEmpty');
  const tableEl    = document.getElementById('cartTable');
  const bodyEl     = document.getElementById('cartItems');
  const totalEl    = document.getElementById('cartTotal');
  const checkoutEl = document.getElementById('checkoutForm');
  const errorEl    = document.getElementById('checkoutError');
  const submitBtn  = checkoutEl.querySelector('button[type="submit"]');

  function renderCart() {
    const items = cartGet();

    if (items.length === 0) {
      emptyEl.style.display = 'block';
      tableEl.style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';
    tableEl.style.display = 'block';

    bodyEl.innerHTML = items.map(item => `
      <tr class="cart-row">
        <td class="cart-name">${escapeHTML(item.name)}</td>
        <td class="cart-cell">${formatPrecio(item.price)}</td>
        <td class="cart-cell">
          <div class="qty-control">
            <button data-action="minus" data-id="${item.id}" aria-label="Disminuir">&#8722;</button>
            <span>${item.qty}</span>
            <button data-action="plus" data-id="${item.id}" aria-label="Aumentar">+</button>
          </div>
        </td>
        <td class="cart-cell">${formatPrecio(item.price * item.qty)}</td>
        <td class="cart-cell cart-remove">
          <button data-action="remove" data-id="${item.id}" aria-label="Eliminar">&#215;</button>
        </td>
      </tr>`).join('');

    totalEl.textContent = formatPrecio(cartTotal());
  }

  bodyEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'minus')  cartChangeQty(id, -1);
    if (action === 'plus')   cartChangeQty(id, 1);
    if (action === 'remove') cartRemove(id);
    renderCart();
  });

  checkoutEl.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.classList.remove('visible');

    const direccion = document.getElementById('direccion').value.trim();
    if (!direccion) {
      errorEl.textContent = 'Ingresá una dirección de envío.';
      errorEl.classList.add('visible');
      return;
    }

    const productos = cartGet().map(item => ({ producto: item.id, cantidad: item.qty }));

    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando…';
    try {
      const venta = await crearVenta(direccion, productos, getToken());
      cartClear();
      document.getElementById('orderId').textContent    = venta._id;
      document.getElementById('orderTotal').textContent = formatPrecio(venta.total);
      document.getElementById('successModal').classList.add('active');
      renderCart();
    } catch (error) {
      if (error.status === 401) {
        showAlert('Tu sesión expiró. Iniciá sesión nuevamente.', 'error');
        setTimeout(() => cerrarSesion('login.html?next=cart.html'), 1500);
        return;
      }
      errorEl.textContent = error.message;
      errorEl.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Finalizar compra';
    }
  });

  renderCart();
}
