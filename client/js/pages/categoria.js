/* NUVEA — Páginas de categoría (moda, electrónica, hogar)
   La categoría se toma del atributo data-categoria del <body> */
import { renderNavbar } from '../components/navbar.js';
import { renderProductGrid, renderGridStatus } from '../components/productCard.js';
import { getProductosPorCategoria } from '../api/productos.js';

renderNavbar();

const grid = document.querySelector('.products-grid');
renderGridStatus(grid, 'Cargando productos…');

try {
  const productos = await getProductosPorCategoria(document.body.dataset.categoria);
  renderProductGrid(grid, productos, 'Todavía no hay productos en esta categoría.');
} catch (error) {
  renderGridStatus(grid, error.message);
}
