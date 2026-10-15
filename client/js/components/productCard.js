/* NUVEA — Product Card Component */
import { cartAdd, cartGet } from '../utils/cart.js';
import { isLoggedIn } from '../utils/session.js';
import { formatPrecio, escapeHTML } from '../utils/format.js';
import { showAlert } from './alert.js';

export function createProductCard(product) {
  const card     = document.createElement('div');
  card.className = 'product-card';

  const sinStock = !product.disponible || product.stock <= 0;

  card.innerHTML = `
    <div class="product-img">
      <img src="../${escapeHTML(product.imagen)}" alt="${escapeHTML(product.nombre)}" loading="lazy" />
    </div>
    <span class="product-tag">${escapeHTML(sinStock ? 'Sin stock' : product.etiqueta)}</span>
    <h3 class="product-name">${escapeHTML(product.nombre)}</h3>
    <p class="product-desc">${escapeHTML(product.desc)}</p>
    <p class="product-price">${formatPrecio(product.precio)}</p>
    <div class="product-qty">
      <button class="qty-btn qty-minus" aria-label="Disminuir cantidad">&#8722;</button>
      <span class="qty-value">1</span>
      <button class="qty-btn qty-plus" aria-label="Aumentar cantidad">+</button>
    </div>
    <button class="product-btn">${sinStock ? 'No disponible' : 'Agregar al carrito'}</button>`;

  let qty       = 1;
  const minus   = card.querySelector('.qty-minus');
  const plus    = card.querySelector('.qty-plus');
  const qtySpan = card.querySelector('.qty-value');
  const addBtn  = card.querySelector('.product-btn');

  if (sinStock) {
    [minus, plus, addBtn].forEach(btn => { btn.disabled = true; });
    return card;
  }

  minus.addEventListener('click', () => {
    if (qty > 1) qtySpan.textContent = --qty;
  });

  plus.addEventListener('click', () => {
    if (qty < product.stock) qtySpan.textContent = ++qty;
  });

  addBtn.addEventListener('click', () => {
    // Usar el carrito requiere estar logueado; navegar y ver productos no
    if (!isLoggedIn()) {
      const actual = window.location.pathname.split('/').pop();
      window.location.href = `login.html?next=${encodeURIComponent(actual)}`;
      return;
    }

    const enCarrito = cartGet().find(i => i.id === product._id)?.qty ?? 0;
    if (enCarrito + qty > product.stock) {
      showAlert(`Solo hay ${product.stock} unidades de "${product.nombre}".`, 'error');
      return;
    }

    cartAdd(product, qty);
    showAlert(`"${product.nombre}" agregado al carrito.`);
    addBtn.textContent = '✓ Agregado';
    addBtn.classList.add('added');
    qty = 1;
    qtySpan.textContent = 1;
    setTimeout(() => {
      addBtn.textContent = 'Agregar al carrito';
      addBtn.classList.remove('added');
    }, 2000);
  });

  return card;
}

// Renderiza una lista de productos dentro de un contenedor, con mensaje si está vacía
export function renderProductGrid(grid, products, emptyMessage = 'No hay productos para mostrar.') {
  grid.innerHTML = '';
  if (!products.length) {
    grid.innerHTML = `<p class="grid-status">${escapeHTML(emptyMessage)}</p>`;
    return;
  }
  products.forEach(product => grid.appendChild(createProductCard(product)));
}

export function renderGridStatus(grid, message) {
  grid.innerHTML = `<p class="grid-status">${escapeHTML(message)}</p>`;
}
