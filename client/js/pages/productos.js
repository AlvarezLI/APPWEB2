/* NUVEA — Listado completo con filtros por categoría, texto y disponibilidad */
import { renderNavbar } from '../components/navbar.js';
import { renderProductGrid, renderGridStatus } from '../components/productCard.js';
import { buscarProductos } from '../api/productos.js';

renderNavbar();

const grid       = document.querySelector('.products-grid');
const chips      = document.querySelectorAll('.chip');
const form       = document.getElementById('filtersForm');
const textoInput = document.getElementById('texto');
const dispInput  = document.getElementById('soloDisponibles');
const countEl    = document.getElementById('resultsCount');

// La categoría inicial puede venir por URL: productos.html?categoria=moda
const params = new URLSearchParams(window.location.search);
let categoria = params.get('categoria') || '';

function marcarChip() {
  chips.forEach(chip => chip.classList.toggle('active', chip.dataset.categoria === categoria));
}

async function cargar() {
  marcarChip();
  renderGridStatus(grid, 'Cargando productos…');

  const filtros = { soloDisponibles: dispInput.checked };
  if (categoria) filtros.categoria = categoria;
  if (textoInput.value.trim()) filtros.texto = textoInput.value.trim();

  try {
    const productos = await buscarProductos(filtros);
    countEl.textContent = `${productos.length} producto${productos.length === 1 ? '' : 's'}`;
    renderProductGrid(grid, productos, 'No se encontraron productos con esos filtros.');
  } catch (error) {
    countEl.textContent = '';
    renderGridStatus(grid, error.message);
  }
}

chips.forEach(chip => chip.addEventListener('click', () => {
  categoria = chip.dataset.categoria;
  const url = new URL(window.location);
  if (categoria) url.searchParams.set('categoria', categoria);
  else url.searchParams.delete('categoria');
  history.replaceState(null, '', url);
  cargar();
}));

form.addEventListener('submit', e => {
  e.preventDefault();
  cargar();
});
dispInput.addEventListener('change', cargar);

cargar();
