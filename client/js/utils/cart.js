/* NUVEA — Carrito guardado en localStorage */

const _C = 'nuvea_cart';

export function cartGet() {
  try { return JSON.parse(localStorage.getItem(_C)) || []; } catch { return []; }
}

export function cartSave(items) {
  localStorage.setItem(_C, JSON.stringify(items));
  updateCartBadge();
}

// product: documento de la API ({ _id, nombre, precio, imagen, stock })
export function cartAdd(product, qty = 1) {
  const items    = cartGet();
  const existing = items.find(i => i.id === product._id);
  const max      = product.stock;

  if (existing) {
    existing.qty = Math.min(existing.qty + qty, max);
  } else {
    items.push({ id: product._id, name: product.nombre, price: product.precio, img: product.imagen, stock: max, qty: Math.min(qty, max) });
  }
  cartSave(items);
}

export function cartChangeQty(id, delta) {
  const items = cartGet();
  const item  = items.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.min(Math.max(1, item.qty + delta), item.stock ?? Infinity);
  cartSave(items);
}

export function cartRemove(id) {
  cartSave(cartGet().filter(i => i.id !== id));
}

export function cartClear() {
  cartSave([]);
}

export function cartCount() {
  return cartGet().reduce((sum, i) => sum + i.qty, 0);
}

export function cartTotal() {
  return cartGet().reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}
