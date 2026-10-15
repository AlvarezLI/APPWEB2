/* NUVEA — Home: 3 productos destacados por categoría */
import { renderNavbar } from '../components/navbar.js';
import { renderProductGrid, renderGridStatus } from '../components/productCard.js';
import { getProductos } from '../api/productos.js';

renderNavbar();

const grid = document.querySelector('.featured-grid');
renderGridStatus(grid, 'Cargando productos…');

try {
  const productos = await getProductos();
  const destacados = ['moda', 'electronica', 'hogar'].flatMap(categoria =>
    productos.filter(p => p.categoria === categoria && p.disponible && p.stock > 0).slice(0, 3)
  );
  renderProductGrid(grid, destacados);
} catch (error) {
  renderGridStatus(grid, error.message);
}
